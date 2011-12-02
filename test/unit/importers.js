

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

  var importer = new DS.Importers.Local(DS.alphabet_obj, {
    parser : DS.Parsers.Obj
  });

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

test("Convert object to dataset through dataset API", 94, function() {
  var ds = new DS({ data : DS.alphabet_obj });
  verifyImport(DS.alphabet_obj, ds);

  // check data size
  ok(ds._rows.length === 24, "there are 5 rows");
  ok(ds._columns.length === 4, "there are 4 columns");

   // check first row
  _.each(DS.alphabet_obj, function(row, i){
    ok(_.isEqual(_.values(row), ds._rows[i].data), "row " + i + " is equal");
    ok(typeof ds._rows[i].data !== "undefined", "row " + i + " has an id");
  });

  // check column types
  ok(ds._columns[0].name === "character", "character is first column");
  ok(ds._columns[0].type === "string", "character is string type");
  ok(ds._columns[1].name === "name", "name is 2nd column");
  ok(ds._columns[1].type === "string", "name is string type");
  ok(ds._columns[2].name === "is_modern", "is_modern is 3rd column");
  ok(ds._columns[2].type === "boolean", "is_modern is boolean type");
  ok(ds._columns[3].name === "numeric_value", "numeric_value is 4th column");
  ok(ds._columns[3].type === "number", "numeric_value is boolean type");

});

module("Strict Importer")
test("Basic Strict Import", 46, function() {

  
  var importer = new DS.Importers.Local(DS.alphabet_strict, {
    parser : DS.Parsers.Strict
  });
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

test("Basic Strict Import through Dataset API", 46, function() {
  var ds = new DS({ data : DS.alphabet_strict, strict: true });

  verifyImport(DS.alphabet_strict, ds);

  // check data size
  ok(ds._rows.length === 24, "there are 5 rows");
  ok(ds._columns.length === 4, "there are 4 columns");

  // check column types
  ok(ds._columns[0].name === "character", "character is first column");
  ok(ds._columns[0].type === "string", "character is string type");

  ok(ds._columns[1].name === "name", "name is 2nd column");
  ok(ds._columns[1].type === "string", "name is string type");

  ok(ds._columns[2].name === "is_modern", "is_modern is 3rd column");
  ok(ds._columns[2].type === "boolean", "is_modern is boolean type");

  ok(ds._columns[3].name === "numeric_value", "numeric_value is 4th column");
  ok(ds._columns[3].type === "number", "numeric_value is number type");
});


module("Remote Importer");
test("Basic json url fetch", 36, function() {
  // This is a random yahoo pipe that just grabs the alphabet_obj.js file and
  // pipes it back as json. Nothing clever happens here.
  var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json";
  var importer = new DS.Importers.Remote(url, {
    parser : DS.Parsers.Obj,
    jsonp : false,
    extract : function(data) {
      return data.value.items[0].json;
    }
  });
  stop();
  var data = importer.fetch({
    success: function(strictData) {
      verifyImport({}, strictData);
      start();
    }
  });
});

test("Basic json url fetch through Dataset API", 36, function() {
  var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json";
  var ds = new DS({ 
    url : url, 
    jsonp : false, 
    extract: function(data) {
      return data.value.items[0].json;
    },
    ready : function() {
      verifyImport({}, this);    
      start();
    }
  });
  stop();
});

test("Basic jsonp url fetch", 36, function() {
  // This is a random yahoo pipe that just grabs the alphabet_obj.js file and
  // pipes it back as json. Nothing clever happens here.
  var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json&_callback=";
  var importer = new DS.Importers.Remote(url, {
    parser : DS.Parsers.Obj,
    jsonp : true,
    extract : function(data) {
      return data.value.items[0].json;
    }
  });
  stop();
  var data = importer.fetch({
    success: function(strictData) {
      verifyImport({}, strictData);
      start();
    }
  });
});

test("Basic jsonp url fetch with Dataset API", 36, function() {
  // This is a random yahoo pipe that just grabs the alphabet_obj.js file and
  // pipes it back as json. Nothing clever happens here.
  var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json&_callback=";
  var ds = new DS({ 
    url : url, 
    jsonp : true, 
    extract: function(data) {
      return data.value.items[0].json;
    },
    ready : function() {
      verifyImport({}, this);    
      start();
    }
  });
  stop();
});
  
module("Delimiter Importer");
test("Remote delimiter parsing test", function() {
  var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=065a0224563f4581b644714d3ba93049&_render=csv";
  var importer = new DS.Importers.Remote(url, {
    jsonp : false,
    parser : DS.Parsers.Delimited,
    dataType: "text"
  });
  stop();
  var data = importer.fetch({
    success: function(strictData) {
      verifyImport({}, strictData);
      start();
    }
  });
});

// TODO: add remote delimiter parsing test through dataset API

test("Basic delimiter parsing test", 46, function() {

  var importer = new DS.Importers.Local(window.DS.alphabet_csv, {
    parser : DS.Parsers.Delimited
  });
  
  importer.fetch({
    success : function(strictData) {
      verifyImport(DS.alphabet_strict, strictData);

      console.log(strictData);
      // check data size
      ok(strictData._rows.length === 24, "there are 24 rows");
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

test("Basic delimiter parsing test with Dataset API", 46, function() {

  var ds = new DS({ 
    data : window.DS.alphabet_csv,
    delimiter : ","
  });
  
  verifyImport(DS.alphabet_strict, ds);

  // check data size
  ok(ds._rows.length === 24, "there are 24 rows");
  ok(ds._columns.length === 4, "there are 4 columns");

  // check column types
  ok(ds._columns[0].name === "character", "character is first column");
  ok(ds._columns[0].type === "string", "character is string type");

  ok(ds._columns[1].name === "name", "name is 2nd column");
  ok(ds._columns[1].type === "string", "name is string type");

  ok(ds._columns[2].name === "is_modern", "is_modern is 3rd column");
  ok(ds._columns[2].type === "boolean", "is_modern is boolean type");

  ok(ds._columns[3].name === "numeric_value", "numeric_value is 4th column");
  ok(ds._columns[3].type === "number", "numeric_value is number type");
});

test("Basic delimiter parsing test with custom separator", 46, function() {
  var importer = new DS.Importers.Local(window.DS.alphabet_customseparator, {
    delimiter : "###",
    parser : DS.Parsers.Delimited
  });
  importer.fetch({
    success : function(strictData) {
      verifyImport(DS.alphabet_strict, strictData);

      console.log(strictData);
      // check data size
      ok(strictData._rows.length === 24, "there are " + strictData._rows.length + " rows");
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

test("Basic delimiter parsing test with custom separator with Dataset API", 46, function() {
  var ds = new DS({ 
    data : window.DS.alphabet_customseparator,
    delimiter : "###"
  });
  
  verifyImport(DS.alphabet_strict, ds);

  // check data size
  ok(ds._rows.length === 24, "there are " + ds._rows.length + " rows");
  ok(ds._columns.length === 4, "there are 4 columns");

  // check column types
  ok(ds._columns[0].name === "character", "character is first column");
  ok(ds._columns[0].type === "string", "character is string type");

  ok(ds._columns[1].name === "name", "name is 2nd column");
  ok(ds._columns[1].type === "string", "name is string type");

  ok(ds._columns[2].name === "is_modern", "is_modern is 3rd column");
  ok(ds._columns[2].type === "boolean", "is_modern is boolean type");

  ok(ds._columns[3].name === "numeric_value", "numeric_value is 4th column");
  ok(ds._columns[3].type === "number", "numeric_value is number type");

});
