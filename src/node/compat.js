var path = require("path");
var _ = require("lodash");
var moment = require("moment");
_.mixin(require("underscore.deferred"));
var request = require("request");

// Include underscore math
<%= underscoreMath %>

// Include Miso Dataset lib
<%= misoDataSet %>

// Load function that makes Miso plugin loading more formal.
this.Miso.load = function(moduleName) {
  try {
    // Attempt to load from node_modules
    require(moduleName);
  } catch (ex) {
    // If path is not already full qualified prefix with cwd
    if (!path.existsSync(moduleName)) {
      moduleName = path.resolve(process.cwd(), moduleName);
    }

    // Load the correct module
    require(moduleName);
  }
};

// Ensure compatibility with Remote Importer
this.Miso.Xhr = function(options) {
  // Make the request using the request module
  request({
    url: options.url,
    method: options.type,
    json: options.dataType.slice(0, 4) === "json"
  }, function(error, resp, body) {
    if (error) {
      return options.error(error);
    }

    return options.success(body);
  });
};

// Expose the module
module.exports = this.Miso;
