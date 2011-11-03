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

});
