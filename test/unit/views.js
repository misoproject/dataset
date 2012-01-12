var ds = new DS.Dataset({
  data: { columns : [ 
    { name : "one",   data : [1, 2, 3] },
    { name : "two",   data : [4, 5, 6] },
    { name : "three", data : [7, 8, 9] } 
  ] },
  strict: true
});

module("Dataset Rows");

  test("Get row by position", function() {
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
    var row = ds.rowById(ds._columns[0].data[0]);
    var expectedRow = {
      _id : ds._columns[0].data[0],
      one : 1,
      two : 4,
      three : 7
    };
    ok(_.isEqual(row, expectedRow), "Row by _id is equal");
  });


module("Dataset Views");

  test("Basic View creation", function() {
    var view = ds.where({});
    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data, view._columns[i].data), "data has been copied");  
    });
   });

  test("One Row Filter View creation", function() {
    var view = ds.where({
      rows : [ds._columns[0].data[0]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");  
    });
  });

  test("Two Row Filter View creation", function() {
    var view = ds.where({
      rows : [ds._columns[0].data[0], ds._columns[0].data[1]]
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 2), view._columns[i].data), "data has been copied");  
    });
  });

  test("Function Row Filter View creation", function() {
    var view = ds.where({
      rows : function(row) {
        return row._id === ds._columns[0].data[0];
      }
    });

    _.each(ds._columns, function(column, i) {
      ok(_.isEqual(ds._columns[i].data.slice(0, 1), view._columns[i].data), "data has been copied");  
    });
  });
