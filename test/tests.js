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
