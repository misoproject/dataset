$(document).ready(function() {

  module("Dataset Construction");

  test("Creating a DS instance from strict JSON", function() {
    var data = {
      "columns" : [{ "name" : "one", "type" : "Integer" }],
      "rows" : [ 
        {"data" : {"one" : 1 } }, 
        {"data" : {"one" : 2 } } 
      ]
    };
    var ds = new DS({ data : data, strict : true });
    //TODO some actual tests
  });
  
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
  
  module("Type Checkigng");
  
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

});
