/**
* Library Deets go here
* USE OUR CODES
* 
* Version 0.0.1
*
* // Constructor Parameters:
* {
*  url : "String - url to fetch data from",
*  jsonp : "boolean - true if this is a jsonp request",
*  delimiter : "String - a delimiter string that is used in a tabular datafile",
*  data : "Object - an actual javascript object that already contains the data",
*  table : "Element - a DOM table that contains the data",
*  format : "String - optional file format specification, otherwise we'll try to guess",
*  recursive: "Boolean - if true build nested arrays of objects as datasets",
*  strict: "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
*  parse: "function to apply to JSON before internal interpretation, optional"
* }
*/

(function(global) {
  
  var DS = function(options) {
    // Instantiate your privates
    // Initialize your datase
    return {
      
      // le private vars
      _options : options,
      
      // le private methods
      _getRow : function(index) {
        
      },
      
      // le methods
      clone : function() {
        
      },
      
      bind : function() {
        
      }
      
    };
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
  DS.prototype.metadata = function() {
      
  };
    
  DS.prototype.filter = function() {
    
  };
  
  DS.prototype.transform = function() {
    
  };
  
  DS.prototype.derive = function() {
    
  };
  
  DS.prototype.sort = function() {
    
  };
  
  DS.prototype.push = function() {
    
  };
  
  DS.prototype.pop = function() {
    
  };
     
  // ====== THE STUFF BELOW NEEDS TO BE CONVERTED! 
    
  // COLUMN FUNCTIONS
  DS.prototype.columns = (function(ds) {
      return function(args) {
        
        // Reference to parent dataset.
        var _ds = ds,
            _c  = this;
      
        _c.prototype = {

          // Add a column
          add : function(args) {

          }
        }
        
        return _c;
      }
    }(_self));
    
    // ROW FUNCTIONS
    _self.prototype.rows = (function(ds) {
      
      // arg types:
      // integer - the row number from the dataset.
      return function(index) {
        
        // Reference to parent dataset.
        var _ds = ds,
        
            // extend internal representation of rows to be the actual row
            // requested from the user.
            _r  = _.extend(this, _getRow(index));
        
        // FETCH INTERNAL ROW REPRESENTATION FROM DATASET.
        
        _r.prototype = {
          
          // Add a row
          add : function(args) {
            
          },
          
          // Get the value at a specific column
          get : function(columnName) {
            
          },
          
          // Set some values.
          // Takes in a hash of attributes and their values.
          set : function(data) {
            
            // Verify each attribute actually exists.
            
          }
          
        }
        
        return _r;
        
      }
    }(_self));
    
    return _self;
  };
  
  DS.VERSION = "0.0.1";
  
}(this));