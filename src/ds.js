/**
* Library Deets go here
* USE OUR CODES
*
* Version 0.0.1
*
* // Constructor Parameters :
* {
*  url : "String - url to fetch data from",
*  jsonp : "boolean - true if this is a jsonp request",
*  delimiter : "String - a delimiter string that is used in a tabular datafile",
*  data : "Object - an actual javascript object that already contains the data",
*  table : "Element - a DOM table that contains the data",
*  format : "String - optional file format specification, otherwise we'll try to guess",
*  recursive : "Boolean - if true build nested arrays of objects as datasets",
*  strict : "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
*  extract : "function to apply to JSON before internal interpretation, optional"
*  ready : the callback function to act on once the data is fetched. Isn't reuired for local imports
*          but is required for remote url fetching.
* }
*/

(function(global, _) {

  // If a global DS constructor is already defined, used that instead
  // otherwise make sure the global namespace is set and
  // define the constructor.
  var DS = (global.DS || function() {

    // Define global scope if it hasn't been defined yet.
    global.DS = function(options) {

      options = options || (options = {});

      this._options = options;

      // stores events that are subscribed on this dataset. Format is:
      // _events["eventName"] = { pos : { rowIds : [], columnIds : [] }, callback : function }
      this._events = {};

      // This queue holds changes as they occur. Calling .push on a dataset
      // starts aggregating all the changes in the queue and calling pop returns
      // them all and clears the queue.
      this._queing = false;
      this._deltaQueue = [];

      // if this is a forked dataset, the parent property should be set. We need to
      // auto subscribe this dataset to sync with its parent.
      /*
      if (options.parent) {
        // TODO: do some auto subscribing here...
      }
      */

      this._buildData();

      return this;
    };

    return global.DS;

  }());

  // CONSTS
  DS.datatypes = {
    UNKNOWN: "Unknown",
    NUMBER : 0,
    STRING : 1,
    BOOLEAN: 2,
    ARRAY  : 3,
    OBJECT : 4
  };

  // Public Methods
  _.extend(DS.prototype, {

    _buildData : function() {

      var importer = null;
      this.parser = DS.Parsers.Obj;

      // Sort out parser type. Default is Object.
      if (this._options.strict) {
        this.parser = DS.Parsers.Strict;
      } else if (this._options.delimiter) {
        this.parser = DS.Parsers.Delimited;
      }

      // Sort out importer type:
      // local imporer or remote?
      var opts = _.extend({},
        this._options,
        { parser : this.parser }
      );
      if (this._options.url) {
        // If this is a delimited set of data, then set the dataType 
        // correctly.
        if (this._options.delimiter) {
          opts.dataType = "text";
        }
        importer = new DS.Importers.Remote(this._options.url, opts);
      } else {
        importer = new DS.Importers.Local(this._options.data, opts);
      } 
      
      // remove temporary data holder.
      delete this._options.data;

      // run parser and append rows and columns to this instance
      // of dataset.
      if (importer !== null) {
        importer.fetch({
          success : _.bind(function(d) {
            _.extend(this, d);
            if (this._options.ready) {
              this._options.ready.call(this);
            }
          }, this)
        });
      }
    },

    filter : function(options) {
      var data = {};
      _.each(['columns', 'rows', 'metadata'], function(type) {
        data[type] = _.clone(this['_'+type]);
      }, this);

      if (options.row) {
        options.rows = [options.row];
      }

      if (options.rows) {
        data.rows = _.filter(data.rows, function(row, index) {
          return _.indexOf(options.rows, index) !== -1;
        });
      }

      if (options.column) {
        options.columns = [options.column];
      }

      if (options.columns) {

        // filter down the columns to only contain the ones we want
        data.columns = _.filter(data.columns, function(column) {
          return _.indexOf(options.columns, column.name) !== -1;
        });

        // filter down the rows to just the values we are looking for
        data.rows = _.map(data.rows, function(row, index) {
          var newRowData = { _id : row._id, data : [] };
          _.each(options.columns, function(cName) {
            newRowData.data.push(row.data[this._byColumnName[cName].position]);
          }, this);

          return newRowData;
        }, this);
      }

      // if properties.clone is set to false, return just the
      // reference to the data.
      if (typeof options.clone !== "undefined" && !options.clone) {
        return data;
      // else return a new dataset of which this is the parent.
      } else {
        return new DS({ data : data, strict : true, parent: this });
      }

    },

    transform : function() {

    },

    derive : function() {

    },

    sort : function() {

    },

    rows : function(num) {
      return this.filter({ row : num });
    },

    columns : function(name) {

    },

    add : function() {

    },

    /**
     * Row + value lookup private method to generalize access to the various
     * caches.
     * @param {string} rowcache The row cache name (_rows | _byRowId)
     * @param {number} index The position|id of the element.
     * @param {string} column The column name for the value being fetched. optional.
     */
    _get : function(rowcache, index, column) {
      if (column) {
        return this[rowcache][index].data[this._byColumnName[column].position];
      } else {
        return this[rowcache][index];
      }
    },

    /**
     * Returns a row based on its position in the rows array.
     * @param {number} index The position in the rows array (0 - for first row, etc.)
     * @param {string} column The name of the column for which the value is being fetched.
     */
    get : function(index, column) {
      return this._get("_rows", index, column);
    },

    /**
     * Returns a row based on its row._id, independent of position in the
     * rows array.
     * @param {number} rid The row identifier
     * @param {string} column The name of the column for which the value is being fetched.
     */
    getByRowId : function(rid, column) {
      return this._get("_byRowId", rid, column);
    },

    /**
     * Internal setter implementation. Differs from API setters in that
     * it expects an actual row object rather than a position specification.
     */
    _set: function(row, data, options) {

      options = options || {};

      // What a delta object is going to look like.
      var delta = {
        _id : row._id,
        old : {},
        changed : {}
      };

      if (typeof row === "undefined") {
        return false;
      } else {

        // Iterate over each key in the data being set
        // and replace the value based on it.
        _.each(_.keys(data), function(key) {

          // Find column we're modifying
          var column = this._byColumnName[key];

          // If this is not an existing column skip it.
          // No new column values can be set.
          if (typeof column !== "undefined") {
            if (row.data[key] !== data[key]) {

              // Save old value if it's different
              delta.old[key] = row.data[column.position];

              // Save the new value in the data object
              delta.changed[key] = data[key];

              // Overwrite actual value
              row.data[column.position] = data[key];
            }
          }
        }, this);

      }

      // if we're queing deltas and this wasn't
      // supposed to be a silent trigger, save it and return the row.
      if (this._queing && !options.silent) {

        this._deltaQueue.push(delta);

      }
/*
      else if (!this.options.silent) {
              // TODO: trigger proper event here? What exactly should we
              // be triggering here? Which events? All update events listening
              // to this position row?
            }
*/


      // TODO: should we be returning the row here? Or the delta? I feel like
      // row makes the most sense, although maybe we should be returning this, for
      // chaining purposes. Thoughts?
      return row;
    },

    /**
     * Sets the values in a particular row to the data object provided
     * as a parameter. Takes an optional set of arguments.
     * @param {int} index - the row position in the data array to be modified
     * @param {Object} data - The object containing the new data
     * @param {Object} options (optional) - Contains flags such as, silent(true|false)
     *   which will prevent event triggering.
     */
    set : function(index, data, options) {
      var row = this._rows[index];
      this._set(row, data, options);
    },

    /**
     * Sets the values in a particular row to the data object provided
     * as a parameter. Takes an optional set of arguments.
     * @param {int} rid - the row _id to be modified
     * @param {Object} data - The object containing the new data
     * @param {Object} options (optional) - Contains flags such as, silent(true|false)
     *   which will prevent event triggering.
     */
    setByRowId : function(rid, data, options) {
      var row = this._byRowId[rid];
      this._set(row, data, options);
    },

    //Calculate the minimum value in the entire dataset
    //TODO memoise and tie to events
    min : function(columns) {
      var min = Infinity,
          rows = this._rows;


      if (typeof columns !== "undefined") {
        if (DS.typeOf(columns) !== "array") {
          columns = [columns];
        }

        // build a subset over each we're building max.
        rows = this.filter({
          clone: false,
          columns : columns
        }).rows;
      }

      // Iterate over all rows and get the max.
      this._eachAll(rows, function(value) {
        if (DS.typeOf(value) === "number" && value < min) {
          min = value;
        }
      });

      return min;
    },

    //Calculate the maximum value in the entire dataset
    //TODO memoise and tie to events
    max : function(columns) {
      var max = -Infinity,
          rows = this._rows;


      if (typeof columns !== "undefined") {
        if (DS.typeOf(columns) !== "array") {
          columns = [columns];
        }

        // build a subset over each we're building max.
        rows = this.filter({
          clone: false,
          columns : columns
        }).rows;
      }

      // Iterate over all rows and get the max.
      this._eachAll(rows, function(value) {
        if (DS.typeOf(value) === "number" && value > max) {
          max = value;
        }
      });

      return max;
    },

    mean : function() {

    },

    mode : function() {

    },

    freq : function() {

    },

    /**
     * Apply a function to every value in every row of the dataset.
     */
    _eachAll: function(rows, iterator ) {
      _.each(rows, function( row ) {
        _.each(row.data, function( value, index ) {
          iterator( value, index );
        });
      });
    },

    /**
     * builds an event object that either contains the optional
     * delta parameter or it takes the queue.
     * @param {string} name The event name
     * @param {delta} delta The delta object
     */
    _buildEvent : function(name, delta) {
      var e = {};

      // Set event name
      e.name = name;

      if (delta) {

        // Set event delta
        if (DS.typeOf(delta) !== "array") {
          e.delta = [delta];
        } else {
          e.delta = delta;
        }

      }

      if (this._queing) {
        e.delta = _.clone(this._deltaQueue);

        if (delta) {
          e.delta.push(delta);
          e.delta = _.flatten(e.delta);
        }
      }

      return e;
    },

    // bind a specific event to a specific callback.
    bind: function(event, pos, callback) {

    },

    // Trigger callbacks for a specific event. Optionally takes in a position.
    trigger : function(event, pos) {

    },

    _sync: function(event) {

    },

    /**
     * Starts the queing of the detals. By doing this, events will
     * not be triggered while the queue is being filled. This allows
     * for manual event triggering later down the road.
     */
    push : function() {
      this._queing = true;
    },

    /**
     * This methods offers a peek into the current state of the
     * delta queue.
     */
    peek : function() {
      return this._deltaQueue;
    },

    /**
     * This method stops the queing of the deltas. It returns a copy
     * of the existing deltas and clears the current queue.
     */
    pop : function() {
      this._queing = false;
      var deltas = _.clone(this._deltaQueue);
      this._deltaQueue = [];
      return deltas;
    }
  });


  (function() {

    var classType = {},
      types = "Boolean Number String Function Array Date RegExp Object".split(" "),
      length = types.length,
      i = 0,
      patterns = {
        "number" : /^\d+$/,
        "boolean" : /^(true|false)$/
      };
    for ( ; i < length; i++ ) {
      classType[ "[object " + types[ i ] + "]" ] = types[ i ].toLowerCase();
    }
    
    /**
     * Returns the type of an input object.
     * Stolen from jQuery via @rwaldron (http://pastie.org/2849690)
     * @param {?} obj - the object being detected.
     */
    DS.typeOf = function(obj) {
      
      var type = obj == null ?
        String( obj ) :
        classType[ {}.toString.call(obj) ] || "object";

      // if the resulting object is a string, test to see if it's
      // a string of numbers or a boolean. We want those cast
      // properly.
      if (type === "string") {
        _.each(patterns, function(regex, name) {
          if (regex.test(obj)) {
            type = name;
          }
        });
      }
      return type;
    };
  })();

  DS.VERSION = "0.0.1";

}(this, _));
