$(document).ready(function() {

  module("Extracting Data");

  (function() {
    var data = {
      "columns" : [{ "name" : "one", "type" : "integer" }],
      "rows" : [ 
        {"data" : [1] }, 
        {"data" : [2] } 
      ]
    };
    var ds = new DS({ data : data, strict : true }),
        rid1 = ds._rows[0]._id,
        rid2 = ds._rows[1]._id;

    test("getting values", function() {
      equal(1, ds.get(rid1, "one"), "Can get the first value in the one column" )
      equal(2, ds.get(rid2, "one"), "Can get the second value in the one column" )
    });

    test("filtering to rows via filter:row", function() {
      var sub = ds.filter({ row : 1 }),
          rid = sub._rows[0]._id;
      equal( sub.get(rid, "one") , ds.get(rid, "one"), "Same data exists in sub dataset" )
    });

    test("filtering to rows via filter:rows", function() {
      var sub = ds.filter({ rows : [0, 1] }),
          rid1 = sub._rows[0]._id,
          rid2 = sub._rows[0]._id;
      equal( sub.get(rid1, "one") , ds.get(rid1, "one"), "Same data exists in sub dataset" )
      equal( sub.get(rid2, "one") , ds.get(rid2, "one"), "Same data exists in sub dataset" )
    });

    test("filtering to rows via rows", function() {
      var sub = ds.rows(1),
          rid = sub._rows[0]._id
      equal( sub.get(rid, "one") , ds.get(rid, "one"), "Same data exists in sub dataset" )
    });
  }());

  module("Setting values");
  (function() {

    test("Setting a single value", function() {
      var obj = [
        {"character" : "α", "name" : "alpha", "is_modern" : true, "numeric_value" : 1}, 
        {"character" : "ε", "name" : "epsilon", "is_modern" : false, "numeric_value" : 5}
      ];
        
      var ds = new DS({ data : obj }),
          rid = ds._rows[0]._id;

      ok(ds.get(rid, "character") === "α", "pre set character is correct");
      ds.set(rid, { "character" : "M" });
      ok(ds.get(rid, "character") === "M", "post set character is correct");
      
    });

    test("Setting a single value to the same value that already exists", function(){
      var obj = [
        {"character" : "α", "name" : "alpha", "is_modern" : true, "numeric_value" : 1}, 
        {"character" : "ε", "name" : "epsilon", "is_modern" : false, "numeric_value" : 5}
      ];
        
      var ds = new DS({ data : obj }),
          rid = ds._rows[0]._id;

      ok(ds.get(rid, "character") === "α", "pre set character is correct");
      ds.set(rid, { "character" : "α" });
      ok(ds.get(rid, "character") === "α", "post set character is correct");

      // TODO: check that things weren't triggered here in the future.
    });

    test("Setting multiple values", function() {
      var obj = [
        {"character" : "α", "name" : "alpha", "is_modern" : true, "numeric_value" : 1}, 
        {"character" : "ε", "name" : "epsilon", "is_modern" : false, "numeric_value" : 5}
      ];
        
      var ds = new DS({ data : obj }),
          rid = ds._rows[0]._id;

      ok(ds.get(rid, "character") === "α", "pre set character is correct");
      ok(ds.get(rid, "name") === "alpha", "pre set character is correct");
      ds.set(rid, { "character" : "M", "name" : "Em" });
      ok(ds.get(rid, "character") === "M", "post set character is correct");
      ok(ds.get(rid, "name") === "Em", "post set character is correct");
    });

    test("Basic Queuing works on Set", function() {
      var obj = [
        {"character" : "α", "name" : "alpha", "is_modern" : true, "numeric_value" : 1}, 
        {"character" : "ε", "name" : "epsilon", "is_modern" : false, "numeric_value" : 5}
      ];
        
      var ds = new DS({ data : obj }),
          rid = ds._rows[0]._id;

      ds.push();

      ok(ds._queing === true, "queing started");
      ok(ds.get(rid, "character") === "α", "pre set character is correct");
      ok(ds.get(rid, "name") === "alpha", "pre set character is correct");
      ds.set(rid, { "character" : "M", "name" : "Em" });
      ok(ds.get(rid, "character") === "M", "post set character is correct");
      ok(ds.get(rid, "name") === "Em", "post set character is correct");

      ok(ds._deltaQueue.length === 1, "There are deltas in the queue");
      // TODO: upgrade our underscore.js version, the current one doesn't have deep equal
      // which is needed here.
      // ok(_.deepEqual(ds._deltaQueue[0], {
        
      //   _id : rid,
      //   old : {
      //     "character" : "α",
      //     "name" : "alpha"
      //   },
      //   changed : {
      //     "character" : "M",
      //     "name" : "Em"
      //   }
      // }), "deltas are equal");

      ds.pop();
      ok(ds._queing === false, "no longer queing");
      ok(ds._deltaQueue.length === 0, "no deltas in the queue")
    });
      
    //TODO: add event related triggers here!

    //TODO: add subset related triggers here 
    // - changing value in parent
    //   should change values in sub datasets.
    // - changing value in sub dataset
    //   should change value in parent?
    // May need to think about this in great detail.

  })();



  module("Type Checking");
  (function() {
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
  })();

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
