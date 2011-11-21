$(document).ready(function() {
  
  module("Events");

  (function() {
    var obj = { "metadata" : {"name" : "Greek Alphabet" },
  "columns" : [ 
    {"name" : "character", "type" : "string"}, 
    {"name" : "is_modern", "type" : "boolean"}, 
    {"name" : "name", "type" : "string"}, 
    {"name" : "numeric_value", "type" : "number"} 
  ],
  "rows" : [   
    { data : ["α","alpha",true,1] },
    { data : ["β","beta",true,2] },
    { data : ["γ","gamma",true,3] },
    { data : ["δ","delta",true,4] },
    { data : ["ε","epsilon",false,5] }]};

    var ds = new DS({ data : obj, strict : true });

    test("basic event binding on entire dataset", function() {
      expect(1);
      ds.bind("sampleevent", null, function() {
        ok(true, "sample event was triggered!");
      });
      ds.trigger("sampleevent");
    });

    test("basic binding on specific row", function() {
      expect(1);
      ds.bind("sampleevent2", {row : ds._rows[0]._id} , function() {
        ok(true, "sampleevent2 triggered with row 1");
      });
      ds.trigger("sampleevent2", { row : ds._rows[0]._id });
    });

    test("basic binding on specific row from array ", function() {
      expect(1);
      ds.bind("sampleevent3", {row : ds._rows[0]._id} , function() {
        ok(true, "sampleevent3 triggered with row 1");
      });
      ds.trigger("sampleevent3", { row : [ds._rows[0]._id, ds._rows[1]._id] });
    });

    test("basic binding on specific row from array reverse", function() {
      expect(1);
      ds.bind("sampleevent4", {row : [ds._rows[0]._id, ds._rows[1]._id]} , function() {
        ok(true, "sampleevent4 triggered with row 1");
      });
      ds.trigger("sampleevent4", { row : ds._rows[0]._id });
    });

    test("multiple subscribers", function() {
      expect(2);
      ds.bind("s1", {row : [ds._rows[0]._id, ds._rows[1]._id]} , function() {
        ok(true, "s1 triggered callback 1");
      });
      ds.bind("s1", {row : [ds._rows[0]._id, ds._rows[1]._id]} , function() {
        ok(true, "s1 triggered callback2");
      });
      ds.trigger("s1", { row : ds._rows[0]._id });
    });

    // TODO: sort out why this is still triggering!
    test("out of range shouldn't trigger", function() {
      expect(0);
      ds.bind("s2", {row : [ds._rows[0]._id, ds._rows[1]._id]} , function() {
        ok(true, "s2 triggered callback 1");
      });
      ds.trigger("s2", { row : ds._rows[2]._id });
    });
  }());

});
