module("Views");

  test("Basic View creation", function() {
    var ds = baseSample();
    var view = ds.where({});
    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data, view._columns[i].data), "data has been copied");  
    });
   });

  test("One Row Filter View creation", function() {
    var ds = baseSample();
    var view = ds.where({
      rows : [ds._columns[0].data[0]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");  
    });
  });

  test("Two Row Filter View creation", function() {
    var ds = baseSample();
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 2), view._columns[i].data), "data has been copied");  
    });
  });

  test("Function Row Filter View creation", function() {
    var ds = baseSample();
    var view = ds.where({
      rows : function(row) {
        return row._id === ds._columns[0].data[0];
      }
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");
    });
  });

  test("Column View creation", function() {
    var ds = baseSample();
    var view = ds.column("one");

    equals(view._columns.length, 2, "there is only one data column"); //one column + _id
    _.each(view._columns[0].data, function(d,i) {
      equals(d, ds._columns[0].data[i], "data matches parent");
    });
  });

  test("Columns View creation", function() {
    var ds = baseSample();
    var view = ds.columns( [ 'one', 'two' ] );

    equals(view._columns.length, 3, "two data columns + _id"); //one column + _id
    _.each(view._columns, function(column, columnIndex) {
      _.each(column.data, function(d, rowIndex) {
        equals(d, ds._columns[columnIndex].data[rowIndex], "data matches parent");
      });
    });
  });

  test("Select by columns and rows", function() {
    var ds = baseSample();
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]],
      columns : [ 'one' ]
    });

    equals(view.length, 2, "view has two rows");
    equals(view._columns.length, 2, "view has one column"); //id column + data column
    _.each(view._columns[1].data, function(d, rowIndex) {
      equals(d, ds._columns[1].data[rowIndex], "data matches parent");
    });
  });

  test("get all column names minus the id col", function() {
    var ds = baseSample();
    ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]), "All column names fetched");  
  });

module("Views :: Rows Selection");

  test("Get row by position", function() {
    var ds = baseSample();
    var row = ds.rowByPosition(0);
    var expectedRow = {
      _id : ds._columns[0].data[0],
      one : 1,
      two : 4,
      three : 7
    };
    ok(_.isEqual(row, expectedRow), "Row by position is equal");
  });

  test("Get row internal", function() {
    var ds = baseSample();
    var row = ds._row(0);
    var expectedRow = {
      _id : ds._columns[0].data[0],
      one : 1,
      two : 4,
      three : 7
    };
    ok(_.isEqual(row, expectedRow), "Row by internal is equal");
  });

  test("Get row by _id", function() {
    var ds = baseSample();
    var row = ds.rowById(ds._columns[0].data[0]);
    var expectedRow = {
      _id : ds._columns[0].data[0],
      one : 1,
      two : 4,
      three : 7
    };
    ok(_.isEqual(row, expectedRow), "Row by _id is equal");
  });

