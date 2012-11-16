(function(global) {
  
  var Util  = global.Util;
  var Dataset = global.Miso.Dataset;

  module("Columns");

  test("Column selection", function() {
    var ds = Util.baseSample();
    var column = ds.column("one");
    var actualColumn = ds._columns[1];

    equals(column.type, actualColumn.type);
    equals(column.name, actualColumn.name);
    equals(column._id, actualColumn._id);
    ok(_.isEqual(column.data, actualColumn.data));

  });

  test("Column max", function() {
    var ds = Util.baseSample();
    var column = ds.column("one");
    equals(column._max(), 3);
  });

  test("Column min", function() {
    var ds = Util.baseSample();
    var column = ds.column("one");
    equals(column._min(), 1);
  });

  test("Column sum", function() {
    var ds = Util.baseSample();
    var column = ds.column("one");
    equals(column._sum(), 6);
  });

  test("Column median", function() {
    var ds = new Dataset({
      data : {
        columns : [
          { name : 'vals', data : [1,2,3,4,5,6,7,8,9,10] },
          { name : 'valsrandomorder', data : [10,2,1,5,3,8,9,6,4,7] },
          { name : 'randomvals', data : [19,4,233,40,10,39,23,47,5,22] }
        ]
      },
      strict : true
    });
    _.when(ds.fetch()).then(function(){
      equals(ds.column('vals')._median(), 5.5);
      equals(ds.column('valsrandomorder')._median(), 5.5); 
      equals(ds.column('randomvals')._median(), 22.5); 
    });
  });

  test("Column mean", function() {
    var ds = new Dataset({
      data : {
        columns : [
          { name : 'vals', data : [1,2,3,4,5,6,7,8,9,10] },
          { name : 'valsrandomorder', data : [10,2,1,5,3,8,9,6,4,7] },
          { name : 'randomvals', data : [19,4,233,40,10,39,23,47,5,22] }
        ]
      },
      strict : true
    });
    _.when(ds.fetch()).then(function(){
      equals(ds.column('vals')._mean(), 5.5);
      equals(ds.column('valsrandomorder')._mean(), 5.5); 
      equals(ds.column('randomvals')._mean(), 44.2); 
    });
  });

  test("Column before function", function() {
    var ds = new Dataset({
      data : {
        columns : [
          { name : 'vals', data : [1,2,3,4,5,6,7,8,9,10] }
        ]
      },
      columns : [
        { name : 'vals', type : 'number', before : function(v) {
            return v * 10;
        }}
      ],
      strict : true
    });
    
    _.when(ds.fetch()).then(function() {
      ok(_.isEqual(ds.sum("vals"), 550));
      ok(_.isEqual(ds.column("vals").data, [10,20,30,40,50,60,70,80,90,100]), ds.column("vals").data);
      ds.update({
        _id : ds._columns[0].data[0],
        vals : 4
      });
      equals(ds.column('vals').data[0], 40);
    });
  });

  module("Views");

  test("Basic View creation", function() {
    var ds = Util.baseSample();
    var view = ds.where({});
    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data, view._columns[i].data), "data has been copied");  
    });
   });

  test("Basic View creation with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({});
    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data, view._columns[i].data), "data has been copied");  
    });
   });


  test("One Row Filter View creation", function() {
    var ds = Util.baseSample();
    var view = ds.where({
      rows : [ds._columns[0].data[0]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");  
    });
  });

  test("One Row Filter View creation with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({
      rows : [ds._columns[0].data[0]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");  
    });
  });

 test("One Row Filter View creation with short syntax", function() {
    var ds = Util.baseSample();
    var view = ds.where(function(row) {
      return row._id === ds._columns[0].data[0];
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");  
    });
  });

  test("One Row Filter View creation with short syntax with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where(function(row) {
      return row.one === ds._columns[0].data[0];
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");  
    });
  });

  test("Two Row Filter View creation", function() {
    var ds = Util.baseSample();
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 2), view._columns[i].data), "data has been copied");  
    });
  });

  test("Two Row Filter View creation with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({
      rows : [ds.column('one').data[0], ds.column('one').data[1]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 2), view._columns[i].data), "data has been copied");  
    });
  });

  test("Function Row Filter View creation ", function() {
    var ds = Util.baseSample();
    var view = ds.where({
      rows : function(row) {
        return row._id === ds._columns[0].data[0];
      }
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");
    });
  });

  test("Function Row Filter View creation with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({
      rows : function(row) {
        return row.one === ds._columns[0].data[0];
      }
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");
    });
  });

  test("Function Row Filter View creation with computed product", function() {
    var ds = Util.baseSample();
    var view = ds.where({
      rows : function() {
        return true;
      }
    });

    equals(view.mean("three"), 8);
    equals(view.max("three"), 9);
    equals(view.min(["three"]), 7);
  });

  test("Function Row Filter View creation with computed product with custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({
      rows : function() {
        return true;
      }
    });

    equals(view.mean("three"), 8);
    equals(view.max("three"), 9);
    equals(view.min(["three"]), 7);
  });

  test("Using string syntax for columns", function() {
    var ds = Util.baseSample();
    var view = ds.where({ columns : 'one' });
    equals(view._columns.length, 2, "one data columns + _id"); //one column + _id
    _.each(view._columns, function(column, columnIndex) {
      _.each(column.data, function(d, rowIndex) {
        equals(d, ds._columns[columnIndex].data[rowIndex], "data matches parent");
      });
    });
  });

  test("Using string syntax for columns with custom idAttribute (the id col)", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({ columns : 'one' });
    equals(view._columns.length, 1, "one data columns + _id"); //one column + _id
    _.each(view._columns, function(column, columnIndex) {
      _.each(column.data, function(d, rowIndex) {
        equals(d, ds._columns[columnIndex].data[rowIndex], "data matches parent");
      });
    });
  });

  test("Using string syntax for columns with custom idAttribute (non id col)", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({ columns : 'two' });
    equals(view._columns.length, 2, "one data columns + _id"); //one column + _id
    _.each(view._columns, function(column, columnIndex) {
      _.each(column.data, function(d, rowIndex) {
        equals(d, ds._columns[columnIndex].data[rowIndex], "data matches parent");
      });
    });
  });

  test("Columns View creation", function() {
    var ds = Util.baseSample();
    var view = ds.where({ columns : [ 'one', 'two' ]});

    equals(view._columns.length, 3, "two data columns + _id"); //one column + _id
    _.each(view._columns, function(column, columnIndex) {
      _.each(column.data, function(d, rowIndex) {
        equals(d, ds._columns[columnIndex].data[rowIndex], "data matches parent");
      });
    });
  });

  test("Columns View creation with idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({ columns : [ 'one', 'two' ]});

    equals(view._columns.length, 2, "two data columns + _id"); //one column + _id
    _.each(view._columns, function(column, columnIndex) {
      _.each(column.data, function(d, rowIndex) {
        equals(d, ds._columns[columnIndex].data[rowIndex], "data matches parent");
      });
    });
  });

  test("Select by columns and rows", function() {
    var ds = Util.baseSample();
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

  test("Select by columns and rows by idAttribute (id col)", function() {
    var ds = Util.baseSampleCustomID();
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]],
      columns : [ 'one' ]
    });

    equals(view.length, 2, "view has two rows");
    equals(view._columns.length, 1, "view has one column"); //id column + data column
    _.each(view._columns[0].data, function(d, rowIndex) {
      equals(d, ds._columns[0].data[rowIndex], "data matches parent");
    });
  });

  test("get all column names minus the id col", function() {
    var ds = Util.baseSample();
    ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]), "All column names fetched");  
  });

  test("get all column names minus the id col custom idAttribute", function() {
    var ds = Util.baseSampleCustomID();
    ok(_.isEqual(ds.columnNames(), [ "two", "three"]), "All column names fetched");  
  });

