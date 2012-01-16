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

  _.extend(DS.View.prototype, DS.Events, {

    _initialize: function(options) {
      
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
      var tempParser = new DS.Parsers();
      _.extend(this, 
        tempParser._cacheColumns(this), 
        tempParser._cacheRows(this));

      // bind to parent
      this.parent.bind("change", this.sync, this);
    },

    /**
    * @public
    * Syncs up the current view based on a passed delta.
    */
    sync : function(event) {
      var deltas = event.deltas;
 
      // iterate over deltas and update rows that are affected.
      _.each(deltas, function(d, deltaIndex) {
        
        // find row position based on delta _id
        var rowPos = this._rowPositionById[d._id];

        // ===== ADD NEW ROW

        if (typeof rowPos === "undefined" && DS.Event.isAdd(d)) {
          // this is an add event, since we couldn't find an
          // existing row to update and now need to just add a new
          // one. Use the delta's changed properties as the new row
          // if it passes the filter.
          if (this.filter.rows && this.filter.rows(d.changed)) {
            this._add(d.changed);  
          }
        } else {

          //===== UPDATE EXISTING ROW
          
          // iterate over each changed property and update the value
          _.each(d.changed, function(newValue, columnName) {
            
            // find col position based on column name
            var colPos = this._columnPositionByName[columnName];
            this._columns[colPos].data[rowPos] = newValue;

          }, this);
        }


        // ====== DELETE ROW (either by event or by filter.)
        // TODO check if the row still passes filter, if not
        // delete it.
        var row = this.rowByPosition(rowPos);
    
        // if this is a delete event OR the row no longer
        // passes the filter, remove it.
        if (DS.Event.isDelete(d) || 
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
          this._delete(rowPos);
        }

      }, this);

      // trigger any subscribers 
      this.trigger("change", event);
     
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

      return new DS.View(options);
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
      return new DS.View({
        filter : { columns : [name] },
        parent : this
      });
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
     return new DS.View({
        filter : { columns : columnsArray },
        parent : this
      });
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
        iterator.apply(context || this, [this.rowByPosition(i)]);
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
    _delete : function(rowPos) {

      var rowId = this._rowIdByPosition[rowPos];

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
    _add : function(row) {
      
      // add all data
      _.each(this._columns, function(column) {
        column.data.push(row[column.name] ? row[column.name] : null);
      });

      // add row indeces to the cache
      this.length++;
      this._rowIdByPosition.push(row._id);
      this._rowPositionById[row._id] = this._rowIdByPosition.length;

      return this;
    },

    /**
    * Returns a dataset view of filtered rows
    * @param {function|array} filter - a filter function or object, 
    * the same as where
    */    
    rows : function(filter) {
      return new DS.View({
        filter : { rows : filter },
        parent : this
      });
    },

    /**
    * Sort rows
    * @param {string} column - name of column by which rows are filtered
    * @param {function} comparator - comparator function, returns -1, 0 or 1. Optional.
    */    
    sort : function(column, comparator) {}


  });

}(this, _));
