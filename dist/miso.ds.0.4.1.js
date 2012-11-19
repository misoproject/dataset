/**
* Miso.Dataset - v0.4.1 - 11/19/2012
* http://github.com/misoproject/dataset
* Copyright (c) 2012 Alex Graul, Irene Ros;
* Dual Licensed: MIT, GPL
* https://github.com/misoproject/dataset/blob/master/LICENSE-MIT 
* https://github.com/misoproject/dataset/blob/master/LICENSE-GPL 
*/

(function(global) {

/**
  * Instantiates a new dataset.
  * Parameters:
  * options - optional parameters.
  *   data : "Object - an actual javascript object that already contains the data",
  *   url : "String - url to fetch data from",
  *   sync : Set to true to be able to bind to dataset changes. False by default.
  *   jsonp : "boolean - true if this is a jsonp request",
  *   delimiter : "String - a delimiter string that is used in a tabular datafile",
  *   strict : "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
  *   extract : "function to apply to JSON before internal interpretation, optional"
  *   ready : the callback function to act on once the data is fetched. Isn't reuired for local imports
  *           but is required for remote url fetching.
  *   columns: A way to manually override column type detection. Expects an array of
  *            objects of the following structure:
  *           { name : 'columnname', type: 'columntype',
  *             ... (additional params required for type here.) }
  *   comparator : function (optional) - takes two rows and returns 1, 0, or -1  if row1 is
  *     before, equal or after row2.
  *   deferred : by default we use underscore.deferred, but if you want to pass your own (like jquery's) just
  *              pass it here.
  *   importer : The classname of any importer (passes through auto detection based on parameters.
  *              For example: <code>Miso.Importers.Polling</code>.
  *   parser   : The classname of any parser (passes through auto detection based on parameters.
  *              For example: <code>Miso.Parsers.Delimited</code>.
  *   resetOnFetch : set to true if any subsequent fetches after first one should overwrite the
  *                  current data.
  *   uniqueAgainst : Set to a column name to check for duplication on subsequent fetches.
  *   interval : Polling interval. Set to any value in milliseconds to enable polling on a url.
  }
  */
  global.Miso = global.Miso || {};
  global.Miso.Dataset = function(options) {
    
    options = options || {};

    this.length = 0;
    
    this._columns = [];
    this._columnPositionByName = {};
    this._computedColumns = [];
    
    this._initialize(options);
  };
}(this));

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

/**
Library Deets go here
USE OUR CODES

Version 0.0.1.2
*/

