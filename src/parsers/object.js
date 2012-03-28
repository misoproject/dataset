(function(global, _) {
  var Miso = (global.Miso || (global.Miso = {}));

  /**
  * Object parser
  * Converts an array of objects to strict format.
  * Each object is a flat json object of properties.
  */
  Miso.Parsers.Obj = Miso.Parsers;

  _.extend(Miso.Parsers.Obj.prototype, Miso.Parsers.prototype, {

    parse : function( data ) {
      var columns = _.keys(data[0]),
          columnData = {};

      //create the empty arrays
      _.each(columns, function( key ) {
        columnData[ key ] = [];
      });

      // iterate over properties in each row and add them
      // to the appropriate column data.
      _.each(columns, function( col ) {
        _.times(data.length, function( i ) {
          columnData[ col ].push( data[i][col] );
        });
      });
     
      return {
        columns : columns,
        data : columnData 
      };
    }

  });

}(this, _));
