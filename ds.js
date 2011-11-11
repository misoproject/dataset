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
        this._columns = this._options.data.columns;
        this._rows = this._options.data.rows;
        this._metadata = this._options.data.metadata;
        delete this._options.data;
      }
    },

   
    metadata : function() {

    },

    filter : function(properties) {
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

    },

    columns : function(name) {

    },

    add : function() {

    },

    get : function(row, column) {
      return this._rows[ row ].data[ this._columnPosition( column ) ];
    },

    _columnByName : function(name) {
      return _.find(this._columns, function(c) {
        return c.name === name;
      });
    },

    _columnPosition : function(name) {
      return _.indexOf(this._columns, this._columnByName(name));
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

  
  
  
  DS.VERSION = "0.0.1";
  global.DS = DS;

}(this));
