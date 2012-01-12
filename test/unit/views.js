function baseSample() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [1, 2, 3] },
      { name : "two",   data : [4, 5, 6] },
      { name : "three", data : [7, 8, 9] } 
    ] },
    strict: true
  });
  return ds;
}

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
    console.log(ds, view);

    equals(view._columns.length, 2, "there is only one data column"); //one column + _id
    _.each(view._columns[0].data, function(d,i) {
      equals(d, ds._columns[0].data[i], "data matches parent");
    });
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
        
        var event = DS.Events.buildEvent("change", delta);

        // trigger view sync with delta
        // view.sync(delta);
        ds.trigger("change", event);

        // make sure view updated
        ok(view._columns[colPos].data[0] === 100, "view was updated.");
      })
    }, this);
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

    var event = DS.Events.buildEvent("change", delta);

    // trigger dataset change
    ds.trigger("change", event);

    // verify both views have updated
    ok(view._columns[1].data[0] === 100, "first view updated");
    ok(deepview._columns[1].data[0] === 100, "second view updated");
    ok(superdeepview._columns[1].data[0] === 100, "third view updated");
  });

  test("Removing Row", function() {
    var ds = baseSample();
    var colname = ds._columns[1].name;
    var rowPos = 0;

    // make a view for first two rows
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]]
    });
  });