(function(global, _) {
  var DS = (global.DS || (global.DS = {}));

  DS.Importers = function(data, options) {};

  /**
  * Simple base extract method, passing data through
  * If your importer needs to extract the data from the
  * returned payload before converting it to
  * a dataset, overwrite this method to return the
  * actual data object.
  */
  DS.Importers.prototype.extract = function(data) {
    data = _.clone(data);
    return data;
  };

}(this, _));
