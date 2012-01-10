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

  _.extend(DS.prototype, {

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
    * @param {options} options object
    * TODO: signature for iterator
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

  });

}(this, _));

