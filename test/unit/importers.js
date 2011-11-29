(function() {

   function verifyImport(obj, strictData) {
       // check properties exist
      ok(typeof strictData._rows !== "undefined", "rows property exists");
      ok(typeof strictData._columns !== "undefined", "columns property exists");

      // verify all rows have ids
      _.each(strictData._rows, function(row, i) {
        ok(typeof row._id !== "undefined", "Row " + i + " has an _id.");
      });

      // verify row caches were put into place by importers.
      ok(typeof strictData._byRowId !== "undefined", "by row id cached");
      ok(typeof strictData._byColumnId !== "undefined", "by column id cached");
      ok(typeof strictData._byColumnName !== "undefined", "by column name cached");
      ok(_.keys(strictData._byRowId).length == strictData._rows.length, "Same number of rows in both row references");
      ok(_.keys(strictData._byColumnId).length == strictData._columns.length, "Same number of columns in both columns references");
      ok(_.keys(strictData._byColumnName).length == strictData._columns.length, "Same number of columns in both columns references");

      // Verify all column position have been set.
      _.each(strictData._columns, function(column, i) {
        ok(column.position === i, "proper column position has been set");
      });
  };

  module("Importing Obj");
  test("Convert object to dataset", 94, function() {
    var importer = new DS.Importers.Obj(DS.alphabet_obj);
    importer.fetch({
      success : function(strictData) {
        verifyImport(DS.alphabet_obj, strictData);

        // check data size
        ok(strictData._rows.length === 24, "there are 5 rows");
        ok(strictData._columns.length === 4, "there are 4 columns");

         // check first row
        _.each(DS.alphabet_obj, function(row, i){
          ok(_.isEqual(_.values(row), strictData._rows[i].data), "row " + i + " is equal");
          ok(typeof strictData._rows[i].data !== "undefined", "row " + i + " has an id");
        });

        // check column types
        ok(strictData._columns[0].name === "character", "character is first column");
        ok(strictData._columns[0].type === "string", "character is string type");
        ok(strictData._columns[1].name === "name", "name is 2nd column");
        ok(strictData._columns[1].type === "string", "name is string type");
        ok(strictData._columns[2].name === "is_modern", "is_modern is 3rd column");
        ok(strictData._columns[2].type === "boolean", "is_modern is boolean type");
        ok(strictData._columns[3].name === "numeric_value", "numeric_value is 4th column");
        ok(strictData._columns[3].type === "number", "numeric_value is boolean type");
      }
    });


  });

  module("Strict Importer")
  test("Basic Strict Import", 46, function() {

    var importer = new DS.Importers.Strict(DS.alphabet_strict);
    importer.fetch({
      success : function(strictData) {
        verifyImport(DS.alphabet_strict, strictData);

        // check data size
        ok(strictData._rows.length === 24, "there are 5 rows");
        ok(strictData._columns.length === 4, "there are 4 columns");

        // check column types
        ok(strictData._columns[0].name === "character", "character is first column");
        ok(strictData._columns[0].type === "string", "character is string type");

        ok(strictData._columns[1].name === "name", "name is 2nd column");
        ok(strictData._columns[1].type === "string", "name is string type");

        ok(strictData._columns[2].name === "is_modern", "is_modern is 3rd column");
        ok(strictData._columns[2].type === "boolean", "is_modern is boolean type");

        ok(strictData._columns[3].name === "numeric_value", "numeric_value is 4th column");
        ok(strictData._columns[3].type === "number", "numeric_value is number type");
      }
    });


  });

  module("Remote Importer");
  test("Basic json url fetch", 36, function() {
    // This is a random yahoo pipe that just grabs the alphabet_obj.js file and
    // pipes it back as json. Nothing clever happens here.
    var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json";
    var parser = new DS.Importers.Remote(url, {
      jsonp : false,
      parse : function(data) {
        return data.value.items[0].json;
      }
    });
    stop();
    var data = parser.fetch({
      success: function(strictData) {
        start();
        verifyImport({}, strictData);
      }
    });

  });

  test("Basic jsonp url fetch", 36, function() {
    // This is a random yahoo pipe that just grabs the alphabet_obj.js file and
    // pipes it back as json. Nothing clever happens here.
    var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json&_callback=?";
    var parser = new DS.Importers.Remote(url, {
      jsonp : true,
      parse : function(data) {
        return data.value.items[0].json;
      }
    });
    stop();
    var data = parser.fetch({
      success: function(strictData) {
        start();
        verifyImport({}, strictData);
      }
    });

  });

})();
