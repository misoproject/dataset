(function(global, _) {
  var DS = (global.DS || (global.DS = {}));
  // ------ Strict Parser ---------
  /**
  * Handles basic strict data format.
  * TODO: add verify flag to disable auto id assignment for example.
  */
  DS.Parsers.Strict = function( options ) {
    this.options = options || {};
  }; 

  _.extend( DS.Parsers.Strict.prototype, DS.Parsers.prototype, {

    parse : function( data ) {
      var columnData = {}, columnNames = [];

      _.each(data.columns, function(column) {
        columnNames.push( column.name );
        columnData[ column.name ] = column.data;
      });

      return {
        columns : columnNames,
        data : columnData 
      }
    }

  });

}(this, _));
