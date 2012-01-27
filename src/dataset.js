/**
Library Deets go here
USE OUR CODES

Version 0.0.1.2
*/

(function(global, _, moment) {

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
  *   },
  *   google_spreadsheet: {
  *     key : "", worksheet(optional) : ""     
  *   },
  *   sorted : true (optional) - If the dataset is already sorted, pass true
  *     so that we don't trigger a sort otherwise.
  *   comparator : function (optional) - takes two rows and returns 1, 0, or -1  if row1 is
  *     before, equal or after row2. 
  }
  */

  DS.types = {
    string : {
      coerce : function(v) {
        return v.toString();
      },
      test : function(v) {
        return DS.typeOf(v) === 'string';
      }
    },

    boolean : {
      coerce : function(v) {
        return !!(v);
      },
      test : function(v) {
        return DS.typeOf(v) === 'boolean';
      }
    },

    number : {  
      coerce : function(v) {
        v = Number(v);
        return _.isNaN(v) ? null : v;
      },
      test : function(v) {
        return DS.typeOf(v) === 'number';
      }
    },

    time : { 
      coerce : function(v) {
        return moment(v);
      },
      test : function(v) {
        return DS.typeOf(v) === 'number';
      }
    }

  };

  DS.Dataset = function(options) {
    options = options || (options = {});
    this._initialize(options);
    return this;
  };

  _.extend(DS.Dataset.prototype, DS.View.prototype, {

    /**
    * @private
    * Internal initialization method. Reponsible for data parsing.
    * @param {object} options - Optional options  
    */
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
        } else if (options.google_spreadsheet) {
          parser = DS.Parsers.GoogleSpreadsheet;
        }
      }

      // set up some base options for importer.
      var importerOptions = _.extend({}, 
        options,
      { parser : parser });

      if (options.delimiter) {
        importerOptions.dataType = "text";
      }

      if (options.google_spreadsheet) {
        _.extend(importerOptions, options.google_spreadsheet);
      }

      // initialize the proper importer
      if (importer === null) {
        if (options.url) {
          importer = DS.Importers.Remote;
        } else if (options.google_spreadsheet) {
          importer = DS.Importers.GoogleSpreadsheet;
          delete options.google_spreadsheet;
        } else {
          importer = DS.Importers.Local;
        }
      }

      // initialize actual new importer.
      importer = new importer(importerOptions);

      // save comparator if we have one
      if (options.comparator) {
        this.comparator = options.comparator;  
      }

      if (importer !== null) {
        importer.fetch({
          success: _.bind(function(d) {
            _.extend(this, d);

            // if a comparator was defined, sort the data
            if (this.comparator) {
              this.sort();
            }

            // call ready method
            if (options.ready) {
              options.ready.call(this);
            }
          }, this)
          });
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
      if (!options || !options.silent) {
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
      if (!options || !options.silent) {
        var ev = this._buildEvent( deltas );
        this.trigger('change', ev );
        this.trigger('remove', ev );
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
              if ((c.type !== 'untyped') && (c.type !== DS.typeOf(newProperties[c.name]))) {
                throw("incorrect value '"+newProperties[c.name]+"' of type "+DS.typeOf(newProperties[c.name])+" passed to column with type "+c.type);
              }
              c.data[rowIndex] = newProperties[c.name];
            }
          }, this);

          deltas.push( { _id : row._id, old : row, changed : newProperties } );
        }
      }, this);

      if (!options || !options.silent) {
        var ev = this._buildEvent( deltas );
        this.trigger('change', ev );
        this.trigger('remove', ev );
      }

    }

  });
}(this, _, moment));

