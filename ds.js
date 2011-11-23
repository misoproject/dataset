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
*  parse : "function to apply to JSON before internal interpretation, optional"
* }
*/

(function(global) {

  var DS = function(options) {
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
    if (options.parent) {
      
      // TODO: do some auto subscribing here...
      
    }

    this._buildData();
  };

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
      
      if (this._options.strict) {
        
       // If this is a strict format import, use the Strict importer.
        importer = new DS.Importers.Strict(this._options.data);
        
      } else if (typeof this._options.data !== "undefined") {

        // If data was set, we've recieved an array of objects?
        importer = new DS.Importers.Obj(this._options.data);
      }  
        
      // remove temporary data holder.  
      delete this._options.data;
      
      // run parser and append rows and columns to this instance
      // of dataset.
      if (importer !== null) {
        _.extend(this, importer.parse());
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

    push : function() {

    },

    pop : function() {

    },

    rows : function(num) {
      return this.filter({ row : num });
    },

    columns : function(name) {

    },

    add : function() {

    },

    get : function(rid, column) {
      return this._byRowId[rid].data[this._byColumnName[column].position];
    },

    /**
     * Sets the values in a particular row to the data object provided
     * as a parameter. Takes an optional set of arguments.
     * @param {int} rid - the row identifier to be modified
     * @param {Object} data - The object containing the new data
     * @param {Object} options (optional) - Contains flags such as, silent(true|false) 
     *   which will prevent event triggering.
     */
    set : function(rid, data, options) {
      this.options || (this.options = {});
      var row = this._byRowId[rid];

      if (typeof row === "undefined") {
        return false;
      } else {
        
        // What a delta object is going to look like.
        var delta = {
          _id : row._id,
          old : {},
          changed : {}
        };

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
      if (this._queing && !this.options.silent) {
        this._deltaQueue.push(delta);
        
      } else if (!this.options.silent) {
        // TODO: trigger proper event here? What exactly should we
        // be triggering here? Which events? All update events listening
        // to this position row?
      }

      return row;
       
    },

    //Calculate the minimum value in the entire dataset
    //TODO memoise and tie to events
    min : function() {
      var min = Infinity;
      this._eachAll(function(value) {
        if (value < min) { min = value; }
      });
      return min;
    },

    //Calculate the maximum value in the entire dataset
    //TODO memoise and tie to events
    max : function() {
      var max = -Infinity;
      this._eachAll(function(value) {
        if (value > max) { max = value; }
      });
      return max;
    },

    mean : function() {

    },

    mode : function() {

    },

    freq : function() {

    },

    //Apply a function to every value in every row of the dataset
    _eachAll: function( iterator ) {
      _.each(this._rows, function( row ) {
        _.each(row.data, function( value ) {
          iterator( value );
        });
      });
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


  /**
   * Returns the type of an input object.
   * Stolen from jQuery via @rwaldron (http://pastie.org/2849690)
   * @param {?} obj - the object being detected.
   */ 
  DS.typeOf = function(obj) {
    var classType = {},
      types = "Boolean Number String Function Array Date RegExp Object".split(" "),
      length = types.length,
      i = 0;
    for ( ; i < length; i++ ) {
      classType[ "[object " + types[ i ] + "]" ] = types[ i ].toLowerCase();
    }
    return obj == null ?
      String( obj ) :
      classType[ {}.toString.call(obj) ] || "object";
  };

  
  DS.Importers = function() {};

  _.extend(DS.Importers, {
    _buildColumn: function(name, type) {
      return {
        _id : _.uniqueId(),
        name : name,
        type : type
      };
    }, 

    /**
     * Used by internal importers to cache the rows and columns
     * in an actual quick lookup table for any id based operations.
     */
    _cache : function(d) {
      d._byRowId = {};
      d._byColumnId = {};
      d._byColumnName = {};

      _.each(d._rows, function(row) {
        d._byRowId[row._id] = row;
      });

      // cache columns, also cache their position
      _.each(d._columns, function(column, index) {
        column.position = index;
        d._byColumnId[column._id] = column;
        d._byColumnName[column.name] = column;
      });
    }
  });
  
  /**
  * Handles basic import. 
  * TODO: add verify flag to disable auto id assignment for example.
  */
  DS.Importers.Strict = function(data, options) {
    this._data = data;  
  };

  _.extend(DS.Importers.Strict.prototype, DS.Importers, {
    _buildColumns : function(n) {
      var columns = this._data.columns;
      
      // verify columns have ids
      _.each(columns, function(column) {
        if (typeof column._id === "undefined") {
          column._id = _.uniqueId();
        }
      });

      return columns;
    },

    parse : function() {
      var d = {};
      
      // Build columns
      d._columns = this._buildColumns();
      
      // Build rows
      d._rows = this._data.rows;
            
      // verify rows have ids
      _.each(d._rows, function(row) {
        if (typeof row._id === "undefined") {
          row._id = _.uniqueId();
        }
      });

      this._cache(d);
      return d;
    }
  });

  /**
   * Converts an array of objects to strict format.
   * @params {Object} obj = [{},{}...]
   */
  DS.Importers.Obj = function(data, options) {
    this._data = data;
  };
  _.extend(DS.Importers.Obj.prototype, DS.Importers, {
    
    _buildColumns : function(n) {
      
      // Pick a sample of n (default is 5) rows
      (n || (n = 5)); 
      var sample = this._data.slice(0, n);
      
      // How many keys do we have?
      var keys  = _.keys(this._data[0]);
      
      // Aggregate the types. For each key,
      // check if the value resolution reduces to a single type.
      // If it does, call that your type.
      var types = _.map(keys, function(key) {
        
        // Build a reduced array of types for this key.
        // If we have N values, we are going to hope that at the end we
        // have an array of length 1 with a single type, like ["string"]
        var vals =  _.inject(this._data, function(memo, row) {
          if (memo.indexOf(DS.typeOf(row[key])) == -1)
            memo.push(DS.typeOf(row[key]));
            return memo;
        }, []); 
        
        if (vals.length == 1) {
          return DS.Importers._buildColumn(key, vals[0]);
        } else {
          return DS.Importers._buildColumn(key, DS.datatypes.UNKNOWN);
        }
      }, this);
      
      return types;
    },
    parse : function() {
      
      var d = {};
      
      // Build columns
      d._columns = this._buildColumns();
      
      // Build rows
      d._rows = _.map(this._data, function(row) {
        
        var r = {};
        
        // Assemble a row by iterating over each column and grabbing
        // the values in the order we expect.
        r.data = _.map(d._columns, function(column) {
          return row[column.name];
        });
        
        // TODO: add id plucking out of data, if exists.
        r._id = _.uniqueId();
        return r;
      });
      
      this._cache(d);
      return d;
    }
  });
  
  DS.VERSION = "0.0.1";
  global.DS = DS;

}(this));
