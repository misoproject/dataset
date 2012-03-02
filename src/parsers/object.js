(function(global, _) {
  var DS = (global.DS || (global.DS = {}));
  // -------- Object Parser -----------
  /**
  * Converts an array of objects to strict format.
  * Each object is a flat json object of properties.
  * @params {Object} obj = [{},{}...]
  */
  DS.Parsers.Obj = DS.Parsers;

  _.extend(DS.Parsers.Obj.prototype, DS.Parsers.prototype, {

    parse : function( data ) {
      return this._extract( data );
    },
    
    _extract : function( data ) {
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
      }
    },

    // build : function(data, options) {
      // this._data = data;
      // var d = {};

      // this._buildColumns(d);
      // // column caching happens inside of build columns this time
      // // so that rows know which column their values belong to
      // // before we build the data.
      // this._setTypes(d, this.options);
      // this._detectTypes(d);
      // this._coerceTypes(d);
      // this._cacheRows(d);
      // return d;
    // }
  });

}(this, _));
