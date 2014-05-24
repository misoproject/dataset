(function(global, _) {

  var Miso = global.Miso || (global.Miso = {});
  var Dataset = global.Miso.Dataset;

  /**
   * `Miso.Dataset.Column` objects make up the columns contained in a dataset and
   * are returned by some methods such as .column on {@link Miso.Dataset} and
   * {@link Miso.Dataset.DataView}
   *
   * @constructor
   * @name Column
   * @memberof Miso.Dataset
   *
   * @param {Object} options
   * @param {String} options.name - Column name
   * @param {Object} [options.type] - Column type (from Miso.types)
   * @param {Object} [options.data] - A set of data. By default, set to an
   *                                  empty array.
   * @param {Function} [options.before] - A function to pre-process a column's
   *                                      value before it is coerced. Signature
   *                                      is `function(value)`
   * @param {Function} [options.format] - Optional. Only set if time type. The
   *                                      moment.js format describing the input
   *                                      dates.
   * @param {Number} [options.id] - Sets a custom column _id. We assign one by
   *                                default.
   */
  Dataset.Column = function(options) {
    _.extend(this, options);
    this._id = options.id || _.uniqueId();
    this.data = options.data || [];
    return this;
  };

  _.extend(Dataset.Column.prototype,
    /** @lends Miso.Dataset.Column.prototype */
    {

    /**
     * Converts any value to this column's type for a given position in some
     * source array.
     *
     * @param {mixed} value
     *
     * @returns {Number}
     */
    toNumeric : function(value) {
      return Dataset.types[this.type].numeric(value);
    },

    /**
     * Internal function used to return the numeric value of a given input in a
     * column. Index is used as this is currently the return value for numeric
     * coercion of string values.
     *
     * @param {Number} index - index position of the row you want the numeric
     *                         value for
     *
     * @returns {Number}
     */
    numericAt : function(index) {
      return this.toNumeric(this.data[index]);
    },

    /**
     * Coerces all the data in the column's data array to the appropriate type.
     */
    coerce : function() {
      this.data = _.map(this.data, function(datum) {
        return Dataset.types[this.type].coerce(datum, this);
      }, this);
    },

    /**
     * If this is a computed column, it calculates the value for this column
     * and adds it to the data.
     *
     * @param {Object} row - the row from which column is computed.
     * @param {Number} [i] - the index at which this value will get added.
     *
     * @returns the computed value
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
     * @returns {Boolean} true if this is a computed column. False otherwise.
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
   * A `DataView` is an immutable version of dataset. It is the result of
   * selecting a subset of the data using the {@link Miso.Dataset#where} call.
   * If the dataset is syncing, this view will be updated when changes take
   * place in the original dataset. A {@link Miso.Dataset} also extends from
   * `DataView`. All the methods available on a dataview will also be available
   * on the dataset.
   *
   * @constructor
   * @name DataView
   * @memberof Miso.Dataset
   *
   * @param {Object} [options] - initialization parameters
   * @param {Miso.Dataset} options.parent - parent dataset
   * @param {Function} options.filter - filter specification TODO: document better
   * @param {String|String[]} options.filter.columns - column name or multiple
   *                                                   names
   * @param {Number|Function} options.filter.rows - rowId or function
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

  _.extend(Dataset.DataView.prototype,
    /** @lends Miso.Dataset.DataView.prototype */
    {

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
     * Used to create Dataviews, subsets of data based on a set of filters.
     * Filtration can be applied to both rows & columns and for syncing
     * datasets changes in the parent dataset from which the dataview was
     * created will be reflected in the dataview.
     *
     * @param {Function|Object} [filter] - a function that takes in a row or an
     *                                     options object that can contain the
     *                                     following parameters.
     * @param {String|String[]} [filter.columns] - A filter for columns. A
     *                                             single or multiple column
     *                                             names.
     * @param {String|Function} [filter.filter] - A filter for rows. A rowId or
     *                                            a filter function that takes
     *                                            in a row and returns true if
     *                                            it passes the criteria.
     * @param {Object} [options]
     *
     * @returns {Miso.Dataset.DataView}
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
     * @param {Function|String} columnFilter - function or column name
     * @private
     *
     * @returns normalized version of the column filter function that can be
     *          executed.
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
     * @private
     *
     * @returns {Function} normalized row filter function that can be executed
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
     * @param {String} name - name of the column to be selected
     *
     * @returns {Miso.Dataset.Column} View of the given column name
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
     * @param {String[]} columnsArray - an array of column names
     *
     * @returns {Miso.Dataset.DataView} dataset view of the given columns
     */
    columns : function(columnsArray) {
     return new Dataset.DataView({
        filter : { columns : columnsArray },
        parent : this
      });
    },

    /**
     * @returns {String[]} the names of all columns, not including id column
     */
    columnNames : function() {
      var cols = _.pluck(this._columns, 'name');
      return _.reject(cols, function( colName ) {
        return colName === this.idAttribute || colName === '_oids';
      }, this);
    },

    /**
     * Checks for the existance of a column and returns true/false
     *
     * @param {String} name - Name of column to check for
     *
     * @returns {Boolean} true if a column exists, false otherwise.
     */
    hasColumn : function(name) {
      return (!_.isUndefined(this._columnPositionByName[name]));
    },

    /**
     * Iterates over all rows in the dataset. Each row is not a direct
     * reference to the data and thus should not be altered in any way.
     *
     * @param {Miso.Dataset.DataView~rowIterator} iterator - function that is
     *                                                       passed each row
     * @param {Object} [context] - The context to be bound to the iterator.
     */
    each : function(iterator, context) {
      for(var i = 0; i < this.length; i++) {
        iterator.apply(context || this, [this.rowByPosition(i), i]);
      }
    },

    /**
     * Iterates over all rows in the dataset in reverse order.  Each row is not
     * a direct reference to the data and thus should not be altered in any
     * way.
     *
     * @param {Miso.Dataset.DataView~rowIterator} iterator - function that is
     *                                                        passed each row
     * @param {Object} [context] - The context to be bound to the iterator.
     */
    reverseEach : function(iterator, context) {
      for(var i = this.length-1; i >= 0; i--) {
        iterator.apply(context || this, [this.rowByPosition(i), i]);
      }
    },

    /**
     * Iterates over each column. Direct column references, not arrays so
     * modifying data may cause internal inconsistencies.
     *
     * @param {Miso.Dataset.DataView~columnIterator} iterator - function that
     *                                                          is passed each
     *                                                          column
     * @param {Object} [context] - The context to be bound to the iterator.
     */
    eachColumn : function(iterator, context) {
      // skip id col
      var cols = this.columnNames();
      for(var i = 0; i < cols.length; i++) {
        iterator.apply(context || this, [cols[i], this.column(cols[i]), i]);
      }  
    },

    /**
     * Fetches a row object at a specified position. Note that the returned row
     * object is NOT a direct reference to the data and thus any changes to it
     * will not alter the original data.
     *
     * @param {Number} i - position index
     *
     * @returns {Object} a single row based on its position (NOT ID.)
     */
    rowByPosition : function(i) {
      return this._row(i);
    },

    /**
     * Fetches a row object with a specific _id. Note that the returned row
     * object is NOT a direct reference to the data and thus any changes to it
     * will not alter the original data.
     *
     * @param {Number} id - unique id
     *
     * @returns {Object} a single row based on its id (NOT Position.)
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
     * Shorthand for {@link Miso.Dataset.DataView#where|ds.where({ rows :
     * rowFilter });} If run with no filter will return all rows.
     *
     * @param {Function|Object} filter - a filter function or object, the same
     *                                   as {@link Miso.Dataset.DataView#where}
     *
     * @returns {Miso.Dataset.DataView} a dataset view of filtered rows
     */
    rows : function(filter) {
      return new Dataset.DataView({
        filter : { rows : filter },
        parent : this
      });
    },

  /**
   * Sorts the dataset according to the comparator. A comparator can either be
   * passed in as part of the options object or have been defined on the
   * dataset already, for example as part of the initialization block.
   *
   * roughly taken from here:
   * http://jxlib.googlecode.com/svn-history/r977/trunk/src/Source/Data/heapsort.js
   * License:
   *   Copyright (c) 2009, Jon Bomgardner.
   *   This file is licensed under an MIT style license
   *
   * @param {Object|Function} [args] - Comparator Function OR Options object
   * @param {Function} args.comparator - Function used to sort the dataset,
   *                                     uses the same return structure as a
   *                                     standard [JavaScript
   *                                     sort](http://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/sort)
   * @param {Boolean} args.silent - Default false, set true to supress the
   *                                firing of a sort event.
   *
   * @returns {Miso.Dataset.DataView}
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
     *
     * @returns {Array} Array of rows.
     */
    toJSON : function() {
      var rows = [];
      for(var i = 0; i < this.length; i++) {
        rows.push(this.rowByPosition(i));
      }
      return rows;
    }
  });

  /**
   * This callback is used to step through each row in a DataView
   * @callback Miso.Dataset.DataView~rowIterator
   * @param {Object} row
   * @param {Number} index
   * @param {Miso.Dataset} dataset
   */

  /**
   * This callback is used to step through each column in a DataView
   * @callback Miso.Dataset.DataView~columnIterator
   * @param {Object} column
   * @param {Number} index
   * @param {Miso.Dataset} dataset
   */
}(this, _));
