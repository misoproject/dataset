/**
Library Deets go here
USE OUR CODES

Version 0.0.1.2
*/

(function(global, _, moment) {

  var Miso = global.Miso;

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
  *   columns: {
  *     name : typeName || { type : name, ...additionalProperties }
  *   }
  *   sorted : true (optional) - If the dataset is already sorted, pass true
  *     so that we don't trigger a sort otherwise.
  *   comparator : function (optional) - takes two rows and returns 1, 0, or -1  if row1 is
  *     before, equal or after row2. 
  *   deferred : by default we use underscore.deferred, but if you want to pass your own (like jquery's) just
  *              pass it here.
  }
  */

  Miso.Dataset = function(options) {
    options = options || (options = {});
    this.length = 0;
    this._initialize(options);
    return this;
  };

  _.extend(Miso.Dataset.prototype, Miso.View.prototype, {

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

      if (options.delimiter) {
        options.dataType = "text";
      }

      // initialize the proper importer
      if (this.importer === null) {
        if (options.url) {
          this.importer = Miso.Importers.Remote;
        } else {
          this.importer = Miso.Importers.Local;
        }
      }

      // initialize importer and parser
      this.parser = new this.parser(options);
      this.importer = new this.importer(options);

      // save comparator if we have one
      if (options.comparator) {
        this.comparator = options.comparator;  
      }

      // if we have a ready callback, save it too
      if (options.ready) {
        this.ready = options.ready;
      }

      this._columns = [];
      this._columnPositionByName = {};

      // if there is no data and no url set, we must be building
      // the dataset from scratch, so create an id column.
      if (_.isUndefined(options.data) && _.isUndefined(options.url)) {
        this._addIdColumn();  
      }

      // if for any reason, you want to use a different deferred
      // implementation, pass it as an option
      if (options.deferred) {
        this.deferred = options.deferred;
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
      
      var dfd = this.deferred || new _.Deferred();

      if ( _.isNull(this.importer) ) {
        throw "No importer defined";
      }

      this.importer.fetch({
        success: _.bind(function( data ) {

          this.apply( data );

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

          dfd.resolve(this);

        }, this),

        error : _.bind(function(e) {
          if (options.error) {
            options.error.call(this);
          }

          dfd.reject(e);
        }, this)
      });

      return dfd.promise();
    },

    //These are the methods that will be used to determine
    //how to update a dataset's data when fetch() is called
    applications : {

      //Update existing values, used the pass column to match 
      //incoming data to existing rows.
      againstColumn : function() {

      },

      //Always blindly add new rows
      blind : function( data ) {
        _.each(data, function( columnData , columnName ) {
          var col = this._column( columnName );
          col.data = col.data.concat( _.map(columnData, function(datum) {
            return Miso.types[col.type].coerce(datum, col);
          }, this) );
        }, this);
      }
    },

    //Takes a dataset and some data and applies one to the other
    apply : function( data ) {
      var parsed = this.parser.parse( data );

      if ( !this.fetched ) {

        this._addIdColumn( parsed.data[ parsed.columns[0] ].length );
        this.addColumns( _.map(parsed.columns, function( name ) {
            return { name : name };
          })
        );
        
        Miso.Builder.detectColumnTypes(this, parsed.data);
        this.applications.blind.call( this, parsed.data );
        Miso.Builder.cacheRows(this);
      } else {
        //TODO append functionality here
        return true;//so I can keep this block and lint ewwww
      }
    },

    addColumns : function( columns ) {
      _.each(columns, function( column ) {
        this.addColumn( column );
      }, this);
    },

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
    * @param count {number} the number of ids to generate.
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
    * Add a row to the dataset
    * TODO: multiple rows?
    * @param {object} row - an object representing a row in the form of:
    * {columnName: value}
    * @param {object} options - options
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    add : function(row, options) {
      if (!row._id) {
        row._id = _.uniqueId();
      }

      this._add(row, options);

      if (this.syncable && (!options || !options.silent)) {
        this.trigger('add', this._buildEvent({ changed : row }) );
        this.trigger('change', this._buildEvent({ changed : row }) );
      }
    },

    /**
    * Remove all rows that match the filter
    * TODO: single row by id?
    * @param {function} filter - function applied to each row
    * @param {object} options - options. Optional.
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    remove : function(filter, options) {
      filter = this._rowFilter(filter);
      var deltas = [];

      this.each(function(row, rowIndex) {
        if (filter(row)) {
          this._remove(row._id);
          deltas.push( { old: row } );
        }
      });
      if (this.syncable && (!options || !options.silent)) {
        var ev = this._buildEvent( deltas );
        this.trigger('remove', ev );
        this.trigger('change', ev );
      }
    },

    /**
    * Update all rows that match the filter
    * TODO: dynamic values
    * @param {function} filter - filter rows to be updated
    * @param {object} newProperties - values to be updated.
    * @param {object} options - options. Optional.
    */    
    update : function(filter, newProperties, options) {
      filter = this._rowFilter(filter);

      var newKeys = _.keys(newProperties),
          deltas = [];

      this.each(function(row, rowIndex) {
        if (filter(row)) {
          _.each(this._columns, function(c) {
            if (_.indexOf(newKeys, c.name) !== -1) {

              // test if the value passes the type test
              var Type = Miso.types[c.type];
              
              if (Type) {
                if (Miso.typeOf(newProperties[c.name], c) === c.type) {
                  newProperties[c.name] = Type.coerce(newProperties[c.name], c);
                } else {
                  throw("incorrect value '" + newProperties[c.name] + 
                        "' of type " + Miso.typeOf(newProperties[c.name], c) +
                        " passed to column with type " + c.type);  
                }
              }
              c.data[rowIndex] = newProperties[c.name];
            }
          }, this);

          deltas.push( { _id : row._id, old : row, changed : newProperties } );
        }
      }, this);

      if (this.syncable && (!options || !options.silent)) {
        var ev = this._buildEvent( deltas );
        this.trigger('update', ev );
        this.trigger('change', ev );
      }

    }

  });
}(this, _, moment));

