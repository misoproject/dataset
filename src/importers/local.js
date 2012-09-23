(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
  * Local data importer is responsible for just using
  * a data object and passing it appropriately.
  */
  Dataset.Importers.Local = function(options) {
    options = options || {};

    this.data = options.data || null;
    this.extract = options.extract || this.extract;
  };

  _.extend(Dataset.Importers.Local.prototype, Dataset.Importers.prototype, {
    fetch : function(options) {
      var data = options.data ? options.data : this.data;
      options.success( this.extract(data) );
    }
  });

}(this, _));
