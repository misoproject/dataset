(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
   * The Base Miso.Parser class. To specify a custom parser, during dataset
   * instantiation set the `parser` property to the class name of the parser
   * you want. Some parsers require some custom properties. This section will
   * document the properties you can set that will either cause this parser to
   * be selected or will be required by it to continue.
   *
   * Built in Parsers include:
   *
   * - {@link Miso.Dataset.Parsers.Strict}
   * - {@link Miso.Dataset.Parsers.Object}
   * - {@link Miso.Dataset.Parsers.Delimited}
   * - {@link Miso.Dataset.Parsers.GoogleSpreadsheet}
   *
   * The base `Miso.Parser` structure is:
   *
   * @constructor
   * @virtual
   * @name Parsers
   * @memberof Miso.Dataset
   *
   * @externalExample parsers
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
