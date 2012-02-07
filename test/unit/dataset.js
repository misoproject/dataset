module("Dataset functions");

test("adding a row", function() {
  var ds = baseSample();
  ds.add( { one: 10 } );

  equals(ds._columns[1].data.length, 4, "row adding to 'one'");
  ok(!_.isUndefined(ds._rowIdByPosition[3]), "rowIdByPosition updated");
  _.each([2,3], function(i) {
    equals(ds._columns[i].data.length, 4, "column length increased on "+ds._columns[i].name);
    strictEqual(ds._columns[i].data[3], null, "null added to column "+ds._columns[i].name);
  });
});

test("removing a row with a function", function() {
  var ds = baseSample();
  var firstRowId = ds._rowIdByPosition[0];
  ds.remove(function(row) { return (row.one === 1); });
  strictEqual( ds._rowPositionById[firstRowId], undefined );
  ok( ds._rowIdByPosition[0] !== firstRowId );
  equals(ds.length, 2);
});


test("removing a row with an id", function() {
  var ds = baseSample();
  var firstRowId = ds._rowIdByPosition[0];
  ds.remove(firstRowId);
  strictEqual( ds._rowPositionById[firstRowId], undefined );
  ok( ds._rowIdByPosition[0] !== firstRowId );
  equals(ds.length, 2);
});

test("upating a row with an incorrect type", function() {
  var ds = baseSample();
  _.each(['a', null, undefined, []], function(value) {
    raises(function() {
      ds.update(ds._rowIdByPosition[0], { 'one' : value } );
    });
  });
});

test("updating a row", function() {
  var ds = baseSample();
  ds._columns[1].type = 'untyped';
  var firstRowId = ds._rowIdByPosition[0];
  _.each([100, 'a', null, undefined, []], function(value) {
    ds.update(firstRowId, { 'one': value } );
    equals(ds._columns[1].data[0], value, "value updated to "+value);
  });
});


module("Type Comparison");
(function() {
  
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


})();

