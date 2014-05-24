(function(global) {

  /**
   * @namespace Miso
   */
  global.Miso = global.Miso || {};

  /**
   * Miso.Dataset is the main object you will instantiate to create a new
   * dataset. A `Miso.Dataset` also extends from {@link Miso.Dataset.DataView}.
   * All the methods available on a {@link Miso.Dataset.DataView} will also be
   * available on the dataset.
   *
   * See [the creating datasets
   * guide](http://misoproject.com/dataset/tutorials/creating) for detailed
   * information.
   *
   * @constructor
   * @memberof Miso
   * @name Dataset
   * @augments Miso.Dataset.DataView
   *
   * @param {Object} [options] - optional parameters.
   * @param {Object} options.data - an actual javascript object that already
   *                                   contains the data
   * @param {String|Function} options.url - The url of a remote file or a
   *                                        function returning a string for a
   *                                        url containing your data, used for
   *                                        remote importers
   * @param {Boolean} options.sync - Set to true to be able to bind to dataset
   *                                 changes. False by default. See [the
   *                                 Syncronization & Events
   *                                 guide](http://misoproject.com/dataset/dataset/tutorials/events)
   *                                 for detailed information
   * @param {String} options.callback - By default, If making a jsonp request,
   *                                    you can use this parameter to specify
   *                                    an alternate callback function name
   *                                    than the one that would be auto
   *                                    generated for you.
   * @param {Boolean} options.jsonp - Whether a remote request should use jsonp
   *                                  to enable cross-domain requests.
   * @param {String} options.delimiter - When using {@link
   *                                     Miso.Dataset.Parsers.Delimited|the
   *                                     Delimeted parser} this is used to set
   *                                     a custom field delimiter such as
   *                                     `delimiter: '||'` for CSV files such
   *                                     as `value1||value2`
   * @param {Boolean} options.strict - Whether to expect the json in our format
   *                                   or whether to interpret as raw array of
   *                                   objects; shorthand for using {@link
   *                                   Miso.Dataset.Parsers.Strict|the Strict
   *                                   parser}; default `false`
   * @param {Function} options.extract - function used to pre-process raw data,
   *                                     see [the creating a dataset
   *                                     guide](http://misoproject.com/dataset/dataset/tutorials/creating)
   *                                     for more information.
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
   * @param {Function} options.comparator - A function to sort the data by. It
   *                                        will be sorted on fetch and on any
   *                                        successive addition. See {@link
   *                                        Miso.Dataset.DataView#sort|the sort
   *                                        function} for more information.
   * @param {Function} options.deferred - by default we use
   *                                      underscore.deferred, but if you want
   *                                      to pass your own (like jquery's) just
   *                                      pass it here.
   * @param {String} options.importer - The classname of any importer (passes
   *                                    through auto detection based on
   *                                    parameters). For example:
   *                                    `Miso.Importers.Polling`. See [the
   *                                    Creating a dataset
   *                                    guide](http://misoproject.com/dataset/dataset/tutorials/creating)
   *                                    for more information.
   * @param {String} options.parser - The classname of any parser (passes
   *                                  through auto detection based on
   *                                  parameters). For example:
   *                                  `Miso.Parsers.Delimited`. See [the
   *                                  Creating a dataset
   *                                  guide](http://misoproject.com/dataset/dataset/tutorials/creating)
   *                                  for more information.
   * @param {Boolean} options.resetOnFetch - set to true if any subsequent
   *                                         fetches after first one should
   *                                         overwrite the current data.
   * @param {String} options.uniqueAgainst - Set to a column name to check for
   *                                         duplication on subsequent fetches.
   * @param {Number} options.interval - Polling interval. Set to any value in
   *                                    milliseconds to enable polling on a
   *                                    url.
   * @param {String} options.idAttribute - By default all ids are stored in a
   *                                       column called '_id'. If there is an
   *                                       alternate column in the dataset that
   *                                       already includes a unique
   *                                       identifier, specify its name here.
   *                                       Note that the row objects will no
   *                                       longer have an _id property.
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
