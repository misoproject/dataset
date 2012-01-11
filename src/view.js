(function(global, _) {

  var DS = global.DS;

  DS.View = function(options) {
    options = options || (options = {});
    this._initialize(options);
    return this;
  };

  _.extend(DS.View.prototype, DS.Events, DS.Syncable, {

  });
  
}(this, _));