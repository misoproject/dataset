(function(global, _) {
  var Miso = (global.Miso || (global.Miso = {}));

  /**
  * Strict format parser.
  * Handles basic strict data format.
  * Looks like: {
  *   data : {
  *     columns : [
  *       { name : colName, type : colType, data : [...] }
  *     ]
  *   }
  * }
  */
  Miso.Parsers.Strict = function( options ) {
    this.options = options || {};
  }; 

  _.extend( Miso.Parsers.Strict.prototype, Miso.Parsers.prototype, {

    parse : function( data ) {
      var columnData = {}, columnNames = [];

      _.each(data.columns, function(column) {
        if (columnNames.indexOf(column.name) !== -1) {
          throw new Error("You have more than one column named \"" + column.name + "\"");
        } else {
          columnNames.push( column.name );
          columnData[ column.name ] = column.data;  
        }
      });

      return {
        columns : columnNames,
        data : columnData 
      };
    }

  });

}(this, _));
