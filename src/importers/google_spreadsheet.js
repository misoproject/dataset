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