$(document).ready(function() {

  module("Extracting Data");

  (function() {
    var data = {
      "columns" : [{ "name" : "one", "type" : "Integer" }],
      "rows" : [ 
        {"data" : [1] }, 
        {"data" : [2] } 
      ]
    };
    var ds = new DS({ data : data, strict : true });

    test("getting values", function() {
      equal(1, ds.get(0, "one"), "Can get the first value in the one column" )
      equal(2, ds.get(1, "one"), "Can get the second value in the one column" )
    });

    test("filtering to rows via filter:row", function() {
      var sub = ds.filter({ row : 1 });
      equal( sub.get(0, "one") , ds.get(1, "one"), "Same data exists in sub dataset" )
    });

    test("filtering to rows via filter:rows", function() {
      var sub = ds.filter({ rows : [0, 1] });
      equal( sub.get(0, "one") , ds.get(0, "one"), "Same data exists in sub dataset" )
      equal( sub.get(1, "one") , ds.get(1, "one"), "Same data exists in sub dataset" )
    });

    test("filtering to rows via rows", function() {
      var sub = ds.rows(1);
      equal( sub.get(0, "one") , ds.get(1, "one"), "Same data exists in sub dataset" )
    });
  }());

  module("Type Checking");

  
  test("Creating a DS instance from object", function() {
    var obj = [{"character" : "α", "name" : "alpha", "is_modern" : true, "numeric_value" : 1}, 
      {"character" : "β", "name" : "beta", "is_modern" : true, "numeric_value" : 2}, 
      {"character" : "γ", "name" : "gamma", "is_modern" : true, "numeric_value" : 3}, 
      {"character" : "δ", "name" : "delta", "is_modern" : true, "numeric_value" : 4}, 
      {"character" : "ε", "name" : "epsilon", "is_modern" : false, "numeric_value" : 5}];

    var ds = new DS({ data : obj });
    ok(typeof ds._columns !== "undefined", "columns are in place");
    ok(typeof ds._rows !== "undefined", "rows are in place");
    
    // check data size
    ok(ds._rows.length === 5, "there are 5 rows");
    ok(ds._columns.length === 4, "there are 4 columns");
    
    // check first row
    _.each(obj, function(row, i){
      ok(_.isEqual(_.values(row), ds._rows[i].data), "row " + i + " is equal");      
      ok(typeof ds._rows[i].data !== "undefined", "row " + i + " has an id");
    });
    
  });
  
  module("Type Checking");
  
  test("Check Boolean type", function() {
    var bTValue = true,
        bFValue = false;
    ok(DS.typeOf(bTValue)=="boolean", "Value should be boolean");
    ok(DS.typeOf(bFValue)=="boolean", "Value should be boolean");
  });

  test("Check number type", function() {
    var value = 12,
        value2 = 0;
    ok(DS.typeOf(value)=="number", "Value should be number");
    ok(DS.typeOf(value2)=="number", "Value should be number");
  });

  test("Check number type", function() {
    var value = "cats",
        value2 = "";
    ok(DS.typeOf(value)=="string", "Value should be string");
    ok(DS.typeOf(value2)=="string", "Value should be string");
  });

  module("Calculated Values");
  (function() {
    var obj = [{a: 'test', b: 4}, {a: 6.231, b: 2}];
    var ds = new DS({ data : obj });

    test("min function", function() {
      equal( 2 , ds.min() , "Miniumum value is 2" )
    });

    test("max function", function() {
      equal( 6.231 , ds.max() , "Maximum value is 6.231" )
    });
  }())

});
