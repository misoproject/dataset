(function(global) {
  
  var Util  = global.Util;
  var Miso  = global.Miso || {};  

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
    ok(strictData._column('_id').type === "number", "_id is number type");
    ok(strictData._column('character').type === "string", "character is string type");
    ok(strictData._column('name').type === "string", "name is string type");
    ok(strictData._column('is_modern').type === "boolean", "is_modern is boolean type");
    ok(strictData._column('numeric_value').type === "number", "numeric_value is numeric type");
  }

  test("Basic Strict Import through Dataset API", 47, function() {
    var ds = new Miso.Dataset({ 
      data : Miso.alphabet_strict, 
      strict: true
    });
    _.when(ds.fetch()).then(function(){
      verifyImport(Miso.alphabet_strict, ds);
      equals(typeof ds.columns, "function", "columns is the function, not the columns obj");
    });
  });

  module("Column creation, coercion &amp; type setting");

  test("Manually creating a column", function() {
    var ds = new Miso.Dataset({ 
      columns : [
        { name : 'testOne' },
        { name : 'testTwo', type: 'time' }
      ] 
    });
    ok(ds._column('testOne').name === 'testOne', 'testOne column created');
    ok(ds._column('testTwo').name === 'testTwo', 'testTwo column created');
    ok(ds._column('testTwo').type === 'time', 'testTwo column has time type');
  });

  test("Manual column type override", function() {
    var ds = new Miso.Dataset({
      data : Miso.alphabet_strict,
      strict : true,
      columns : [
        { name : 'name', type : 'number' }
      ]
    });
    _.when(ds.fetch()).then(function(){
      ok(ds._column('name').type === "number", "character is 2 column");
      ok(_.uniq(ds._column('name').data)[0] === null, "character has been coerced to null");
    });
  });

  test("Manual column type override", function() {
    var data = _.clone(Miso.alphabet_strict);
    data.columns[1].data = [];
    _(data.columns[0].data.length).times(function() {
      data.columns[1].data.push( moment() );
    });

    var ds = new Miso.Dataset({
      data : data,
      strict: true,
      columns: [
        { name : 'name', type : 'time' }
      ]
    });

    _.when(ds.fetch()).then(function(){
      ok(ds._column('name').type === "time", "name column has a type of time");
      //nasty check that it's a moment bject
      ok(ds._column('name').data[0].version === moment().version, "is a moment object");
    });
  });

  test("Manual column type override with extra properties", function() {

    var ds = new Miso.Dataset({
      data : [
        { 'character' : '12/31 2012' },
        { 'character' : '01/31 2011' }
      ],
      columns : [
        { name : 'character', type : 'time', format : 'MM/DD YYYY' }
      ]
    });
    _.when(ds.fetch()).then(function(){
      ok(ds._column('character').type === "time", "character column has a type of time");
      // verify format was properly coerced
      equals(ds._column('character').data[0].valueOf(), moment("12/31 2012", "MM/DD YYYY"));
    });
  });

  module("Obj Importer");
  test("Convert object to dataset", 46, function() {
    var ds = new Miso.Dataset({ data : Miso.alphabet_obj });
    _.when(ds.fetch()).then(function(){
      verifyImport(Miso.alphabet_obj, ds);
    });
  });

  // module("Remote Importer");
  // test("Basic json url fetch", 53, function() {
  //   var url = "data/alphabet_strict.json";
  //   var importer = new Miso.Importers.Remote({
  //     url : url,
  //     parser : Miso.Parsers.Strict,
  //     jsonp : false
  //   });
  //   stop();
  //   var data = importer.fetch({
  //     success: function(strictData) {
  //       verifyImport({}, strictData);
  //       start();
  //     }
  //   });
  // });

  test("Basic json url fetch through Dataset API", 46, function() {
    var url = "data/alphabet_strict.json";
    var ds = new Miso.Dataset({ 
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

  // test("Basic jsonp url fetch", 53, function() {
    // var url = "data/alphabet_obj.json?callback=";
    // var importer = new Miso.Importers.Remote({
      // url : url,
      // parser : Miso.Parsers.Obj,
      // jsonp : true,
      // extract : function(raw) {
        // return raw.data;
      // }
    // });
    // stop();
    // var data = importer.fetch({
      // success: function(strictData) {
        // verifyImport({}, strictData);
        // start();
      // }
    // });
  // });

  test("Basic jsonp url fetch with Dataset API", 46, function() {
    var url = "data/alphabet_obj.json?callback=";
    var ds = new Miso.Dataset({ 
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
    
  // module("Delimiter Importer");
  // test("Remote delimiter parsing test", function() {
    // var url = "data/alphabet.csv";
    // var importer = new Miso.Importers.Remote({
      // url : url, 
      // jsonp : false,
      // parser : Miso.Parsers.Delimited,
      // dataType: "text"
    // });
    // stop();
    // var data = importer.fetch({
      // success: function(strictData) {
        // verifyImport({}, strictData);
        // start();
      // }
    // });
  // });

  // // TODO: add remote delimiter parsing test through dataset API

  // test("Basic delimiter parsing test", 53, function() {

    // var importer = new Miso.Importers.Local({
      // parser : Miso.Parsers.Delimited,
      // data : window.Miso.alphabet_csv
    // });
    
    // importer.fetch({
      // success : function(strictData) {
        // verifyImport(Miso.alphabet_strict, strictData);
      // }
    // });
  // });

  // test("Basic delimiter parsing test with Dataset API", 53, function() {

    // var ds = new Miso.Dataset({ 
      // data : window.Miso.alphabet_csv,
      // delimiter : ","
    // });
    // _.when(ds.fetch()).then(function(){
      // verifyImport(Miso.alphabet_strict, ds);
    // });
  // });

  // test("Basic delimiter parsing test with custom separator", 53, function() {
    // var importer = new Miso.Importers.Local({
      // data : window.Miso.alphabet_customseparator,
      // delimiter : "###",
      // parser : Miso.Parsers.Delimited
    // });
    // importer.fetch({
      // success : function(strictData) {
        // verifyImport(Miso.alphabet_strict, strictData);
      // }
    // });
  // });

  // test("Basic delimiter parsing test with custom separator with Dataset API", 53, function() {
    // var ds = new Miso.Dataset({ 
      // data : window.Miso.alphabet_customseparator,
      // delimiter : "###"
    // });
    // _.when(ds.fetch()).then(function(){
      // verifyImport(Miso.alphabet_strict, ds);
    // });
  // });

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
      ok(_.isEqual(d._columns[i].data, obj._columns[i].data), "Expected: "+d._columns[i].data + " Got: " + window.Miso.google_spreadsheet_strict._columns[i].data);
    }
  }

  test("Google spreadsheet dataset test", function() {
    
    var key = "0Asnl0xYK7V16dFpFVmZUUy1taXdFbUJGdGtVdFBXbFE";
    var worksheet = "1";

    var ds = new Miso.Dataset({
      importer: Miso.Importers.GoogleSpreadsheet,
      parser : Miso.Parsers.GoogleSpreadsheet,
      key : key,
      worksheet: worksheet,
      ready : function() {
        verifyGoogleSpreadsheet(this, window.Miso.google_spreadsheet_strict);
        start();
      }
    });
    ds.fetch();
    stop();
  });

}(this));

