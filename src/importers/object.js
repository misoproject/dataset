(function(global, _) {
  var DS = (global.DS || (global.DS = {}));
  // -------- Object Parser -----------
  /**
  * Converts an array of objects to strict format.
  * Each object is a flat json object of properties.
  * @params {Object} obj = [{},{}...]
  */
  DS.Parsers.Obj = function(data, options) {
    this.options = options || {};
    this._data = data;
  };

  _.extend(DS.Parsers.Obj.prototype, DS.Parsers.prototype, {

    _buildColumns : function(d, n) {
      d._columns = [];

      // create column container objects
      var columnNames  = _.keys(this._data[0]);
      _.each(columnNames, function(columnName) {
        d._columns.push(this._buildColumn(columnName, null));
      }, this);

      // add id column
      this._addIdColumn(d);

      // cache them so we have a lookup
      this._cacheColumns(d);

      // Build rows
      _.map(this._data, function(row) {

        // iterate over properties in each row and add them
        // to the appropriate column data.
        _.each(row, function(value, key) {
          this._addValue(d, key, value);
        }, this);

        // add a row id
        this._addValue(d, "_id", _.uniqueId());
      }, this);

      return d;
    },

    build : function(options) {
      var d = {};

      this._buildColumns(d);
      // column caching happens inside of build columns this time
      // so that rows know which column their values belong to
      // before we build the data.
      this._setTypes(d, this.options);
      this._detectTypes(d);
      this._coerceTypes(d);
      this._cacheRows(d);
      return d;
    }
  });

}(this, _));
