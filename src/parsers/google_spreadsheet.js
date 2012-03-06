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

    parse : function(data) {
      var columns = [],
          columnData = [];

      var positionRegex = /([A-Z]+)(\d+)/; 
      var columnPositions = {};

      _.each(data.feed.entry, function(cell, index) {

        var parts = positionRegex.exec(cell.title.$t),
        column = parts[1],
        position = parseInt(parts[2], 10);

        if (_.isUndefined(columnPositions[column])) {

          // cache the column position
          columnPositions[column] = columnData.length;

          // we found a new column, so build a new column type.
          columns[columnPositions[column]]    = cell.content.$t;
          columnData[columnPositions[column]] = [];

        } else {

          // find position: 
          var colpos = columnPositions[column];

          // this is a value for an existing column, so push it.
          columnData[colpos][position-1] = cell.content.$t; 
        }
      }, this);

      // fill whatever empty spaces we might have in the data due to 
      // empty cells
      columnData.length = _.max(_.pluck(columnData, "length")) - 1; // for column name

      var keyedData = {};

      _.each(columnData, function(coldata, column) {

        // slice off first space. It was alocated for the column name
        // and we've moved that off.
        coldata.splice(0,1);

        for (var i = 0; i < coldata.length; i++) {
          if (_.isUndefined(coldata[i]) || coldata[i] === "") {
            coldata[i] = null;
          }
        }

        keyedData[columns[column]] = coldata;
      });

      return {
        columns : columns,
        data : keyedData
      };
    }

  });
}(this, _));

