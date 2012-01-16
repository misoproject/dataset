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
    var max = ds.max(column.name);
    ok(max.val() === Math.max.apply(null, column.data), "Max is correct");  
  });
});


module("Products :: Sync");

test("Basic Sync Recomputation", function() {
  
  var ds = baseSample();

  var max = ds.max("one");

  ok(max.val() === 3, "old max correct");

  // make a change in ds - NOT THROUGH API
  ds._columns[1].data[1] = 5;

  var delta = {
    _id : ds._columns[0].data[1],
    old : { "one" : 2 },
    changed : { "one" : 5 }
  };

  var max = ds.max("one");
  var event = DS.Events._buildEvent(delta);
  max.sync(event);
  ok(max.val() === 5, "max was updated");

});

test("Basic Sync Recomputation - Not Affected Column", function() {
  
  var ds = baseSample();

  var max = ds.max("two");
  ok(max.val() === 6, "old max correct");

  // make a change in ds - NOT THROUGH API
  ds._columns[1].data[1] = 5;

  var delta = {
    _id : ds._columns[0].data[1],
    old : { "one" : 2 },
    changed : { "one" : 5 }
  };

  var max = ds.max("two");
  var event = DS.Events._buildEvent(delta);
  max.sync(event);
  ok(max.val() === 6, "max was not updated");

});

test("Basic subscription to product changes", function() {
  var ds = baseSample();

  _.each(ds._columns.slice(1, 4), function(column, i) {
    var testobj = { prop : 1 },
        callback = function() {
          this.prop = 2;
        };
    
    var max = ds.max(column.name);

    max.bind("change", callback, testobj);

    // bump up the 1st value to a really high number so
    // that we know the value will need to recompute.
    var delta = {
      _id : ds._columns[0].data[1],
      old : { },
      changed : { }
    };

    delta.old[column.name] = ds._columns[i+1].data[1];
    delta.changed[column.name] = 10;
    ds._columns[i+1].data[1] = 10;

    var event = DS.Events._buildEvent(delta);
    max.sync(event);
    ok(testobj.prop === 2, "callback was called!"); 
    ok(max.val() === 10, "max was updated"); 
  });
});

test("Subscription doesn't trigger when value doesn't change", function() {
  var ds = baseSample();

  _.each(ds._columns.slice(1, 4), function(column, i) {
    var testobj = { prop : 1 },
        callback = function() {
          this.prop = 2;
        };
    
    var max = ds.max(column.name);
    var oldMax = max.val();
    max.bind("change", callback, testobj);

    // bump down the new value in the col to a really low value
    // so that we know the product won't be any different.
    var delta = {
      _id : ds._columns[0].data[1],
      old : { },
      changed : { }
    };

    delta.old[column.name] = ds._columns[i+1].data[1];
    delta.changed[column.name] = 0;
    ds._columns[i+1].data[1] = 0;

    var event = DS.Events._buildEvent(delta);
    max.sync(event);
    
    ok(testobj.prop === 1, "callback was not called!");  
    ok(oldMax === max.val(), "max hasn't changed");
  });
});

