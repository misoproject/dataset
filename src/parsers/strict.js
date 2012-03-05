(function(global, _) {
  var Miso = (global.Miso || (global.Miso = {}));
  // ------ Strict Parser ---------
  /**
  * Handles basic strict data format.
  * TODO: add verify flag to disable auto id assignment for example.
  */
  Miso.Parsers.Strict = function( options ) {
    this.options = options || {};
  }; 

  _.extend( Miso.Parsers.Strict.prototype, Miso.Parsers.prototype, {

    parse : function( data ) {
      var columnData = {}, columnNames = [];

      _.each(data.columns, function(column) {
        columnNames.push( column.name );
        columnData[ column.name ] = column.data;
      });

      return {
        columns : columnNames,
        data : columnData 
      };
    }

  });

}(this, _));
