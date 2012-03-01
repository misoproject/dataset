(function(global, _) {
  var DS = (global.DS || (global.DS = {}));

  /**
  * Local data importer is responsible for just using
  * a data object and passing it appropriately.
  */
  DS.Importers.Local = function(options) {
    options || (options = {});

    this.dataset = options.dataset;
    this.parser = options.dataset.parser;
    this.data = options.data || null;

    this.extract = options.extract || this.extract;
  };

  _.extend(DS.Importers.Local.prototype, DS.Importers.prototype, {
    fetch : function(options) {
      var data = options.data ? options.data : this.data;
      options.success( this.extract(data) );
    }
  });

}(this, _));
