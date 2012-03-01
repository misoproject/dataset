(function(global, _) {
  var DS = (global.DS || (global.DS = {}));
  // ------ Strict Parser ---------
  /**
  * Handles basic strict data format.
  * TODO: add verify flag to disable auto id assignment for example.
  */
  DS.Parsers.Strict = function(data, options) {
    this.options = options || {};
    this._data = this.parse(data);
  };

  _.extend( DS.Parsers.Strict.prototype, DS.Parsers.prototype, {

    _buildColumns : function(d) {
      d._columns = [];

      _.each(this._data._columns, function(columnOpts) {
        d._columns.push(this._buildColumn(columnOpts));
      }, this);

      // add row _id column. Generate auto ids if there
      // isn't already a unique id column.
      if (_.pluck(d._columns, "name").indexOf("_id") === -1) {
        this._addIdColumn(d, d._columns[0].data.length);
      }

      return d;
    }

  });

}(this, _));
