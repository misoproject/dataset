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

      this._add(row);
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
    */    
    remove : function(filter, options) {
      this.each(function(row, rowIndex) {
        if (filter(row)) {
          this._remove(row._id);
        }
      });
    },

    /**
    * Update all rows that match the filter
    * TODO: dynamic values
    * @param {function} filter - filter rows to be updated
    * @param {object} newProperties - values to be updated.
    * @param {object} options - options. Optional.
    */    
    update : function(filter, newProperties, options) {}

  });
}(this, _));

