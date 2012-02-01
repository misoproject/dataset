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

module("Products :: Max");

test("Basic Max Product", function() {

  var ds = baseSample();

  // check each column
  _.each(ds._columns, function(column) {
    if (column.name === '_id') { return }
    var max = ds.max(column.name);
    ok(max.val() === Math.max.apply(null, column.data), "Max is correct");  
  });

  //empty
  equals(ds.max().val(), 9);
  var names = _.map(ds._columns, function(column) {
    return column.name
  });
  equals(ds.max(names).val(), 9);

});

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
  var names = _.map(ds._columns, function(column) {
    return column.name
  });
  equals(ds.min(names).val(), 1);

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
