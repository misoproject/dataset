(function(global) {
  
  var Util  = global.Util;
  var Miso  = global.Miso || {};  

  var numbers = [];
  for (var i=0; i<1000; i++) {
    numbers.push(i);
  }

  JSLitmus.onTestStart = function(test) {
    console.profile(test.name);
  };

  JSLitmus.onTestFinish = function(test) {
    console.profileEnd(test.name);
  };

  JSLitmus.test('add', function() {
    
    var ds = Util.baseSample();
    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
    });
    return ds;
  });

  JSLitmus.test('add + sync', function() {
    
    var ds = Util.baseSyncingSample();
    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
    });
    
    return ds;
  });

  JSLitmus.test('add with view', function() {
    var ds = Util.baseSample();
    var view = ds.column('one');
    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
    });
    return ds;
  });

  JSLitmus.test('add with view + sync', function() {
    var ds = Util.baseSyncingSample();
    var view = ds.column('one');
    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
    });
    return ds;
  });

  JSLitmus.test('add with 5 views', function() {
    var ds = Util.baseSample();
    var views = [];
    _(5).times(function() { 
      views.push( ds.column('one') );
    });

    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
    });
    return ds;
  });

  JSLitmus.test('add with 5 views + sync', function() {
    var ds = Util.baseSyncingSample();
    var views = [];
    _(5).times(function() { 
      views.push( ds.column('one') );
    });

    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
    });
    return ds;
  });

  JSLitmus.test('add + remove with view', function() {
    var ds = Util.baseSample();
    var view = ds.column('one');
    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
      ds.remove(ds._rowIdByPosition[0]);
    });
    return ds;
  });

  JSLitmus.test('add + remove with view + sync', function() {
    var ds = Util.baseSyncingSample();
    var view = ds.column('one');
    _.each(numbers, function(num){ 
      ds.add({ one: 45, two: num});
      ds.remove(ds._rowIdByPosition[0]);
    });
    return ds;
  });

  JSLitmus.test('update', function() {
    var ds = Util.baseSample();
    _.each(numbers, function(num){ 
      ds.update(ds._rowIdByPosition[0], { one: num });
    });
    return ds;
  });

  JSLitmus.test('update + sync', function() {
    var ds = Util.baseSyncingSample();
    _.each(numbers, function(num){ 
      ds.update(ds._rowIdByPosition[0], { one: num });
    });
    return ds;
  });

  JSLitmus.test('update with view', function() {
    var ds = Util.baseSample();
    var view = ds.column('one');
    _.each(numbers, function(num){ 
      ds.update(ds._rowIdByPosition[0], { one: num });
    });
    return ds;
  });

   JSLitmus.test('update with view + sync', function() {
    var ds = Util.baseSyncingSample();
    var view = ds.column('one');
    _.each(numbers, function(num){ 
      ds.update(ds._rowIdByPosition[0], { one: num });
    });
    return ds;
  });

}(this));

