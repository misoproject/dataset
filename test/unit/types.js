module("DS Numeric Type");
(function() {
  var numbers = ['123', '0.34', '.23'];

  test("Check number type", function() {
    var notNumbers = ['a', undefined, {}, 'll22'];

    _.each(numbers, function(num) {
      ok(DS.typeOf(num) == "number", "Value should be number");
      ok(DS.types.number.test(num), "Should return true for a number");
    });

    _.each(notNumbers, function(nn) {
      ok(DS.typeOf(nn) != "number", "Value should not be number");
      ok(!DS.types.number.test(nn), "Should not return true for a number");
    });
  });

  test("Coerce number type", function() {
    var coerced = [123, 0.34, 0.23];
    _.each(numbers, function(num, i) {
      equals(DS.types.number.coerce(num), coerced[i], "Should return true for a number");
    });
  });

  test("Compare number type", function() {
    equals(DS.types.number.compare(10,20), -1);
    equals(DS.types.number.compare(20,10),  1);
    equals(DS.types.number.compare(10,10),  0);
    equals(DS.types.number.compare(20,200),  -1);
    equals(DS.types.number.compare(0, 0),  0);
    equals(DS.types.number.compare(-30, -40),  1);
    equals(DS.types.number.compare(-30, 0),  -1);
  });

}());

module("DS Boolean Type");
(function() {
  var booleans = ['true', 'false', true];

  test("Check boolean type", function() {
    var notBooleans = [1, 'foo', null, undefined, {}];
    _.each(booleans, function(bool) {
      ok(DS.typeOf(bool) == "boolean", "Value should be boolean");
      ok(DS.types.boolean.test(bool), "Should return true for a bool");
    });
    _.each(notBooleans, function(nb) {
      ok(DS.typeOf(nb) != "boolean", nb+" Value should not be number");
      ok(!DS.types.boolean.test(nb), nb+" Should not return true for a boolean");
    });
  });

  test("Coerce boolean type", function() {
    var coerced = [true, false, true];
    _.each(booleans, function(num, i) {
      equals(DS.types.boolean.coerce(num), coerced[i], "Should return true for a boolean");
    });
  });

  test("Compare boolean type", function() {
    var results = [0, -1];
    _.each([true, false], function(num, i) {
      equals(DS.types.boolean.compare(num, true), results[i], "Should return true for a boolean");
    });
  });

  test("Numeric conversion", function() {
    equals(DS.types.boolean.numeric(true), 1, "True returns 1");
    equals(DS.types.boolean.numeric(false), 0, "False returns 0");
  });

}());

module("DS Time Type");
(function() {
  test("Check date type", function() {
    ok(DS.types.time.test("22/22/2001"), "date in correct format");
    ok(!DS.types.time.test("20"), "date incorrect format");
  });

  test("Compare date type", function() {
    var m = moment("2011/05/01",  "YYYY/MM/DD"),
    m2 = moment("2011/05/05", "YYYY/MM/DD"),
    m3 = moment("2011/05/01", "YYYY/MM/DD");

    equals(DS.types.time.compare(m,m2), -1);
    equals(DS.types.time.compare(m2,m),  1);
    equals(DS.types.time.compare(m3,m),  0);
  });


}());

module("DS String Type");
test("Compare string type", function() {
  equals(DS.types.string.compare("A", "B"), -1);
  equals(DS.types.string.compare("C", "B"),  1);
  equals(DS.types.string.compare("bbb", "bbb"),  0);
  equals(DS.types.string.compare("bbb", "bbbb"),  -1);
  equals(DS.types.string.compare("bbb", "bbbb"),  -1);
  equals(DS.types.string.compare("bbbb", "bbb"),  1);
  equals(DS.types.string.compare("bbb", "bbb"),  0);
});



