module("Dataset Views")

  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [1, 2, 3] },
      { name : "two",   data : [4, 5, 6] },
      { name : "three", data : [7, 8, 9] } 
    ] },
    strict: true
  });


  test("Basic View creation", function() {
    var view = ds.where({});
    _.each(ds.columns, function(column, i) {
      ok(_.isEqual(ds.columns[i].data, view.columns[i].data), "data has been copied");  
    });
  });

  test("View from row ID array", function() {});
  test("View from row function", function() {});
  test("View from column array", function() {});