module("Views :: Syncing");

  test("Basic sync of dataset changes", function() {
    var ds = baseSample();
    _.each(ds._columns.slice(1,4), function(column, i) {
      _.each(column.data, function(oldVal, rowPos) {
        var rowId = ds._columns[0].data[rowPos],
            colPos = i+1,
            col   = ds._columns[colPos].name;
          
        // make a view
        var view = ds.where({
          rows : [rowId]
        });   

        // make a manual change to dataset
        ds._columns[colPos].data[rowPos] = 100;

        // create delta to propagate
        var delta = {
          _id : rowId,
          old : {},
          changed : {}
        };
        delta.old[col] = oldVal;
        delta.changed[col] = 100;
        
        var event = DS.Events._buildEvent(delta);

        // trigger view sync with delta
        // view.sync(delta);
        ds.trigger("change", event);

        // make sure view updated
        ok(view._columns[colPos].data[0] === 100, "view was updated.");
      })
    }, this);
  });


  test("Sync of updates via the external API", function() {
    var ds = baseSample(),
        view1 = ds.column('one'),
        view2 = ds.column('two'),
        firstRowId = ds._rowIdByPosition[0],
        view3 = ds.where(firstRowId);

    ds.update(firstRowId, { one: 100, two: 200 });
    equals(view1._columns[1].data[0], 100);
    equals(view3._columns[1].data[0], 100);
    equals(view2._columns[1].data[0], 200);
  });

  test("Nested Syncing", function() {
    var ds = baseSample();
    var colname = ds._columns[1].name;
    var oldVal  = ds._columns[1].data[0];

    // make a view for first two rows
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]]
    });
    
    // make a view for first row of the first view
    var deepview = view.where({
      rows : [view._columns[0].data[0]]
    });

    var superdeepview = deepview.where({});

    // modify a value in the dataset's first row
    ds._columns[1].data[0] = 100;

    // create delta
    var delta = { _id : ds._columns[0].data[0], old : {}, changed : {} };
    delta.old[colname] = oldVal;
    delta.changed[colname] = 100;

    var event = DS.Events._buildEvent(delta);

    // trigger dataset change
    ds.trigger("change", event);

    // verify both views have updated
    ok(view._columns[1].data[0] === 100, "first view updated");
    ok(deepview._columns[1].data[0] === 100, "second view updated");
    ok(superdeepview._columns[1].data[0] === 100, "third view updated");
  });

  test("Basic row removal propagation", function() {
    var ds = baseSample();
    var colname = ds._columns[1].name;
    var rowPos = 0;

    // make a view for first two rows
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]]
    });

    // create delta for row deletion
    var delta = {
      _id : ds._columns[0].data[0],
      old : ds.rowByPosition(0),
      changed : {}
    };

    // create event representing deletion
    var event = DS.Events._buildEvent(delta);

    // delete actual row
    ds._remove( ds._rowIdByPosition[0] );
    ds.trigger("change", event);

    // verify view row was deleted as well
    ok(view.length === 1, "view is one element shorter");
    ok(view._columns[0].data[0] === ds._columns[0].data[0], "first row was delete");
  });

  test("row removal propagation via external API", function() {
    var ds = baseSample();
    var view = ds.column('one');

    ds.remove(function(row) {
      return (row.one === 1);
    });

    ok(view.length === 2, "row was removed from view");
    ok(ds.length === 2, "row was removed from dataset");

  });

  test("Basic row adding propagation", function() {
    var ds = baseSample();

    // create view with a function filter
    var view = ds.where({ rows : function(row) {
      return row.three > 5
    }});

    ok(view.length === 3, "all rows initially copied");

    // now add another row
    var newRow = {
      _id : 200, one : 4, two : 6, three : 20
    };

    var delta = {
      _id : 200,
      old : {},
      changed : newRow
    };

    // create event representing addition
    var event = DS.Events._buildEvent(delta);

    // for now, we aren't adding the actual data to the original dataset
    // just simulating that addition. Eventually when we ammend the api
    // with .add support, this can be refactored. better yet, added to.
    ds.trigger("change", event);

    ok(view.length === 4, "row was added");
    ok(_.isEqual(view.rowByPosition(3), newRow), "rows are equal");
  });

  test("Propagating row adding via external API", function() {
    var ds = baseSample();
    var view = ds.column('one');

    ds.add( { one: 10, two: 22 } );
    ok(view.length === 4, "row was added to view");
  });

  test("Basic row adding propagation - Not added when out of filter range", function() {
    var ds = baseSample();

    // create view with a function filter
    var view = ds.where({ rows : function(row) {
      return row.three > 5
    }});

    ok(view.length === 3, "all rows initially copied");

    // now add another row
    var newRow = {
      _id : _.uniqueId(), one : 4, two : 6, three : 1
    };

    var delta = {
      _id : newRow._id,
      old : {},
      changed : newRow
    };

    // create event representing addition
    var event = DS.Events._buildEvent(delta);

    // for now, we aren't adding the actual data to the original dataset
    // just simulating that addition. Eventually when we ammend the api
    // with .add support, this can be refactored. better yet, added to.
    ds.trigger("change", event);

    ok(view.length === 3, "row was NOT added");

    ok(_.isEqual(view.rowByPosition(2), ds.rowByPosition(2)), "last row in view hasn't changed.");
  })

