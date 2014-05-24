(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
   * Base Miso.Parser class.
   * @constructor
   * @virtual
   * @name Parsers
   * @memberof Miso.Dataset
   */
  Dataset.Parsers = function( options ) {
    this.options = options || {};
  };

  _.extend(Dataset.Parsers.prototype,
    /** @lends Miso.Dataset.Parsers */
    {

    /**
     * The main function for the parser, it must return an object with the
     * columns names and the data in columns
     *
     * @virtual
     * @memberof Miso.Dataset.Parsers.prototype
     */
    parse : function() {}

  });
}(this, _));
