/**
   Library Deets go here
   USE OUR CODES
  
   Version 0.0.1.2
*/

(function(global, _) {

  var DS = global.DS;

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
  *   subsets : {
  *     name : function(yourParamsHere) {
  *       return a.filtering;
  *     }
  *   }
  */
  DS.Dataset = function(options) {
    options = options || (options = {});
    this._initialize(options);
    return this;
  };

  _.extend(DS.Dataset.prototype, DS.View.prototype, {

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
    where : function(filter, options) {

      var viewData = this._selectRows( this._selectColumns(filter.columns) );
      console.log('vd', viewData);

      return new DS.View({ data : { columns : viewData }, strict : true });
    },

    /**
    * Select rows for a view
    * @param {array/function/undefined} columns
    */
    _selectRows: function(selectedColumns, rowFilter) {
      var rowSelector;

      if (_.isUndefined(rowFilter)) {
        rowSelector = function() { 
          return true;
        };

      } else if (_.isFunction(rowFilter)) {
        rowSelector = rowFilter;

      } else { //array
        rowSelector = function(column) {
          return _.indexOf(rowFilter, column) === -1 ? true : false;
        };
      }

      this.each(function(row) {
        if (!rowSelector(row)) { return; }

        for (var i=0; i<=selectedColumns.length; i++) {
          selectedColumns[i].data.push( row[selectedColumns[i]] );
        }

      });

      return selectedColumns;
    },

    /**
    * Select columns for a view
    * @param {array/undefined} columns
    */
    _selectColumns : function(columnFilter) {
      var columnSelector, selectedColumns = [];

      if (_.isUndefined(columnFilter)) {
        columnSelector = function() {
          return true;
        };
      } else { //array
        columnSelector = function(column) {
          return _.indexOf(columnFilter, column) === -1 ? true : false;
        };
      }

      _.each(this.columns, function(column) {
        if (columnSelector(column)) {
          selectedColumns.push( {
            name : column.name,
            data : column.data, 
            type : column.type,
            _id : column._id
          } );
        }
      });

      return selectedColumns;
    },

    /**
    * Returns a dataset view of the given column name
    * @param {string} name - name of the column to be selected
    */
    column : function(name) {},


    /**
    * Returns a dataset view of the given columns 
    * @param {object} filter - either an array of column names or a function 
    * that returns a boolean for each column object
    */    
    columns : function(filter) {},


    /**
    * Returns a dataset view of filtered rows
    * @param {object} filter - a filter function or object, the same as where
    */    
    rows : function(filter) {},

    /**
    * Iterates over all rows in the dataset
    * @param {function} iterator - function that is passed each row
    * iterator(rowObject, index, dataset)
    * @param {object} context - options object. Optional.
    */    
    each : function(iterator, context) {},

    /**
    * Add a row to the dataset
    * TODO: multiple rows?
    * @param {object} row - an object representing a row in the form of:
    * {columnName: value}
    * @param {object} options - options
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    add : function(row, options) {},

    /**
    * Remove all rows that match the filter
    * TODO: single row by id?
    * @param {function} filter - function applied to each row
    * @param {object} options - options. Optional.
    */    
    remove : function(filter, options) {},

    /**
    * Update all rows that match the filter
    * TODO: dynamic values
    * @param {function} filter - filter rows to be updated
    * @param {object} newProperties - values to be updated.
    * @param {object} options - options. Optional.
    */    
    update : function(filter, newProperties, options) {},

    /**
    * Sort rows
    * @param {string} column - name of column by which rows are filtered
    * @param {function} comparator - comparator function, returns -1, 0 or 1. Optional.
    */    
    sort : function(column, comparator) {}

  });
}(this, _));

