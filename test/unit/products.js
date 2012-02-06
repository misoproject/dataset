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

module("Products");

module("Products :: Sum");
test("Basic Sum Product", function() {
  var ds = baseSample();
  
  _.each(ds._columns, function(column){
    if (column.name === '_id') { return }
    var sum = ds.sum(column.name);
    ok(sum.val() === _.sum(column.data), "sum is correct for column "+ column.name);
  });
});

test("Time Sum Should Fail", function() {
  var ds = new DS.Dataset({
    data : [
      { "one" : 1, "t" : "2010/01/13" },
      { "one" : 5, "t" : "2010/05/15" },
      { "one" : 10, "t" : "2010/01/23" }
    ],
    columnTypes : {
      "t" : "time"
    }
  });

  equals(ds._columns[2].type, "time");
  try {
    ds.sum("t").val()
  } catch(e) {
    ok(true, "can't sum up time.");
  }
  
});

module("Products :: Max");

test("Basic Max Product", function() {

  var ds = baseSample();
  
  // check each column
  ds.eachColumn(function(columnName) {
    var max     = ds.max(columnName),
        column  = ds._columns[ds._columnPositionByName[columnName]];
    ok(max.val() === Math.max.apply(null, column.data), "Max is correct for col " + columnName);  
  });

  //empty
  equals(ds.max().val(), 9);
  var names = _.compact(_.map(ds._columns, function(column) {
    if (column.name !== "_id") return column.name;
  }));

  ok(ds.max(ds.columnNames()).val() === 9);

});

test("Time Max Product", function() {
  var ds = new DS.Dataset({
    data : [
      { "one" : 1, "t" : "2010/01/13" },
      { "one" : 5, "t" : "2010/05/15" },
      { "one" : 10, "t" : "2010/01/23" }
    ],
    columnTypes : {
      "t" : "time"
    }
  });

  equals(ds._columns[2].type, "time");
  equals(ds.max("t").val().valueOf(), ds._columns[2].data[1].valueOf());
})

test("Basic Min Product", function() {

  var ds = baseSample();

  // check each column
  _.each(ds._columns, function(column) {
    if (column.name === '_id') { return }
    var min = ds.min(column.name);
    ok(min.val() === Math.min.apply(null, column.data), "Min is correct");  
  });

  //empty
  equals(ds.min().val(), 1);
  var names = _.compact(_.map(ds._columns, function(column) {
    if (column.name !== "_id") return column.name;
  }));
  equals(ds.min(names).val(), 1);

});

test("Time Min Product", function() {
  var ds = new DS.Dataset({
    data : [
      { "one" : 1, "t" : "2010/01/13" },
      { "one" : 5, "t" : "2010/05/15" },
      { "one" : 10, "t" : "2010/01/23" }
    ],
    columnTypes : {
      "t" : "time"
    }
  });

  equals(ds._columns[2].type, "time");
  equals(ds.min("t").val().valueOf(), ds._columns[2].data[0].valueOf());
});

module("Products :: Sync");

test("Basic Sync Recomputation", function() {
  
  var ds = baseSample();
  var max = ds.max("one");

  ok(max.val() === 3, "old max correct");

  ds.update(ds._rowIdByPosition[0], { one : 22});

  ok(max.val() === 22, "max was updated");

});

test("Basic subscription to product changes", function() {
  var ds = baseSample(),
      max = ds.max("one"),
      counter = 0;

  max.bind('change', function() {
    counter += 1;
  });

  ds.update(ds._rowIdByPosition[0], { one : 22});
  ds.update(ds._rowIdByPosition[0], { one : 34});

  equals(counter, 2);

});


test("Subscription doesn't trigger when value doesn't change", function() {
  var ds = baseSample();
      max = ds.max("one"),
      counter = 0;

  max.bind('change', function() {
    counter += 1;
  });

  ds.update(ds._rowIdByPosition[0], { one : 22});
  ds.update(ds._rowIdByPosition[1], { one : 2});

  equals(counter, 1);

});

module("Products :: Custom");

test("Defining a custom product", function() {

  var ds = baseSample();
  var min = ds.calculated(function() {
    var min = Infinity;
    _.each(this._column('one').data, function(value) {
      if (value < min) {
        min = value;
      }
    });
    return min;
  });

  equals(min.val(), 1, "custum product calcualted the minimum");

  ds.update(ds._rowIdByPosition[0], { one : 22});

  equals(min.val(), 2, "custum product calculated the updated minimum");

});


test("Defining a new product on the DS prototype", function() {

  DS.Dataset.prototype.custom = function() {
    return this.calculated(function() {
      var min = Infinity;
      _.each(this._column('one').data, function(value) {
        if (value < min) {
          min = value;
        }
      });
      return min;
    });
  };

  var ds = baseSample();
  var custom = ds.custom();

  equals(custom.val(), 1, "custum product calculated the minimum");

  ds.update(ds._rowIdByPosition[0], { one : 22});

  equals(custom.val(), 2, "custum product calculated the updated minimum");

});

test("Defining a new product a dataset", function() {

  var ds = baseSample();
  ds.custom = function() {
    return this.calculated(function() {
      var min = Infinity;
      _.each(this._column('one').data, function(value) {
        if (value < min) {
          min = value;
        }
      });
      return min;
    });
  };

  var custom = ds.custom();

  equals(custom.val(), 1, "custum product calcualted the minimum");

  ds.update(ds._rowIdByPosition[0], { one : 22});

  equals(custom.val(), 2, "custum product calculated the updated minimum");

});
