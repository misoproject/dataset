(function(global) {
  
  var Util  = global.Util;
  var DS    = global.DS || {};  

  function verifyImport(obj, strictData) {

    // check properties exist
    ok(typeof strictData._columns !== "undefined", "columns property exists");

    // check all caches exist
    ok(typeof strictData._rowPositionById !== "undefined", "row position by id cache exists");
    ok(typeof strictData._rowIdByPosition !== "undefined", "row id by position cache exists");
    ok(typeof strictData._columnPositionByName !== "undefined", "column position by name cache exists");
    ok(typeof strictData.length !== "undefined", "row count exists");

    // check row cache ids
    for (var i = 0; i < strictData.length; i++) {
      var id = strictData._rowIdByPosition[i];
      ok(i === strictData._rowPositionById[id], "row " + i + " id correctly cached");
    }

    // check unique id column is first
    ok(strictData._columns[0].name === "_id", "first column is _id.");
    ok(strictData._columnPositionByName["_id"] === 0, "first column cached _id as 0");

    // verify all rows have the proper amount of data
    _.each(strictData._columns, function(column) {
      ok(column.data.length === strictData.length, "row count for column " + column.name + " is correct.");
    });

    // Verify all column position have been set.
    _.each(strictData._columns, function(column, i) {
      ok(strictData._columnPositionByName[column.name] === i, "proper column position has been set");
    });

    checkColumnTypes(strictData);
  }

  function checkColumnTypes(strictData) {

    // check data size
    ok(strictData.length === 24, "there are 24 rows");
    ok(strictData._columns.length === 5, "there are 5 columns");

    // check column types
    ok(strictData._columns[0].name === "_id", "_id is 1 column");
    ok(strictData._columns[0].type === "number", "_id is number type");
    ok(strictData._columns[1].name === "character", "character is 2 column");
    ok(strictData._columns[1].type === "string", "character is string type");
    ok(strictData._columns[2].name === "name", "name is 3 column");
    ok(strictData._columns[2].type === "string", "name is string type");
    ok(strictData._columns[3].name === "is_modern", "is_modern is 4 column");
    ok(strictData._columns[3].type === "boolean", "is_modern is boolean type");
    ok(strictData._columns[4].name === "numeric_value", "numeric_value is 5 column");
    ok(strictData._columns[4].type === "number", "numeric_value is numeric type");
  }

  module("Strict Importer");
  test("Basic Strict Import", 53, function() {
    var importer = new DS.Importers.Local({
      parser : DS.Parsers.Strict,
      data : DS.alphabet_strict
    });
    importer.fetch({
      success : function(strictData) {
        verifyImport(DS.alphabet_strict, strictData);
      }
    });
  });

  test("Basic Strict Import through Dataset API", 54, function() {
    var ds = new DS.Dataset({ 
      data : DS.alphabet_strict, 
      strict: true
    });
    _.when(ds.fetch()).then(function(){
      verifyImport(DS.alphabet_strict, ds);
      equals(typeof ds.columns, "function", "columns is the function, not the columns obj");
    });
  });

  module("Coercion and type setting");
  test("Manual column type override", function() {
    var ds = new DS.Dataset({
      data : DS.alphabet_strict,
      strict: true,
      columnTypes : {
        name : 'number'
      }
    });
    _.when(ds.fetch()).then(function(){
      ok(ds._columns[2].name === "name", "character is 2 column");
      ok(ds._columns[2].type === "number", "character is 2 column");
      ok(_.uniq(ds._columns[2].data)[0] === null, "character has been coerced to null");
    });
  });

  test("Manual column type override", function() {
    var data = _.clone(DS.alphabet_strict);
    data.columns[1].data = [];
    _(data.columns[0].data.length).times(function() {
      data.columns[1].data.push( moment() );
    });

    var ds = new DS.Dataset({
      data : data,
      strict: true,
      columnTypes : {
        character : 'time'
      }
    });

    _.when(ds.fetch()).then(function(){
      ok(ds._columns[1].type === "time", "name column has a type of time");
      //nasty check that it's a moment bject
      ok(ds._columns[1].data[0].version === moment().version, "is a moment object");
    });
  });

  test("Manual column type override with extra properties", function() {

    var ds = new DS.Dataset({
      data : [
        { 'character' : '12/31 2012' },
        { 'character' : '01/31 2011' }
      ],
      columnTypes : {
        character : { type : 'time', format : 'MM/DD YYYY' }
      }
    });
    _.when(ds.fetch()).then(function(){
      ok(ds._columns[1].type === "time", "character column has a type of time");
      // verify format was properly coerced
      equals(ds._columns[1].data[0].valueOf(), moment("12/31 2012", "MM/DD YYYY"));
    });
  });

  module("Obj Importer");
  test("Convert object to dataset", 53, function() {
    var ds = new DS.Dataset({ data : DS.alphabet_obj });
    _.when(ds.fetch()).then(function(){
      verifyImport(DS.alphabet_obj, ds);
    });
  });

  module("Remote Importer");
  test("Basic json url fetch", 53, function() {
    var url = "data/alphabet_strict.json";
    var importer = new DS.Importers.Remote({
      url : url,
      parser : DS.Parsers.Strict,
      jsonp : false
    });
    stop();
    var data = importer.fetch({
      success: function(strictData) {
        verifyImport({}, strictData);
        start();
      }
    });
  });

  test("Basic json url fetch through Dataset API", 53, function() {
    var url = "data/alphabet_strict.json";
    var ds = new DS.Dataset({ 
      url : url, 
      jsonp : false, 
      strict: true,
      ready : function() {
        verifyImport({}, this);   
        start();
      }
    });
    ds.fetch();
    stop();
  });

  test("Basic jsonp url fetch", 53, function() {
    var url = "data/alphabet_obj.json?callback=";
    var importer = new DS.Importers.Remote({
      url : url,
      parser : DS.Parsers.Obj,
      jsonp : true,
      extract : function(raw) {
        return raw.data;
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

  test("Basic jsonp url fetch with Dataset API", 53, function() {
    var url = "data/alphabet_obj.json?callback=";
    var ds = new DS.Dataset({ 
      url : url, 
      jsonp : true, 
      extract: function(raw) {
        return raw.data;
      },
      ready : function() {
        verifyImport({}, this); 
        start();
      }
    });
    ds.fetch();
    stop();
  });
    
  module("Delimiter Importer");
  test("Remote delimiter parsing test", function() {
    var url = "data/alphabet.csv";
    var importer = new DS.Importers.Remote({
      url : url, 
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

  test("Basic delimiter parsing test", 53, function() {

    var importer = new DS.Importers.Local({
      parser : DS.Parsers.Delimited,
      data : window.DS.alphabet_csv
    });
    
    importer.fetch({
      success : function(strictData) {
        verifyImport(DS.alphabet_strict, strictData);
      }
    });
  });

  test("Basic delimiter parsing test with Dataset API", 53, function() {

    var ds = new DS.Dataset({ 
      data : window.DS.alphabet_csv,
      delimiter : ","
    });
    _.when(ds.fetch()).then(function(){
      verifyImport(DS.alphabet_strict, ds);
    });
  });

  test("Basic delimiter parsing test with custom separator", 53, function() {
    var importer = new DS.Importers.Local({
      data : window.DS.alphabet_customseparator,
      delimiter : "###",
      parser : DS.Parsers.Delimited
    });
    importer.fetch({
      success : function(strictData) {
        verifyImport(DS.alphabet_strict, strictData);
      }
    });
  });

  test("Basic delimiter parsing test with custom separator with Dataset API", 53, function() {
    var ds = new DS.Dataset({ 
      data : window.DS.alphabet_customseparator,
      delimiter : "###"
    });
    _.when(ds.fetch()).then(function(){
      verifyImport(DS.alphabet_strict, ds);
    });
  });

  module("Google Spreadsheet Support");
  function verifyGoogleSpreadsheet(d, obj) {

    ok(_.isEqual(
      _.keys(d._columnPositionByName), 
      _.keys(obj._columnPositionByName)
    ));
    ok(_.isEqual(
      d._rowIdByPosition.length, 
      obj._rowIdByPosition.length)
    );

    // ignoring id column, since that changes.
    for(var i = 1; i < d.length; i++) {
      ok(_.isEqual(d._columns[i].data, obj._columns[i].data), "Expected: "+d._columns[i].data + " Got: " + window.DS.google_spreadsheet_strict._columns[i].data);
    }
  }

  test("Google spreadsheet parse test", function() {
    
    $.ajax({
      url : "https://spreadsheets.google.com/feeds/cells/0Asnl0xYK7V16dFpFVmZUUy1taXdFbUJGdGtVdFBXbFE/1/public/basic?alt=json-in-script",
      dataType: "jsonp",
      success: function(data) {
        var parser = new DS.Parsers.GoogleSpreadsheet(data);
        var strictData = parser.build();
        verifyGoogleSpreadsheet(strictData, window.DS.google_spreadsheet_strict);
        start();
      }
    });
    stop();
  });

  test("Google spreadsheet import test", function() {

    
    var importer = new DS.Importers.GoogleSpreadsheet({
      key : "0Asnl0xYK7V16dFpFVmZUUy1taXdFbUJGdGtVdFBXbFE",
      worksheet : "1"
    });

    importer.fetch({
      success : function(data) {
        verifyGoogleSpreadsheet(data, window.DS.google_spreadsheet_strict);
        start();
      }
    });
    stop();
  });


  test("Google spreadsheet dataset test", function() {
    
    var key = "0Asnl0xYK7V16dFpFVmZUUy1taXdFbUJGdGtVdFBXbFE";
    var worksheet = "1";

    var ds = new DS.Dataset({
      google_spreadsheet : {
        key : key,
        worksheet: worksheet
      },
      ready : function() {
        verifyGoogleSpreadsheet(this, window.DS.google_spreadsheet_strict);
        start();
      }
    });
    ds.fetch();
    stop();
  });
}(this));

