(function(global, _) {

  var Miso = global.Miso || (global.Miso = {});
  var Dataset = global.Miso.Dataset;

  /**
  * A single column in a dataset
  * Parameters:
  *   options
  *     name
  *     type (from Miso.types)
  *     data (optional)
  *     before (a pre coercion formatter)
  *     format (for time type.)
  *     any additional arguments here..
  * Returns:
  *   new Miso.Column
  */
  Dataset.Column = function(options) {
    _.extend(this, options);
    this._id = options.id || _.uniqueId();
    this.data = options.data || [];
    return this;
  };

  _.extend(Dataset.Column.prototype, {

    /**
    * Converts any value to this column's type for a given position
    * in some source array.
    * Parameters:
    *   value
    * Returns: 
    *   number
    */
    toNumeric : function(value) {
      return Dataset.types[this.type].numeric(value);
    },

    /**
    * Returns the numeric representation of a datum at any index in this 
    * column.
    * Parameters:
    *   index - position in data array
    * Returns
    *   number
    */
    numericAt : function(index) {
      return this.toNumeric(this.data[index]);
    },

    /**
    * Coerces the entire column's data to the column type.
    */
    coerce : function() {
      this.data = _.map(this.data, function(datum) {
        return Dataset.types[this.type].coerce(datum, this);
      }, this);
    },

    /**
    * If this is a computed column, it calculates the value
    * for this column and adds it to the data.
    * Parameters:
    *   row - the row from which column is computed.
    *   i - Optional. the index at which this value will get added.
    * Returns
    *   val - the computed value
    */
    compute : function(row, i) {
      if (this.func) {
        var val = this.func(row);
        if (typeof i !== "undefined") {
          this.data[i] = val;  
        } else {
          this.data.push(val);
        }
        
        return val;
      }
    },

    /**
    * returns true if this is a computed column. False otherwise.
    */
    isComputed : function() {
      return !_.isUndefined(this.func);
    },

    _sum : function() {
      return _.sum(this.data);
    },

    _mean : function() {
      var m = 0;
      for (var j = 0; j < this.data.length; j++) {
        m += this.numericAt(j);
      }
      m /= this.data.length;
      return Dataset.types[this.type].coerce(m, this);
    },

    _median : function() {
      return Dataset.types[this.type].coerce(_.median(this.data), this);
    },

    _max : function() {
      var max = -Infinity;
      for (var j = 0; j < this.data.length; j++) {
        if (this.data[j] !== null) {
          if (Dataset.types[this.type].compare(this.data[j], max) > 0) {
            max = this.numericAt(j);
          }  
        }
      }

      return Dataset.types[this.type].coerce(max, this);
    },

    _min : function() {
      var min = Infinity;
      for (var j = 0; j < this.data.length; j++) {
        if (this.data[j] !== null) {
          if (Dataset.types[this.type].compare(this.data[j], min) < 0) {
            min = this.numericAt(j);
          }  
        }
      }
      return Dataset.types[this.type].coerce(min, this);
    }
  });

  /**
  * Creates a new view.
  * Parameters
  *   options - initialization parameters:
  *     parent : parent dataset
  *     filter : filter specification TODO: document better
  *       columns : column name or multiple names
  *       rows : rowId or function
  * Returns
  *   new Miso.Dataview.
  */
  Dataset.DataView = function(options) {
    if (typeof options !== "undefined") {
      options = options || (options = {});

      if (_.isUndefined(options.parent)) {
        throw new Error("A view must have a parent specified.");
      } 
      this.parent = options.parent;
      this._initialize(options);
    }
  };

  _.extend(Dataset.DataView.prototype, {

    _initialize: function(options) {
      
      // is this a syncable dataset? if so, pull
      // required methoMiso and mark this as a syncable dataset.
      if (this.parent.syncable === true) {
        _.extend(this, Miso.Events);
        this.syncable = true;
      }

      this.idAttribute = this.parent.idAttribute;

      // save filter
      this.filter = { };
      this.filter.columns = _.bind(this._columnFilter(options.filter.columns || undefined), this);
      this.filter.rows = _.bind(this._rowFilter(options.filter.rows || undefined), this);
      
      // initialize columns.
      this._columns = this._selectData();

      Dataset.Builder.cacheColumns(this);
      Dataset.Builder.cacheRows(this);

      // bind to parent if syncable
      if (this.syncable) {
        this.parent.subscribe("change", this._sync, { context : this });  
      }
    },

    // Syncs up the current view based on a passed delta.
    _sync : function(event) {
      var deltas = event.deltas, eventType = null;
 
      // iterate over deltas and update rows that are affected.
      _.each(deltas, function(d, deltaIndex) {
        
        // find row position based on delta _id
        var rowPos = this._rowPositionById[d[this.idAttribute]];

        // ===== ADD NEW ROW

        if (typeof rowPos === "undefined" && Dataset.Event.isAdd(d)) {
          // this is an add event, since we couldn't find an
          // existing row to update and now need to just add a new
          // one. Use the delta's changed properties as the new row
          // if it passes the filter.
          if (this.filter.rows && this.filter.rows(d.changed)) {
            this._add(d.changed);  
            eventType = "add";
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

            eventType = "update";
          }, this);
        }


        // ====== DELETE ROW (either by event or by filter.)
        // TODO check if the row still passes filter, if not
        // delete it.
        var row = this.rowByPosition(rowPos);
    
        // if this is a delete event OR the row no longer
        // passes the filter, remove it.
        if (Dataset.Event.isRemove(d) || 
            (this.filter.row && !this.filter.row(row))) {

          // Since this is now a delete event, we need to convert it
          // to such so that any child views, know how to interpet it.

          var newDelta = {
            old : this.rowByPosition(rowPos),
            changed : {}
          };
          newDelta[this.idAttribute] = d[this.idAttribute];

          // replace the old delta with this delta
          event.deltas.splice(deltaIndex, 1, newDelta);

          // remove row since it doesn't match the filter.
          this._remove(rowPos);
          eventType = "delete";
        }

      }, this);

      // trigger any subscribers 
      if (this.syncable) {
        this.publish(eventType, event);
        this.publish("change", event);  
      }
    },

    /**
    * Returns a dataset view based on the filtration parameters 
    * Parameters:
    *   filter - object with optional columns array and filter object/function 
    *   options - Options.
    * Returns:
    *   new Miso.Dataset.DataView
    */
    where : function(filter, options) {
      options = options || {};
      options.filter = options.filter || {};
      if ( _.isFunction(filter) ) {
        options.filter.rows = filter;
      } else {
        options.filter = filter;
      }
      
      options.parent = this;

      return new Dataset.DataView(options);
    },

    _selectData : function() {
      var selectedColumns = [];

      _.each(this.parent._columns, function(parentColumn) {
        
        // check if this column passes the column filter
        if (this.filter.columns(parentColumn)) {
          selectedColumns.push(new Dataset.Column({
            name : parentColumn.name,
            data : [], 
            type : parentColumn.type,
            _id : parentColumn._id
          }));
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
    * Parameters:
    *   columnFilter - function or column name
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
        if (_.isString(columnFilter) ) {
          columnFilter = [ columnFilter ];
        }
        columnFilter.push(this.idAttribute);
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
        rowSelector = _.bind(function(row) {
          return _.indexOf(rowFilter, row[this.idAttribute]) === -1 ? 
            false : 
            true;
        }, this);
      }

      return rowSelector;
    },

    /**
    * Returns a dataset view of the given column name
    * Parameters:
    *   name - name of the column to be selected
    * Returns:
    *   Miso.Column.
    */
    column : function(name) {
      return this._column(name);
    },

    _column : function(name) {
      if (_.isUndefined(this._columnPositionByName)) { return undefined; }
      var pos = this._columnPositionByName[name];
      return this._columns[pos];
    },

    /**
    * Returns a dataset view of the given columns 
    * Parameters:
    *   columnsArray - an array of column names
    * Returns:
    *   Miso.DataView.
    */    
    columns : function(columnsArray) {
     return new Dataset.DataView({
        filter : { columns : columnsArray },
        parent : this
      });
    },

    /**
    * Returns the names of all columns, not including id column.
    * Returns:
    *   columnNames array
    */
    columnNames : function() {
      var cols = _.pluck(this._columns, 'name');
      return _.reject(cols, function( colName ) {
        return colName === this.idAttribute || colName === '_oids';
      }, this);
    },

    /** 
    * Returns true if a column exists, false otherwise.
    * Parameters:
    *   name (string)
    * Returns
    *   true | false
    */
    hasColumn : function(name) {
      return (!_.isUndefined(this._columnPositionByName[name]));
    },

    /**
    * Iterates over all rows in the dataset
    * Paramters:
    *   iterator - function that is passed each row
    *              iterator(rowObject, index, dataset)
    *   context - options object. Optional.
    */
    each : function(iterator, context) {
      for(var i = 0; i < this.length; i++) {
        iterator.apply(context || this, [this.rowByPosition(i), i]);
      }
    },

    /**
    * Iterates over all rows in the dataset in reverse order
    * Parameters:
    *   iterator - function that is passed each row
    *              iterator(rowObject, index, dataset)
    *   context - options object. Optional.
    */
    reverseEach : function(iterator, context) {
      for(var i = this.length-1; i >= 0; i--) {
        iterator.apply(context || this, [this.rowByPosition(i), i]);
      }
    },

    /**
    * Iterates over each column.
    * Parameters:
    *   iterator - function that is passed:
    *              iterator(colName, column, index)
    *   context - options object. Optional.
    */
    eachColumn : function(iterator, context) {
      // skip id col
      var cols = this.columnNames();
      for(var i = 0; i < cols.length; i++) {
        iterator.apply(context || this, [cols[i], this.column(cols[i]), i]);
      }  
    },

    /**
    * Returns a single row based on its position (NOT ID.)
    * Paramters:
    *   i - position index
    * Returns:
    *   row object representation
    */
    rowByPosition : function(i) {
      return this._row(i);
    },

    /** 
    * Returns a single row based on its id (NOT Position.)
    * Parameters:
    *   id - unique id
    * Returns:
    *   row object representation
    */
    rowById : function(id) {
      return this._row(this._rowPositionById[id]);
    },

    _row : function(pos) {
      var row = {};
      _.each(this._columns, function(column) {
        row[column.name] = column.data[pos];
      });
      return row;   
    },
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

    _add : function(row) {
      
      // first coerce all the values appropriatly
      _.each(row, function(value, key) {
        var column = this.column(key);

        // is this a computed column? if so throw an error
        if (column.isComputed()) {
          throw "You're trying to update a computed column. Those get computed!";
        }

        // if we suddenly see values for data that didn't exist before as a column
        // just drop it. First fetch defines the column structure.
        if (typeof column !== "undefined") {
          var Type = Dataset.types[column.type];

          // test if value matches column type
          if (column.force || Type.test(row[column.name], column)) {
            
            // do we have a before filter? If so, pass it through that first
            if (!_.isUndefined(column.before)) {
              row[column.name] = column.before(row[column.name]);
            }

            // coerce it.
            row[column.name] = Type.coerce(row[column.name], column);

          } else {
            throw("incorrect value '" + row[column.name] + 
                  "' of type " + Dataset.typeOf(row[column.name], column) +
                  " passed to column '" + column.name + "' with type " + column.type);  
          
          }
        }
      }, this);

      // do we have any computed columns? If so we need to calculate their values.
      if (this._computedColumns) {
        _.each(this._computedColumns, function(column) {
          var newVal = column.compute(row);
          row[column.name] = newVal;
        });
      }

      // if we don't have a comparator, just append them at the end.
      if (_.isUndefined(this.comparator)) {
        
        // add all data
        _.each(this._columns, function(column) {
          if (!column.isComputed()) {
            column.data.push(!_.isUndefined(row[column.name]) && !_.isNull(row[column.name]) ? row[column.name] : null);
          }
        });

        this.length++;

        // add row indeces to the cache
        this._rowIdByPosition = this._rowIdByPosition || (this._rowIdByPosition = []);
        this._rowPositionById = this._rowPositionById || (this._rowPositionById = {});

        // if this row already exists, throw an error
        if (typeof this._rowPositionById[row[this.idAttribute]] !== "undefined") {
          throw "The id " + row[this.idAttribute] + " is not unique. The " + this.idAttribute + " column must be unique";
        }

        this._rowPositionById[row[this.idAttribute]] = this._rowIdByPosition.length;
        this._rowIdByPosition.push(row[this.idAttribute]);
      
      // otherwise insert them in the right place. This is a somewhat
      // expensive operation.    
      } else {
        
        var insertAt = function(at, value, into) {
          Array.prototype.splice.apply(into, [at, 0].concat(value));
        };

        var i;
        this.length++;
        for(i = 0; i < this.length; i++) {
          var row2 = this.rowByPosition(i);
          if (_.isUndefined(row2[this.idAttribute]) || this.comparator(row, row2) < 0) {
            
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
          this._rowIdByPosition.push(row[this.idAttribute]);
          this._rowPositionById[row[this.idAttribute]] = i;
        }, this);
      }
      
      return this;
    },

    /**
    * Returns a dataset view of filtered rows
    * @param {function|array} filter - a filter function or object, 
    * the same as where
    */    
    rows : function(filter) {
      return new Dataset.DataView({
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
    * Parameters:
    *   options - Optional
    */    
  sort : function(args) {
      var options = {}, cachedRows = [];
    
      //If the first param is the comparator, set it as such.
      if ( _.isFunction(args) ) {
        options.comparator = args;
      } else {
        options = args || {};
      }

      if (options.comparator) {
        this.comparator = options.comparator;
      } else if (_.isUndefined(this.comparator)) {
        throw new Error("Cannot sort without this.comparator.");
      }

      // cache rows
      var i, j, row;
      for(i = 0; i < this.length; i++) {
        cachedRows[i] = this._row(i);
      }

      cachedRows.sort( this.comparator );

      // iterate through cached rows, overwriting data in columns
      i = cachedRows.length;
      while ( i-- ) {
        row = cachedRows[i];

        this._rowIdByPosition[i] = row[ this.idAttribute ];
        this._rowPositionById[ row[ this.idAttribute ] ] = i;

        j = this._columns.length;
        while ( j-- ) {
          var col = this._columns[j];
          col.data[i] = row[ col.name ];
        }
      }

      if (this.syncable && !options.silent) {
        this.publish("sort");
      }

      return this;
    },
   
    /**
    * Exports a version of the dataset in json format.
    * Returns:
    *   Array of rows.
    */
    toJSON : function() {
      var rows = [];
      for(var i = 0; i < this.length; i++) {
        rows.push(this.rowByPosition(i));
      }
      return rows;
    }
  });

}(this, _));
