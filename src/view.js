(function(global, _) {

  var DS = global.DS;

  /**
  * @constructor
  *
  * Creates a new view.
  * @param {object} options - initialization parameters:
  *   parent : parent dataset
  *   filter : filter specification TODO: document better
  */
  DS.View = function(options) {
    //rowFilter, columnFilter, parent
    options = options || (options = {});

    if (_.isUndefined(options.parent)) {
      throw new Error("A view must have a parent specified.");
    } 
    this.parent = options.parent;
    this._initialize(options);
    return this;
  };

  _.extend(DS.View.prototype, DS.Events, DS.Syncable, {

    _initialize: function(options) {
      
      // save filter
      this.filter = {
        columns : this._columnFilter(options.filter.columns || undefined),
        rows    : this._rowFilter(options.filter.rows || undefined)
      };

      // initialize columns.
      this.columns = this._selectData();

      // pass through strict importer
      // TODO: Need to cache all data here, so.... need to
      // either pass through importer, or pull that out. Maybe
      // the data caching can happen elsewhere?
      // right now just passing through default parser.
      var tempParser = new DS.Parsers();
      _.extend(this, 
        tempParser._cacheColumns(this));
      
      _.extend(this, 
        tempParser._cacheRows(this));
    },

    /**
    * Returns a dataset view based on the filtration parameters 
    * @param {filter} object with optional columns array and filter object/function 
    * @param {options} options object
    */
    where : function(filter, options) {
      options = options || {};
      
      options.parent = this;
      options.filter = options.filter || {};

      return new DS.View(_.extend(
        options, 
        filter)
      );

      // return new DS.View({rowFilter: });
    },

    _selectData : function() {
      var selectedColumns = [];

      _.each(this.parent.columns, function(parentColumn) {
        
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
    * @param {function|name} columnFilter - function or column name
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
        columnSelector = function(column) {
          return _.indexOf(columnFilter, column) === -1 ? true : false;
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

      if (_.isUndefined(rowFilter)) {
        rowSelector = function() { 
          return true;
        };

      } else if (_.isFunction(rowFilter)) {
        rowSelector = rowFilter;

      } else { //array
        rowSelector = function(row) {
          return _.indexOf(rowFilter, row) === -1 ? true : false;
        };
      }

      return rowSelector;
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
    * TODO: we can't call this columns!!! we have a columns data property...
    */    
    //columns : function(filter) {},


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
    each : function(iterator, context) {
      
      // TODO flesh this out...
      for(var i = 0; i < this.length; i++) {
        iterator.apply(context || this, [this._buildRow(i)]);
      }

    },

    _buildRow : function(i) {
      var row = {};
      _.each(this.columns, function(column) {
        row[column.name] = column.data[i];
      });
      return row; 
    },

    /**
    * Sort rows
    * @param {string} column - name of column by which rows are filtered
    * @param {function} comparator - comparator function, returns -1, 0 or 1. Optional.
    */    
    sort : function(column, comparator) {}


  });

}(this, _));
