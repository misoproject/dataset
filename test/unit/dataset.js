(function(global) {
  
  var Util  = global.Util;
  var Miso    = global.Miso || {};

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

  test("adding a row with wrong types", function() {
    var ds = Util.baseSample();
    raises(function() {
      ds.add( { one: 'a', two : 5, three : [] } ); 
      ds.add( { two : 5, three : [] } );   
      ds.add( { three : [] } );  
      ds.add( { one: 'a' } );
    });
    
    ds.add( { one: 5 } );
    equals(ds._columns[1].data.length, 4, "row adding to 'one'");
    equals(ds._columns[2].data.length, 4, "row adding to 'two'");
    equals(ds._columns[3].data.length, 4, "row adding to 'three'");
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
    _.each(['a', []], function(value) {
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

  test("#105 - updating a row with a function", function() {
    var ds = Util.baseSample();
    ds.update(function(row) {
      return true;
    }, function(row) {
      return {
        one : row.one % 2 === 0 ? 100 : 0,
        two : row.two % 2 === 0 ? 100 : 0,
        three : row.three % 2 === 0 ? 100 : 0
      };
    });

    ok(_.isEqual(ds.column("one").data, [0,100,0]));
    ok(_.isEqual(ds.column("two").data, [100,0,100]));
    ok(_.isEqual(ds.column("three").data, [0,100,0]));
  });
}(this));