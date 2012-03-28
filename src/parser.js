(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));

  /**
  * Base Miso.Parser class.
  */
  Miso.Parsers = function( options ) {
    this.options = options || {};
  };

  _.extend(Miso.Parsers.prototype, {

    //this is the main function for the parser,
    //it must return an object with the columns names
    //and the data in columns
    parse : function() {}

  });
}(this, _));
