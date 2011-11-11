$(document).ready(function() {

  module("Extracting Data");
  var data = {
      "columns" : [{ "name" : "one", "type" : "Integer" }],
      "rows" : [ 
        {"data" : [1] }, 
        {"data" : [2] } 
      ]
  };
  ds = new DS({ data : data, strict : true });

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
    console.log('ss', sub);
  });

  test("filtering to rows via rows", function() {
    var sub = ds.rows(1);
    equal( sub.get(0, "one") , ds.get(1, "one"), "Same data exists in sub dataset" )
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


});
