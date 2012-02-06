module("Type Checking");

test("Check Boolean type", 2, function() {
  var bTValue = true,
      bFValue = false;
  ok(DS.typeOf(bTValue)=="boolean", "Value should be boolean");
  ok(DS.typeOf(bFValue)=="boolean", "Value should be boolean");
});

test("Check number type", 2, function() {
  var value = 12,
      value2 = 0;
  ok(DS.typeOf(value)=="number", "Value should be number");
  ok(DS.typeOf(value2)=="number", "Value should be number");
});

test("Check number type", 2, function() {
  var value = "cats",
      value2 = "";
  ok(DS.typeOf(value)=="string", "Value should be string");
  ok(DS.typeOf(value2)=="string", "Value should be string");
});

test("Check time type", 1, function() {
  var value = "2011/01/19";
  ok(DS.typeOf(value)=="time", "Value should be time");
});

module("Type Comparison");
test("Compare string type", function() {
  equals(DS.types.string.compare("A", "B"), -1);
  equals(DS.types.string.compare("C", "B"),  1);
  equals(DS.types.string.compare("bbb", "bbb"),  0);
  equals(DS.types.string.compare("bbb", "bbbb"),  -1);
  equals(DS.types.string.compare("bbb", "bbbb"),  -1);
  equals(DS.types.string.compare("bbbb", "bbb"),  1);
  equals(DS.types.string.compare("bbb", "bbb"),  0);
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

test("Compare date type", function() {
  var m = moment("2011/05/01",  "YYYY/MM/DD"),
      m2 = moment("2011/05/05", "YYYY/MM/DD"),
      m3 = moment("2011/05/01", "YYYY/MM/DD");

  equals(DS.types.time.compare(m,m2), -1);
  equals(DS.types.time.compare(m2,m),  1);
  equals(DS.types.time.compare(m3,m),  0);
});


module("Type raw extraction");
test("Numeric raw extraction", 2, function() {
  var ds = baseSample();
  equals(ds._columns[1].type, "number");
  equals(ds._columns[1].raw(1), ds._columns[1].data[1]);
});

test("String raw extraction", 2, function() {
  var ds = new DS.Dataset({
    data : DS.alphabet_strict,
    strict: true
  });
  equals(ds._columns[2].type, "string");
  equals(ds._columns[2].raw(1), 1);
});

test("Time raw extraction", 2, function() {
  var ds = new DS.Dataset({
    data : [
      { 'character' : '12/31 2012' },
      { 'character' : '01/31 2011' }
    ],
    columnTypes : {
      character : { type : 'time', format : 'MM/DD YYYY' }
    }
  });
  equals(ds._columns[1].type, "time");
  equals(ds._columns[1].raw(1), moment('01/31 2011', 'MM/DD YYYY').valueOf());
});