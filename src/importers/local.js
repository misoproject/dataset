(function(global, _) {
  var DS = (global.DS || (global.DS = {}));

  /**
  * Local data importer is responsible for just using
  * a data object and passing it appropriately.
  */
  DS.Importers.Local = function(options) {
    this.options = options || (options = {});

    if (this.options.extract) {
      this.extract = this.options.extract;
    }
    this.data = options.data;
    this.parser = this.options.parser || DS.Importer.Obj;
  };

  _.extend(DS.Importers.Local.prototype, DS.Importers.prototype, {
    fetch : function(options) {
      // since this is the local importer, it just
      // passes the data through, parsed.
      this.data = this.extract(this.data);

      // create a new parser and pass the parsed data in
      this.parser = new this.parser(this.data, _.extend({},
        this.options,
        options));

        var parsedData = this.parser.build();
        options.success(parsedData);
    }
  });

}(this, _));
