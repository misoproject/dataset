// --------- Google Spreadsheet Parser -------
// This is utilizing the format that can be obtained using this:
// http://code.google.com/apis/gdata/samples/spreadsheet_sample.html

(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));

/**
* @constructor
* Google Spreadsheet Parser. 
* Used in conjunction with the Google Spreadsheet Importer.
* Requires the following:
* @param {object} data - the google spreadsheet data.
* @param {object} options - Optional options argument.
*/
Miso.Parsers.GoogleSpreadsheet = function(data, options) {
  this.options = options || {};
  this._data = data;
};

_.extend(Miso.Parsers.GoogleSpreadsheet.prototype, Miso.Parsers.prototype, {

  _buildColumns : function(d, n) {
    d._columns = [];

    var positionRegex = /([A-Z]+)(\d+)/; 
    var columnPositions = {};

    _.each(this._data.feed.entry, function(cell, index) {

      var parts = positionRegex.exec(cell.title.$t),
      column = parts[1],
      position = parseInt(parts[2], 10);

      if (_.isUndefined(columnPositions[column])) {

        // cache the column position
        columnPositions[column] = d._columns.length;

        // we found a new column, so build a new column type.
        d._columns.push(this._buildColumn(cell.content.$t, null, []));

      } else {

        // find position: 
        var colpos = columnPositions[column];

        // this is a value for an existing column, so push it.
        d._columns[colpos].data[position-1] = cell.content.$t; 
      }
    }, this);

    // fill whatever empty spaces we might have in the data due to 
    // empty cells
    d.length = _.max(d._columns, function(column) { 
      return column.data.length; 
    }).data.length - 1; // for column name

    _.each(d._columns, function(column, index) {

      // slice off first space. It was alocated for the column name
      // and we've moved that off.
      column.data.splice(0,1);

      for (var i = 0; i < d.length; i++) {
        if (_.isUndefined(column.data[i]) || column.data[i] === "") {
          column.data[i] = null;
        }
      }
    });

    // add row _id column. Generate auto ids if there
    // isn't already a unique id column.
    if (_.pluck(d._columns, "name").indexOf("_id") === -1) {
      this._addIdColumn(d, d._columns[0].data.length);
    }

    return d;
  }

});

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

      throw new Error("Set options.key to point to your google document.");
    } else {

      options.worksheet = options.worksheet || 1;
      options.url = "https://spreadsheets.google.com/feeds/cells/" + options.key + "/" + options.worksheet + "/public/basic?alt=json-in-script&callback=";
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

_.extend(
  Miso.Importers.GoogleSpreadsheet.prototype, 
Miso.Importers.Remote.prototype);

}(this, _));
