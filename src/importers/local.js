(function(global, _) {
  var Miso = (global.Miso || (global.Miso = {}));

  /**
  * Local data importer is responsible for just using
  * a data object and passing it appropriately.
  */
  Miso.Importers.Local = function(options) {
    options = options || {};

    this.data = options.data || null;
    this.extract = options.extract || this.extract;
  };

  _.extend(Miso.Importers.Local.prototype, Miso.Importers.prototype, {
    fetch : function(options) {
      var data = options.data ? options.data : this.data;
      options.success( this.extract(data) );
    }
  });

}(this, _));
