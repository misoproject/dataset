/**
* Library Deets go here
* USE OUR CODES
*
* Version 0.0.1.2
*{
 url : "String - url to fetch data from",
 jsonp : "boolean - true if this is a jsonp request",
 delimiter : "String - a delimiter string that is used in a tabular datafile",
 data : "Object - an actual javascript object that already contains the data",
 table : "Element - a DOM table that contains the data",
 format : "String - optional file format specification, otherwise we'll try to guess",
 recursive : "Boolean - if true build nested arrays of objects as datasets",
 strict : "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
 extract : "function to apply to JSON before internal interpretation, optional"
 ready : the callback function to act on once the data is fetched. Isn't reuired for local imports
         but is required for remote url fetching.
 columnNames : {
   oldName : newName
 },
 subsets : {
   name : function(yourParamsHere) {
     return a.filtering;
   }
 }
}
*/

(function(global, _) {

 var DS = (global.DS || function() {

    global.DS = function(options) {
      options = options || (options = {});

      this._initialize(options);

      return this;
    };

    return global.DS;
  }());

  DS.datatypes = {
    UNKNOWN: "Unknown",
    NUMBER : 0,
    STRING : 1,
    BOOLEAN: 2,
    ARRAY  : 3,
    OBJECT : 4,
    TIMESTAMP : 5
  };

  //Taken wholesale from backbone.js
  DS.Events = {
    /**
    * Bind callbacks to dataset events
    * @param {eventName} name of the event
    * @param {callback} callback function
    * @param {context} context for the callback, optional
    */
    bind : function(ev, callback, context) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = calls[ev] || (calls[ev] = {});
      var tail = list.tail || (list.tail = list.next = {});
      tail.callback = callback;
      tail.context = context;
      list.tail = tail.next = {};
      return this;
    }, 

    /**
    * Remove one or many callbacks. If `callback` is null, removes all
    * callbacks for the event. If `ev` is null, removes all bound callbacks
    * for all events.
    * @param {ev} event name
    * @param {callback} callback function to be removed
    */
    unbind : function(ev, callback) {
      var calls, node, prev;
      if (!ev) {
        this._callbacks = null;
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = {};
        } else if (node = calls[ev]) {
          while ((prev = node) && (node = node.next)) {
            if (node.callback !== callback) continue;
            prev.next = node.next;
            node.context = node.callback = null;
            break;
          }
        }
      }
      return this;
    },

    /**
    * trigger a given event
    * @param {eventName} name of event
    */
    trigger : function(eventName) {
      var node, calls, callback, args, ev, events = ['all', eventName];
      if (!(calls = this._callbacks)) return this;
      while (ev = events.pop()) {
        if (!(node = calls[ev])) continue;
        args = ev == 'all' ? arguments : Array.prototype.slice.call(arguments, 1);
        while (node = node.next) {
          if (callback = node.callback) {
            callback.apply(node.context || this, args);
          }
        }
      }
      return this;
    }
  }

  _.extend(DS.prototype, DS.Events, {

    _initialize: function(options) {
      
      // initialize importer from options or just create a blank
      // one for now, we'll detect it later.
      var importer = options.importer || null;

      // default parser is object parser, unless otherwise specified.
      var parser  = options.parser || DS.Parsers.Obj;

      // figure out out if we need another parser.
      if (_.isUndefined(options.parser)) {
        if (options.strict) {
          parser = DS.Parsers.Strict;
        } else if (options.delimiter) {
          parser = DS.Parsers.Delimited;
        }
      }

      // set up some base options for importer.
      var importerOptions = _.extend({}, 
        options,
        { parser : parser });
      
      if (options.delimiter) {
        importerOptions.dataType = "text";
      }

      // initialize the proper importer
      if (importer === null) {
        if (options.url) {
          importer = DS.Importers.Remote;
        } else {
          importer = DS.Importers.Local;
        }
      }

      // initialize actual new importer.
      importer = new importer(importerOptions);

      if (importer !== null) {
        importer.fetch({
          success: _.bind(function(d) {
            _.extend(this, d);
            if (options.ready) {
              options.ready.call(this);
            }
          }, this)
        });
      }
    },

    /**
    * Returns a dataset view based on the filtration parameters 
    * @param {filter} object with optional columns array and filter object/function 
    * @param {options} options object
    */
    where : function(filter, options) {},

    /**
    * Returns a dataset view of the given column name
    * @param {name} name of the column to be selected
    */
    column : function(name) {},


    /**
    * Returns a dataset view of the given columns 
    * @param {filter} either an array of column names or a function 
    * that returns a boolean for each column object
    */    
    columns : function(filter) {},


    /**
    * Returns a dataset view of filtered rows
    * @param {filter} a filter function or object, the same as where
    */    
    rows : function(filter) {},

    /**
    * Iterates over all rows in the dataset
    * @param {iterator} function that is passed each row
    * iterator(rowObject, index, dataset)
    * @param {options} options object
    */    
    each : function(iterator) {},

    /**
    * Add a row to the dataset
    * TODO: multiple rows?
    * @param {row} object {columnName: value}
    * @param {options} options
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    add : function(row, options) {},

    /**
    * Remove all rows that match the filter
    * TODO: single row by id?
    * @param {filter} function applied to each row
    * @param {options} options
    */    
    remove : function(filter, options) {},

    /**
    * Update all rows that match the filter
    * TODO: dynamic values
    * @param {filter} filter rows to be updated
    * @param {newProperties} options
    * @param {options} options
    */    
    update : function(filter, newProperties, options) {},

    /**
    * Sort rows
    * @param {column} column by which rows are filtered
    * @param {comparator} optional comparator function, returns -1, 0 or 1 
    */    
    sort : function(column, comparator) {},

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

}(this, _));

