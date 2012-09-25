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
