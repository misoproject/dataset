(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));
  /**
  * @constructor
  * Instantiates a new google spreadsheet importer.
  * @param {object} options - Options object. Requires at the very least:
  *     key - the google spreadsheet key
  *     worksheet - the index of the spreadsheet to be retrieved.
  *   OR
  *     url - a more complex url (that may include filtering.) In this case
  *           make sure it's returning the feed json data.
  */
  Miso.Importers.GoogleSpreadsheet = function(options) {
    options = options || {};
    if (options.url) {

      options.url = options.url;

    } else {

      if (_.isUndefined(options.key)) {

        throw new Error("Set options 'key' properties to point to your google document.");
      } else {

        options.worksheet = options.worksheet || 1;
        options.url = "https://spreadsheets.google.com/feeds/cells/" + 
          options.key + "/" + 
          options.worksheet + 
          "/public/basic?alt=json-in-script&callback=";

        delete options.key;
        delete options.worksheet;
      }
    }
    
    this.parser = Miso.Parsers.GoogleSpreadsheet;
    this.params = {
      type : "GET",
      url : options.url,
      dataType : "jsonp"
    };

    return this;
  };

  _.extend(Miso.Importers.GoogleSpreadsheet.prototype, Miso.Importers.Remote.prototype);

}(this, _));

// <<<<<<< HEAD
//   /**
//   * @constructor
//   * Instantiates a new google spreadsheet importer.
//   * @param {object} options - Options object. Requires at the very least:
//   *     key - the google spreadsheet key
//   *     worksheet - the index of the spreadsheet to be retrieved.
//   *   OR
//   *     url - a more complex url (that may include filtering.) In this case
//   *           make sure it's returning the feed json data.
//   */
//   Miso.Importers.GoogleSpreadsheet = function(options) {
//     options = options || {};
//     if (options.url) {

//       options.url = options.url;
// =======
// /**
// * @constructor
// * Google Spreadsheet Parser. 
// * Used in conjunction with the Google Spreadsheet Importer.
// * Requires the following:
// * @param {object} data - the google spreadsheet data.
// * @param {object} options - Optional options argument.
// */
// Miso.Parsers.GoogleSpreadsheet = function(data, options) {
//   this.options = options || {};
//   this._data = data;
// };

// _.extend(Miso.Parsers.GoogleSpreadsheet.prototype, Miso.Parsers.prototype, {

//   _buildColumns : function(d, n) {
//     d._columns = [];

//     var positionRegex = /([A-Z]+)(\d+)/; 
//     var columnPositions = {};

//     _.each(this._data.feed.entry, function(cell, index) {

//       var parts = positionRegex.exec(cell.title.$t),
//       column = parts[1],
//       position = parseInt(parts[2], 10);

//       if (_.isUndefined(columnPositions[column])) {
// >>>>>>> master

//     } else {

//       if (_.isUndefined(options.key)) {

//         throw new Error("Set options.key to point to your google document.");
//       } else {

//         options.worksheet = options.worksheet || 1;
//         options.url = "https://spreadsheets.google.com/feeds/cells/" + options.key + "/" + options.worksheet + "/public/basic?alt=json-in-script&callback=";
//         delete options.key;
//         delete options.worksheet;
//       }
//     }

// <<<<<<< HEAD
//     this.parser = Miso.Parsers.GoogleSpreadsheet;
//     this.params = {
//       type : "GET",
//       url : options.url,
//       dataType : "jsonp"
//     };

//     return this;
//   };

//   _.extend(Miso.Importers.GoogleSpreadsheet.prototype, Miso.Importers.Remote.prototype);
// =======
//     return d;
//   }

// });

// /**
// * @constructor
// * Instantiates a new google spreadsheet importer.
// * @param {object} options - Options object. Requires at the very least:
// *     key - the google spreadsheet key
// *     worksheet - the index of the spreadsheet to be retrieved.
// *   OR
// *     url - a more complex url (that may include filtering.) In this case
// *           make sure it's returning the feed json data.
// */
// Miso.Importers.GoogleSpreadsheet = function(options) {
//   options = options || {};
//   if (options.url) {

//     options.url = options.url;

//   } else {

//     if (_.isUndefined(options.key)) {

//       throw new Error("Set options.key to point to your google document.");
//     } else {

//       options.worksheet = options.worksheet || 1;
//       options.url = "https://spreadsheets.google.com/feeds/cells/" + options.key + "/" + options.worksheet + "/public/basic?alt=json-in-script&callback=";
//       delete options.key;
//       delete options.worksheet;
//     }
//   }

//   this.parser = Miso.Parsers.GoogleSpreadsheet;
//   this.params = {
//     type : "GET",
//     url : options.url,
//     dataType : "jsonp"
//   };

//   return this;
// };

// _.extend(
//   Miso.Importers.GoogleSpreadsheet.prototype, 
// Miso.Importers.Remote.prototype);
// >>>>>>> master

// }(this, _));
