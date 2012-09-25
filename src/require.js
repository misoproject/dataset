(function(global) {

  var Miso = global.Miso || {};
  delete window.Miso;

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      // Export module
      module.exports = Miso;
    }
    exports.miso = Miso;

  } else if (typeof define === 'function' && define.amd) {
    // Register as a named module with AMD.
    define('miso', [], function() {      
      return Miso;
    });
  }
  
}(this));
