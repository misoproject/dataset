/**
Library Deets go here
USE OUR CODES

Version 0.0.1.2
*/

(function(global, _, moment) {

  var Miso = global.Miso;

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
  Miso.Dataset = function(options) {
    this.length = 0;
    
    this._columns = [];
    this._columnPositionByName = {};
    this._computedColumns = [];
    
    if (typeof options !== "undefined") {
      options = options || {};
      this._initialize(options);
    }
  };

  // take on miso dataview's prototype
  Miso.Dataset.prototype = new Miso.DataView();

  // add dataset methods to dataview.
  _.extend(Miso.Dataset.prototype, {

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

      // initialize importer from options or just create a blank
      // one for now, we'll detect it later.
      this.importer = options.importer || null;

      // default parser is object parser, unless otherwise specified.
      this.parser  = options.parser || Miso.Parsers.Obj;

      // figure out out if we need another parser.
      if (_.isUndefined(options.parser)) {
        if (options.strict) {
          this.parser = Miso.Parsers.Strict;
        } else if (options.delimiter) {
          this.parser = Miso.Parsers.Delimited;
        } 
      }

      // initialize the proper importer
      if (this.importer === null) {
        if (options.url) {

          if (!options.interval) {
            this.importer = Miso.Importers.Remote;  
          } else {
            this.importer = Miso.Importers.Polling;
            this.interval = options.interval;
          }
          
        } else {
          this.importer = Miso.Importers.Local;
        }
      }

      // initialize importer and parser
      this.parser = new this.parser(options);

      if (this.parser instanceof Miso.Parsers.Delimited) {
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
          var rowIndex = uniqCol.data.indexOf( Miso.types[uniqCol.type].coerce(key) );

          var row = {};
          _.each(data, function(col, name) {
            row[name] = col[dataIndex];
          });

          if (rowIndex === -1) {
            toAdd.push( row );
          } else {
            toUpdate.push( row );
            var oldRow = this.rowById(this.column('_id').data[rowIndex])._id;
            this.update(oldRow, row);
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
        Miso.Builder.detectColumnTypes(this, parsed.data);
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

      Miso.Builder.cacheRows(this);
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
        if (typeof Miso.types[type] === "undefined") {
          throw "The type " + type + " doesn't exist";
        }

        var column = new Miso.Column({
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

      column = new Miso.Column( column );

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

      if (!_.isUndefined(this.column("_id"))) {
        return;
      }

      var ids = [];
      if (count && count > 0) {
        _.times(count, function() {
          ids.push(_.uniqueId());
        });
      }

      // add the id column
      this.addColumn({ name: "_id", type : "number", data : ids });

      // did we accidentally add it to the wrong place? (it should always be first.)
      if (this._columnPositionByName._id !== 0) {

        // we need to move it to the beginning and unshift all the other
        // columns
        var idCol = this._columns[this._columnPositionByName._id],
            oldIdColPos = this._columnPositionByName._id;

        // move col back 
        this._columns.splice(oldIdColPos, 1);
        this._columns.unshift(idCol);
        
        this._columnPositionByName._id = 0;
        _.each(this._columnPositionByName, function(pos, colName) {
          if (colName !== "_id" && this._columnPositionByName[colName] < oldIdColPos) {
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
        if (!row._id) {
          row._id = _.uniqueId();
        }

        this._add(row, options);

        // store all deltas for a single fire event.
        if (this.syncable && !options.silent) {
          deltas.push({ changed : row });
        }
      
      }, this);
      
      if (this.syncable && !options.silent) {
        var e = this._buildEvent(deltas);
        this.trigger('add', e );
        this.trigger('change', e );
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
          rowsToRemove.push(row._id);
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
        var ev = this._buildEvent( deltas );
        this.trigger('remove', ev );
        this.trigger('change', ev );
      }
    },

    /**
    * Update all rows that match the filter. Fires update and change.
    * Parameters:
    *   filter - row id OR filter rows to be updated
    *   newProperties - values to be updated.
    *   options - options. Optional
    *     silent - set to true to prevent event triggering..
    */    
    update : function(filter, newProperties, options) {

      var newKeys, deltas = [];

      var updateRow = _.bind(function(row, rowIndex) {
        var c, props;

        if (_.isFunction(newProperties)) {
          props = newProperties.apply(this, [row]);
        } else {
          props = newProperties;
        }

        newKeys = _.keys(props);

        _.each(newKeys, function(columnName) {

          c = this.column(columnName);

          // check if we're trying to update a computed column. If so
          // fail.
          if (c.isComputed()) {
            throw "You're trying to update a computed column. Those get computed!";
          }

          // test if the value passes the type test
          var Type = Miso.types[c.type];
          
          if (Type) {
            if (Type.test(props[c.name], c)) {

              // do we have a before filter on the column? If so, apply it
              if (!_.isUndefined(c.before)) {
                props[c.name] = c.before(props[c.name]);
              }

              // coerce it.
              props[c.name] = Type.coerce(props[c.name], c);
            } else {
              throw("incorrect value '" + props[c.name] + 
                    "' of type " + Miso.typeOf(props[c.name], c) +
                    " passed to column '" + c.name + "' with type " + c.type);  
            }
          }
          c.data[rowIndex] = props[c.name];
        }, this);
        
        // do we have any computed columns? if so we need to update
        // the row.
        if (typeof this._computedColumns !== "undefined") {
          _.each(this._computedColumns, function(column) {

            // compute the complete row:
            var newrow = _.extend({}, row, props);
            
            var oldValue = newrow[column.name];
            var newValue = column.compute(newrow, rowIndex);
            // if this is actually a new value, then add it to the delta.
            if (oldValue !== newValue) {
              props[column.name] = newValue;
            }
          });
        }

        deltas.push( { _id : row._id, old : row, changed : props } );
      }, this);

      // do we just have a single id? array it up.
      if (_.isString(filter)) {
        filter = [filter];
      }
      // do we have an array of ids instead of filter functions?
      if (_.isArray(filter)) {
        var row, rowIndex;
        _.each(filter, function(rowId) {
          row = this.rowById(rowId);
          rowIndex = this._rowPositionById[rowId];
          
          updateRow(row, rowIndex);
        });

      } else {

        // make a filter function.
        filter = this._rowFilter(filter);

        this.each(function(row, rowIndex) {
          if (filter(row)) {
            updateRow(row, rowIndex);
          }
        }, this);
      }

      if (this.syncable && (!options || !options.silent)) {
        var ev = this._buildEvent( deltas );
        this.trigger('update', ev );
        this.trigger('change', ev );
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
        this.trigger("reset");
      }
    }

  });
}(this, _, moment));

