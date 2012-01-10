module("Events");

(function() {
  var ds = new DS({}),
      result = 0,
      increment = function(by) {
        by = (by || 1);
        result += by;
      };

  test("binding and firing an event", function() {
    ds.bind('ping', increment);
    ds.trigger('ping');
    equal(1, result);
  });

}());