(function(global, _, moment) {

  var Miso = global.Miso || (global.Miso = {});
  var Dataset = global.Miso.Dataset;

  // take on miso dataview's prototype
  Dataset.prototype = new Dataset.DataView();

  // add dataset methods to dataview.
  _.extend(Dataset.prototype, {

    /**
    * @private
    * Internal initialization method. Reponsible for data parsing.
    * @param {object} options - Optional options  
    */
    _initialize: function(options) {

      // is this a syncable dataset? if so, pull
      // required methods and mark this as a syncable dataset.
      if (options.sync === true) {
        _.extend(this, Miso.Events);
        this.syncable = true;
      }

      this.idAttribute = options.idAttribute || '_id';

      // initialize importer from options or just create a blank
      // one for now, we'll detect it later.
      this.importer = options.importer || null;

      // default parser is object parser, unless otherwise specified.
      this.parser  = options.parser || Dataset.Parsers.Obj;

      // figure out out if we need another parser.
      if (_.isUndefined(options.parser)) {
        if (options.strict) {
          this.parser = Dataset.Parsers.Strict;
        } else if (options.delimiter) {
          this.parser = Dataset.Parsers.Delimited;
        } 
      }

      // initialize the proper importer
      if (this.importer === null) {
        if (options.url) {

          if (!options.interval) {
            this.importer = Dataset.Importers.Remote;  
          } else {
            this.importer = Dataset.Importers.Polling;
            this.interval = options.interval;
          }
          
        } else {
          this.importer = Dataset.Importers.Local;
        }
      }

      // initialize importer and parser
      this.parser = new this.parser(options);

      if (this.parser instanceof Dataset.Parsers.Delimited) {
        options.dataType = "text";
      }

      this.importer = new this.importer(options);

      // save comparator if we have one
      if (options.comparator) {
        this.comparator = options.comparator;  
      }

      // if we have a ready callback, save it too
      if (options.ready) {
        this.ready = options.ready;
      }

      // If new data is being fetched and we want to just
      // replace existing rows, save this flag.
      if (options.resetOnFetch) {
        this.resetOnFetch = options.resetOnFetch;
      }

      // if new data is being fetched and we want to make sure
      // only new rows are appended, a column must be provided
      // against which uniqueness will be checked.
      // otherwise we are just going to blindly add rows.
      if (options.uniqueAgainst) {
        this.uniqueAgainst = options.uniqueAgainst;
      }

      // if there is no data and no url set, we must be building
      // the dataset from scratch, so create an id column.
      if (_.isUndefined(options.data) && _.isUndefined(options.url)) {
        this._addIdColumn();  
      }

      // if for any reason, you want to use a different deferred
      // implementation, pass it as an option
      if (options.deferred) {
        this.deferred = options.deferred;
      } else {
        this.deferred =  new _.Deferred();
      }

      //build any columns present in the constructor
      if ( options.columns ) {
        this.addColumns(options.columns);
      }
    },

    /**
    * Responsible for actually fetching the data based on the initialized dataset.
    * Note that this needs to be called for either local or remote data.
    * There are three different ways to use this method:
    * ds.fetch() - will just fetch the data based on the importer. Note that for async 
    *              fetching this isn't blocking so don't put your next set of instructions
    *              expecting the data to be there.
    * ds.fetch({
    *   success: function() { 
    *     // do stuff
    *     // this is the dataset.
    *   },
    *   error : function(e) {
    *     // do stuff
    *   }
    * })        - Allows you to pass success and error callbacks that will be called once data
    *             is property fetched.
    *
    * _.when(ds.fetch(), function() {
    *   // do stuff
    *   // note 'this' is NOT the dataset.
    * })        - Allows you to use deferred behavior to potentially chain multiple datasets.
    *
    * @param {object} options Optional success/error callbacks.
    **/
    fetch : function(options) {
      options = options || {};
      
      var dfd = this.deferred;

      if ( _.isNull(this.importer) ) {
        throw "No importer defined";
      }

      this.importer.fetch({
        success: _.bind(function( data ) {

          try {
            this._apply( data );
          } catch (e) {
            if (options.error) {
              options.error.call(this, e);
            } else {
              throw e;
            }
          }

          // if a comparator was defined, sort the data
          if (this.comparator) {
            this.sort();
          }

          if (this.ready) {
            this.ready.call(this);
          }

          if (options.success) {
            options.success.call(this);
          }

          // Ensure the context of the promise is set to the Dataset
          dfd.resolveWith(this, [this]);

        }, this),

        error : _.bind(function(e) {
          if (options.error) {
            options.error.call(this, e);
          }

          dfd.reject(e);
        }, this)
      });

      return dfd.promise();
    },

    //These are the methods that will be used to determine
    //how to update a dataset's data when fetch() is called
    _applications : {

      //Update existing values, used the pass column to match 
      //incoming data to existing rows.
      againstColumn : function(data) {
        var rows = [],
            colNames = _.keys(data),   
            row,
            uniqName = this.uniqueAgainst,
            uniqCol = this.column(uniqName),
            toAdd = [],
            toUpdate = [],
            toRemove = [];

        _.each(data[uniqName], function(key, dataIndex) { 
          var rowIndex = uniqCol.data.indexOf( Dataset.types[uniqCol.type].coerce(key) );

          var row = {};
          _.each(data, function(col, name) {
            row[name] = col[dataIndex];
          });

          if (rowIndex === -1) {
            toAdd.push( row );
          } else {
            toUpdate.push( row );
            row[this.idAttribute] = this.rowById(this.column(this.idAttribute).data[rowIndex])[this.idAttribute];
            this.update(row);
          }
        }, this);
        if (toAdd.length > 0) {
          this.add(toAdd);
        }
      },

      //Always blindly add new rows
      blind : function( data ) {
        var columnName, columnData, rows = [], row;

        // figure out the length of rows we have.
        var colNames = _.keys(data),
            dataLength = _.max(_.map(colNames, function(name) {
              return data[name].length;
            }, this));

        // build row objects
        for( var i = 0; i < dataLength; i++) {
          row = {};
          for(var j = 0; j < colNames.length; j++) {
            row[colNames[j]] = data[colNames[j]][i];
          }
          rows.push(row);
        }

        this.add(rows);
      }
    },

    //Takes a dataset and some data and applies one to the other
    _apply : function( data ) {
      
      var parsed = this.parser.parse( data );

      // first time fetch
      if ( !this.fetched ) {

        // create columns (inc _id col.)
        this._addIdColumn();
        this.addColumns( _.map(parsed.columns, function( name ) {
            return { name : name };
          })
        );
        
        // detect column types, add all rows blindly and cache them.
        Dataset.Builder.detectColumnTypes(this, parsed.data);
        this._applications.blind.call( this, parsed.data );
        
        this.fetched = true;
      
      // reset on fetch
      } else if (this.resetOnFetch) {

        // clear the data
        this.reset();

        // blindly add the data.
        this._applications.blind.call( this, parsed.data );

      // append
      } else if (this.uniqueAgainst) {

        // make sure we actually have this column
        if (!this.hasColumn(this.uniqueAgainst)) {
          throw new Error("You requested a unique add against a column that doesn't exist.");
        }

        this._applications.againstColumn.call(this, parsed.data);
      
      // polling fetch, just blindly add rows
      } else {
        this._applications.blind.call( this, parsed.data );
      }

      Dataset.Builder.cacheRows(this);
    },

    /**
    * Adds columns to the dataset.
    */
    addColumns : function( columns ) {
      _.each(columns, function( column ) {
        this.addColumn( column );
      }, this);
    },

    /**
    * Allows adding of a computed column. A computed column is
    * a column that is somehow based on the other existing columns.
    * Parameters:
    *   name : name of new column
    *   type : The type of the column based on existing types.
    *   func : The way that the column is derived. It takes a row as a parameter.
    */
    addComputedColumn : function(name, type, func) {
      // check if we already ahve a column by this name.
      if ( !_.isUndefined(this.column(name)) ) { 
        throw "There is already a column by this name.";
      } else {

        // check that this is a known type.
        if (typeof Dataset.types[type] === "undefined") {
          throw "The type " + type + " doesn't exist";
        }

        var column = new Dataset.Column({
          name : name,
          type : type,
          func : _.bind(func, this)
        });

        this._columns.push(column);
        this._computedColumns.push(column);
        this._columnPositionByName[column.name] = this._columns.length - 1;

        // do we already have data? if so compute the values for this column.
        if (this.length > 0) {
          this.each(function(row, i) {
            column.compute(row, i);
          }, this);
        }

        return column;
      }
    },

    /** 
    * Adds a single column to the dataset
    * Parameters:
    *   column : a set of properties describing a column (name, type, data etc.)
    * Returns
    *   Miso.Column object.
    */
    addColumn : function(column) {
      //don't create a column that already exists
      if ( !_.isUndefined(this.column(column.name)) ) { 
        return false; 
      }

      column = new Dataset.Column( column );

      this._columns.push( column );
      this._columnPositionByName[column.name] = this._columns.length - 1;

      return column;
    },

    /**
    * Adds an id column to the column definition. If a count
    * is provided, also generates unique ids.
    * Parameters:
    *   count - the number of ids to generate.
    */
    _addIdColumn : function( count ) {
      // if we have any data, generate actual ids.

      if (!_.isUndefined(this.column(this.idAttribute))) {
        return;
      }

      var ids = [];
      if (count && count > 0) {
        _.times(count, function() {
          ids.push(_.uniqueId());
        });
      }

      // add the id column
      var idCol = this.addColumn({ name: this.idAttribute, data : ids });
      // is this the default _id? if so set numeric type. Otherwise,
      // detect data
      if (this.idAttribute === "_id") {
        idCol.type = "number";
      }

      // did we accidentally add it to the wrong place? (it should always be first.)
      if (this._columnPositionByName[this.idAttribute] !== 0) {

        // we need to move it to the beginning and unshift all the other
        // columns
        var oldIdColPos = this._columnPositionByName[this.idAttribute];

        // move col back 
        this._columns.splice(oldIdColPos, 1);
        this._columns.unshift(idCol);
        
        this._columnPositionByName[this.idAttribute] = 0;
        _.each(this._columnPositionByName, function(pos, colName) {
          if (colName !== this.idAttribute && this._columnPositionByName[colName] < oldIdColPos) {
            this._columnPositionByName[colName]++;
          }
        }, this);
      }
      
    },

    /**
    * Add a row to the dataset. Triggers add and change.
    * Parameters:
    *   row - an object representing a row in the form of:
    *         {columnName: value}
    *   options - options
    *     silent: boolean, do not trigger an add (and thus view updates) event
    */    
    add : function(rows, options) {
      
      options = options || {};

      if (!_.isArray(rows)) {
        rows = [rows];
      }

      var deltas = [];

      _.each(rows, function(row) {
        if (!row[this.idAttribute]) {
          row[this.idAttribute] = _.uniqueId();
        }

        this._add(row, options);

        // store all deltas for a single fire event.
        if (this.syncable && !options.silent) {
          deltas.push({ changed : row });
        }
      
      }, this);
      
      if (this.syncable && !options.silent) {
        var e = Dataset.Events._buildEvent(deltas, this);
        this.publish('add', e );
        this.publish('change', e );
      }

      return this;
    },

    /**
    * Remove all rows that match the filter. Fires remove and change.
    * Parameters:
    *   filter - row id OR function applied to each row to see if it should be removed.
    *   options - options. Optional.
    *     silent: boolean, do not trigger an add (and thus view updates) event
    */    
    remove : function(filter, options) {
      filter = this._rowFilter(filter);
      var deltas = [], rowsToRemove = [];

      this.each(function(row, rowIndex) {
        if (filter(row)) {
          rowsToRemove.push(row[this.idAttribute]);
          deltas.push( { old: row } );
        }
      });

      // don't attempt tp remove the rows while iterating over them
      // since that modifies the length of the dataset and thus
      // terminates the each loop early. 
      _.each(rowsToRemove, function(rowId) {
        this._remove(rowId);  
      }, this);
      
      if (this.syncable && (!options || !options.silent)) {
        var ev = Dataset.Events._buildEvent( deltas, this );
        this.publish('remove', ev );
        this.publish('change', ev );
      }
    },

    _arrayUpdate : function(rows) {
      var deltas = [];
      _.each(rows, function(newRow) {
        var delta = { old : {}, changed : {} };
        delta[this.idAttribute] = newRow[this.idAttribute];

        var pos = this._rowPositionById[newRow[this.idAttribute]];
        _.each(newRow, function(value, prop) {
          var column = this._columns[this._columnPositionByName[prop]];
          var type = Dataset.types[column.type];

          if ((column.name === this.idAttribute) && (column.data[pos] !== value)) {
            throw "You can't update the id column";
          }

          if (typeof column === "undefined") { 
            throw "column " + prop + " not found!"; 
          }

          //Ensure value passes the type test
          if (!type.test(value, column)) {
            throw "Value is incorrect type";
          }

          //skip if computed column
          if (this._computedColumns[column.name]) {
            return;
          }

          value = type.coerce(value, column);

          //Run any before filters on the column
          if (!_.isUndefined(column.before)) {
            value = column.before(value);
          }
 
          if (column.data[pos] !== value) {
            delta.old[prop] = column.data[pos];
            column.data[pos] = value;
            delta.changed[prop] = value;
          }


        }, this);

          // Update any computed columns
          if (typeof this._computedColumns !== "undefined") {
            _.each(this._computedColumns, function(column) {
              var temprow = _.extend({}, this._row(pos)),
                  oldValue = temprow[column.name],
                  newValue = column.compute(temprow, pos);
              if (oldValue !== newValue) {
                delta.old[column.name] = oldValue;
                column.data[pos] = newValue;
                delta.changed[column.name] = newValue;
              }
            }, this);
          }
        if ( _.keys(delta.changed).length > 0 ) {
          deltas.push(delta);
        }
      }, this);
      return deltas;
    },

    _functionUpdate : function(func) {
      var rows = [];
      for(var i = 0; i < this.length; i++) {
        var newRow = func(this.rowByPosition(i));
        if (newRow !== false) {
          rows.push( newRow );
        }
      }
      return this._arrayUpdate(rows);
    },

    /**
    * Update can be used on one of three ways.
    * 1: To update specific rows by passing in an object with the _id
    * 2: To update a number of rows by passing in an array of objects with _ids
    * 3: To update a number of row by passing in a function which will be applied to
    * all rows.
    * */    
    update : function( rowsOrFunction, options ) {
      var deltas;

      if ( _.isFunction(rowsOrFunction) ) {
        deltas = this._functionUpdate(rowsOrFunction);
      } else {
        var rows = _.isArray(rowsOrFunction) ? rowsOrFunction : [rowsOrFunction];
        deltas = this._arrayUpdate(rows);
      }

      //computer column updates
      //update triggers
      if (this.syncable && (!options || !options.silent)) {
        var ev = Dataset.Events._buildEvent( deltas, this );
        this.publish('update', ev );
        this.publish('change', ev );
      }
      return this;
    },

    /**
    * Clears all the rows
    * Fires a "reset" event.
    * Parameters:
    *   options (object)
    *     silent : true | false.
    */
    reset : function(options) {
      _.each(this._columns, function(col) {
        col.data = [];
      });
      this.length = 0;
      if (this.syncable && (!options || !options.silent)) {
        this.publish("reset");
      }
    }

  });
  
}(this, _, moment));


