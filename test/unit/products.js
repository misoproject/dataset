(function(global) {
  
  var Util  = global.Util;
  var Miso    = global.Miso || {};  

  module("Products :: Sum");
  test("Basic Sum Product", function() {
    var ds = Util.baseSyncingSample();
    
    _.each(ds._columns, function(column){
      if (column.name === '_id') { return; }
      var sum = ds.sum(column.name);
      ok(sum.val() === _.sum(column.data), "sum is correct for column "+ column.name);
    });
  });

  test("Basic Sum Product Non Syncable", function() {
    var ds = Util.baseSample();
    
    _.each(ds._columns, function(column){
      if (column.name === '_id') { return; }
      var sumNum = ds.sum(column.name);
      ok(sumNum === _.sum(column.data), "sum is correct for column "+ column.name);
      ok(_.isUndefined(sumNum.val), "there is no val method on sum product");
    });
  });

  test("Time Sum Should Fail", function() {
    var ds = new Miso.Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columnTypes : {
        "t" : "time"
      },
      sync : true
    });

    _.when(ds.fetch()).then(function(){
      equals(ds._columns[2].type, "time");
      try {
        ds.sum("t").val();
      } catch(e) {
        ok(true, "can't sum up time.");
      }

      try {
        ds.sum("t").val();
      } catch(e) {
        ok(true, "can't sum up time.");
      }
    });
  });

  module("Products :: Max");

  test("Basic Max Product", function() {

    var ds = Util.baseSyncingSample();
    
    // check each column
    ds.eachColumn(function(columnName) {
      var max     = ds.max(columnName),
          column  = ds._columns[ds._columnPositionByName[columnName]];
      ok(max.val() === Math.max.apply(null, column.data), "Max is correct for col " + columnName);  
    });

    //empty
    equals(ds.max().val(), 9);
    var names = _.compact(_.map(ds._columns, function(column) {
      if (column.name !== "_id") {return column.name;}
    }));

    ok(ds.max(ds.columnNames()).val() === 9);

  });

  test("Basic Max Calculation no syncable", function() {

    var ds = Util.baseSample();
    
    // check each column
    ds.eachColumn(function(columnName) {
      var max     = ds.max(columnName),
          column  = ds._columns[ds._columnPositionByName[columnName]];
      ok(max === Math.max.apply(null, column.data), "Max is correct for col " + columnName);  
    });

    //empty
    equals(ds.max(), 9);
    var names = _.compact(_.map(ds._columns, function(column) {
      if (column.name !== "_id") {return column.name;}
    }));

    ok(ds.max(ds.columnNames()) === 9);

  });

  test("Time Max Product", function() {
    var ds = new Miso.Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columnTypes : {
        "t" : { type : "time", format : 'YYYY/MM/DD' }
      },
      sync : true
    }).fetch({
      success : function() {
        equals(this._columns[2].type, "time");
        equals(this.max("t").val().valueOf(), this._columns[2].data[1].valueOf());    
      }
    });

    
  });

  test("Time Max Product non syncable", function() {
    var ds = new Miso.Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columnTypes : {
        "t" : { type : "time", format : 'YYYY/MM/DD' }
      }
    });
    _.when(ds.fetch()).then(function(){
      equals(ds._columns[2].type, "time");
      equals(ds.max("t").valueOf(), ds._columns[2].data[1].valueOf());
    });
  });

  module("Products :: Min");
  test("Basic Min Product", function() {

    var ds = Util.baseSyncingSample();

    // check each column
    ds.eachColumn(function(columnName) {
      if (columnName === '_id') { return; }
      var min = ds.min(columnName);
      var column = ds.column(columnName);
      ok(min.val() === Math.min.apply(null, column.data), "Min is correct");  
    });

    //empty
    equals(ds.min().val(), 1);
    var names = _.compact(_.map(ds._columns, function(column) {
      if (column.name !== "_id") {return column.name;}
    }));
  });

  test("Basic Min Product Non Syncable", function() {

    var ds = Util.baseSample();

    // check each column
    _.each(ds._columns, function(column) {
      if (column.name === '_id') { return; }
      var min = ds.min(column.name);
      ok(min === Math.min.apply(null, column.data), "Min is correct");  
    });

    //empty
    equals(ds.min(), 1);
    var names = _.compact(_.map(ds._columns, function(column) {
      if (column.name !== "_id") {return column.name;}
    }));
    equals(ds.min(names), 1);
  });

  test("Time Min Product", function() {
    var ds = new Miso.Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columnTypes : {
        "t" : { type : "time", format : 'YYYY/MM/DD' }
      },
      sync : true
    });

    _.when(ds.fetch()).then(function() {
      equals(ds._columns[2].type, "time");
      equals(ds.min("t").val().valueOf(), ds._columns[2].data[0].valueOf());
      equals(ds.min("t").type(), ds._columns[2].type);
      equals(ds.min("t").numeric(), ds._columns[2].data[0].valueOf());
    });
  });

  test("Time Min Product Non Syncable", function() {
    var ds = new Miso.Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columnTypes : {
        "t" : { type : "time", format : 'YYYY/MM/DD' }
      }
    });

    _.when(ds.fetch(), function(){
      equals(ds._columns[2].type, "time");
      equals(ds.min("t").valueOf(), ds._columns[2].data[0].valueOf());
    });
  });

  test("Basic Mean Product", function() {
    var ds = new Miso.Dataset({
      data : {
        columns : [
          { name : 'vals', data : [1,2,3,4,5,6,7,8,9,10] },
          { name : 'valsrandomorder', data : [10,2,1,5,3,8,9,6,4,7] },
          { name : 'randomvals', data : [19,4,233,40,10,39,23,47,5,22] }
        ]
      },
      strict : true,
      sync : true
    });

    _.when(ds.fetch()).then(function() {
      var m = ds.mean('vals');
      var m2 = ds.mean('valsrandomorder');
      var m3 = ds.mean(['vals', 'valsrandomorder']);

      equals(m.val(), 5.5);
      equals(m2.val(), 5.5);
      equals(m3.val(), 5.5);
      equals(ds.mean(['vals', 'valsrandomorder', 'randomvals']).val(), 18.4);

      m.bind("change", function(s) {
        equals(s.deltas[0].old, 5.5);
        equals(this.val(), 6.4);
      });

      m2.bind("change", function(s) {
        equals(s.deltas[0].old, 5.5);
        equals(this.val(), 6.4);
      });

      m3.bind("change", function(s) {
        equals(s.deltas[0].old, 5.5);
        equals(this.val(), 5.95);
      });

      ds.update(ds._rowIdByPosition[0], { vals : 10, valusrandomorder : 10 });
    });
  });

  test("Basic Mean Product Non Syncable", function() {
    var ds = new Miso.Dataset({
      data : {
        columns : [
          { name : 'vals', data : [1,2,3,4,5,6,7,8,9,10] },
          { name : 'valsrandomorder', data : [10,2,1,5,3,8,9,6,4,7] },
          { name : 'randomvals', data : [19,4,233,40,10,39,23,47,5,22] }
        ]
      },
      strict : true
    });

    _.when(ds.fetch()).then(function() {

      var m = ds.mean('vals');
      var m2 = ds.mean('valsrandomorder');
      var m3 = ds.mean(['vals', 'valsrandomorder']);
      var m4 = ds.mean(['vals', 'valsrandomorder', 'randomvals']);

      equals(m, 5.5);
      equals(m2, 5.5);
      equals(m3, 5.5);
      equals(m4, 18.4);

      ds.update(ds._rowIdByPosition[0], { vals : 10, valusrandomorder : 10 });

      equals(m, 5.5);
      equals(m2, 5.5);
      equals(m3, 5.5);
      equals(m4, 18.4);
    });
  });

  // TODO: add time mean product here!!!g

  module("Products :: Sync");

  test("Basic Sync Recomputation", function() {
    
    var ds = Util.baseSyncingSample();
    var max = ds.max("one");

    ok(max.val() === 3, "old max correct");

    ds.update(ds._rowIdByPosition[0], { one : 22 });

    ok(max.val() === 22, "max was updated");
  });

  test("Basic Sync No Recomputation Non Syncing", function() {
    
    var ds = Util.baseSample();
    var max = ds.max("one");

    ok(max === 3, "old max correct");

    ds.update(ds._rowIdByPosition[0], { one : 22 });

    ok(max === 3, "max was not updated");
  });

  test("Basic subscription to product changes", function() {
    var ds = Util.baseSyncingSample(),
        max = ds.max("one"),
        maxFunc = ds.max("one"),
        counter = 0;

    max.bind('change', function() {
      counter += 1;
    });

    ds.update(ds._rowIdByPosition[0], { one : 22});
    ds.update(ds._rowIdByPosition[0], { one : 34});

    equals(counter, 2);

  });

  test("Basic subscription to product changes on syncable doesn't trigger", function() {
    var ds = Util.baseSample(),
        max = ds.max("one"),
        counter = 0;

    equals(_.isUndefined(max.bind), true);
    equals(Miso.typeOf(max), "number");
  });


  test("Subscription doesn't trigger when value doesn't change", function() {
    var ds = Util.baseSyncingSample(),
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

    var ds = Util.baseSyncingSample();
    var min = ds.calculated(ds.column('one'), function() {
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

    equals(min.val(), 2, "custom product calculated the updated minimum");

  });

  test("Defining a new product on the Miso prototype", function() {

    var ds = Util.baseSyncingSample();
    Miso.Dataset.prototype.custom = function() {
      return this.calculated(ds.column('one'), function() {
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

    equals(custom.val(), 1, "custum product calculated the minimum");

    ds.update(ds._rowIdByPosition[0], { one : 22});

    equals(custom.val(), 2, "custum product calculated the updated minimum");

  });

  test("Defining a new product a dataset", function() {

    var ds = Util.baseSyncingSample();
    ds.custom = function() {
      return this.calculated(ds.column('one'), function() {
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
}(this));