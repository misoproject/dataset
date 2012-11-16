var path = require("path");
var _ = require("lodash");
var moment = require("moment");
_.mixin(require("underscore.deferred"));
var request = require("request");

this.Miso = require("miso.events");

// Include underscore math
<%= underscoreMath %>

// Include Miso Dataset lib
<%= misoDataSet %>

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
