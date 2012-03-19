// -------- Delimited Parser ----------

/**
* Handles CSV and other delimited data. Takes in a data string
* and options that can contain: {
*   delimiter : "someString" <default is comma> 
* }
*/

(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));


  Miso.Parsers.Delimited = function(options) {
    this.options = options || {};

    this.delimiter = this.options.delimiter || ",";

    this.__delimiterPatterns = new RegExp(
      (
        // Delimiters.
        "(\\" + this.delimiter + "|\\r?\\n|\\r|^)" +

        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

        // Standard fields.
        "([^\"\\" + this.delimiter + "\\r\\n]*))"
      ),
      "gi"
    );
  };

  _.extend(Miso.Parsers.Delimited.prototype, Miso.Parsers.prototype, {

    parse : function(data) {
      var columns = [];
      var columnData = {};

      var parseCSV = function(delimiterPattern, strData, strDelimiter) {

        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create an array to hold our data. Give the array
        // a default empty first row.


        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // track how many columns we have. Once we reach a new line
        // mark a flag that we're done calculating that.
        var columnCount = 0;
        var columnCountComputed = false;

        // track which column we're on. Start with -1 because we increment it before
        // we actually save the value.
        var columnIndex = -1;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = delimiterPattern.exec(strData)){

          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ];

          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if ( strMatchedDelimiter.length &&
            ( strMatchedDelimiter !== strDelimiter )){
              // we have reached a new row.

              // We are clearly done computing columns.
              columnCountComputed = true;

              // when we're done with a row, reset the row index to 0
              columnIndex = 0;
            } else {

              // Find the number of columns we're fetching and
              // create placeholders for them.
              if (!columnCountComputed) {
                columnCount++;
              }

              columnIndex++;
            }


            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            var strMatchedValue = null;
            if (arrMatches[ 2 ]){

              // We found a quoted value. When we capture
              // this value, unescape any double quotes.
              strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
              );

            } else {

              // We found a non-quoted value.
              strMatchedValue = arrMatches[ 3 ];
            }

            // Now that we have our value string, let's add
            // it to the data array.
            if (columnCountComputed) {

              columnData[columns[columnIndex]].push(strMatchedValue);
            
            } else {
              // we are building the column names here
              columns.push(strMatchedValue);
              columnData[strMatchedValue] = [];
            }
        }

        // Return the parsed data.
        return {
          columns : columns,
          data : columnData
        }
      };

      return parseCSV(
        this.__delimiterPatterns, 
        data, 
        this.delimiter);
    }

  });


}(this, _));
