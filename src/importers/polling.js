(function(global,_){
  
  var Miso = (global.Miso || (global.Miso = {}));

  Miso.Importers.Polling = function(options) {
    options = options || {};
    this.interval = options.interval || 1000;
    this._def = null;

    Miso.Importers.Remote.apply(this, [options]);
  };

  _.extend(Miso.Importers.Polling.prototype, Miso.Importers.Remote.prototype, {
    fetch : function(options) {

      if (this._def === null) {

        this._def = _.Deferred();

        // wrap success with deferred resolution
        this.success_callback = _.bind(function(data) {
          options.success(this.extract(data));
          this._def.resolve(this);
        }, this);

        // wrap error with defered rejection
        this.error_callback = _.bind(function(error) {
          options.error(error);
          this._def.reject(error);
        }, this);
      } 

      // on success, setTimeout another call
      _.when(this._def.promise()).then(function(importer) {
        
        var callback = _.bind(function() {
          this.fetch({
            success : this.success_callback,
            error   : this.error_callback
          });
        }, importer);

        setTimeout(callback, importer.interval);
        // reset deferred
        importer._def = _.Deferred();
      });

      Miso.Xhr(_.extend(this.params, {
        success : this.success_callback,
        error : this.error_callback
      }));

      window.imp = this;
    },

    stop : function() {
      if (this._def !== null) {
        this._def.reject();
      }
    },

    start : function() {
      if (this._def !== null) {
        this._def = _.Deferred();
        this.fetch();
      }
    }
  });

}(this, _));