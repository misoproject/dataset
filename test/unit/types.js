(function(global) {
  
  var Util  = global.Util;
  var Miso    = global.Miso || {};  

  var numbers = ['123', '0.34', '.23'];
  var not_numbers = [null, NaN,undefined];


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

  test("Check all non numeric values return null on numeric", function() {
    expect(10);

    _.each(Miso.types, function(type) {
      // not checking undefined - we either coerrced it out and can't computationally
      // derive it like a NaN
      _.each([NaN, null], function(not_a_number) {
        ok(type.numeric(not_a_number) === null, "["+type.name+"] " + not_a_number + " is represented as " + type.numeric(not_a_number));
      });
    });
  });

  test("Check all non numeric values return null on coerce", function() {
    expect(15);

    _.each(Miso.types, function(type) {
      _.each(not_numbers, function(not_a_number) {
        ok(type.coerce(not_a_number) === null, "["+type.name+"] " + not_a_number + " is represented as " + type.coerce(not_a_number));
      });
    });
  });


  test("Coerce number type", function() {
    var coerced = [123, 0.34, 0.23];
    _.each(numbers, function(num, i) {
      equals(Miso.types.number.coerce(num), coerced[i], "Should return true for a number");
    });
  });


  test("Coerce to null", function() {
    var coerced = ['foo', undefined, NaN, {}];
    _.each(coerced, function(num, i) {
      equals(Miso.types.number.coerce(coerced[i]), null, "Should return null for invalid input");
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

  test("Check weird types", function() {
    equals(Miso.types.string.compare(null, "a"), -1);
    equals(Miso.types.string.compare("a", null), 1);
    equals(Miso.types.string.compare(null, null), 0);
    equals(Miso.types.string.compare(null, undefined), 0);
    equals(Miso.types.string.compare(undefined, undefined), 0);
    equals(Miso.types.string.compare(undefined, null), 0);

    equals(Miso.types.number.compare(null, 1), -1);
    equals(Miso.types.number.compare(null, 0), -1);
    equals(Miso.types.number.compare(1, null), 1);
    equals(Miso.types.number.compare(0, null), 1);
    equals(Miso.types.number.compare(null, null), 0);
    equals(Miso.types.number.compare(null, undefined), 0);
    equals(Miso.types.number.compare(undefined, undefined), 0);
    equals(Miso.types.number.compare(undefined, null), 0);

    equals(Miso.types.boolean.compare(null, true), -1);
    equals(Miso.types.boolean.compare(true, null), 1);
    equals(Miso.types.boolean.compare(null, null), 0);
    equals(Miso.types.boolean.compare(null, undefined), 0);
    equals(Miso.types.boolean.compare(undefined, undefined), 0);
    equals(Miso.types.boolean.compare(undefined, null), 0);

    equals(Miso.types.time.compare(null, moment()), -1);
    equals(Miso.types.time.compare(moment(), null), 1);
    equals(Miso.types.time.compare(null, null), 0);
    equals(Miso.types.time.compare(null, undefined), 0);
    equals(Miso.types.time.compare(undefined, undefined), 0);
    equals(Miso.types.time.compare(undefined, null), 0);
  });

  module("Miso Time Type");

  test("Check date parsing formats", function() {
    var testtimes = [
      { input : "2011", format : "YYYY" },
      { input : "11", format : "YY" },
      { input : "2011/03", format : "YYYY/MM" },
      { input : "2011/04/3", format : "YYYY/MM/D" },
      { input : "2011/04/30", format : "YYYY/MM/D" },
      { input : "2011/04/30", format : "YYYY/MM/D" },
      { input : "20110430", format : "YYYYMMD" },
      { input : "20110430", format : "YYYYMMDD" },
      { input : "2011/4/03", format : "YYYY/M/DD" },
      { input : "2011/4/30", format : "YYYY/M/DD" },
      { input : "2011/6/2", format : "YYYY/M/D" },
      { input : "2011/6/20", format : "YYYY/M/D" },
      { input : "2011/6/20 4PM", format : "YYYY/M/D hA" },
      { input : "2011/6/20 4PM", format : "YYYY/M/D hhA" },
      { input : "2011/6/20 12PM", format : "YYYY/M/D hA" },
      { input : "12PM", format : "hA" },
      { input : "12:30 PM", format : "h:m A" },
      { input : "5:05 PM", format : "h:m A" },
      { input : "12:05 PM", format : "hh:mm A" },
      { input : "-04:00", format : "Z" },
      { input : "+04:00", format : "Z" },
      { input : "-0400", format : "ZZ" },
      { input : "+0400", format : "ZZ" },
      { input : "AM -04:00", format : "A Z" },
      { input : "PM +04:00", format : "A Z" },
      { input : "AM -0400", format : "A ZZ" },
      { input : "PM +0400", format : "A ZZ" },
      { input : "12:05 -04:00", format : "hh:mm Z" },
      { input : "12:05 +04:00", format : "hh:mm Z" },
      { input : "12:05 -0400", format : "hh:mm ZZ" },
      { input : "12:05 +0400", format : "hh:mm ZZ" },
      { input : "12:05:30 +0400", format : "hh:mm:s ZZ" },
      { input : "12:05:30 -0400", format : "hh:mm:ss ZZ" }
    ];
    _.each(testtimes, function(t) {
      ok(Miso.types.time.test(t.input, {format : t.format}), t.input);
      ok(Miso.types.time.coerce(t.input, {format:t.format}).valueOf(), moment(t.input, t.format).valueOf());
    });
  });

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

  test("String type returns 0 or coerced form", function() {
    equals(Miso.types.string.numeric("A"), null);
    equals(Miso.types.string.numeric(null), null);
    equals(Miso.types.string.numeric("99"), 99);
    equals(Miso.types.string.numeric("99.3"), 99.3);
  });
}(this));


