(function(global) {

  var Miso = global.Miso || {};

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      // Export module
      module.exports = Miso;
    }
    exports.miso = Miso;
  }
  
}(this));
