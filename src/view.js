(function(global, _) {

  var DS = global.DS;

  DS.View = function(options) {
    //rowFilter, columnFilter, parent
    options = options || (options = {});
    this._initialize(options);
    return this;
  };

  _.extend(DS.View.prototype, DS.Events, DS.Syncable, {

    /**
    * Returns a dataset view based on the filtration parameters 
    * @param {filter} object with optional columns array and filter object/function 
    * @param {options} options object
    */
    where : function(filter, options) {

      var viewData = this._selectRows( this._selectColumns(filter.columns) );
      console.log('vd', viewData);

      // return new DS.View({rowFilter: });
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
            data : [], 
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
    * Sort rows
    * @param {string} column - name of column by which rows are filtered
    * @param {function} comparator - comparator function, returns -1, 0 or 1. Optional.
    */    
    sort : function(column, comparator) {}


  });

}(this, _));
