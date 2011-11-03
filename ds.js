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
    this._buildData();
  };

  // CONSTS
  DS.datatypes = {
    NUMBER : 0,
    STRING : 1,
    BOOLEAN: 2, 
    ARRAY  : 3, 
    OBJECT : 4
  };

  // Public Methods
  _.extend(DS.prototype, {
    _buildData : function() {
      if (this._options.strict) {
        this._data = this._options.data;
        delete this._options.data;
      } else {
        this._data = this._normalizeData();
      }
    },

    _normalizeData : function() {
      //TODO preprocessing for CSV/TSV etc
      this._data = this._fromObject(options.data);
      delete options.data;
    },

    _fromObject : function() {
      //assumes array of objects, takes types from first row
      _.each(options.data[0], function(value, key) {
        //TODO fill in
      });
    },

    metadata : function() {

    },

    filter : function() {

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

    columns : function(name) {

    },

    add : function() {

    },

    get : function(row, column) {

    },

    set : function(row, data, options) {

    },

    min : function() {

    },

    max : function() {

    },

    mean : function() {

    },

    mode : function() {

    },

    freq : function() {

    } 

  });

  DS.VERSION = "0.0.1";
  global.DS = DS;

}(this));
