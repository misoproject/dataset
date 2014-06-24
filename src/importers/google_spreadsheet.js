(function(global, _) {

  var Dataset = global.Miso.Dataset;
  
  /**
   * Import directly from google spreadsheets, see [the Google Spreadsheets
   * guide](http://misoproject.com/dataset/dataset/tutorials/googlespreadsheets).
   *
   * @constructor
   * @name GoogleSpreadsheet
   * @memberof Miso.Dataset.Importers
   * @augments Miso.Dataset.Importers.Remote
   *
   * @param {Object} options - Requires at the very least: (`key` AND (`gid` OR
   *                           `sheedNAme`)) OR `url`
   * @param {String} options.key - the google spreadsheet key
   * @param {Number} options.gid - the index of the spreadsheet to be retrieved
   *                               (1 default)
   * @param {String} options.sheetName - the name of the sheet to fetch
   *                                     ("Sheet1" default)
   * @param {String} options.url - a more complex url (that may include
   *                               filtering.) In this case make sure it's
   *                               returning the feed json data.
   * @param {Boolean} options.fast - An optional flag to enable faster parsing.
   *                                 See [the Google Spreadsheets
   *                                 guide](http://misoproject.com/dataset/dataset/tutorials/googlespreadsheets)
   *                                 for more information about this flag.
   */
  Dataset.Importers.GoogleSpreadsheet = function(options) {
    options = options || {};
    if (options.url) {

      options.url = options.url;

    } else {

      if (_.isUndefined(options.key)) {

        throw new Error("Set options 'key' properties to point to your google document.");
      } else {

        // turning on the "fast" option will use the farser parser
        // that downloads less data but it's flakier (due to google not
        // correctly escaping various strings when returning json.)
        if (options.fast) {
          
          options.url = "https://spreadsheets.google.com/tq?key=" + options.key;
                  
          if (typeof options.sheetName === "undefined") {
            options.sheetName = "Sheet1";
          } 

          options.url += "&sheet=" + options.sheetName;
          this.callback = "misodsgs" + new Date().getTime();
          options.url += "&tqx=version:0.6;responseHandler:" + this.callback;
          options.url += ";reqId:0;out:json&tq&_=1335871249558#";

          delete options.sheetName;
        } else {
          options.url = "https://spreadsheets.google.com/feeds/cells/" + 
          options.key + "/" + 
          options.worksheet + 
          "/public/basic?alt=json-in-script&callback=";
        }
        
        delete options.key;
      }
    }
    

    this.params = {
      type : "GET",
      url : options.url,
      dataType : "jsonp"
    };

    return this;
  };

  _.extend(Dataset.Importers.GoogleSpreadsheet.prototype, Dataset.Importers.Remote.prototype);

}(this, _));
