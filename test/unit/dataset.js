(function(global) {
  
  var Util  = global.Util;
  var DS    = global.DS || {};

  module("Dataset functions");

  test("adding a row", function() {
    var ds = Util.baseSample();
    ds.add( { one: 10 } );

    equals(ds._columns[1].data.length, 4, "row adding to 'one'");
    ok(!_.isUndefined(ds._rowIdByPosition[3]), "rowIdByPosition updated");
    _.each([2,3], function(i) {
      equals(ds._columns[i].data.length, 4, "column length increased on "+ds._columns[i].name);
      strictEqual(ds._columns[i].data[3], null, "null added to column "+ds._columns[i].name);
    });
  });

  test("removing a row with a function", function() {
    var ds = Util.baseSample();
    var firstRowId = ds._rowIdByPosition[0];
    ds.remove(function(row) { return (row.one === 1); });
    strictEqual( ds._rowPositionById[firstRowId], undefined );
    ok( ds._rowIdByPosition[0] !== firstRowId );
    equals(ds.length, 2);
  });


  test("removing a row with an id", function() {
    var ds = Util.baseSample();
    var firstRowId = ds._rowIdByPosition[0];
    ds.remove(firstRowId);
    strictEqual( ds._rowPositionById[firstRowId], undefined );
    ok( ds._rowIdByPosition[0] !== firstRowId );
    equals(ds.length, 2);
  });

  test("upating a row with an incorrect type", function() {
    var ds = Util.baseSample();
    _.each(['a', null, undefined, []], function(value) {
      raises(function() {
        ds.update(ds._rowIdByPosition[0], { 'one' : value } );
      });
    });
  });

  test("updating a row", function() {
    var ds = Util.baseSample();
    ds._columns[1].type = 'untyped';
    var firstRowId = ds._rowIdByPosition[0];
    _.each([100, 'a', null, undefined, []], function(value) {
      ds.update(firstRowId, { 'one': value } );
      equals(ds._columns[1].data[0], value, "value updated to "+value);
    });
  });
}(this));