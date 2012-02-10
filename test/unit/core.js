module("Type raw extraction");
test("Numeric raw extraction", 2, function() {
  var ds = baseSample();
  equals(ds._columns[1].type, "number");
  window.foobar = ds._columns[1]
  equals(ds._columns[1].numericAt(1), ds._columns[1].data[1]);
});

test("String raw extraction", 2, function() {
  var ds = new DS.Dataset({
    data : DS.alphabet_strict,
    strict: true
  });
  equals(ds._columns[2].type, "string");
  equals(ds._columns[2].numericAt(1), 1);
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
  equals(ds._columns[1].numericAt(1), moment('01/31 2011', 'MM/DD YYYY').valueOf());
});
