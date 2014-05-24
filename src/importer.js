(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
   * To specify a custom importer during dataset instantiation, just set the
   * `importer` property to the class name of the importer you want. Some
   * importers require custom properties. This section will document the
   * properties you can set that will either cause this importer to be selected
   * or will be required by it to continue.
   *
   * Built in Importers include:
   *
   * - {@link Miso.Dataset.Importers.Local}
   * - {@link Miso.Dataset.Importers.Remote}
   * - {@link Miso.Dataset.Importers.Polling}
   * - {@link Miso.Dataset.Importers.GoogleSpreadsheet}
   *
   * An importer must implement the following interface:
   *
   * @constructor
   * @virtual
   * @name Importers
   * @memberof Miso.Dataset
   */
  Dataset.Importers = function(data, options) {};

  /**
   * Simple base extract method, passing data through.  If your importer needs
   * to extract the data from the returned payload before converting it to a
   * {@link Miso.Dataset}, overwrite this method to return the actual data
   * object.
   *
   * @memberof Miso.Dataset.Importers.prototype
   * @name extract
   */
  Dataset.Importers.prototype.extract = function(data) {
    data = _.clone(data);
    return data;
  };
}(this, _));
