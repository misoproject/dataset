(function(global) {

  /**
   * @namespace Miso
   */
  global.Miso = global.Miso || {};

  /**
   * Instantiates a new dataset.
   * @constructor
   * @memberof Miso
   * @name Dataset
   * @augments Miso.Dataset.DataView
   *
   * @param {Object} [options] - optional parameters.
   * @param {Object} options.data - an actual javascript object that already
   *                                   contains the data
   * @param {String} options.url - url to fetch data from
   * @param {Boolean} options.sync - Set to true to be able to bind to dataset
   *                                 changes. False by default.
   * @param {Boolean} options.jsonp - true if this is a jsonp request
   * @param {String} options.delimiter - a delimiter string that is used in a
   *                                     tabular datafile
   * @param {Boolean} options.strict - Whether to expect the json in our format
   *                                   or whether to interpret as raw array of
   *                                   objects, default false
   * @param {Function} options.extract - function to apply to JSON before
   *                                     internal interpretation
   * @param {Function} options.ready - the callback function to act on once the
   *                                   data is fetched. Isn't reuired for local
   *                                   imports but is required for remote url
   *                                   fetching.
   * @param {Array} options.columns - A way to manually override column type
   *                                  detection. Expects an array of objects of
   *                                  the following structure: `{ name :
   *                                  'columnname', type: 'columntype', ...
   *                                  (additional params required for type
   *                                  here.) }`
   * @param {Function} options.comparator - takes two rows and returns 1, 0, or
   *                                        -1 if row1 is before, equal or
   *                                        after row2.
   * @param {Function} options.deferred - by default we use
   *                                      underscore.deferred, but if you want
   *                                      to pass your own (like jquery's) just
   *                                      pass it here.
   * @param {String} options.importer - The classname of any importer (passes
   *                                     through auto detection based on
   *                                     parameters. For example:
   *                                     `Miso.Importers.Polling`.
   * @param {String} options.parser - The classname of any parser (passes
   *                                  through auto detection based on
   *                                  parameters. For example:
   *                                  `Miso.Parsers.Delimited`.
   * @param {Boolean} options.resetOnFetch - set to true if any subsequent
   *                                         fetches after first one should
   *                                         overwrite the current data.
   * @param {String} options.uniqueAgainst - Set to a column name to check for
   *                                         duplication on subsequent fetches.
   * @param {Number} options.interval - Polling interval. Set to any value in
   *                                    milliseconds to enable polling on a
   *                                    url.
   */
  global.Miso.Dataset = function(options) {
    
    options = options || {};

    this.length = 0;
    
    this._columns = [];
    this._columnPositionByName = {};
    this._computedColumns = [];
    
    this._initialize(options);
  };
}(this));
