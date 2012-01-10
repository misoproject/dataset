function verifyImport(obj, strictData) {
  console.log(strictData);

  // check properties exist
  ok(typeof strictData.columns !== "undefined", "columns property exists");

  // check all caches exist
  ok(typeof strictData._rowPositionById !== "undefined", "row position by id cache exists");
  ok(typeof strictData._rowIdByPosition !== "undefined", "row id by position cache exists");
  ok(typeof strictData._columnPositionByName !== "undefined", "column position by name cache exists");
  ok(typeof strictData.length !== "undefined", "row count exists");

  // check unique id column is first
  ok(strictData.columns[0].name === "_id", "first column is _id.");
  ok(strictData._columnPositionByName["_id"] === 0, "first column cached _id as 0");

  // verify all rows have the proper amount of data
  _.each(strictData.columns, function(column) {
    ok(column.data.length === strictData.length, "row count for column " + column.name + " is correct.");
  });

  // Verify all column position have been set.
  _.each(strictData.columns, function(column, i) {
    ok(strictData._columnPositionByName[column.name] === i, "proper column position has been set");
  });
};

function checkColumnTypes(strictData) {
  // check column types
  ok(strictData.columns[0].name === "_id", "_id is 1 column");
  ok(strictData.columns[0].type === "number", "_id is number type");
  ok(strictData.columns[1].name === "character", "character is 2 column");
  ok(strictData.columns[1].type === "string", "character is string type");
  ok(strictData.columns[2].name === "name", "name is 3 column");
  ok(strictData.columns[2].type === "string", "name is string type");
  ok(strictData.columns[3].name === "is_modern", "is_modern is 4 column");
  ok(strictData.columns[3].type === "boolean", "is_modern is boolean type");
  ok(strictData.columns[4].name === "numeric_value", "numeric_value is 5 column");
  ok(strictData.columns[4].type === "number", "numeric_value is boolean type");
}

module("Strict Importer")
test("Basic Strict Import", 29, function() {

  
  var importer = new DS.Importers.Local(DS.alphabet_strict, {
    parser : DS.Parsers.Strict
  });
  importer.fetch({
    success : function(strictData) {
      verifyImport(DS.alphabet_strict, strictData);

      // check data size
      ok(strictData.length === 24, "there are 24 rows");
      ok(strictData.columns.length === 5, "there are 5 columns");

      // check column types
      checkColumnTypes(strictData);
    }
  });
});

// test("Basic Strict Import through Dataset API", 29, function() {
//   var ds = new DS({ data : DS.alphabet_strict, strict: true });

//   verifyImport(DS.alphabet_strict, ds);

//   // check data size
//   ok(ds._rows.length === 24, "there are 5 rows");
//   ok(ds._columns.length === 4, "there are 4 columns");

//   // check column types
//   checkColumnTypes(strictData);
// });

module("Obj Importer");
test("Convert object to dataset", 33, function() {

  var importer = new DS.Importers.Local(DS.alphabet_obj, {
    parser : DS.Parsers.Obj
  });

  importer.fetch({
    success : function(strictData) {
      verifyImport(DS.alphabet_obj, strictData);

      // check data size
      ok(strictData.length === 24, "there are 24 rows");
      ok(strictData.columns.length === 5, "there are 5 columns");

       // check all data
       var keys = _.keys(DS.alphabet_obj[0]);
      _.each(keys, function(key) {
        
        // get all row values
        var values = _.pluck(DS.alphabet_obj, key);

        // get column values
        var colVals = strictData.columns[strictData._columnPositionByName[key]].data;
        ok(_.isEqual(values, colVals), "data is correct for column " + strictData._columnPositionByName[key].name);
      });

      // check column types
      checkColumnTypes(strictData);
    }
  });
});

// test("Convert object to dataset through dataset API", 33, function() {
//   var ds = new DS({ data : DS.alphabet_obj });
//   verifyImport(DS.alphabet_obj, ds);

//   // check data size
//   ok(ds._rows.length === 24, "there are 5 rows");
//   ok(ds._columns.length === 4, "there are 4 columns");

//    // check first row
//   _.each(DS.alphabet_obj, function(row, i){
//     ok(_.isEqual(_.values(row), ds._rows[i].data), "row " + i + " is equal");
//     ok(typeof ds._rows[i].data !== "undefined", "row " + i + " has an id");
//   });

// // check column types
// checkColumnTypes(strictData);

// });






