(function(global, _) {
  var DS = (global.DS || (global.DS = {}));

  /**
  * Local data importer is responsible for just using
  * a data object and passing it appropriately.
  */
  DS.Importers.Local = function(options) {
    options || (options = {});

    this.extract = options.extract || this.extract;

    //Because this is the local parser we already have
    //the data by this point
    this.data = options.data;
  };

  _.extend(DS.Importers.Local.prototype, DS.Importers.prototype, {
    fetch : function(options) {
      var parsedData = options.parser.build( this.extract(this.data) );
      options.success(parsedData);
    }
  });

}(this, _));