(function(global, _) {

  var Dataset = global.Miso.Dataset;

  Dataset.typeOf = function(value, options) {
    var types = _.keys(Dataset.types),
        chosenType;

    //move string and mixed to the end
    types.push(types.splice(_.indexOf(types, 'string'), 1)[0]);
    types.push(types.splice(_.indexOf(types, 'mixed'), 1)[0]);

    chosenType = _.find(types, function(type) {
      return Dataset.types[type].test(value, options);
    });

    chosenType = _.isUndefined(chosenType) ? 'string' : chosenType;

    return chosenType;
  };
  
  Dataset.types = {
    
    mixed : {
      name : 'mixed',
      coerce : function(v) {
        if (_.isNull(v) || typeof v === "undefined" || _.isNaN(v)) {
          return null;
        }
        return v;
      },
      test : function() {
        return true;
      },
      compare : function(s1, s2) {
        if ( _.isEqual(s1, s2) ) { return 0; }
        if (s1 < s2)  { return -1;}
        if (s1 > s2)  { return 1; }
      },
      numeric : function(v) {
        return v === null || _.isNaN(+v) ? null : +v;
      }
    },

    string : {
      name : "string",
      coerce : function(v) {
        if (_.isNaN(v) || v === null || typeof v === "undefined") {
          return null;
        }
        return v.toString();
      },

      test : function(v) {
        return (v === null || typeof v === "undefined" || typeof v === 'string');
      },

      compare : function(s1, s2) {
        if (s1 == null && s2 != null) { return -1; }
        if (s1 != null && s2 == null) { return 1; }
        if (s1 < s2) { return -1; }
        if (s1 > s2) { return 1;  }
        return 0;
      },

      numeric : function(value) {
        if (_.isNaN(+value) || value === null) {
          return null;
        } else if (_.isNumber(+value)) {
          return +value;
        } else {
          return null;
        }
      }
    },

    "boolean" : {
      name : "boolean",
      regexp : /^(true|false)$/,
      coerce : function(v) {
        if (_.isNaN(v) || v === null || typeof v === "undefined") {
          return null;
        }
        if (v === 'false') { return false; }
        return Boolean(v);
      },
      test : function(v) {
        if (v === null || typeof v === "undefined" || typeof v === 'boolean' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(n1, n2) {
        if (n1 == null && n2 != null) { return -1; }
        if (n1 != null && n2 == null) { return 1; }
        if (n1 == null && n2 == null) { return 0; }
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      numeric : function(value) {
        if (value === null || _.isNaN(value)) {
          return null;
        } else {
          return (value) ? 1 : 0;  
        }
      }
    },

    number : {  
      name : "number",
      regexp : /^\s*[\-\.]?[0-9]+([\.][0-9]+)?\s*$/,
      coerce : function(v) {
        var cv = +v;
        if (_.isNull(v) || typeof v === "undefined" || _.isNaN(cv)) {
          return null;
        }
        return cv;
      },
      test : function(v) {
        if (v === null || typeof v === "undefined" || typeof v === 'number' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(n1, n2) {
        if (n1 == null && n2 != null) { return -1; }
        if (n1 != null && n2 == null) { return 1; }
        if (n1 == null && n2 == null) { return 0; }
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      numeric : function(value) {
        if (_.isNaN(value) || value === null) {
          return null;
        }
        return value;
      }
    },

    time : {
      name : "time",
      format : "DD/MM/YYYY",
      _formatLookup : [
        ['DD', "\\d{2}"],
        ['D' ,  "\\d{1}|\\d{2}"],
        ['MM', "\\d{2}"],
        ['M' , "\\d{1}|\\d{2}"],
        ['YYYY', "\\d{4}"],
        ['YY', "\\d{2}"],
        ['A', "[AM|PM]"],
        ['hh', "\\d{2}"],
        ['h', "\\d{1}|\\d{2}"],
        ['mm', "\\d{2}"],
        ['m', "\\d{1}|\\d{2}"],
        ['ss', "\\d{2}"],
        ['s', "\\d{1}|\\d{2}"],
        ['ZZ',"[-|+]\\d{4}"],
        ['Z', "[-|+]\\d{2}:\\d{2}"]
      ],
      _regexpTable : {},

      _regexp: function(format) {
        //memoise
        if (this._regexpTable[format]) {
          return new RegExp(this._regexpTable[format], 'g');
        }

        //build the regexp for substitutions
        var regexp = format;
        _.each(this._formatLookup, function(pair) {
          regexp = regexp.replace(pair[0], pair[1]);
        }, this);

        // escape all forward slashes
        regexp = regexp.split("/").join("\\/");

        // save the string of the regexp, NOT the regexp itself.
        // For some reason, this resulted in inconsistant behavior
        this._regexpTable[format] = regexp; 
        return new RegExp(this._regexpTable[format], 'g');
      },

      coerce : function(v, options) {
        options = options || {};

        if (_.isNull(v) || typeof v === "undefined" || _.isNaN(v)) {
          return null;
        }

        // if string, then parse as a time
        if (_.isString(v)) {
          var format = options.format || this.format;
          return moment(v, format);   
        } else if (_.isNumber(v)) {
          return moment(v);
        } else {
          return v;
        }

      },

      test : function(v, options) {
        options = options || {};
        if (v === null || typeof v === "undefined") {
          return true;
        }
        if (_.isString(v) ) {
          var format = options.format || this.format,
              regex = this._regexp(format);
          return regex.test(v);
        } else {
          //any number or moment obj basically
          return true;
        }
      },
      compare : function(d1, d2) {
        if (d1 < d2) {return -1;}
        if (d1 > d2) {return 1;}
        return 0;
      },
      numeric : function( value ) {
        if (_.isNaN(value) || value === null) {
          return null;
        }
        return value.valueOf();
      }
    }
  };

}(this, _));

(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
  * A representation of an event as it is passed through the
  * system. Used for view synchronization and other default
  * CRUD ops.
  * Parameters:
  *   deltas - array of deltas.
  *     each delta: { changed : {}, old : {} }
  */
  Dataset.Event = function(deltas, dataset) {
    if (!_.isArray(deltas)) {
      deltas = [deltas];
    }
    this.deltas = deltas;
    this.dataset = dataset || null;
  };

  _.extend(Dataset.Event.prototype, {
    affectedColumns : function() {
      var cols = [];
      _.each(this.deltas, function(delta) {
        delta.old = (delta.old || []);
        delta.changed = (delta.changed || []);
        cols = _.chain(cols)
          .union(_.keys(delta.old), _.keys(delta.changed) )
          .reject(function(col) {
            return col === this.dataset.idAttribute;
          }, this).value();
      }, this);

      return cols;
    }
  });

   _.extend(Dataset.Event, {
    /**
    * Returns true if the event is a deletion
    */
    isRemove : function(delta) {
      if (_.isUndefined(delta.changed) || _.keys(delta.changed).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * Returns true if the event is an add event.
    */
    isAdd : function(delta) {
      if (_.isUndefined(delta.old) || _.keys(delta.old).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * Returns true if the event is an update.
    */
    isUpdate : function(delta) {
      if (!this.isRemove(delta) && !this.isAdd(delta)) {
        return true;
      } else {
        return false;
      }
    }
  });
  
  
  //Event Related Methods
  Dataset.Events = {};

  // Used to build event objects accross the application.
  Dataset.Events._buildEvent = function(delta, dataset) {
    return new Dataset.Event(delta, dataset);
  };

}(this, _));

(function(global, _) {
  
  var Dataset = global.Miso.Dataset;
  
  /**
  * This is a generic collection of dataset-building utilities
  * that are used by Miso.Dataset and Miso.DataView.
  */
  Dataset.Builder = {

    /**
    * Detects the type of a column based on some input data.
    * Parameters:
    *   column - the Miso.Column object
    *   data - an array of data to be scanned for type detection
    * Returns:
    *   input column but typed.
    */
    detectColumnType : function(column, data) {

      // compute the type by assembling a sample of computed types
      // and then squashing it to create a unique subset.
      var type = _.inject(data.slice(0, 5), function(memo, value) {

        var t = Dataset.typeOf(value);

        if (value !== "" && memo.indexOf(t) === -1 && !_.isNull(value)) {
          memo.push(t);
        }
        return memo;
      }, []);

      // if we only have one type in our sample, save it as the type
      if (type.length === 1) {
        column.type = type[0];
      } else {
        //empty column or mixed type
        column.type = 'mixed';
      }

      return column;
    },

    /**
    * Detects the types of all columns in a dataset.
    * Parameters:
    *   dataset - the dataset to test the columns of
    *   parsedData - the data to check the type of
    */
    detectColumnTypes : function(dataset, parsedData) {

      _.each(parsedData, function(data, columnName) {
        
        var column = dataset.column( columnName );
        
        // check if the column already has a type defined
        if ( column.type ) { 
          column.force = true;
          return; 
        } else {
          Dataset.Builder.detectColumnType(column, data);
        }

      }, this);
    },

    /**
    * Used by internal importers to cache the rows 
    * in quick lookup tables for any id based operations.
    * also used by views to cache the new rows they get
    * as a result of whatever filter created them.
    */
    cacheRows : function(dataset) {

      Dataset.Builder.clearRowCache(dataset);

      // cache the row id positions in both directions.
      // iterate over the _id column and grab the row ids
      _.each(dataset._columns[dataset._columnPositionByName[dataset.idAttribute]].data, function(id, index) {
        dataset._rowPositionById[id] = index;
        dataset._rowIdByPosition.push(id);
      }, dataset);  

      // cache the total number of rows. There should be same 
      // number in each column's data
      var rowLengths = _.uniq( _.map(dataset._columns, function(column) { 
        return column.data.length;
      }));

      if (rowLengths.length > 1) {
        throw new Error("Row lengths need to be the same. Empty values should be set to null." + 
          _.map(dataset._columns, function(c) { return c.data + "|||" ; }));
      } else {
        dataset.length = rowLengths[0];
      }
    },

    /**
    * Clears the row cache objects of a dataset
    * Parameters:
    *   dataset - Miso.Dataset instance.
    */
    clearRowCache : function(dataset) {
      dataset._rowPositionById = {};
      dataset._rowIdByPosition = [];
    },

    /**
    * Caches the column positions by name
    * Parameters:
    *   dataset - Miso.Dataset instance.
    */
    cacheColumns : function(dataset) {
      dataset._columnPositionByName = {};
      _.each(dataset._columns, function(column, i) {
        dataset._columnPositionByName[column.name] = i;
      });
    }
  };

  // fix lack of IE indexOf. Again.
  if (!Array.prototype.indexOf) { 
    Array.prototype.indexOf = function(obj, start) {
     for (var i = (start || 0), j = this.length; i < j; i++) {
         if (this[i] === obj) { return i; }
     }
     return -1;
    };
  }

}(this, _));

(function(global, _) {

  var Miso = global.Miso || (global.Miso = {});
  var Dataset = global.Miso.Dataset;

  /**
  * A Miso.Product is a single computed value that can be obtained 
  * from a Miso.Dataset. When a dataset is syncable, it will be an object
  * that one can subscribe to the changes of. Otherwise, it returns
  * the actual computed value.
  * Parameters:
  *   func - the function that derives the computation.
  *   columns - the columns from which the function derives the computation
  */
  Dataset.Product = function(options) {
    options = options || {};
    
    // save column name. This will be necessary later
    // when we decide whether we need to update the column
    // when sync is called.
    this.func = options.func;

    // determine the product type (numeric, string, time etc.)
    if (options.columns) {
      var column = options.columns;
      if (_.isArray(options.columns)) {
        column = options.columns[0];
      }
      
      this.valuetype = column.type;
      this.numeric = function() {
        return column.toNumeric(this.value);
      };
    }

    this.func({ silent : true });
    return this;
  };

  _.extend(Dataset.Product.prototype, Miso.Events, {

    /**
    * return the raw value of the product
    * Returns:
    *   The value of the product. Most likely a number.
    */
    val : function() {
      return this.value;
    },

    /**
    * return the type of product this is (numeric, time etc.)
    * Returns
    *   type. Matches the name of one of the Miso.types.
    */
    type : function() {
      return this.valuetype;
    },
    
    //This is a callback method that is responsible for recomputing
    //the value based on the column its closed on.
    _sync : function(event) {
      this.func();
    },

    // builds a delta object.
    _buildDelta : function(old, changed) {
      return {
        old : old,
        changed : changed
      };
    }
  });

  Dataset.Product.define = function(func) {
    return function(columns, options) {
      options = options || {};
      var columnObjects = this._findColumns(columns);
      var _self = this;
      options.type = options.type || columnObjects[0].type;
      options.typeOptions = options.typeOptions || columnObjects[0].typeOptions;

      //define wrapper function to handle coercion
      var producer = function() {
        var val = func.call(_self, columnObjects, options);
        return Dataset.types[options.type].coerce(val, options.typeOptions);
      };

      if (this.syncable) {
        //create product object to pass back for syncable datasets/views
        var prod = new Dataset.Product({
          columns : columnObjects,
          func : function(options) {
            options = options || {};
            var delta = this._buildDelta(this.value, producer.call(_self));
            this.value = delta.changed;
            if (_self.syncable) {
              var event = Dataset.Events._buildEvent(delta, this);
              if (!_.isUndefined(delta.old) && !options.silent && delta.old !== delta.changed) {
                this.publish("change", event);
              }
            }
          }
        });
        this.subscribe("change", prod._sync, { context : prod }); 
        return prod; 

      } else {
        return producer.call(_self);
      }

    };
  };


  _.extend(Dataset.DataView.prototype, {

    // finds the column objects that match the single/multiple
    // input columns. Helper method.
    _findColumns : function(columns) {
      var columnObjects = [];

      // if no column names were specified, get all column names.
      if (_.isUndefined(columns)) {
        columns = this.columnNames();
      }

      // convert columns to an array in case we only got one column name.
      columns = _.isArray(columns) ? columns : [columns];

      // assemble actual column objecets together.
      _.each(columns, function(column) {
        column = this._columns[this._columnPositionByName[column]];
        columnObjects.push(column);
      }, this);

      return columnObjects;
    },

    /**
    * Computes the sum of one or more columns.
    * Parameters:
    *   columns - string or array of column names on which the value is calculated 
    *   options
    *     silent - set to tue to prevent event propagation
    */
    sum : Dataset.Product.define( function(columns, options) {
      _.each(columns, function(col) {
        if (col.type === Dataset.types.time.name) {
          throw new Error("Can't sum up time");
        }
      });
      return _.sum(_.map(columns, function(c) { return c._sum(); }));
    }),

     /**
    * return a Product with the value of the maximum 
    * value of the column
    * Parameters:
    *   column - string or array of column names on which the value is calculated 
    */    
    max : Dataset.Product.define( function(columns, options) {
      return _.max(_.map(columns, function(c) { 
        return c._max(); 
      }));
    }),

  
    /**
    * return a Product with the value of the minimum 
    * value of the column
    * Paramaters:
    *   columns - string or array of column names on which the value is calculated 
    */    
    min : Dataset.Product.define( function(columns, options) {
      return _.min(_.map(columns, function(c) { 
        return c._min(); 
      }));
    }),

    /**
    * return a Product with the value of the average
    * value of the column
    * Parameters:
    *   column - string or array of column names on which the value is calculated 
    */    
    mean : Dataset.Product.define( function(columns, options) {
      var vals = [];
      _.each(columns, function(col) {
        vals.push(col.data);
      });

      vals = _.flatten(vals);

      // save types and type options to later coerce
      var type = columns[0].type;

      // convert the values to their appropriate numeric value
      vals = _.map(vals, function(v) { return Dataset.types[type].numeric(v); });
      return _.mean(vals);   
    })

  });

}(this, _));


(function(global, _) {

  var Dataset = global.Miso.Dataset;

  Dataset.Importers = function(data, options) {};

  /**
  * Simple base extract method, passing data through
  * If your importer needs to extract the data from the
  * returned payload before converting it to
  * a dataset, overwrite this method to return the
  * actual data object.
  */
  Dataset.Importers.prototype.extract = function(data) {
    data = _.clone(data);
    return data;
  };

}(this, _));

(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
  * Local data importer is responsible for just using
  * a data object and passing it appropriately.
  */
  Dataset.Importers.Local = function(options) {
    options = options || {};

    this.data = options.data || null;
    this.extract = options.extract || this.extract;
  };

  _.extend(Dataset.Importers.Local.prototype, Dataset.Importers.prototype, {
    fetch : function(options) {
      var data = options.data ? options.data : this.data;
      options.success( this.extract(data) );
    }
  });

}(this, _));

(function(global, _) {

  var Dataset = global.Miso.Dataset;
  

  /**
  * A remote importer is responsible for fetching data from a url.
  * Parameters:
  *   options
  *     url - url to query
  *     extract - a method to pass raw data through before handing back to parser.
  *     dataType - ajax datatype
  *     jsonp  - true if it's a jsonp request, false otherwise.
  */
  Dataset.Importers.Remote = function(options) {
    options = options || {};

    this._url = options.url;
    this.extract = options.extract || this.extract;

    // Default ajax request parameters
    this.params = {
      type : "GET",
      url : _.isFunction(this._url) ? _.bind(this._url, this) : this._url,
      dataType : options.dataType ? options.dataType : (options.jsonp ? "jsonp" : "json"),
      callback : options.callback
    };
  };

  _.extend(Dataset.Importers.Remote.prototype, Dataset.Importers.prototype, {
    fetch : function(options) {

      // call the original fetch method of object parsing.
      // we are assuming the parsed version of the data will
      // be an array of objects.
      var callback = _.bind(function(data) {
        options.success( this.extract(data) );
      }, this);

      // do we have a named callback? We need to wrap our
      // success callback in this name
      if (this.callback) {
        window[this.callback] = callback;
      }

      // make ajax call to fetch remote url.
      Dataset.Xhr(_.extend(this.params, {
        success : this.callback ? this.callback : callback,
        error   : options.error
      }));
    }
  });

  // this XHR code is from @rwldron.
  var _xhrSetup = {
    url       : "",
    data      : "",
    dataType  : "",
    success   : function() {},
    type      : "GET",
    async     : true,
    xhr : function() {
      return global.ActiveXObject ? new global.ActiveXObject("Microsoft.XMLHTTP") : new global.XMLHttpRequest();
    }
  }, rparams = /\?/;

  Dataset.Xhr = function(options) {

    // json|jsonp etc.
    options.dataType = options.dataType && options.dataType.toLowerCase() || null;

    var url = _.isFunction(options.url) ? options.url() : options.url;

    if (options.dataType &&
      (options.dataType === "jsonp" || options.dataType === "script" )) {

        Dataset.Xhr.getJSONP(
          url, 
          options.success,
          options.dataType === "script",
          options.error,
          options.callback
        );

        return;
      }

      var settings = _.extend({}, _xhrSetup, options, { url : url });

      // create new xhr object
      settings.ajax = settings.xhr();

      if (settings.ajax) {
        if (settings.type === "GET" && settings.data) {

          //  append query string
          settings.url += (rparams.test(settings.url) ? "&" : "?") + settings.data;

          //  Garbage collect and reset settings.data
          settings.data = null;
        }

        settings.ajax.open(settings.type, settings.url, settings.async);
        settings.ajax.send(settings.data || null);

        return Dataset.Xhr.httpData(settings);
      }
  };

  Dataset.Xhr.getJSONP = function(url, success, isScript, error, callback) {
    // If this is a script request, ensure that we do not
    // call something that has already been loaded
    if (isScript) {

      var scripts = document.querySelectorAll("script[src=\"" + url + "\"]");

      //  If there are scripts with this url loaded, early return
      if (scripts.length) {

        //  Execute success callback and pass "exists" flag
        if (success) {
          success(true);
        }

        return;
      }
    }

    var head    = document.head ||
    document.getElementsByTagName("head")[0] ||
    document.documentElement,

    script    = document.createElement("script"),
    paramStr  = url.split("?")[ 1 ],
    isFired   = false,
    params    = [],
    parts;

    // Extract params
    if (paramStr && !isScript) {
      params = paramStr.split("&");
    }
    if (params.length) {
      parts = params[params.length - 1].split("=");
    }
    if (!callback) {
      var fallback = _.uniqueId('callback');
      callback = params.length ? (parts[ 1 ] ? parts[ 1 ] : fallback) : fallback;
    }

    if (!paramStr && !isScript) {
      url += "?";
    }

    if ( !paramStr || !/callback/.test(paramStr) ) {
      if (paramStr) { url += '&'; }
      url += "callback=" + callback;
    }

    if (callback && !isScript) {

      // If a callback name already exists
      if (!!window[callback]) {
        callback = callback + (+new Date()) + _.uniqueId();
      }

      //  Define the JSONP success callback globally
      window[callback] = function(data) {
        if (success) {
          success(data);
        }
        isFired = true;
      };

      //  Replace callback param and callback name
      if (parts) { 
        url = url.replace(parts.join("="), parts[0] + "=" + callback);
      }
    }

    script.onload = script.onreadystatechange = function() {
      if (!script.readyState || /loaded|complete/.test(script.readyState)) {

        //  Handling remote script loading callbacks
        if (isScript) {

          //  getScript
          if (success) {
            success();
          }
        }

        //  Executing for JSONP requests
        if (isFired) {

          //  Garbage collect the callback
          try {
            delete window[callback];
          } catch(e) {
            window[callback] = void 0;
          }
          
          //  Garbage collect the script resource
          head.removeChild(script);
        }
      }
    };

    script.onerror = function(e) {
      if (error) {
        error.call(null, e);
      }
    };

    script.src = url;
    head.insertBefore(script, head.firstChild);
    return;
  };

  Dataset.Xhr.httpData = function(settings) {
    var data, json = null, handleResponse;

    handleResponse = function () {
      if (settings.ajax.readyState === 4) {
        try {
          json = JSON.parse(settings.ajax.responseText);
        } catch (e) {
          // suppress
        }

        data = {
          xml : settings.ajax.responseXML,
          text : settings.ajax.responseText,
          json : json
        };

        if (settings.dataType) {
          data = data[settings.dataType];
        }

        // if we got an ok response, call success, otherwise fail.
        if (/(2..)/.test(settings.ajax.status)) {
          settings.success.call(settings.ajax, data);
        } else {
          if (settings.error) {
            settings.error.call(null, settings.ajax.statusText);
          }
        }
      }
    };

    if ( settings.ajax.readyState === 4 ) {
      handleResponse(); // Internet Exploder doesn't bother with readystatechange handlers for cached resources... trigger the handler manually
    } else {
      settings.ajax.onreadystatechange = handleResponse;
    }

    return data;
  };

}(this, _));

(function(global,_){
  
  var Dataset = global.Miso.Dataset;

  /**
  * A remote polling importer that queries a url once every 1000
  * seconds.
  * Parameters:
  *   interval - poll every N milliseconds. Default is 1000.
  *   extract  - a method to pass raw data through before handing back to parser.
  */
  Dataset.Importers.Polling = function(options) {
    options = options || {};
    this.interval = options.interval || 1000;
    this._def = null;

    Dataset.Importers.Remote.apply(this, [options]);
  };

  _.extend(Dataset.Importers.Polling.prototype, Dataset.Importers.Remote.prototype, {
    fetch : function(options) {

      if (this._def === null) {

        this._def = _.Deferred();

        // wrap success with deferred resolution
        this.success_callback = _.bind(function(data) {
          options.success(this.extract(data));
          this._def.resolve(this);
        }, this);

        // wrap error with defered rejection
        this.error_callback = _.bind(function(error) {
          options.error(error);
          this._def.reject(error);
        }, this);
      } 

      // on success, setTimeout another call
      _.when(this._def.promise()).then(function(importer) {
        
        var callback = _.bind(function() {
          this.fetch({
            success : this.success_callback,
            error   : this.error_callback
          });
        }, importer);

        importer._timeout = setTimeout(callback, importer.interval);
        // reset deferred
        importer._def = _.Deferred();
      });

      Dataset.Xhr(_.extend(this.params, {
        success : this.success_callback,
        error : this.error_callback
      }));

      global.imp = this;
    },

    stop : function() {
      if (this._def !== null) {
        this._def.reject();
      }
      if (typeof this._timeout !== "undefined") {
        clearTimeout(this._timeout);
      }
    },

    start : function() {
      if (this._def !== null) {
        this._def = _.Deferred();
        this.fetch();
      }
    }
  });

}(this, _));

(function(global, _) {

  var Dataset = global.Miso.Dataset;
  
  /**
  * Instantiates a new google spreadsheet importer.
  * Parameters
  *   options - Options object. Requires at the very least:
  *     key - the google spreadsheet key
  *     gid - the index of the spreadsheet to be retrieved (1 default)
  *       OR
  *     sheetName - the name of the sheet to fetch ("Sheet1" default)
  *   OR
  *     url - a more complex url (that may include filtering.) In this case
  *           make sure it's returning the feed json data.
  */
  Dataset.Importers.GoogleSpreadsheet = function(options) {
    options = options || {};
    if (options.url) {

      options.url = options.url;

    } else {

      if (_.isUndefined(options.key)) {

        throw new Error("Set options 'key' properties to point to your google document.");
      } else {

        // turning on the "fast" option will use the farser parser
        // that downloads less data but it's flakier (due to google not
        // correctly escaping various strings when returning json.)
        if (options.fast) {
          
          options.url = "https://spreadsheets.google.com/tq?key=" + options.key;
                  
          if (typeof options.sheetName === "undefined") {
            options.sheetName = "Sheet1";
          } 

          options.url += "&sheet=" + options.sheetName;
          this.callback = "misodsgs" + new Date().getTime();
          options.url += "&tqx=version:0.6;responseHandler:" + this.callback;
          options.url += ";reqId:0;out:json&tq&_=1335871249558#";

          delete options.sheetName;
        } else {
          options.url = "https://spreadsheets.google.com/feeds/cells/" + 
          options.key + "/" + 
          options.worksheet + 
          "/public/basic?alt=json-in-script&callback=";
        }
        
        delete options.key;
      }
    }
    

    this.params = {
      type : "GET",
      url : options.url,
      dataType : "jsonp"
    };

    return this;
  };

  _.extend(Dataset.Importers.GoogleSpreadsheet.prototype, Dataset.Importers.Remote.prototype);

}(this, _));

(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
  * Base Miso.Parser class.
  */
  Dataset.Parsers = function( options ) {
    this.options = options || {};
  };

  _.extend(Dataset.Parsers.prototype, {

    //this is the main function for the parser,
    //it must return an object with the columns names
    //and the data in columns
    parse : function() {}

  });
}(this, _));

(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
  * Strict format parser.
  * Handles basic strict data format.
  * Looks like: {
  *   data : {
  *     columns : [
  *       { name : colName, type : colType, data : [...] }
  *     ]
  *   }
  * }
  */
  Dataset.Parsers.Strict = function( options ) {
    this.options = options || {};
  }; 

  _.extend( Dataset.Parsers.Strict.prototype, Dataset.Parsers.prototype, {

    parse : function( data ) {
      var columnData = {}, columnNames = [];

      _.each(data.columns, function(column) {
        if (columnNames.indexOf(column.name) !== -1) {
          throw new Error("You have more than one column named \"" + column.name + "\"");
        } else {
          columnNames.push( column.name );
          columnData[ column.name ] = column.data;  
        }
      });

      return {
        columns : columnNames,
        data : columnData 
      };
    }

  });

}(this, _));

(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
  * Object parser
  * Converts an array of objects to strict format.
  * Each object is a flat json object of properties.
  */
  Dataset.Parsers.Obj = Dataset.Parsers;

  _.extend(Dataset.Parsers.Obj.prototype, Dataset.Parsers.prototype, {

    parse : function( data ) {
      var columns = _.keys(data[0]),
          columnData = {};

      //create the empty arrays
      _.each(columns, function( key ) {
        columnData[ key ] = [];
      });

      // iterate over properties in each row and add them
      // to the appropriate column data.
      _.each(columns, function( col ) {
        _.times(data.length, function( i ) {
          columnData[ col ].push( data[i][col] );
        });
      });
     
      return {
        columns : columns,
        data : columnData 
      };
    }

  });

}(this, _));

// --------- Google Spreadsheet Parser -------
// 

(function(global, _) {

  var Dataset = global.Miso.Dataset;
  /**
  * Google Spreadsheet Parser. 
  * This is utilizing the format that can be obtained using this:
  * http://code.google.com/apis/gdata/samples/spreadsheet_sample.html
  * Used in conjunction with the Google Spreadsheet Importer.
  */
  Dataset.Parsers.GoogleSpreadsheet = function(options) {
    this.fast = options.fast || false;
  };

  _.extend(Dataset.Parsers.GoogleSpreadsheet.prototype, Dataset.Parsers.prototype, {

    parse : function(data) {
      var columns = [],
          columnData = [],  
          keyedData = {},
          i;

      // the fast importer API is not available
      if (typeof data.status !== "undefined" && data.status === "error") {
        throw new Error("You can't use the fast importer for this url. Disable the fast flag");
      }

      if (this.fast) {

        // init column names
        columns = _.pluck(data.table.cols, "label");

        // check that the column names don't have duplicates
        if (_.unique(columns).length < columns.length) {
          var dup = "";
          
          _.inject(columns, function(memo, val) { 
            
            memo[val] = (memo[val] + 1) || 1; 
            if (memo[val] > 1) {
              dup = val;
            }
            return memo; 
          }, {});

          throw new Error("You have more than one column named \"" + dup + "\"");
        }

        // save data
        _.each(data.table.rows, function(row) {
          row = row.c;
          for(i = 0; i < row.length; i++) {
            columnData[i] = columnData[i] || [];
            if (row[i].v === "") {
              columnData[i].push(null);  
            } else {
              columnData[i].push(row[i].v);
            }
          }
        });

        // convert to keyed data.
        _.each(columns, function(colName, index) {
          keyedData[colName] = columnData[index];
        });

      } else {
        var positionRegex = /([A-Z]+)(\d+)/,
            columnPositions = {};

        _.each(data.feed.entry, function(cell) {

          var parts = positionRegex.exec(cell.title.$t),
          column = parts[1],
          position = parseInt(parts[2], 10);

          // this is the first row, thus column names.
          if (position === 1) {

            // if we've already seen this column name, throw an exception
            if (columns.indexOf(cell.content.$t) !== -1) {
              throw new Error("You have more than one column named \"" + cell.content.$t + "\"");
            } else {
              // cache the column position
              columnPositions[column] = columnData.length;

              // we found a new column, so build a new column type.
              columns[columnPositions[column]]    = cell.content.$t;
              columnData[columnPositions[column]] = []; 
            }

          } else {

            // find position: 
            var colpos = columnPositions[column];

            // this is a value for an existing column, so push it.
            columnData[colpos][position-1] = cell.content.$t; 

          }
        }, this);

        _.each(columnData, function(coldata, column) {
          // fill whatever empty spaces we might have in the data due to empty cells
          coldata.length = _.max(_.pluck(columnData, "length"));

          // slice off first space. It was alocated for the column name
          // and we've moved that off.
          coldata.splice(0,1);

          for (var i = 0; i < coldata.length; i++) {
            if (_.isUndefined(coldata[i]) || coldata[i] === "") {
              coldata[i] = null;
            }
          }

          keyedData[columns[column]] = coldata;
        });

      }
      
      return {
        columns : columns,
        data : keyedData
      };
    }

  });
}(this, _));


(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
  * Delimited data parser.
  * Handles CSV and other delimited data. 
  * Parameters:
  *   options
  *     delimiter : ","
  */
  Dataset.Parsers.Delimited = function(options) {
    options = options || {};

    this.delimiter = options.delimiter || ",";

    this.skipRows = options.skipRows || 0;

    this.emptyValue = options.emptyValue || null;

    this.__delimiterPatterns = new RegExp(
      (
        // Delimiters.
        "(\\" + this.delimiter + "|\\r?\\n|\\r|^)" +

        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

        // Standard fields.
        "([^\"\\" + this.delimiter + "\\r\\n]*))"
      ),
      "gi"
    );
  };

  // Ie is not aware of trim method...
  if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, ''); 
    };
  }

  _.extend(Dataset.Parsers.Delimited.prototype, Dataset.Parsers.prototype, {

    parse : function(data) {
      var columns = [],
          columnData = {},
          uniqueSequence = {};
      
      var uniqueId = function(str) {
        if ( !uniqueSequence[str] ) {
          uniqueSequence[str] = 0;
        }
        var id = str + uniqueSequence[str];
        uniqueSequence[str] += 1;
        return id;
      };


      var parseCSV = function(delimiterPattern, strData, strDelimiter, skipRows, emptyValue) {

        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // track how many columns we have. Once we reach a new line
        // mark a flag that we're done calculating that.
        var columnCount = 0;
        var columnCountComputed = false;

        // track which column we're on. Start with -1 because we increment it before
        // we actually save the value.
        var columnIndex = -1;

        // track which row we're on
        var rowIndex = 0;

        try {

          // trim any empty lines at the end
          strData = strData//.trim();
            .replace(/\s+$/,"")
            .replace(/^[\r|\n|\s]+[\r|\n]/,"\n");

          // do we have any rows to skip? if so, remove them from the string
          if (skipRows > 0) {
            var rowsSeen = 0,
                charIndex = 0,
                strLen = strData.length;

            while (rowsSeen < skipRows && charIndex < strLen) {
              if (/\n|\r|\r\n/.test(strData.charAt(charIndex))) {
                rowsSeen++;
              } 
              charIndex++;
            }

            strData = strData.slice(charIndex, strLen);
          }

          // Keep looping over the regular expression matches
          // until we can no longer find a match.
          function matchHandler(arrMatches) {
            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if ( strMatchedDelimiter.length &&
              ( strMatchedDelimiter !== strDelimiter )){

            // we have reached a new row.
            rowIndex++;

            // if we caught less items than we expected, throw an error
            if (columnIndex < columnCount-1) {
              rowIndex--;
              throw new Error("Not enough items in row");
            }

            // We are clearly done computing columns.
            columnCountComputed = true;

            // when we're done with a row, reset the row index to 0
            columnIndex = 0;

          } else {

            // Find the number of columns we're fetching and
            // create placeholders for them.
            if (!columnCountComputed) {
              columnCount++;
            }

            columnIndex++;
          }


          // Now that we have our delimiter out of the way,
          // let's check to see which kind of value we
          // captured (quoted or unquoted).
          var strMatchedValue = null;
          if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
              new RegExp( "\"\"", "g" ),
              "\""
            );

          } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];
          }


          // Now that we have our value string, let's add
          // it to the data array.

          if (columnCountComputed) {

            if (strMatchedValue === '') {
              strMatchedValue = emptyValue;
            }

            if (typeof columnData[columns[columnIndex]] === "undefined") {
              throw new Error("Too many items in row"); 
            }

            columnData[columns[columnIndex]].push(strMatchedValue);  

          } else {

            var createColumnName = function(start) {
              var newName = uniqueId(start);
              while ( columns.indexOf(newName) !== -1 ) {
                newName = uniqueId(start);
              }
              return newName;
            };

            //No column name? Create one starting with X
            if ( _.isUndefined(strMatchedValue) || strMatchedValue === '' ) {
              strMatchedValue = 'X';
            }

            //Duplicate column name? Create a new one starting with the name
            if (columns.indexOf(strMatchedValue) !== -1) {
              strMatchedValue = createColumnName(strMatchedValue);
            }

            // we are building the column names here
            columns.push(strMatchedValue);
            columnData[strMatchedValue] = [];
          }
          }        

        //missing column header at start
        if ( new RegExp('^' + strDelimiter).test(strData) ) {
          matchHandler(['','',undefined,'']);
        }
        while (arrMatches = delimiterPattern.exec(strData)) {
          matchHandler(arrMatches);
        } // end while
        } catch (e) {
          throw new Error("Error while parsing delimited data on row " + rowIndex + ". Message: " + e.message);
        }

      

        // Return the parsed data.
        return {
          columns : columns,
          data : columnData
        };
      };

      return parseCSV(
        this.__delimiterPatterns, 
        data, 
        this.delimiter,
        this.skipRows,
        this.emptyValue);
    }

  });


}(this, _));