module("Sort");

test("Sort fail", function() {
  var ds = baseSample();
  try {
    ds.sort();
    ok(false, "error should have been thrown.");
  } catch (e) {
    ok(e.message === "Cannot sort without this.comparator.");
  }
});

test("Basic Sort", function() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [10, 2, 3, 14, 3, 4] },
      { name : "two",   data : [4,  5, 6, 1,  1, 1] },
      { name : "three", data : [7,  8, 9, 1,  1, 1] } 
    ] },
    strict: true
  });
  
  ds.comparator = function(r1, r2) {
    if (r1.one > r2.one) return 1;
    if (r1.one < r2.one) return -1;
    return 0;
  }

  ds.sort();

  ok(_.isEqual(ds._columns[1].data, [2,3,3,4,10,14]));
  ok(_.isEqual(ds._columns[2].data, [5,6,1,1,4,1]));
  ok(_.isEqual(ds._columns[3].data, [8,9,1,1,7,1]));

});

test("Basic Sort reverse", function() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [10, 2, 3, 14, 3, 4] },
      { name : "two",   data : [4,  5, 6, 1,  1, 1] },
      { name : "three", data : [7,  8, 9, 1,  1, 1] } 
    ] },
    strict: true
  });
  
  ds.comparator = function(r1, r2) {
    if (r1.one > r2.one) return -1;
    if (r1.one < r2.one) return 1;
    return 0;
  }

  ds.sort();
  
  ok(_.isEqual(ds._columns[1].data, [2,3,3,4,10,14].reverse()));
  ok(_.isEqual(ds._columns[2].data, [5,6,1,1,4,1].reverse()));
  ok(_.isEqual(ds._columns[3].data, [8,9,1,1,7,1].reverse()));

});

test("Sort in init", function() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [10, 2, 3, 14, 3, 4] },
      { name : "two",   data : [4,  5, 6, 1,  1, 1] },
      { name : "three", data : [7,  8, 9, 1,  1, 1] } 
    ] },
    comparator : function(r1, r2) {
      if (r1.one > r2.one) return -1;
      if (r1.one < r2.one) return 1;
      return 0;
    },
    strict: true
  });
  
  ok(_.isEqual(ds._columns[1].data, [2,3,3,4,10,14].reverse()));
  ok(_.isEqual(ds._columns[2].data, [5,6,1,1,4,1].reverse()));
  ok(_.isEqual(ds._columns[3].data, [8,9,1,1,7,1].reverse()));
});

test("Add row in sorted order", function() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [10, 2, 3, 14, 3, 4] },
      { name : "two",   data : [4,  5, 6, 1,  1, 1] },
      { name : "three", data : [7,  8, 9, 1,  1, 1] } 
    ] },
    comparator : function(r1, r2) {
      if (r1.one > r2.one) return 1;
      if (r1.one < r2.one) return -1;
      return 0;
    },
    strict: true
  });

  ds.add({
    one : 5, two: 5, three: 5
  });

  ok(_.isEqual(ds._columns[1].data, [2,3,3,4,5,10,14]));
  ok(_.isEqual(ds._columns[2].data, [5,6,1,1,5,4,1]));
  ok(_.isEqual(ds._columns[3].data, [8,9,1,1,5,7,1]));

});

test("Add row in reverse sorted order", function() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [10, 2, 3, 14, 3, 4] },
      { name : "two",   data : [4,  5, 6, 1,  1, 1] },
      { name : "three", data : [7,  8, 9, 1,  1, 1] } 
    ] },
    comparator : function(r1, r2) {
      if (r1.one > r2.one) return -1;
      if (r1.one < r2.one) return 1;
      return 0;
    },
    strict: true
  });

  ds.add({
    one : 5, two: 5, three: 5
  });
  
  ok(_.isEqual(ds._columns[1].data, [2,3,3,4,5,10,14].reverse()));
  ok(_.isEqual(ds._columns[2].data, [5,6,1,1,5,4,1].reverse()));
  ok(_.isEqual(ds._columns[3].data, [8,9,1,1,5,7,1].reverse()));

});
