(function(global) {
  
  var Util  = global.Util;
  var Miso    = global.Miso || {};  

  var numbers = ['123', '0.34', '.23'];
  
  module("Miso Numeric Type");
  test("Check number type", function() {
    var notNumbers = ['a', {}, 'll22'];

    _.each(numbers, function(num) {
      ok(Miso.typeOf(num) === "number", "Value should be number");
      ok(Miso.types.number.test(num), "Should return true for a number");
    });

    _.each(notNumbers, function(nn) {
      ok(Miso.typeOf(nn) !== "number", "Value should not be number " + nn);
      ok(!Miso.types.number.test(nn), "Should not return true for a number " + nn);
    });
  });

  test("Coerce number type", function() {
    var coerced = [123, 0.34, 0.23];
    _.each(numbers, function(num, i) {
      equals(Miso.types.number.coerce(num), coerced[i], "Should return true for a number");
    });
  });

  test("Compare number type", function() {
    equals(Miso.types.number.compare(10,20), -1);
    equals(Miso.types.number.compare(20,10),  1);
    equals(Miso.types.number.compare(10,10),  0);
    equals(Miso.types.number.compare(20,200),  -1);
    equals(Miso.types.number.compare(0, 0),  0);
    equals(Miso.types.number.compare(-30, -40),  1);
    equals(Miso.types.number.compare(-30, 0),  -1);
  });


  module("Miso Boolean Type");

  var booleans = ['true', 'false', true];

  test("Check boolean type", function() {
    var notBooleans = [1, 'foo', {}];
    _.each(booleans, function(bool) {
      ok(Miso.typeOf(bool) === "boolean", "Value should be boolean");
      ok(Miso.types.boolean.test(bool), "Should return true for a bool");
    });
    _.each(notBooleans, function(nb) {
      ok(Miso.typeOf(nb) !== "boolean", nb+" Value should not be number");
      ok(!Miso.types.boolean.test(nb), nb+" Should not return true for a boolean");
    });
  });

  test("Coerce boolean type", function() {
    var coerced = [true, false, true];
    _.each(booleans, function(num, i) {
      equals(Miso.types.boolean.coerce(num), coerced[i], "Should return true for a boolean");
    });
  });

  test("Compare boolean type", function() {
    var results = [0, -1];
    _.each([true, false], function(num, i) {
      equals(Miso.types.boolean.compare(num, true), results[i], "Should return true for a boolean");
    });
  });

  test("Numeric conversion", function() {
    equals(Miso.types.boolean.numeric(true), 1, "True returns 1");
    equals(Miso.types.boolean.numeric(false), 0, "False returns 0");
  });

  module("Miso Time Type");

  test("Check date type", function() {
    ok(Miso.types.time.test("22/22/2001"), "date in correct format");
    ok(!Miso.types.time.test("20"), "date incorrect format");
  });

  test("Compare date type", function() {
    var m = moment("2011/05/01",  "YYYY/MM/DD"),
    m2 = moment("2011/05/05", "YYYY/MM/DD"),
    m3 = moment("2011/05/01", "YYYY/MM/DD");

    equals(Miso.types.time.compare(m,m2), -1);
    equals(Miso.types.time.compare(m2,m),  1);
    equals(Miso.types.time.compare(m3,m),  0);
  });

  module("Miso String Type");
  test("Compare string type", function() {
    equals(Miso.types.string.compare("A", "B"), -1);
    equals(Miso.types.string.compare("C", "B"),  1);
    equals(Miso.types.string.compare("bbb", "bbb"),  0);
    equals(Miso.types.string.compare("bbb", "bbbb"),  -1);
    equals(Miso.types.string.compare("bbb", "bbbb"),  -1);
    equals(Miso.types.string.compare("bbbb", "bbb"),  1);
    equals(Miso.types.string.compare("bbb", "bbb"),  0);
  });
}(this));


