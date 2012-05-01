// --------- Google Spreadsheet Parser -------
// 

(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));
  /**
  * Google Spreadsheet Parser. 
  * This is utilizing the format that can be obtained using this:
  * http://code.google.com/apis/gdata/samples/spreadsheet_sample.html
  * Used in conjunction with the Google Spreadsheet Importer.
  */
  Miso.Parsers.GoogleSpreadsheet = function(options) {
    this.fast = options.fast || false;
  };

  _.extend(Miso.Parsers.GoogleSpreadsheet.prototype, Miso.Parsers.prototype, {

    parse : function(data) {
      var columns = [],
          columnData = [],  
          keyedData = {},
          i;

      if (this.fast) {

        // init column names
        columns = _.pluck(data.table.cols, "label");

        // save data
        _.each(data.table.rows, function(row) {
          row = row.c;
          for(i = 0; i < row.length; i++) {
            columnData[i] = columnData[i] || [];
            if (row[i].v === "") {
              columnData[i].push(null);  
            } else {
              columnData[i].push(row[i].v);
            }
          }
        });

        // convert to keyed data.
        _.each(columns, function(colName, index) {
          keyedData[colName] = columnData[index];
        });

      } else {
        var positionRegex = /([A-Z]+)(\d+)/,
            columnPositions = {};

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

        _.each(columnData, function(coldata, column) {
          // fill whatever empty spaces we might have in the data due to empty cells
          coldata.length = _.max(_.pluck(columnData, "length"));

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

      }
      
      return {
        columns : columns,
        data : keyedData
      };
    }

  });
}(this, _));

