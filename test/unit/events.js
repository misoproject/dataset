(function(global) {
  
  var Util  = global.Util;
  var Miso    = global.Miso || {};
  
  module("Events");

  test("binding and firing an event", function() {

    var ds = new Miso.Dataset({
      data: { columns : [ { name: "one", data: [1,2] } ] },
      strict: true,
      sync : true
    }),
    result = 0,
    increment = function(by) {
      by = (by || 1);
      result += by;
    };

    ds.bind('ping', increment);

    result = 0;
    ds.trigger('ping', 1);
    equals(result, 1);
  });

  test("unbinding event", function() {
    var ds = new Miso.Dataset({
      data: { columns : [ { name: "one", data: [1,2] } ] },
      strict: true,
      sync : true
    }),
    result = 0,
    increment = function(by) {
      by = (by || 1);
      result += by;
    };

    ds.bind('ping', increment);

    ds.trigger('ping');
    ds.unbind('ping', increment);
    ds.trigger('ping');
    equals(result, 1);
  });

}(this));