(function(global, _) {

  var Miso = global.Miso || (global.Miso = {});
  var Dataset = Miso.Dataset;

  /**
  * A Miso.Derived dataset is a regular dataset that has been derived
  * through some computation from a parent dataset. It behaves just like 
  * a regular dataset except it also maintains a reference to its parent
  * and the method that computed it.
  * Parameters:
  *   options
  *     parent - the parent dataset
  *     method - the method by which this derived dataset was computed
  * Returns
  *   a derived dataset instance
  */

  Dataset.Derived = function(options) {
    options = options || {};

    Dataset.call(this);
    
    // save parent dataset reference
    this.parent = options.parent;

    // the id column in a derived dataset is always _id
    // since there might not be a 1-1 mapping to each row
    // but could be a 1-* mapping at which point a new id 
    // is needed.
    this.idAttribute = "_id";
    
    // save the method we apply to bins.
    this.method = options.method;

    this._addIdColumn();

    this.addColumn({
      name : "_oids",
      type : "mixed"
    });

    if (this.parent.syncable) {
      _.extend(this, Miso.Events);
      this.syncable = true;
      this.parent.subscribe("change", this._sync, { context : this });  
    }
  };

  // take in dataset's prototype.
  Dataset.Derived.prototype = new Dataset();

  // inherit all of dataset's methods.
  _.extend(Dataset.Derived.prototype, {
    _sync : function() {
      // recompute the function on an event.
      // TODO: would be nice to be more clever about this at some point.
      this.func.call(this.args);
      this.publish("change");
    }
  });


  // add derived methods to dataview (and thus dataset & derived)
  _.extend(Dataset.DataView.prototype, {

    /**
    * moving average
    * Parameters:
    *   column - The column on which to calculate the average
    *   size - The window size to utilize for the moving average
    *   options
    *     method - the method to apply to all values in a window. Mean by default.
    * Returns:
    *   a miso.derived dataset instance
    */
    movingAverage : function(columns, size, options) {
      
      options = options || {};

      var d = new Dataset.Derived({
        parent : this,
        method : options.method || _.mean,
        size : size,
        args : arguments
      });

      // copy over all columns
      this.eachColumn(function(columnName) {
        
        // don't try to compute a moving average on the id column.
        if (columnName === this.idAttribute) {
          throw "You can't compute a moving average on the id column";
        }

        d.addColumn({
          name : columnName, type : this.column(columnName).type, data : []
        });
      }, this);

      // save column positions on new dataset.
      Dataset.Builder.cacheColumns(d);

      // apply with the arguments columns, size, method
      var computeMovingAverage = function() {

        // normalize columns arg - if single string, to array it.
        if (typeof columns === "string") {
          columns = [columns];
        }

        // copy the ids
        this.column(this.idAttribute).data = this.parent
          .column(this.parent.idAttribute)
          .data.slice(size-1, this.parent.length);

        // copy the columns we are NOT combining minus the sliced size.
        this.eachColumn(function(columnName, column) {
          if (columns.indexOf(columnName) === -1 && columnName !== "_oids") {
            // copy data
            column.data = this.parent.column(columnName).data.slice(size-1, this.parent.length);
          } else {
            // compute moving average for each column and set that as the data 
            column.data = _.movingAvg(this.parent.column(columnName).data, size, this.method);
          }
        }, this);

        this.length = this.parent.length - size + 1;
        
        // generate oids for the oid col
        var oidcol = this.column("_oids");
        oidcol.data = [];
        for(var i = 0; i < this.length; i++) {
          oidcol.data.push(this.parent.column(this.parent.idAttribute).data.slice(i, i+size));
        }
        
        Dataset.Builder.cacheRows(this);
        
        return this;
      };

      d.func = _.bind(computeMovingAverage, d);
      return d.func.call(d.args);
    },

    /**
    * Group rows by the column passed and return a column with the
    * counts of the instance of each value in the column passed.
    */
    countBy : function(byColumn, options) {

      options = options || {};
      var d = new Dataset.Derived({
        parent : this,
        method : _.sum,
        args : arguments
      });

      var parentByColumn = this.column(byColumn);
      //add columns
      d.addColumn({
        name : byColumn,
        type : parentByColumn.type
      });

      d.addColumn({ name : 'count', type : 'number' });
      d.addColumn({ name : '_oids', type : 'mixed' });
      Dataset.Builder.cacheColumns(d);

      var names = d.column(byColumn).data, 
          values = d.column('count').data, 
          _oids = d.column('_oids').data,
          _ids = d.column(d.idAttribute).data;

      function findIndex(names, datum, type) {
        var i;
        for(i = 0; i < names.length; i++) {
          if (Dataset.types[type].compare(names[i], datum) === 0) {
            return i;
          }
        }
        return -1;
      }

      this.each(function(row) {
        var index = findIndex(names, row[byColumn], parentByColumn.type);
        if ( index === -1 ) {
          names.push( row[byColumn] );
          _ids.push( _.uniqueId() );
          values.push( 1 );
          _oids.push( [row[this.parent.idAttribute]] );
        } else {
          values[index] += 1;
          _oids[index].push( row[this.parent.idAttribute]); 
        }
      }, d);

      Dataset.Builder.cacheRows(d);
      return d;
    },

    /**
    * group rows by values in a given column
    * Parameters:
    *   byColumn - The column by which rows will be grouped (string)
    *   columns - The columns to be included (string array of column names)
    *   options 
    *     method - function to be applied, default is sum
    *     preprocess - specify a normalization function for the
    *                  byColumn values if you need to group by some kind of 
    *                  derivation of those values that are not just equality based.
    * Returns:
    *   a miso.derived dataset instance
    */
    groupBy : function(byColumn, columns, options) {
      
      options = options || {};

      var d = new Dataset.Derived({

        // save a reference to parent dataset
        parent : this,
        
        // default method is addition
        method : options.method || _.sum,

        // save current arguments
        args : arguments
      });

      if (options && options.preprocess) {
        d.preprocess = options.preprocess;  
      }

      // copy columns we want - just types and names. No data.
      var newCols = _.union([byColumn], columns);
      
      _.each(newCols, function(columnName) {

        this.addColumn({
          name : columnName,
          type : this.parent.column(columnName).type
        });
      }, d);

      // save column positions on new dataset.
      Dataset.Builder.cacheColumns(d);

      // will get called with all the arguments passed to this
      // host function
      var computeGroupBy = function() {

        var self = this;

        // clear row cache if it exists
        Dataset.Builder.clearRowCache(this);

        // a cache of values
        var categoryPositions = {},
            categoryCount     = 0,
            originalByColumn = this.parent.column(byColumn);

        // bin all values by their
        for(var i = 0; i < this.parent.length; i++) {
          var category = null;
          
          // compute category. If a pre-processing function was specified
          // (for binning time for example,) run that first.
          if (this.preprocess) {
            category = this.preprocess(originalByColumn.data[i]);
          } else {
            category = originalByColumn.data[i];  
          }
           
          if (_.isUndefined(categoryPositions[category])) {
              
            // this is a new value, we haven't seen yet so cache
            // its position for lookup of row vals
            categoryPositions[category] = categoryCount;

            // add an empty array to all columns at that position to
            // bin the values
            _.each(columns, function(columnToGroup) {
              var column = this.column(columnToGroup);
              var idCol  = this.column(this.idAttribute);
              column.data[categoryCount] = [];
              idCol.data[categoryCount] = _.uniqueId();
            }, this);

            // add the actual bin number to the right col
            this.column(byColumn).data[categoryCount] = category;

            categoryCount++;
          }

          _.each(columns, function(columnToGroup) {
            
            var column = this.column(columnToGroup),
                binPosition = categoryPositions[category];

            column.data[binPosition].push(this.parent.rowByPosition(i));
          }, this);
        }

        // now iterate over all the bins and combine their
        // values using the supplied method. 
        var oidcol = this._columns[this._columnPositionByName._oids];
        oidcol.data = [];

        _.each(columns, function(colName) {
          var column = this.column(colName);

          _.each(column.data, function(bin, binPos) {
            if (_.isArray(bin)) {
              
              // save the original ids that created this group by?
              oidcol.data[binPos] = oidcol.data[binPos] || [];
              oidcol.data[binPos].push(_.map(bin, function(row) { return row[self.parent.idAttribute]; }));
              oidcol.data[binPos] = _.flatten(oidcol.data[binPos]);

              // compute the final value.
              column.data[binPos] = this.method(_.map(bin, function(row) { return row[colName]; }));
              this.length++;
            }
          }, this);

        }, this);

        Dataset.Builder.cacheRows(this);
        return this;
      };
      
      // bind the recomputation function to the dataset as the context.
      d.func = _.bind(computeGroupBy, d);

      return d.func.call(d.args);
    }
  });

}(this, _));