module("Views :: Rows Selection");

  test("each", function() {
    var ds = Util.baseSample();
    var expectedRow = {
      _id : ds._columns[0].data[0],
      one : 1,
      two : 4,
      three : 7
    };

    ds.each(function(row, index) {
      if (index === 0) {
        ok(_.isEqual(row, expectedRow), "Row by position is equal");
      }
    });

  });


  test("reversed each", 1, function() {
    var ds = Util.baseSample();
    var expectedRow = {
      _id : ds._columns[0].data[2],
      one : 3,
      two : 6,
      three : 9
    };
    var count = 0;

    ds.reverseEach(function(row) {
      if (count === 0) {
        ok(_.isEqual(row, expectedRow), "Row by position is equal");
      }
      count += 1;
    });
  });

  test("Get row by position", function() {
    var ds = Util.baseSample();
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
    var ds = Util.baseSample();
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
    var ds = Util.baseSample();
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
    var ds = Util.baseSyncingSample();
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
        
        var event = Dataset.Events._buildEvent(delta);

        // publish view sync with delta
        // view.sync(delta);
        ds.publish("change", event);

        // make sure view updated
        ok(view._columns[colPos].data[0] === 100, "view was updated to " + view._columns[colPos].data[0]);
      });
    }, this);
  });


  test("No syncing of non syncable dataset changes", function() {
    var ds = Util.baseSample();
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
        oldVal = ds._columns[colPos].data[rowPos];
        ds._columns[colPos].data[rowPos] = 100;

        // create delta to propagate
        var delta = {
          _id : rowId,
          old : {},
          changed : {}
        };
        delta.old[col] = oldVal;
        delta.changed[col] = 100;

        // publish view sync with delta
        // view.sync(delta);
        if (_.isUndefined(ds.publish)) {
          ok(true, "can't even trigger change, no publish api.");
        }

        // make sure view updated
        ok(view._columns[colPos].data[0] === oldVal, "view was not updated");
      });
    }, this);
  });

  test("Sync of updates via the external API", function() {
    var ds = Util.baseSyncingSample(),
        view1 = ds.where({ column : 'one'}),
        view2 = ds.where({ column : 'two'}),
        firstRowId = ds._rowIdByPosition[0],
        view3 = ds.where(firstRowId);

    ds.update({ _id : firstRowId, one: 100, two: 200 });
    equals(view1.column('one').data[0], 100);
    equals(view2.column('two').data[0], 200);
    equals(view3._columns[1].data[0], 100);
  });

  test("No Sync of updates via the external API", function() {
    var ds = Util.baseSample();
    var view1 = ds.where({ column : 'one'});
    var view2 = ds.where({ column : 'two'});
    var firstRowId = ds._rowIdByPosition[0];
    var view3 = ds.where(firstRowId);

    var oldVals = { one : view1.column('one').data[0], two : view2.column('two').data[0], three: view3._columns[1].data[0] };
    ds.update(firstRowId, { one: 100, two: 200 });

    equals(view1.column('one').data[0], oldVals.one);
    equals(view2.column('two').data[0], oldVals.two);
    equals(view3._columns[1].data[0], oldVals.three);
  });

  test("Nested Syncing", function() {
    var ds = Util.baseSyncingSample();
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

    var superdeepview = deepview.where({}, { sync : true });

    // modify a value in the dataset's first row
    ds._columns[1].data[0] = 100;

    // create delta
    var delta = { _id : ds._columns[0].data[0], old : {}, changed : {} };
    delta.old[colname] = oldVal;
    delta.changed[colname] = 100;

    var event = Dataset.Events._buildEvent(delta);

    // trigger dataset change
    ds.publish("change", event);

    // verify both views have updated
    ok(view._columns[1].data[0] === 100, "first view updated");
    ok(deepview._columns[1].data[0] === 100, "second view updated");
    ok(superdeepview._columns[1].data[0] === 100, "third view updated");
  });

  test("Basic row removal propagation", function() {
    var ds = Util.baseSyncingSample();

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
    var event = Dataset.Events._buildEvent(delta);

    // delete actual row
    ds._remove( ds._rowIdByPosition[0] );
    ds.publish("change", event);

    // verify view row was deleted as well
    ok(view.length === 1, "view is one element shorter");
    ok(view._columns[0].data[0] === ds._columns[0].data[0], "first row was delete");
  });

  test("row removal propagation via external API", function() {
    var ds = Util.baseSyncingSample();
    var view = ds.where({ column : 'one' });

    var l = ds.length;
    ds.remove(function(row) {
      return (row.one === 1);
    });
    equals(ds.length, l-1);
    ok(view.length === 2, "row was removed from view");
    ok(ds.length === 2, "row was removed from dataset");

  });

  test("Basic row adding propagation", function() {
    var ds = Util.baseSyncingSample();

    // create view with a function filter
    var view = ds.where({ rows : function(row) {
      return row.three > 5;
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
    var event = Dataset.Events._buildEvent(delta);

    // for now, we aren't adding the actual data to the original dataset
    // just simulating that addition. Eventually when we ammend the api
    // with .add support, this can be refactored. better yet, added to.
    ds.publish("change", event);

    ok(view.length === 4, "row was added");
    ok(_.isEqual(view.rowByPosition(3), newRow), "rows are equal");
  });

  test("Propagating row adding via external API", function() {
    var ds = Util.baseSyncingSample();
    var view = ds.where({ column : ['one']});

    ds.add( { one: 10, two: 22 } );
    ok(view.length === 4, "row was added to view");
  });

  test("Basic row adding propagation - Not added when out of filter range", function() {
    var ds = Util.baseSyncingSample();

    // create view with a function filter
    var view = ds.where({ rows : function(row) {
      return row.three > 5;
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
    var event = Dataset.Events._buildEvent(delta);

    // for now, we aren't adding the actual data to the original dataset
    // just simulating that addition. Eventually when we ammend the api
    // with .add support, this can be refactored. better yet, added to.
    ds.publish("change", event);

    ok(view.length === 3, "row was NOT added");

    ok(_.isEqual(view.rowByPosition(2), ds.rowByPosition(2)), "last row in view hasn't changed.");
  });

  module("Sort");

  test("Sort fail", function() {
    var ds = Util.baseSample();
    try {
      ds.sort();
      ok(false, "error should have been thrown.");
    } catch (e) {
      ok(e.message === "Cannot sort without this.comparator.");
    }
  });

  test("Basic Sort", function() {
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 3, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ] },
      strict: true
    });
    
    ds.comparator = function(r1, r2) {
      if (r1.one > r2.one) {return 1;}
      if (r1.one < r2.one) {return -1;}
      return 0;
    };

    _.when(ds.fetch()).then(function(){
      ds.sort();

      ok(_.isEqual(ds._columns[1].data, [2,3,3,4,10,14]),ds._columns[1].data);
      ok(_.isEqual(ds._columns[2].data, [5,6,1,1,4,1])  ,ds._columns[2].data);
      ok(_.isEqual(ds._columns[3].data, [8,9,1,1,7,1])  ,ds._columns[3].data);
    });

  });

   test("Sort with options param", function() {
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 3, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ] },
      strict: true
    });



    _.when(ds.fetch()).then(function(){
      ds.sort({ silent : true, comparator : function(r1, r2) {
        if (r1.one > r2.one) {return 1;}
        if (r1.one < r2.one) {return -1;}
        return 0;
      }
      });

      ok(_.isEqual(ds._columns[1].data, [2,3,3,4,10,14]),ds._columns[1].data);
      ok(_.isEqual(ds._columns[2].data, [5,6,1,1,4,1])  ,ds._columns[2].data);
      ok(_.isEqual(ds._columns[3].data, [8,9,1,1,7,1])  ,ds._columns[3].data);
    });

  });

  test("setting sort comparator when sorting", function() {
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 3, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ] },
      strict: true
    });

    _.when(ds.fetch()).then(function(){
      ds.sort(function(r1, r2) {
        if (r1.one > r2.one) {return 1;}
        if (r1.one < r2.one) {return -1;}
        return 0;
      });

      ok(_.isEqual(ds._columns[1].data, [2,3,3,4,10,14]),ds._columns[1].data);
      ok(_.isEqual(ds._columns[2].data, [5,6,1,1,4,1])  ,ds._columns[2].data);
      ok(_.isEqual(ds._columns[3].data, [8,9,1,1,7,1])  ,ds._columns[3].data);
    });

  });

  test("Basic Sort reverse", function() {
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 6, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ] },
      strict: true
    });
    
    ds.comparator = function(r1, r2) {
      if (r1.one > r2.one) {return -1;}
      if (r1.one < r2.one) {return 1;}
      return 0;
    };
    _.when(ds.fetch()).then(function(){
      ds.sort();
      
      ok(_.isEqual(ds._columns[1].data, [2,3,4,6,10,14].reverse()), ds._columns[1].data);
      ok(_.isEqual(ds._columns[2].data, [5,1,1,6,4,1].reverse()), ds._columns[2].data);
      ok(_.isEqual(ds._columns[3].data, [8,1,1,9,7,1].reverse()), ds._columns[3].data);
    });
  });

  test("Sort in init", function() {
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 6, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ] },
      comparator : function(r1, r2) {
        if (r1.one > r2.one) {return -1;}
        if (r1.one < r2.one) {return 1;}
        return 0;
      },
      strict: true
    });
    _.when(ds.fetch()).then(function(){
      ok(_.isEqual(ds._columns[1].data, [2,3,4,6,10,14].reverse()), ds._columns[1].data);
      ok(_.isEqual(ds._columns[2].data, [5,1,1,6,4,1].reverse()), ds._columns[2].data);
      ok(_.isEqual(ds._columns[3].data, [8,1,1,9,7,1].reverse()), ds._columns[3].data);
    });
  });

  test("Add row in sorted order", function() {
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 6, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ] },
      comparator : function(r1, r2) {
        if (r1.one > r2.one) { return 1;  }
        if (r1.one < r2.one) { return -1; }
        return 0;
      },
      strict: true
    });
    _.when(ds.fetch()).then(function(){
      var l = ds.length;
      ds.add({
        one : 5, two: 5, three: 5
      });
      equals(ds.length, l+1);
      ok(_.isEqual(ds._columns[1].data, [2,3,4,5,6,10,14]));
      ok(_.isEqual(ds._columns[2].data, [5,1,1,5,6,4,1]));
      ok(_.isEqual(ds._columns[3].data, [8,1,1,5,9,7,1]));
    });
  });

  test("Add row in reverse sorted order", function() {
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 6, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ] },
      comparator : function(r1, r2) {
        if (r1.one > r2.one) { return -1; }
        if (r1.one < r2.one) { return 1; }
        return 0;
      },
      strict: true
    });

    _.when(ds.fetch()).then(function(){
      ds.add({
        one : 5, two: 5, three: 5
      });
      
      ok(_.isEqual(ds._columns[1].data, [2,3,4,5,6,10,14].reverse()));
      ok(_.isEqual(ds._columns[2].data, [5,1,1,5,6,4,1].reverse()));
      ok(_.isEqual(ds._columns[3].data, [8,1,1,5,9,7,1].reverse()));
    });
  });

  module("export");
  test("Export to json", function(){
    var ds = new Dataset({
      data: { columns : [ 
        { name : "one",   data : [10, 2, 6, 14, 3, 4] },
        { name : "two",   data : [4,  5, 6, 1,  1, 1] },
        { name : "three", data : [7,  8, 9, 1,  1, 1] } 
      ]},
      strict: true
    });

    _.when(ds.fetch()).then(function() {
      var j = ds.toJSON();
    
      ok(_.isEqual(j[0], { _id : ds._columns[0].data[0], one : 10, two : 4, three : 7}), j[0]);
      ok(_.isEqual(j[1], { _id : ds._columns[0].data[1], one : 2, two : 5, three : 8}), j[1]);
      ok(_.isEqual(j[2], { _id : ds._columns[0].data[2], one : 6, two : 6, three : 9}), j[2]);
      ok(_.isEqual(j[3], { _id : ds._columns[0].data[3], one : 14, two : 1, three : 1}), j[3]);
      ok(_.isEqual(j[4], { _id : ds._columns[0].data[4], one : 3, two : 1, three : 1}), j[4]);
      ok(_.isEqual(j[5], { _id : ds._columns[0].data[5], one : 4, two : 1, three : 1}), j[5]);  
    });
    
  });

}(this));
