/* global data */
Miso.Dataset.Importers.MyCustomImporter = function(options) {
  // save your options
  // overwrite 'extract' function if you want
  // but don't forget users can overwrite that when
  // instantiating a new Dataset.
};

_.extend(
  Miso.Dataset.Importers.MyCustomImporter.prototype,
  Miso.Dataset.Importers.prototype,
  {

    // required method fetch must be defined.
    // options should have a success and error callback.
    // On successful data retrieval, the fetch should call
    // the success callback with the returned data.
    fetch : function(options) {

      // retrieve data
      //    ....

      // if data is successfully returned, pass it to
      //    options.success like so:
      options.success( this.extract(data) );
    }
  }
);
