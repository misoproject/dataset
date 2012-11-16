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


  test("adding a row with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    ds.add( { one: 100 } );

    equals(ds._columns[1].data.length, 4, "row adding to 'one'");
    ok(!_.isUndefined(ds._rowIdByPosition[3]), "rowIdByPosition updated");
    _.each([1,2], function(i) {
      equals(ds._columns[i].data.length, 4, "column length increased on "+ds._columns[i].name);
      strictEqual(ds._columns[i].data[3], null, "null added to column "+ds._columns[i].name);
    });

    ok(_.isEqual(ds.rowById(100), { one : 100, two : null, three : null }));
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

  test("removing a row with an id with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var firstRowId = ds.rowByPosition(0).one;

    ds.remove(firstRowId);
    strictEqual( ds._rowPositionById[firstRowId], undefined );
    ok( ds._rowIdByPosition[0] !== firstRowId );
    equals(ds.length, 2);
  });

  test("updating a row with an incorrect type", function() {
    var ds = Util.baseSample();
    _.each(['a', []], function(value) {
      raises(function() {
        ds.update({ _id : ds._rowIdByPosition[0], one : value } );
      });
    });
  });

  test("updating a row", function() {
    var ds = Util.baseSample();
    ds._columns[1].type = 'mixed';
    var firstRowId = ds._rowIdByPosition[0];
    _.each([100, 'a', null, undefined, []], function(value) {
      ds.update({ _id : firstRowId, one: value });
      equals(ds._columns[1].data[0], value, "value updated to "+value);
    });
  });
 
    test("updating multiple rows", function() {
    var ds = Util.baseSample();
    ds._columns[1].type = 'mixed';
    var firstRowId = ds._rowIdByPosition[0];
    var secondRowId = ds._rowIdByPosition[1];
    _.each([100, 'a', null, undefined, []], function(value) {
      ds.update([{ _id : firstRowId, one: value },{ _id : secondRowId, one: value }]);
      equals(ds._columns[1].data[0], value, "value updated to "+value);
      equals(ds._columns[1].data[1], value, "value updated to "+value);
    });
  });
 

  test("updating a row with custom idAttribute (non id column)", function() {
    var ds = Util.baseSampleCustomID();
    ds._columns[1].type = 'mixed';
    var firstRowId = ds.rowByPosition(0).one;

    _.each([100, 'a', null, undefined, []], function(value) {
      ds.update({ one : firstRowId, two: value } );
      equals(ds._columns[1].data[0], value, "value updated to "+value);
    });
  });

  test("updating a row with a custom idAttribute (updating id col)", 1, function() {
    var ds = Util.baseSampleCustomID();

    raises(function() {
      ds.update({ one : 99});
    }, "You can't update the id column");

  });

  test("#105 - updating a row with a function", function() {
    var ds = Util.baseSample();
    ds.update(function(row) {
      return {
        one : row.one % 2 === 0 ? 100 : 0,
        two : row.two % 2 === 0 ? 100 : 0,
        three : row.three % 2 === 0 ? 100 : 0,
        _id : row._id
      };
    });

    ok(_.isEqual(ds.column("one").data, [0,100,0]));
    ok(_.isEqual(ds.column("two").data, [100,0,100]));
    ok(_.isEqual(ds.column("three").data, [0,100,0]));
  });

   test("#105 - updating a row with a function skips a row when false is returned", function() {
    var ds = Util.baseSample();
    ds.update(function(row) {
      if (row.one === 1) {
        return false;
      }
      return {
        one : row.one % 2 === 0 ? 100 : 0,
        two : row.two % 2 === 0 ? 100 : 0,
        three : row.three % 2 === 0 ? 100 : 0,
        _id : row._id
      };
    });

    ok(_.isEqual(ds.column("one").data, [1,100,0]));
    ok(_.isEqual(ds.column("two").data, [4,0,100]));
    ok(_.isEqual(ds.column("three").data, [7,100,0]));
  });


  module("Computed Columns");
  test("Add computed column to empty dataset", function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [] },
        { name : "two",   data : [] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });

      ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]));      
    });

  });

  test("Add a computed column with a bogus type - should fail", 3, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [] },
        { name : "two",   data : [] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      raises(function() {
        ds.addComputedColumn("three", "NOTYPE", function(row) {
          return row.one + row.two;
        });
      }, "The type NOTYPE doesn't exist");

      ok(_.isEqual(ds.columnNames(), ["one", "two"]));
    });
  });

  test("Add a computed column with a name that already exists", 3, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [] },
        { name : "two",   data : [] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      raises(function() {
        ds.addComputedColumn("one", "number", function(row) {
          return row.one + row.two;
        });
      }, "There is already a column by this name.");

      ok(_.isEqual(ds.columnNames(), ["one", "two"]));
    });
  });

  test("Add computed column to dataset with values", 3, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      var newcol = ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });

      ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]));
      ok(_.isEqual(newcol.data, [11,22,33]));
    });
  });

  test("Add row to a dataset with one computed column", 5, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      var newcol = ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });

      ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]));
      ok(_.isEqual(newcol.data, [11,22,33]));

      // add a row
      ds.add({
        one : 4,
        two : 40
      });

      equals(newcol.data.length, 4);
      ok(_.isEqual(newcol.data, [11,22,33,44]), newcol.data);
    });
  });

  test("Add a row to a dataset with multiple computed columns one of which depends on a computed column", 8, function() {

    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      var newcol = ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });
      var newcol2 = ds.addComputedColumn("four", "number", function(row) {
        return row.one + row.two + row.three;
      });

      ok(_.isEqual(ds.columnNames(), ["one", "two", "three", "four"]));
      ok(_.isEqual(newcol.data, [11,22,33]));
      ok(_.isEqual(newcol2.data, [22,44,66]), newcol2.data);
      
      // add a row
      ds.add({
        one : 4,
        two : 40
      });

      equals(newcol.data.length, 4);
      equals(newcol2.data.length, 4);
      ok(_.isEqual(newcol.data, [11,22,33,44]), newcol.data);
      ok(_.isEqual(newcol2.data,  [22,44,66,88]), newcol2.data);
    });

  });

  test("Can't add a row with a computed column value.", 9, function() {

    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      var newcol = ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });
      var newcol2 = ds.addComputedColumn("four", "number", function(row) {
        return row.one + row.two + row.three;
      });

      ok(_.isEqual(ds.columnNames(), ["one", "two", "three", "four"]));
      ok(_.isEqual(newcol.data, [11,22,33]));
      ok(_.isEqual(newcol2.data, [22,44,66]), newcol2.data);
      
      // add a row
      raises(function() {
        ds.add({
          one : 4,
          two : 40,
          three: 34
        });  
      });
      
      equals(newcol.data.length, 3);
      equals(newcol2.data.length, 3);
      ok(_.isEqual(newcol.data, [11,22,33]), newcol.data);
      ok(_.isEqual(newcol2.data,  [22,44,66]), newcol2.data);
    });

  });

  test("Update a row in a dataset with a single computed column", 3, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      var newcol = ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });
      var newcol2 = ds.addComputedColumn("four", "number", function(row) {
        return row.one + row.two + row.three;
      });

      var firstId = ds.rowByPosition(0)._id;

      ds.update({ _id : firstId, one : 100 });

      ok(_.isEqual(newcol.data, [110,22,33]), newcol.data);
      ok(_.isEqual(newcol2.data,  [220,44,66]), newcol2.data);
    });
  });

  test("remove row and make sure computed column row is removed too", 2, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      var newcol = ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });

      var firstId = ds.rowByPosition(0)._id;
      ds.remove(firstId);

      ok(_.isEqual(newcol.data, [22,33]), newcol.data);
    });
  });

  test("check that syncable datasets notify properly of computed columns too during addition", 2, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true,
      sync: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });

      stop();
      ds.subscribe("add", function(event) {
        ok(event.deltas[0].changed.three === 44);
        start();
      });

      ds.add({
        one : 4,
        two : 40
      });

    });
  });

  test("check that syncable datasets notify properly of computed columns too during addition", 2, function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true,
      sync: true
    });

    ds.fetch().then(function() {
      ok(_.isEqual(ds.columnNames(), ["one", "two"]));

      ds.addComputedColumn("three", "number", function(row) {
        return row.one + row.two;
      });

      stop();
      ds.subscribe("change", function(event) {
        ok(event.deltas[0].changed.three === 110);
        start();
      });

      ds.update({
        _id : ds.rowByPosition(0)._id,
        one : 100
      });

    });
  });

  module("Custom idAttribute");

  test("Specify custom idAttribute", function() {
    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1,2,3] },
        { name : "two",   data : [10,20,30] }
      ]},
      strict: true,
      idAttribute: 'one'
    });
    ds.fetch().then(function() {
      ok(_.isEqual(ds.rowById(1), { one : 1, two : 10 }));
      ok(_.isEqual(ds.rowById(2), { one : 2, two : 20 }));
      ok(_.isEqual(ds.rowById(3), { one : 3, two : 30 }));
    });
  });
}(this));
