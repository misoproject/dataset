/**
* Miso.Dataset - v0.1.0 - 2/29/2012
* http://github.com/alexgraul/Dataset
* Copyright (c) 2012 Alex Graul, Irene Ros;
* Licensed MIT, GPL
*/

(function(global, _) {

  /* @exports namespace */
  var Miso = global.Miso = {};

  Miso.typeOf = function( value ) {
    var types = _.keys(Miso.types),
        chosenType;

    //move string to the end
    types.push(types.splice(_.indexOf(types, 'string'), 1)[0]);

    chosenType = _.find(types, function(type) {
      return Miso.types[type].test( value );
    });

    chosenType = _.isUndefined(chosenType) ? 'string' : chosenType;

    return chosenType;
  };
  
  Miso.types = {
    string : {
      name : "string",
      coerce : function(v) {
        return _.isNull(v) ? null : v.toString();
      },
      test : function(v) {
        return (typeof v === 'string');
      },
      compare : function(s1, s2) {
        if (s1 < s2) {return -1;}
        if (s1 > s2) {return 1;}
        return 0;
      },
      // returns a raw value that can be used for computations
      // should be numeric. In the case of a string, just return its index.
      // TODO: not sure what this should really be... thinking about scales here
      // for now, but we may want to return a hash or something instead...
      numeric : function(value, index) {
        return index;
      }
    },

    boolean : {
      name : "boolean",
      regexp : /^(true|false)$/,
      coerce : function(v) {
        if (v === 'false') { return false; }
        return Boolean(v);
      },
      test : function(v) {
        if (typeof v === 'boolean' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(n1, n2) {
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      numeric : function(value) {
        return (value) ? 1 : 0;
      }
    },

    number : {  
      name : "number",
      regexp : /^[\-\.]?[0-9]+([\.][0-9]+)?$/,
      coerce : function(v) {
        if (_.isNull(v)) {
          return null;
        }
        v = Number(v);
        return _.isNaN(v) ? null : v;
      },
      test : function(v) {
        if (typeof v === 'number' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(n1, n2) {
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      numeric : function(value) {
        return value;
      }
    },

    time : {
      name : "time",
      format : "DD/MM/YYYY",
      _formatLookup : [
        ['DD', "\\d{2}"],
        ['MM', "\\d{2}"],
        ['YYYY', "\\d{4}"],
        ['YY', "\\d{2}"]
      ],
      _regexpTable : {},

      _regexp: function(format) {
        //memoise
        if (this._regexpTable[format]) {
          return this._regexpTable[format];
        }

        //build the regexp for substitutions
        var regexp = format;
        _.each(this._formatLookup, function(pair) {
          regexp = regexp.replace(pair[0], pair[1]);
        }, this);

        return this._regexpTable[format] = new RegExp(regexp, 'g');
      },

      coerce : function(v, options) {
        options = options || {};
        // if string, then parse as a time
        if (_.isString(v)) {
          var format = options.format || this.format;
          return moment(v, format);   
        } else if (_.isNumber(v)) {
          return moment(v);
        } else {
          return v;
        }

      },

      test : function(v, format) {
        if (_.isString(v) ) {
          format = format || this.format;
          return this._regexp(format).test(v);
        } else {
          //any number or moment obj basically
          return true;
        }
      },
      compare : function(d1, d2) {
        if (d1 < d2) {return -1;}
        if (d1 > d2) {return 1;}
        return 0;
      },
      numeric : function( value ) {
        return value.valueOf();
      }
    }
  };

}(this, _));

(function(global, _) {

  /* @exports namespace */
  var Miso = global.Miso || (global.Miso = {});

  /**
  * A representation of an event as it is passed through the
  * system. Used for view synchronization and other default
  * CRUD ops.
  * @constructor
  * @param {string} ev - Name of event
  * @param {object|array of objects} deltas - array of deltas.
  */
  Miso.Event = function(deltas) {
    if (!_.isArray(deltas)) {
      deltas = [deltas];
    }
    this.deltas = deltas;
  };

  _.extend(Miso.Event.prototype, {
    affectedColumns : function() {
      var cols = [];
      
      _.each(this.deltas, function(delta) {
        cols = _.union(cols, 
          _.keys(delta.old),
          _.keys(delta.changed)
        );
      });

      return cols;
    }
  });

   _.extend(Miso.Event, {
    /**
    * Returns true if the event is a deletion
    */
    isDelete : function(delta) {
      if (_.isUndefined(delta.changed) || _.keys(delta.changed).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * Returns true if the event is an add event.
    */
    isAdd : function(delta) {
      if (_.isUndefined(delta.old) || _.keys(delta.old).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * Returns true if the event is an update.
    */
    isUpdate : function(delta) {
      if (!this.isDelete(delta) && !this.isAdd(delta)) {
        return true;
      } else {
        return false;
      }
    }
  });
  
  /**
  * @name Miso.Events
  * - Event Related Methods
  * @property {object} Miso.Events - A module aggregating some functionality
  *  related to events. Will be used to extend other classes.
  */
  Miso.Events = {};

  /**
  * Bind callbacks to dataset events
  * @param {string} ev - name of the event
  * @param {function} callback - callback function
  * @param {object} context - context for the callback. optional.
  * @returns {object} context
  */
  Miso.Events.bind = function (ev, callback, context) {
    var calls = this._callbacks || (this._callbacks = {});
    var list  = calls[ev] || (calls[ev] = {});
    var tail = list.tail || (list.tail = list.next = {});
    tail.callback = callback;
    tail.context = context;
    list.tail = tail.next = {};
    return this;
  };

  /**
  * Remove one or many callbacks. If `callback` is null, removes all
  * callbacks for the event. If `ev` is null, removes all bound callbacks
  * for all events.
  * @param {string} ev - event name
  * @param {function} callback - callback function to be removed
  */
  Miso.Events.unbind = function(ev, callback) {
    var calls, node, prev;
    if (!ev) {
      this._callbacks = null;
    } else if (calls = this._callbacks) {
      if (!callback) {
        calls[ev] = {};
      } else if (node = calls[ev]) {
        while ((prev = node) && (node = node.next)) {
          if (node.callback !== callback) { 
            continue;
          }
          prev.next = node.next;
          node.context = node.callback = null;
          break;
        }
      }
    }
    return this;
  };

  /**
  * @public
  * trigger a given event
  * @param {string} eventName - name of event
  */
  Miso.Events.trigger = function(eventName) {
    var node, calls, callback, args, ev, events = ['all', eventName];
    if (!(calls = this._callbacks)) {
      return this;
    }
    while (ev = events.pop()) {
      if (!(node = calls[ev])) {
        continue;
      }
      args = ev === 'all' ? arguments : Array.prototype.slice.call(arguments, 1);
      while (node = node.next) {
        if (callback = node.callback) {
          callback.apply(node.context || this, args);
        }
      }
    }
    return this;
  };

  /**
  * Used to build event objects accross the application.
  * @param {string} ev - event name
  * @public
  * @param {object|array of objects} delta - change delta object.
  * @returns {object} event - Event object.
  */
  Miso.Events._buildEvent = function(delta) {
    return new Miso.Event(delta);
  };
}(this, _));
(function(global, _) {

  var Miso = global.Miso;

  Miso.Column = function(options) {
    this._id = options.id || _.uniqueId();
    this.name = options.name;
    this.type = options.type;
    this.data = options.data || [];
    return this;
  };

  _.extend(Miso.Column.prototype, {

    toNumeric : function(value, index) {
      return Miso.types[this.type].numeric(value, index);  
    },

    numericAt : function(index) {
      return this.toNumeric(this.data[index], index);
    },

    coerce : function() {
      this.data = _.map(this.data, function(datum) {
        return Miso.types[this.type].coerce(datum, this.typeOptions);
      }, this);
    },

    sum : function() {
      return _.sum(this.data);
    },

    max : function() {
      var max = -Infinity;
      for (var j = 0; j < this.data.length; j++) {
        if (Miso.types[this.type].compare(this.data[j], max) > 0) {
          max = this.numericAt(j);
        }
      }
      return max;
    },

    min : function() {
      var min = Infinity;
      for (var j = 0; j < this.data.length; j++) {
        if (Miso.types[this.type].compare(this.data[j], min) < 0) {
          min = this.numericAt(j);
        }
      }
      return min;
    }
  });

  /**
  * @constructor
  *
  * Creates a new view.
  * @param {object} options - initialization parameters:
  *   parent : parent dataset
  *   filter : filter specification TODO: document better
  */
  Miso.View = function(options) {
    //rowFilter, columnFilter, parent
    options = options || (options = {});

    if (_.isUndefined(options.parent)) {
      throw new Error("A view must have a parent specified.");
    } 
    this.parent = options.parent;
    this._initialize(options);

    return this;
  };

  _.extend(Miso.View.prototype, {

    _initialize: function(options) {
      
      // is this a syncable dataset? if so, pull
      // required methoMiso and mark this as a syncable dataset.
      if (this.parent.syncable === true) {
        _.extend(this, Miso.Events);
        this.syncable = true;
      }

      // save filter
      this.filter = {
        columns : this._columnFilter(options.filter.columns || undefined),
        rows    : this._rowFilter(options.filter.rows || undefined)
      };

      // initialize columns.
      this._columns = this._selectData();

      // pass through strict importer
      // TODO: Need to cache all data here, so.... need to
      // either pass through importer, or pull that out. Maybe
      // the data caching can happen elsewhere?
      // right now just passing through default parser.
      var tempParser = new Miso.Parsers();
      _.extend(this, 
        tempParser._cacheColumns(this), 
        tempParser._cacheRows(this));

      // bind to parent if syncable
      if (this.syncable) {
        this.parent.bind("change", this.sync, this);  
      }
    },

    /**
    * @public
    * Syncs up the current view based on a passed delta.
    * TODO Should this be moved to sync.js? Not sure I want to separate it
    * But also not sure it still belongs here.
    */
    sync : function(event) {
      var deltas = event.deltas;
 
      // iterate over deltas and update rows that are affected.
      _.each(deltas, function(d, deltaIndex) {
        
        // find row position based on delta _id
        var rowPos = this._rowPositionById[d._id];

        // ===== ADD NEW ROW

        if (typeof rowPos === "undefined" && Miso.Event.isAdd(d)) {
          // this is an add event, since we couldn't find an
          // existing row to update and now need to just add a new
          // one. Use the delta's changed properties as the new row
          // if it passes the filter.
          if (this.filter.rows && this.filter.rows(d.changed)) {
            this._add(d.changed);  
          }
        } else {

          //===== UPDATE EXISTING ROW
          if (rowPos === "undefined") { return; }
          
          // iterate over each changed property and update the value
          _.each(d.changed, function(newValue, columnName) {
            
            // find col position based on column name
            var colPos = this._columnPositionByName[columnName];
            if (_.isUndefined(colPos)) { return; }
            this._columns[colPos].data[rowPos] = newValue;

          }, this);
        }


        // ====== DELETE ROW (either by event or by filter.)
        // TODO check if the row still passes filter, if not
        // delete it.
        var row = this.rowByPosition(rowPos);
    
        // if this is a delete event OR the row no longer
        // passes the filter, remove it.
        if (Miso.Event.isDelete(d) || 
            (this.filter.row && !this.filter.row(row))) {

          // Since this is now a delete event, we need to convert it
          // to such so that any child views, know how to interpet it.

          var newDelta = {
            _id : d._id,
            old : this.rowByPosition(rowPos),
            changed : {}
          };

          // replace the old delta with this delta
          event.deltas.splice(deltaIndex, 1, newDelta);

          // remove row since it doesn't match the filter.
          this._remove(rowPos);
        }

      }, this);

      // trigger any subscribers 
      if (this.syncable) {
        this.trigger("change", event);  
      }
    },

    /**
    * Returns a dataset view based on the filtration parameters 
    * @param {filter} object with optional columns array and filter object/function 
    * @param {options} options object
    */
    where : function(filter, options) {
      options = options || {};
      
      options.parent = this;
      options.filter = filter || {};

      return new Miso.View(options);
    },

    _selectData : function() {
      var selectedColumns = [];

      _.each(this.parent._columns, function(parentColumn) {
        
        // check if this column passes the column filter
        if (this.filter.columns(parentColumn)) {
          selectedColumns.push({
            name : parentColumn.name,
            data : [], 
            type : parentColumn.type,
            _id : parentColumn._id
          });
        }

      }, this);

      // get the data that passes the row filter.
      this.parent.each(function(row) {

        if (!this.filter.rows(row)) { 
          return; 
        }

        for(var i = 0; i < selectedColumns.length; i++) {
          selectedColumns[i].data.push(row[selectedColumns[i].name]);
        }
      }, this);

      return selectedColumns;
    },

    /**
    * Returns a normalized version of the column filter function
    * that can be executed.
    * @param {name\array of names} columnFilter - function or column name
    */
    _columnFilter: function(columnFilter) {
      var columnSelector;

      // if no column filter is specified, then just
      // return a passthrough function that will allow
      // any column through.
      if (_.isUndefined(columnFilter)) {
        columnSelector = function() {
          return true;
        };
      } else { //array
        columnFilter.push('_id');
        columnSelector = function(column) {
          return _.indexOf(columnFilter, column.name) === -1 ? false : true;
        };
      }

      return columnSelector;
    },

    /**
    * Returns a normalized row filter function
    * that can be executed 
    */
    _rowFilter: function(rowFilter) {
      
      var rowSelector;

      //support for a single ID;
      if (_.isNumber(rowFilter)) {
        rowFilter = [rowFilter];
      }

      if (_.isUndefined(rowFilter)) {
        rowSelector = function() { 
          return true;
        };

      } else if (_.isFunction(rowFilter)) {
        rowSelector = rowFilter;

      } else { //array
        rowSelector = function(row) {
          return _.indexOf(rowFilter, row._id) === -1 ? false : true;
        };
      }

      return rowSelector;
    },

    /**
    * @public
    * Returns a dataset view of the given column name
    * @param {string} name - name of the column to be selected
    */
    column : function(name) {
      return this._column(name);
    },

    /**
    * @private
    * Column accessor that just returns column object
    * witout creating a view of it. Used for Products.
    * @param {string} name - Column name.
    * @returns {object} column 
    */
    _column : function(name) {
      var pos = this._columnPositionByName[name];
      return this._columns[pos];
    },

    /**
    * Returns a dataset view of the given columns 
    * @param {array} filter - an array of column names
    */    
    columns : function(columnsArray) {
     return new Miso.View({
        filter : { columns : columnsArray },
        parent : this
      });
    },

    /**
    * Returns the names of all columns, not including id column.
    * @returns {array} columnNames
    */
    columnNames : function() {
      var cols = _.pluck(this._columns, 'name');
      cols.shift();
      return cols;
    },

    /**
    * @public
    * Iterates over all rows in the dataset
    * @param {function} iterator - function that is passed each row
    * iterator(rowObject, index, dataset)
    * @param {object} context - options object. Optional.
    */    
    each : function(iterator, context) {
      for(var i = 0; i < this.length; i++) {
        iterator.apply(context || this, [this.rowByPosition(i), i]);
      }
    },

    /**
    * Iterates over each column.
    * @param {function} iterator - function that is passed each column name
    * iterator(colName, index, dataset)
    * @param {object} context - options object. Optional.
    */
    eachColumn : function(iterator, context) {
      // skip id col
      for(var i = 1; i < this.length; i++) {
        iterator.apply(context || this, [this._columns[i].name, i]);
      }  
    },

    /**
    * @public
    * Returns a single row based on its position (NOT ID.)
    * @param {number} i - position index
    * @returns {object} row
    */
    rowByPosition : function(i) {
      return this._row(i);
    },

    /** 
    * @public
    * Returns a single row based on its id (NOT Position.)
    * @param {number} id - unique id
    * @returns {object} row
    */
    rowById : function(id) {
      return this._row(this._rowPositionById[id]);
    },

    /**
    * @private
    * A row retriever based on index position in column data.
    * @param {number} i - position index
    * @returns {object} row
    */
    _row : function(pos) {
      var row = {};
      _.each(this._columns, function(column) {
        row[column.name] = column.data[pos];
      });
      return row;   
    },

    /**
    * @private
    * Deletes a row from all columns and caches.
    * Never manually call this. Views are immutable. This is used
    * by the auto syncing capability. Using this against your view
    * will result in dataloss. Only datasets can have rows be removed.
    * @param {number} rowPos - the row to delete at any position
    */
    _remove : function(rowId) {
      var rowPos = this._rowPositionById[rowId];

      // remove all values
      _.each(this._columns, function(column) {
        column.data.splice(rowPos, 1);
      });
      
      // update caches
      delete this._rowPositionById[rowId];
      this._rowIdByPosition.splice(rowPos, 1);
      this.length--;

      return this;
    },

    /**
    * @private
    * Adds a row to the appropriate column positions
    * and updates caches. This should never be called directly!
    * @param {object} row - A row representation.
    */
    _add : function(row, options) {
      
      if (_.isUndefined(this.comparator)) {
        
        // add all data
        _.each(this._columns, function(column) {
          column.data.push(row[column.name] ? row[column.name] : null);
        });

        // add row indeces to the cache
        this._rowIdByPosition.push(row._id);
        this._rowPositionById[row._id] = this._rowIdByPosition.length;
          
      } else {
        
        var insertAt = function(at, value, into) {
          Array.prototype.splice.apply(into, [at, 0].concat(value));
        };

        var i;
        for(i = 0; i < this.length; i++) {
          var row2 = this.rowByPosition(i);
          if (this.comparator(row, row2) < 0) {
            
            _.each(this._columns, function(column) {
              insertAt(i, (row[column.name] ? row[column.name] : null), column.data);
            });
            
            break;
          }
        }
    
        // rebuild position cache... 
        // we could splice it in but its safer this way.
        this._rowIdByPosition = [];
        this._rowPositionById = {};
        this.each(function(row, i) {
          this._rowIdByPosition.push(row._id);
          this._rowPositionById[row._id] = i;
        });
      }

      this.length++;
      
      return this;
    },

    /**
    * Returns a dataset view of filtered rows
    * @param {function|array} filter - a filter function or object, 
    * the same as where
    */    
    rows : function(filter) {
      return new Miso.View({
        filter : { rows : filter },
        parent : this
      });
    },

    /**
    * Sort rows based on comparator
    *
    * roughly taken from here: 
    * http://jxlib.googlecode.com/svn-history/r977/trunk/src/Source/Data/heapsort.js
    * License:
    *   Copyright (c) 2009, Jon Bomgardner.
    *   This file is licensed under an MIT style license
    *
    * @param {object} options - Optional.
    */    
    sort : function(options) {
      options = options || {};
      
      if (_.isUndefined(this.comparator)) {
        throw new Error("Cannot sort without this.comparator.");
      } 

      var count = this.length, end;

      if (count === 1) {
        // we're done. only one item, all sorted.
        return;
      }

      var swap = _.bind(function(from, to) {
      
        // move second row over to first
        var row = this.rowByPosition(to);

        _.each(row, function(value, column) {
          var colPosition = this._columnPositionByName[column],
              value2 = this._columns[colPosition].data[from];
          this._columns[colPosition].data.splice(from, 1, value);
          this._columns[colPosition].data.splice(to, 1, value2);
        }, this);
      }, this);

      var siftDown = _.bind(function(start, end) {
        var root = start, child;
        while (root * 2 <= end) {
          child = root * 2;
          var root_node = this.rowByPosition(root);

          if ((child + 1 < end) && 
              this.comparator(
                this.rowByPosition(child), 
                this.rowByPosition(child+1)
              ) < 0) {
            child++;  
          }

          if (this.comparator(
                root_node, 
                this.rowByPosition(child)) < 0) {
                  
            swap(root, child);
            root = child;
          } else {
            return;
          }
     
        }
          
      }, this);
      

      // puts data in max-heap order
      var heapify = function(count) {
        var start = Math.round((count - 2) / 2);
        while (start >= 0) {
          siftDown(start, count - 1);
          start--;
        }  
      };

      if (count > 2) {
        heapify(count);

        end = count - 1;
        while (end > 1) {
          
          swap(end, 0);
          end--;
          siftDown(0, end);

        }
      } else {
        if (this.comparator(
            this.rowByPosition(0), 
            this.rowByPosition(1)) > 0) {
          swap(0,1);
        }
      }

      if (this.syncable) {
        this.trigger("sort");  
      }
    }
  });

}(this, _));

/**
Library Deets go here
USE OUR CODES

Version 0.0.1.2
*/

(function(global, _, moment) {

  var Miso = global.Miso;

  /**
  * @constructor
  *
  * Instantiates a new dataset.
  * @param {object} options - optional parameters. 
  *   url : "String - url to fetch data from",
  *   jsonp : "boolean - true if this is a jsonp request",
  *   delimiter : "String - a delimiter string that is used in a tabular datafile",
  *   data : "Object - an actual javascript object that already contains the data",
  *   table : "Element - a DOM table that contains the data",
  *   format : "String - optional file format specification, otherwise we'll try to guess",
  *   recursive : "Boolean - if true build nested arrays of objects as datasets",
  *   strict : "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
  *   extract : "function to apply to JSON before internal interpretation, optional"
  *   ready : the callback function to act on once the data is fetched. Isn't reuired for local imports
  *           but is required for remote url fetching.
  *   columnNames : {
  *     oldName : newName
  *   },
  *   columnTypes : {
  *     name : typeName || { type : name, ...additionalProperties }
  *   }
  *   google_spreadsheet: {
  *     key : "", worksheet(optional) : ""
  *   },
  *   sorted : true (optional) - If the dataset is already sorted, pass true
  *     so that we don't trigger a sort otherwise.
  *   comparator : function (optional) - takes two rows and returns 1, 0, or -1  if row1 is
  *     before, equal or after row2. 
  *   deferred : by default we use underscore.deferred, but if you want to pass your own (like jquery's) just
  *              pass it here.
  }
  */

  Miso.Dataset = function(options) {
    options = options || (options = {});
    this._initialize(options);
    return this;
  };

  _.extend(Miso.Dataset.prototype, Miso.View.prototype, {

    /**
    * @private
    * Internal initialization method. Reponsible for data parsing.
    * @param {object} options - Optional options  
    */
    _initialize: function(options) {

      // is this a syncable dataset? if so, pull
      // required methods and mark this as a syncable dataset.
      if (options.sync === true) {
        _.extend(this, Miso.Events);
        this.syncable = true;
      }

      // initialize importer from options or just create a blank
      // one for now, we'll detect it later.
      this.importer = options.importer || null;

      // default parser is object parser, unless otherwise specified.
      this.parser  = options.parser || Miso.Parsers.Obj;

      // figure out out if we need another parser.
      if (_.isUndefined(options.parser)) {
        if (options.strict) {
          this.parser = Miso.Parsers.Strict;
        } else if (options.delimiter) {
          this.parser = Miso.Parsers.Delimited;
        } else if (options.google_spreadsheet) {
          this.parser = Miso.Parsers.GoogleSpreadsheet;
        }
      }

      // set up some base options for importer.
      var importerOptions = _.extend({}, 
        options,
        { parser : this.parser }
      );

      if (options.delimiter) {
        importerOptions.dataType = "text";
      }

      if (options.google_spreadsheet) {
        _.extend(importerOptions, options.google_spreadsheet);
      }

      // initialize the proper importer
      if (this.importer === null) {
        if (options.url) {
          this.importer = Miso.Importers.Remote;
        } else if (options.google_spreadsheet) {
          this.importer = Miso.Importers.GoogleSpreadsheet;
          delete options.google_spreadsheet;
        } else {
          this.importer = Miso.Importers.Local;
        }
      }

      // initialize actual new importer.
      this.importer = new this.importer(importerOptions);

      // save comparator if we have one
      if (options.comparator) {
        this.comparator = options.comparator;  
      }

      // if we have a ready callback, save it too
      if (options.ready) {
        this.ready = options.ready;
      }

      // if for any reason, you want to use a different deferred
      // implementation, pass it as an option
      if (options.deferred) {
        this.deferred = options.deferred;
      }
    },

    /**
    * Responsible for actually fetching the data based on the initialized dataset.
    * Note that this needs to be called for either local or remote data.
    * There are three different ways to use this method:
    * ds.fetch() - will just fetch the data based on the importer. Note that for async 
    *              fetching this isn't blocking so don't put your next set of instructions
    *              expecting the data to be there.
    * ds.fetch({
    *   success: function() { 
    *     // do stuff
    *     // this is the dataset.
    *   },
    *   error : function(e) {
    *     // do stuff
    *   }
    * })        - Allows you to pass success and error callbacks that will be called once data
    *             is property fetched.
    *
    * _.when(ds.fetch(), function() {
    *   // do stuff
    *   // note 'this' is NOT the dataset.
    * })        - Allows you to use deferred behavior to potentially chain multiple datasets.
    *
    * @param {object} options Optional success/error callbacks.
    **/
    fetch : function(options) {
      options = options || {};
      
      var dfd = this.deferred || new _.Deferred();

      if (this.importer !== null) {

        this.importer.fetch({
          
          success: _.bind(function(d) {
            _.extend(this, d);

            // if a comparator was defined, sort the data
            if (this.comparator) {
              this.sort();
            }

            // call ready method
            if (this.ready) {
              this.ready.call(this);
            }

            // call success method if any passed
            if (options.success) {
              options.success.call(this);
            }

            // resolve deferred
            dfd.resolve(this);

          }, this),

          error : _.bind(function(e) {

            // call error if any passed
            if (options.error) {
              options.error.call(this);
            }

            // reject deferred
            dfd.reject(e);

          }, this)
        });
      }

      return dfd.promise();
    },

    /**
    * Add a row to the dataset
    * TODO: multiple rows?
    * @param {object} row - an object representing a row in the form of:
    * {columnName: value}
    * @param {object} options - options
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    add : function(row, options) {
      if (!row._id) {
        row._id = _.uniqueId();
      }

      this._add(row, options);

      if (this.syncable && (!options || !options.silent)) {
        this.trigger('add', this._buildEvent({ changed : row }) );
        this.trigger('change', this._buildEvent({ changed : row }) );
      }
    },

    /**
    * Remove all rows that match the filter
    * TODO: single row by id?
    * @param {function} filter - function applied to each row
    * @param {object} options - options. Optional.
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    remove : function(filter, options) {
      filter = this._rowFilter(filter);
      var deltas = [];

      this.each(function(row, rowIndex) {
        if (filter(row)) {
          this._remove(row._id);
          deltas.push( { old: row } );
        }
      });
      if (this.syncable && (!options || !options.silent)) {
        var ev = this._buildEvent( deltas );
        this.trigger('change', ev );
        this.trigger('remove', ev );
      }
    },

    /**
    * Update all rows that match the filter
    * TODO: dynamic values
    * @param {function} filter - filter rows to be updated
    * @param {object} newProperties - values to be updated.
    * @param {object} options - options. Optional.
    */    
    update : function(filter, newProperties, options) {
      filter = this._rowFilter(filter);

      var newKeys = _.keys(newProperties),
          deltas = [];

      this.each(function(row, rowIndex) {
        if (filter(row)) {
          _.each(this._columns, function(c) {
            if (_.indexOf(newKeys, c.name) !== -1) {
              if ((c.type !== 'untyped') && (c.type !== Miso.typeOf(newProperties[c.name]))) {
                throw("incorrect value '"+newProperties[c.name]+"' of type "+Miso.typeOf(newProperties[c.name])+" passed to column with type "+c.type);
              }
              c.data[rowIndex] = newProperties[c.name];
            }
          }, this);

          deltas.push( { _id : row._id, old : row, changed : newProperties } );
        }
      }, this);

      if (this.syncable && (!options || !options.silent)) {
        var ev = this._buildEvent( deltas );
        this.trigger('change', ev );
        this.trigger('remove', ev );
      }

    }

  });
}(this, _, moment));


(function(global, _) {

  // shorthand
  var Miso = global.Miso;
  var Product = (Miso.Product || function() {

    Miso.Product = function(options) {
      options = options || (options = {});
      
      // save column name. This will be necessary later
      // when we decide whether we need to update the column
      // when sync is called.
      this.func = options.func;

      // determine the product type (numeric, string, time etc.)
      if (options.columns) {
        var column = options.columns;
        if (_.isArray(options.columns)) {
          column = options.columns[0];
        }
        
        this.valuetype = column.type;
        this.numeric = function() {
          return column.toNumeric(this.value);
        };
      }

      this.value = this.func({ silent : true });
      return this;
    };

    return Miso.Product;
  })();

  _.extend(Product.prototype, Miso.Events, {

    /**
    * @public
    * This is a callback method that is responsible for recomputing
    * the value based on the column its closed on.
    */
    sync : function(event) {
      this.value = this.func();
    },

    /**
    * @public
    * return the raw value of the product
    * @returns {?} value - The value of the product. Most likely a number.
    */
    val : function() {
      return this.value;
    },

    /**
    * @public
    * return the type of product this is (numeric, time etc.)
    * @returns {?} type.
    */
    type : function() {
      return this.valuetype;
    },

    _buildDelta : function(old, changed) {
      return {
        old : old,
        changed : changed
      };
    }
  });

  _.extend(Miso.Dataset.prototype, {

    _columnsToArray : function(columns) {
      if (_.isUndefined(columns)) {
        columns = this.columnNames();
      }
      columns = _.isArray(columns) ? columns : [columns];
      // verify this is an appropriate type for this function
      
      return columns;
    },

    _toColumnObjects : function(columns) {
      var columnObjects = [];
      _.each(columns, function(column) {
        column = this._columns[this._columnPositionByName[column]];
        columnObjects.push(column);
      }, this);
      return columnObjects;
    },

    sum : function(columns, options) {
      options = options || {};
      columns = this._columnsToArray(columns);
      var columnObjects = this._toColumnObjects(columns);

      var sumFunc = (function(columns){
        return function() {
          var sum = 0;
          for (var i= 0; i < columns.length; i++) {
            sum += columns[i].sum();
          }
          return sum;
        };
      }(columnObjects));

      if (this.syncable) {
        return this.calculated(columnObjects, sumFunc);
      } else {
        return sumFunc();
      }
    },

    /**
    * return a Product with the value of the maximum 
    * value of the column
    * @param {column/columns} column or array of columns on which the value is calculated 
    */    
    max : function(columns, options) {
      options = options || {};
      columns = this._columnsToArray(columns);
      var columnObjects = this._toColumnObjects(columns);

      var maxFunc = (function(columns) {
        return function() {
          var max = -Infinity, columnObject;
          for (var i= 0; i < columns.length; i++) {
            columnObject = columns[i];

            for (var j= 0; j < columnObject.data.length; j++) {
              if (Miso.types[columnObject.type].compare(columnObject.data[j], max) > 0) {
                max = columnObject.numericAt(j);
              }
            }
          }
          
          // save types and type options to later coerce
          var type = columnObject.type;
          var typeOptions = columnObject.typeOptions;

          // return the coerced value for column type.
          return Miso.types[type].coerce(max, typeOptions);
        };
      }(columnObjects));

      if (this.syncable) {
        return this.calculated(columnObjects, maxFunc);  
      } else {
        return maxFunc();
      }
      
    },

    /**
    * return a Product with the value of the minimum 
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    min : function(columns, options) {
      options = options || {};
      columns = this._columnsToArray(columns);
      var columnObjects = this._toColumnObjects(columns);
      
      var minFunc = (function(columns) {
        return function() {
          var min = Infinity, columnObject;
          for (var i= 0; i < columns.length; i++) {
            columnObject = columns[i];
            for (var j= 0; j < columnObject.data.length; j++) {
              if (Miso.types[columnObject.type].compare(columnObject.data[j], min) < 0) {
                min = columnObject.numericAt(j);
              }
            }
          }
           // save types and type options to later coerce
          var type = columnObject.type;
          var typeOptions = columnObject.typeOptions;

          // return the coerced value for column type.
          return Miso.types[type].coerce(min, typeOptions);
        };
      }(columnObjects));

      if (this.syncable) {
        return this.calculated(columnObjects, minFunc);  
      } else {
        return minFunc();
      }
      
    },

    /**
    * return a Product with the value of the average
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    mean : function(column, options) {},

    /*
    * return a Product with the value of the mode
    * of the column
    * @param {column} column on which the value is calculated 
    */    
    mode : function(column, options) {},

    /*
    * return a Product derived by running the passed function
    * @param {column} column on which the value is calculated 
    * @param {producer} function which derives the product after
    * being passed each row. TODO: producer signature
    */    
    calculated : function(columns, producer) {
      var _self = this;

      var prod = new Product({
        columns : columns,
        func : function(options) {
          options = options || {};
          
          // build a diff delta. We're using the column name
          // so that any subscribers know whether they need to 
          // update if they are sharing a column.
          var delta = this._buildDelta( this.value, producer.apply(_self) );

          if (_self.syncable) {
            var event = this._buildEvent( "change", delta );

            // trigger any subscribers this might have if the values are diff
            if (!_.isUndefined(delta.old) && !options.silent && delta.old !== delta.changed) {
              this.trigger("change", event);
            }  
          }

          // return updated value
          return delta.changed;
        }
      });

      // auto bind to parent dataset if its syncable
      if (this.syncable) {
        this.bind("change", prod.sync, prod);  
      }
      return prod;
    }

  });

}(this, _));


(function(global, _) {

  var Miso = (global.Miso = global.Miso || {});

  _.extend(global.Miso.Dataset.prototype, {
    /**
    * moving average
    * @param {column} column on which to calculate the average
    * @param {width} direct each side to take into the average
    */
    movingAverage : function(column, width) {

    },

    /**
    * group rows by values in a given column
    * @param {byColumn} column by which rows will be grouped
    * @param {columns} columns to be included
    * @params {object} options 
    *   method function to be applied, default addition
    *   preprocess - specify a normalization function for the
    * byColumn values if you need to group by some kind of derivation of 
    * those values that are not just equality based.
    */
    groupBy : function(byColumn, columns, options) {
      
      options = options || {};

      // TODO: should we check type match here?
      // default method is addition
      var method = options.method || _.sum;

      var d = {
        _columns : []
      };

      if (options && options.preprocess) {
        this.preprocess = options.preprocess;  
      }

      var parser = new Miso.Parsers();

      // copy columns we want - just types and names. No data.
      var newCols = _.union([byColumn], columns);
      _.each(newCols, function(columnName) {
        var newColumn = d._columns.push(_.clone(
          this._columns[this._columnPositionByName[columnName]])
        );

        d._columns[d._columns.length-1].data = [];
      }, this);

      // save column positions on new dataset.
      d = parser._cacheColumns(d);

      // a cache of values
      var categoryPositions = {},
          categoryCount     = 0,
          byColumnPosition  = d._columnPositionByName[byColumn];

      // bin all values by their categories
      for(var i = 0; i < this.length; i++) {
        var category = null;
        if (this.preprocess) {
          category = this.preprocess(this._columns[this._columnPositionByName[byColumn]].data[i]);
        } else {
          category = this._columns[this._columnPositionByName[byColumn]].data[i];  
        }
         
        if (_.isUndefined(categoryPositions[category])) {
            
          // this is a new value, we haven't seen yet so cache
          // its position for lookup of row vals
          categoryPositions[category] = categoryCount;

          // add an empty array to all columns at that position to
          // bin the values
          _.each(columns, function(columnToGroup) {
            var column = d._columns[d._columnPositionByName[columnToGroup]];
            column.data[categoryCount] = [];
          });

          // add the actual bin number to the right col
          d._columns[d._columnPositionByName[byColumn]].data[categoryCount] = category;

          categoryCount++;
        }

        _.each(columns, function(columnToGroup) {
          
          var column = d._columns[d._columnPositionByName[columnToGroup]],
              value  = this._columns[this._columnPositionByName[columnToGroup]].data[i],
              binPosition = categoryPositions[category];

          column.data[binPosition].push(value);
        }, this);
      }

      // now iterate over all the bins and combine their
      // values using the supplied method. 
      _.each(columns, function(colName) {
        var column = d._columns[d._columnPositionByName[colName]];
        _.each(column.data, function(bin, binPos) {
          if (_.isArray(bin)) {
            column.data[binPos] = method.call(this, bin);
          }
        });
      }, this);
    
      // create new dataset based on this data
      d.columns = d._columns;
      delete d._columns;
      var ds = new Miso.Dataset({
        data   : d,
        strict : true
      });

      // TODO: subscribe this to parent dataset!
      var fetcheddata = null;
      ds.fetch({
        success : function() {
          fetcheddata = this;
        }
      });
      return fetcheddata;
    }
  });

}(this, _));


(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));

  // ------ data parsers ---------
  Miso.Parsers = function() {};

  _.extend(Miso.Parsers.prototype, {

    /**
    * Creates an internal representation of a column based on
    * the form expected by our strict json.
    * @param {string} name The column name
    * @param {string} type The type of the data in the column
    */
    _buildColumn : function(name, type, data) {
      // if all properties were passed as an object rather
      // than separatly
      if (_.isObject(name) && arguments.length === 1) {
        return new Miso.Column(name);  
      } else {
        return new Miso.Column({
          name : name,
          type : type,
          data : data
        });
      }
    },

    build : function(options) {
      var d = {};

      this._buildColumns(d);
      this._setTypes(d, this.options);
      this._detectTypes(d);
      this._coerceTypes(d);
      this._cacheColumns(d);
      this._cacheRows(d);

      return d;
    },

    _coerceTypes : function(d) {

      // also save raw type function onto column for future computable
      // value extraction
      _.each(d._columns, function(column, index) {
        column.coerce();
      });
      return d;
    },

    _setTypes : function(d, options) {
      options.columnTypes = options.columnTypes || {};
      _.each(d._columns, function(column) {
        var type = options.columnTypes[column.name];
        if (type) {

          // if the type is specified as an object of a form such as:
          // { type : time, format : 'YYYY/MM/DDD'}
          // then take the type property as the type and extend the 
          // column to add a property called
          // typeOptions with the rest of the attributes.
          if (_.isObject(type)) {
            column.type = type.type;
            delete type.type;
            column.typeOptions = type;
          } else {
            column.type = type;
          }
        } 
      });
    },

    _addValue : function(d, columnName, value) {
      var colPos = d._columnPositionByName[columnName];
      d._columns[colPos].data.push(value);
    },

    _detectTypes : function(d, n) {

      _.each(d._columns, function(column) {

        // check if the column already has a type defined. If so, skip
        // this auth detection phase.
        if (_.isUndefined(column.type) || column.type === null) {

          // compute the type by assembling a sample of computed types
          // and then squashing it to create a unique subset.
          var type = _.inject(column.data.slice(0, (n || 5)), function(memo, value) {

            var t = Miso.typeOf(value);

            if (value !== "" && memo.indexOf(t) === -1 && !_.isNull(value)) {
              memo.push(t);
            }
            return memo;
          }, []);

          // if we only have one type in our sample, save it as the type
          if (type.length === 1) {
            column.type = type[0];
          } else if (type.length === 0) {
            // we are assuming that this is a number type because we have
            // no values in the sample. Unfortunate.
            column.type = "number";
          } else {
            throw new Error("This column seems to have mixed types");
          }
        }

      });

      return d;
    },

    /**
    * Used by internal importers to cache the columns and their
    * positions in a fast hash lookup.
    * @param d {object} the data object to append cache to.
    */
    _cacheColumns : function(d) {
      d._columnPositionByName = {};

      // cache columns by their column names
      // TODO: should we cache by _id?
      _.each(d._columns, function(column, index) {
        d._columnPositionByName[column.name] = index;
      });

      return d;
    },

    /**
    * Used by internal importers to cache the rows 
    * in quick lookup tables for any id based operations.
    * @param d {object} the data object to append cache to.
    */
    _cacheRows : function(d) {

      d._rowPositionById = {};
      d._rowIdByPosition = [];

      // cache the row id positions in both directions.
      // iterate over the _id column and grab the row ids
      _.each(d._columns[d._columnPositionByName._id].data, function(id, index) {
        d._rowPositionById[id] = index;
        d._rowIdByPosition.push(id);
      });  

      // cache the total number of rows. There should be same 
      // number in each column's data type
      var rowLengths = _.uniq( _.map(d._columns, function(column) { 
        return column.data.length;
      }));

      if (rowLengths.length > 1) {
        throw new Error("Row lengths need to be the same. Empty values should be set to null." + _.map(d._columns, function(c) { return c.data + "|||" ; }));
      } else {
        d.length = rowLengths[0];
      }

      return d;
    },

    /**
    * Adds an id column to the column definition. If a count
    * is provided, also generates unique ids.
    * @param d {object} the data object to modify
    * @param count {number} the number of ids to generate.
    */
    _addIdColumn : function(d, count) {
      // if we have any data, generate actual ids.
      var ids = [];
      if (count && count > 0) {
        _.times(count, function() {
          ids.push(_.uniqueId());
        });
      }
      d._columns.unshift(
        this._buildColumn("_id", "number", ids)
      );

      return d;
    },


    /**
    * By default we are assuming that our data is in
    * the correct form from the fetching.
    */
    parse : function(data) {
      return data;
    }
  });

  // ------ Strict Parser ---------
  /**
  * Handles basic strict data format.
  * TODO: add verify flag to disable auto id assignment for example.
  */
  Miso.Parsers.Strict = function(data, options) {
    this.options = options || {};
    this._data = this.parse(data);
  };

  _.extend(
    Miso.Parsers.Strict.prototype,
    Miso.Parsers.prototype, {

      _buildColumns : function(d) {
        d._columns = [];
        
        _.each(this._data._columns, function(columnOpts) {
          d._columns.push(this._buildColumn(columnOpts));
        }, this);

        // add row _id column. Generate auto ids if there
        // isn't already a unique id column.
        if (_.pluck(d._columns, "name").indexOf("_id") === -1) {
          this._addIdColumn(d, d._columns[0].data.length);
        }

        return d;
      }

    });

    // -------- Object Parser -----------
    /**
    * Converts an array of objects to strict format.
    * Each object is a flat json object of properties.
    * @params {Object} obj = [{},{}...]
    */
    Miso.Parsers.Obj = function(data, options) {
      this.options = options || {};
      this._data = data;
    };

    _.extend(
      Miso.Parsers.Obj.prototype,
      Miso.Parsers.prototype, {

        _buildColumns : function(d, n) {

          d._columns = [];

          // create column container objects
          var columnNames  = _.keys(this._data[0]);
          _.each(columnNames, function(columnName) {
            d._columns.push(this._buildColumn(columnName, null));
          }, this);

          // add id column
          this._addIdColumn(d);

          // cache them so we have a lookup
          this._cacheColumns(d);

          // Build rows
          _.map(this._data, function(row) {

            // iterate over properties in each row and add them
            // to the appropriate column data.
            _.each(row, function(value, key) {
              this._addValue(d, key, value);
            }, this);

            // add a row id
            this._addValue(d, "_id", _.uniqueId());
          }, this);

          return d;
        },

        build : function(options) {

          var d = {};

          this._buildColumns(d);
          // column caching happens inside of build columns this time
          // so that rows know which column their values belong to
          // before we build the data.
          this._setTypes(d, this.options);
          this._detectTypes(d);
          this._coerceTypes(d);
          this._cacheRows(d);
          return d;
        }
      }
    );

    // ---------- Data Importers -------------

    // this XHR code is from @rwldron.
    var _xhrSetup = {
      url       : "",
      data      : "",
      dataType  : "",
      success   : function() {},
      type      : "GET",
      async     : true,
      xhr : function() {
        return new global.XMLHttpRequest();
      }
    }, rparams = /\?/;

    Miso.Xhr = function(options) {

      // json|jsonp etc.
      options.dataType = options.dataType && options.dataType.toLowerCase() || null;

      if (options.dataType && 
        (options.dataType === "jsonp" || options.dataType === "script" )) {

          Miso.Xhr.getJSONP(
            options.url,
            options.success,
            options.dataType === "script",
            options.error
          );

          return;
        }

        var settings = _.extend({}, _xhrSetup, options);

        // create new xhr object
        settings.ajax = settings.xhr();

        if (settings.ajax) {
          if (settings.type === "GET" && settings.data) {

            //  append query string
            settings.url += (rparams.test(settings.url) ? "&" : "?") + settings.data;

            //  Garbage collect and reset settings.data
            settings.data = null;
          }

          settings.ajax.open(settings.type, settings.url, settings.async);
          settings.ajax.send(settings.data || null);

          return Miso.Xhr.httpData(settings);
        }
    };

    Miso.Xhr.getJSONP = function(url, success, isScript, error) {
      // If this is a script request, ensure that we do not 
      // call something that has already been loaded
      if (isScript) {

        var scripts = document.querySelectorAll("script[src=\"" + url + "\"]");

        //  If there are scripts with this url loaded, early return
        if (scripts.length) {

          //  Execute success callback and pass "exists" flag
          if (success) { 
            success(true);
          }

          return;
        }
      } 

      var head    = document.head || 
      document.getElementsByTagName("head")[0] || 
      document.documentElement,

      script    = document.createElement("script"),
      paramStr  = url.split("?")[ 1 ],
      isFired   = false,
      params    = [],
      callback, parts, callparam;

      // Extract params
      if (paramStr && !isScript) {
        params = paramStr.split("&");
      }
      if (params.length) {
        parts = params[params.length - 1].split("=");
      }
      callback = params.length ? (parts[ 1 ] ? parts[ 1 ] : parts[ 0 ]) : "jsonp";

      if (!paramStr && !isScript) {
        url += "?callback=" + callback;
      }

      if (callback && !isScript) {

        // If a callback name already exists
        if (!!window[callback]) {
          callback = callback + (+new Date()) + _.uniqueId();
        }

        //  Define the JSONP success callback globally
        window[callback] = function(data) {
          if (success) { 
            success(data);
          }
          isFired = true;
        };

        //  Replace callback param and callback name
        url = url.replace(parts.join("="), parts[0] + "=" + callback);
      }

      script.onload = script.onreadystatechange = function() {
        if (!script.readyState || /loaded|complete/.test(script.readyState)) {

          //  Handling remote script loading callbacks
          if (isScript) {

            //  getScript
            if (success) { 
              success();
            }
          }

          //  Executing for JSONP requests
          if (isFired) {

            //  Garbage collect the callback
            delete window[callback];

            //  Garbage collect the script resource
            head.removeChild(script);
          }
        }
      };

      script.onerror = function(e) {
        if (error) { 
          error.call(null);
        }
      };

      script.src = url;
      head.insertBefore(script, head.firstChild);
      return;
    };

    Miso.Xhr.httpData = function(settings) {
      var data, json = null;

      settings.ajax.onreadystatechange = function() {
        if (settings.ajax.readyState === 4) {
          try {
            json = JSON.parse(settings.ajax.responseText);
          } catch (e) {
            // suppress
          }

          data = {
            xml : settings.ajax.responseXML,
            text : settings.ajax.responseText,
            json : json
          };

          if (settings.dataType) {
            data = data[settings.dataType];
          }

          // if we got an ok response, call success, otherwise fail.
          if (/(2..)/.test(settings.ajax.status)) {
            settings.success.call(settings.ajax, data);  
          } else {
            if (settings.error) {
              settings.error.call(null, settings.ajax.statusText);
            }
          }
        }
      };

      return data;
    };

    Miso.Importers = function(data, options) {};

    /**
    * Simple base parse method, passing data through
    */
    Miso.Importers.prototype.extract = function(data) {
      data = _.clone(data);
      data._columns = data.columns;
      delete data.columns;
      return data;
    };

    /**
    * Local data importer is responsible for just using 
    * a data object and passing it appropriatly.
    */
    Miso.Importers.Local = function(options) {
      this.options = options || (options = {});

      if (this.options.extract) {
        this.extract = this.options.extract;
      }
      this.data = options.data;
      this.parser = this.options.parser || Miso.Importer.Obj;
    };

    _.extend(
      Miso.Importers.Local.prototype,
      Miso.Importers.prototype, {
        fetch : function(options) {
          // since this is the local importer, it just
          // passes the data through, parsed.
          this.data = this.extract(this.data);

          // create a new parser and pass the parsed data in
          this.parser = new this.parser(this.data, _.extend({},
            this.options,
            options));

            var parsedData = this.parser.build();
            options.success(parsedData);     
        }
      });

      /**
      * A remote importer is responsible for fetching data from a url
      * and passing it through the right parser.
      */
      Miso.Importers.Remote = function(options) {
        options = options || {};
        this._url = options.url;

        if (options.extract) {
          this.extract = options.extract;
        }

        this.parser = options.parser || Miso.Parsers.Obj;

        // Default ajax request parameters
        this.params = {
          type : "GET",
          url : this._url,
          dataType : options.dataType ? options.dataType : (options.jsonp ? "jsonp" : "json")
        };
      };

      _.extend(
        Miso.Importers.Remote.prototype,
        Miso.Importers.prototype,
        {
          fetch : function(options) {

            // call the original fetch method of object parsing.
            // we are assuming the parsed version of the data will
            // be an array of objects.
            var callback = _.bind(function(data) {
              data = this.extract(data);

              // create a new parser and pass the parsed data in
              this.parser = new this.parser(data, options);

              var parsedData = this.parser.build();
              options.success(parsedData);  

            }, this);

            // make ajax call to fetch remote url.
            Miso.Xhr(_.extend(this.params, { 
              success : callback,
              error   : options.error
            }));
          }
        }
      );



}(this, _));

// --------- Google Spreadsheet Parser -------
// This is utilizing the format that can be obtained using this:
// http://code.google.com/apis/gdata/samples/spreadsheet_sample.html

(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));

/**
* @constructor
* Google Spreadsheet Parser. 
* Used in conjunction with the Google Spreadsheet Importer.
* Requires the following:
* @param {object} data - the google spreadsheet data.
* @param {object} options - Optional options argument.
*/
Miso.Parsers.GoogleSpreadsheet = function(data, options) {
  this.options = options || {};
  this._data = data;
};

_.extend(Miso.Parsers.GoogleSpreadsheet.prototype, Miso.Parsers.prototype, {

  _buildColumns : function(d, n) {
    d._columns = [];

    var positionRegex = /([A-Z]+)(\d+)/; 
    var columnPositions = {};

    _.each(this._data.feed.entry, function(cell, index) {

      var parts = positionRegex.exec(cell.title.$t),
      column = parts[1],
      position = parseInt(parts[2], 10);

      if (_.isUndefined(columnPositions[column])) {

        // cache the column position
        columnPositions[column] = d._columns.length;

        // we found a new column, so build a new column type.
        d._columns.push(this._buildColumn(cell.content.$t, null, []));

      } else {

        // find position: 
        var colpos = columnPositions[column];

        // this is a value for an existing column, so push it.
        d._columns[colpos].data[position-1] = cell.content.$t; 
      }
    }, this);

    // fill whatever empty spaces we might have in the data due to 
    // empty cells
    d.length = _.max(d._columns, function(column) { 
      return column.data.length; 
    }).data.length - 1; // for column name

    _.each(d._columns, function(column, index) {

      // slice off first space. It was alocated for the column name
      // and we've moved that off.
      column.data.splice(0,1);

      for (var i = 0; i < d.length; i++) {
        if (_.isUndefined(column.data[i]) || column.data[i] === "") {
          column.data[i] = null;
        }
      }
    });

    // add row _id column. Generate auto ids if there
    // isn't already a unique id column.
    if (_.pluck(d._columns, "name").indexOf("_id") === -1) {
      this._addIdColumn(d, d._columns[0].data.length);
    }

    return d;
  }

});

/**
* @constructor
* Instantiates a new google spreadsheet importer.
* @param {object} options - Options object. Requires at the very least:
*     key - the google spreadsheet key
*     worksheet - the index of the spreadsheet to be retrieved.
*   OR
*     url - a more complex url (that may include filtering.) In this case
*           make sure it's returning the feed json data.
*/
Miso.Importers.GoogleSpreadsheet = function(options) {
  options = options || {};
  if (options.url) {

    options.url = options.url;

  } else {

    if (_.isUndefined(options.key)) {

      throw new Error("Set options.key to point to your google document.");
    } else {

      options.worksheet = options.worksheet || 1;
      options.url = "https://spreadsheets.google.com/feeds/cells/" + options.key + "/" + options.worksheet + "/public/basic?alt=json-in-script&callback=";
      delete options.key;
      delete options.worksheet;
    }
  }

  this.parser = Miso.Parsers.GoogleSpreadsheet;
  this.params = {
    type : "GET",
    url : options.url,
    dataType : "jsonp"
  };

  return this;
};

_.extend(
  Miso.Importers.GoogleSpreadsheet.prototype, 
Miso.Importers.Remote.prototype);

}(this, _));

// -------- Delimited Parser ----------

/**
* Handles CSV and other delimited data. Takes in a data string
* and options that can contain: {
*   delimiter : "someString" <default is comma> 
* }
*/

(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));


  Miso.Parsers.Delimited = function(data, options) {
    this.options = options || {};

    this.delimiter = this.options.delimiter || ",";
    this._data = data;

    this.__delimiterPatterns = new RegExp(
      (
        // Delimiters.
        "(\\" + this.delimiter + "|\\r?\\n|\\r|^)" +

        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

        // Standard fields.
        "([^\"\\" + this.delimiter + "\\r\\n]*))"
      ),
      "gi"
    );
  };

  _.extend(Miso.Parsers.Delimited.prototype, Miso.Parsers.prototype, {

    _buildColumns : function(d, sample) {

      d._columns = [];

      // convert the csv string into the beginnings of a strict
      // format. The only thing missing is type detection.
      // That happens after all data is parsed.
      var parseCSV = function(delimiterPattern, strData, strDelimiter) {

        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create an array to hold our data. Give the array
        // a default empty first row.


        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // track how many columns we have. Once we reach a new line
        // mark a flag that we're done calculating that.
        var columnCount = 0;
        var columnCountComputed = false;

        // track which column we're on. Start with -1 because we increment it before
        // we actually save the value.
        var columnIndex = -1;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = delimiterPattern.exec(strData)){

          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ];

          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if ( strMatchedDelimiter.length &&
            ( strMatchedDelimiter !== strDelimiter )){
              // we have reached a new row.

              // We are clearly done computing columns.
              columnCountComputed = true;

              // when we're done with a row, reset the row index to 0
              columnIndex = 0;
            } else {

              // Find the number of columns we're fetching and
              // create placeholders for them.
              if (!columnCountComputed) {
                columnCount++;
              }

              columnIndex++;
            }


            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            var strMatchedValue = null;
            if (arrMatches[ 2 ]){

              // We found a quoted value. When we capture
              // this value, unescape any double quotes.
              strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
              );

            } else {

              // We found a non-quoted value.
              strMatchedValue = arrMatches[ 3 ];
            }

            // Now that we have our value string, let's add
            // it to the data array.
            if (columnCountComputed) {

              d._columns[columnIndex].data.push(strMatchedValue); 

            } else {

              // we are building the column names here
              d._columns.push(this._buildColumn({
                name : strMatchedValue,
                data : []
              }));
            }
        }

        // Return the parsed data.
        return d;
      };

      parseCSV = _.bind(parseCSV, this);
      parseCSV(
        this.__delimiterPatterns, 
        this._data, 
      this.delimiter);

      this._addIdColumn(d, d._columns[0].data.length);

      return d;
    }

  });


}(this, _));
