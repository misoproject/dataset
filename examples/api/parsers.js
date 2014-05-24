/* global arrayOfColumnNames, dataObject */
// Pass in the data you'll be parsing
// Take in any potential options you might need for your parser
Miso.Dataset.Parsers.MyCustomParser = function(data, options) {};

_.extend(
  Miso.Dataset.Parsers.MyCustomParser.prototype,
  Miso.Dataset.Parsers.prototype,
  {
    // required method parse must be defined:
    parse : function(data) {

      // parse the data here
      // ...

      // return the following structure:
      return {
        // an array of column names in the order they are in
        // for example: ["state", "population", "amount"]
        columns : arrayOfColumnNames,

        // an object conainint the data, keyed by column names
        // for example:
        // {
        //  state : [ "AZ", "AL", "MA" ],
        //  population : [ 1000, 2000, 3000],
        //  amount : [12,45,34]
        // }
        data : dataObject
      };
    }
  }
);