module("Remote Importer");
test("Basic json url fetch", 27, function() {
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
      checkColumnTypes(strictData);
      start();
    }
  });
});

// test("Basic json url fetch through Dataset API", 27, function() {
//   var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json";
//   var ds = new DS({ 
//     url : url, 
//     jsonp : false, 
//     extract: function(data) {
//       return data.value.items[0].json;
//     },
//     ready : function() {
//       verifyImport({}, this);   
//       checkColumnTypes(strictData); 
//       start();
//     }
//   });
//   stop();
// });

test("Basic jsonp url fetch", 27, function() {
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
      checkColumnTypes(strictData);
      start();
    }
  });
});

// test("Basic jsonp url fetch with Dataset API", 27, function() {
//   // This is a random yahoo pipe that just grabs the alphabet_obj.js file and
//   // pipes it back as json. Nothing clever happens here.
//   var url = "http://pipes.yahoo.com/pipes/pipe.run?_id=ea8f8a21cf15cb73a884adca0d49e227&_render=json&_callback=";
//   var ds = new DS({ 
//     url : url, 
//     jsonp : true, 
//     extract: function(data) {
//       return data.value.items[0].json;
//     },
//     ready : function() {
//       verifyImport({}, this); 
//       checkColumnTypes(strictData);   
//       start();
//     }
//   });
//   stop();
// });
  
module("Delimiter Importer");
test("Remote delimiter parsing test", function() {
  var url = "data/alphabet.csv";
  var importer = new DS.Importers.Remote(url, {
    jsonp : false,
    parser : DS.Parsers.Delimited,
    dataType: "text"
  });
  stop();
  var data = importer.fetch({
    success: function(strictData) {
      verifyImport({}, strictData);
      checkColumnTypes(strictData);
      start();
    }
  });
});

// TODO: add remote delimiter parsing test through dataset API

test("Basic delimiter parsing test", 29, function() {

  var importer = new DS.Importers.Local(window.DS.alphabet_csv, {
    parser : DS.Parsers.Delimited
  });
  
  importer.fetch({
    success : function(strictData) {
      verifyImport(DS.alphabet_strict, strictData);

      // check data size
      console.log(strictData);
      ok(strictData.length === 24, "there are 24 rows");
      ok(strictData.columns.length === 5, "there are 5 columns");

      // check column types
      checkColumnTypes(strictData);
    }
  });
});

// test("Basic delimiter parsing test with Dataset API", 46, function() {

//   var ds = new DS({ 
//     data : window.DS.alphabet_csv,
//     delimiter : ","
//   });
  
//   verifyImport(DS.alphabet_strict, ds);

//   // check data size
//   ok(ds.length === 24, "there are 24 rows");
//   ok(ds.columns.length === 5, "there are 5 columns");

//   // check column types
//   ok(ds.columns[0].name === "character", "character is first column");
//   ok(ds.columns[0].type === "string", "character is string type");

//   ok(ds.columns[1].name === "name", "name is 2nd column");
//   ok(ds.columns[1].type === "string", "name is string type");

//   ok(ds.columns[2].name === "is_modern", "is_modern is 3rd column");
//   ok(ds.columns[2].type === "boolean", "is_modern is boolean type");

//   ok(ds.columns[3].name === "numeric_value", "numeric_value is 4th column");
//   ok(ds.columns[3].type === "number", "numeric_value is number type");
// });

test("Basic delimiter parsing test with custom separator", 29, function() {
  var importer = new DS.Importers.Local(window.DS.alphabet_customseparator, {
    delimiter : "###",
    parser : DS.Parsers.Delimited
  });
  importer.fetch({
    success : function(strictData) {
      verifyImport(DS.alphabet_strict, strictData);

      // check data size
      ok(strictData.length === 24, "there are 24 rows");
      ok(strictData.columns.length === 5, "there are 5 columns");

      // check column types
      checkColumnTypes(strictData);
    }
  });
});

// test("Basic delimiter parsing test with custom separator with Dataset API", 46, function() {
//   var ds = new DS({ 
//     data : window.DS.alphabet_customseparator,
//     delimiter : "###"
//   });
  
//   verifyImport(DS.alphabet_strict, ds);

//   // check data size
//   ok(ds._rows.length === 24, "there are " + ds._rows.length + " rows");
//   ok(ds._columns.length === 4, "there are 4 columns");

  // // check column types
  // checkColumnTypes(strictData);

// });
