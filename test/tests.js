$(document).ready(function() {

  module("Dataset Construction");

  test("Creating a DS instance from strict JSON", function() {
    var data = {
      "columns" : [{ "name" : "one", "type" : "Integer" }],
      "rows" : [ 
        {"data" : [1] }, 
        {"data" : [2] } 
      ]
    };
    ds = new DS({ data : data, strict : true });

    ok( 
      ( ds._options.data === undefined ),
      "Data doesn't still exist in the options object"
    );

    equal(1, ds.get(0, "one"), "Can get the first value in the one column" )
    equal(2, ds.get(1, "one"), "Can get the second value in the one column" )

  });


});
