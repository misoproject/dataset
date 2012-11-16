(function(global) {
  
  var Util = global.Util;
  var Miso = global.Miso || {};  
  var Dataset = Miso.Dataset;

  module("Products :: Sum");
  test("Basic Sum Product", function() {
    var ds = Util.baseSyncingSample();
    
    _.each(ds._columns, function(column){
      if (column.name === '_id') { return; }
      var sum = ds.sum(column.name);
      ok(sum.val() === _.sum(column.data), "sum is correct for column "+ column.name);
    });
  });

  test("Basic Sum Product with custom idAttribute", function() {
    var ds = Util.baseSyncingSampleCustomidAttribute();
    
    _.each(ds._columns, function(column){
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

  test("Time Sum Should Fail", 2, function() {
    var ds = new Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columns : [
        { name : "t", type : "time", format : "YYYY/MM/DD" }
      ],
      sync : true
    });

    _.when(ds.fetch()).then(function(){
      equals(ds.column("t").type, "time");
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
          column  = ds.column(columnName);
      ok(max.val() === Math.max.apply(null, column.data), "Max is correct for col " + columnName);  
    });

    //empty
    equals(ds.max().val(), 9);

    ok(ds.max(ds.columnNames()).val() === 9);

  });

  test("Basic Max Calculation no syncable", function() {

    var ds = Util.baseSample();
    
    // check each column
    ds.eachColumn(function(columnName) {
      var max     = ds.max(columnName),
          column  = ds.column(columnName);
      ok(max === Math.max.apply(null, column.data), "Max is correct for col " + columnName);  
    });

    //empty
    equals(ds.max(), 9);

    ok(ds.max(ds.columnNames()) === 9);
  });

  test("Time Max Product", function() {
    var ds = new Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columns : [
        { name : "t", type : "time", format : 'YYYY/MM/DD' }
      ],
      sync : true
    }).fetch({
      success : function() {
        equals(this.column("t").type, "time");
        equals(this.max("t").val().valueOf(), this.column("t").data[1].valueOf());    
      }
    });

    
  });

  test("Time Max Product non syncable", function() {
    var ds = new Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columns : [
        { name : "t", type : "time", format : 'YYYY/MM/DD' }
      ]
    });
    _.when(ds.fetch()).then(function(){
      equals(ds.column("t").type, "time");
      equals(ds.max("t").valueOf(), ds.column("t").data[1].valueOf());
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
    var ds = new Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columns : [
        { name : "t", type : "time", format : 'YYYY/MM/DD' }
      ],
      sync : true
    });

    _.when(ds.fetch()).then(function() {
      window.ds = ds;
      equals(ds.column("t").type, "time");
      equals(ds.min("t").val().valueOf(), ds.column("t").data[0].valueOf());
      equals(ds.min("t").type(), ds.column("t").type);
      equals(ds.min("t").numeric(), ds.column("t").data[0].valueOf());
    });
  });

  test("Time Min Product Non Syncable", 2, function() {
    var ds = new Dataset({
      data : [
        { "one" : 1, "t" : "2010/01/13" },
        { "one" : 5, "t" : "2010/05/15" },
        { "one" : 10, "t" : "2010/01/23" }
      ],
      columns : [
        { name : "t", type : "time", format : 'YYYY/MM/DD' }
      ]
    });

    _.when(ds.fetch()).then(function(){
      equals(ds.column("t").type, "time");
      equals(ds.min("t").valueOf(), ds.column("t").data[0].valueOf());
    });
  });

  test("Basic Mean Product", function() {
    var ds = new Dataset({
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

      m.subscribe("change", function(s) {
        equals(s.deltas[0].old, 5.5);
        equals(this.val(), 6.4);
      });

      m2.subscribe("change", function(s) {
        equals(s.deltas[0].old, 5.5);
        equals(this.val(), 6.4);
      });

      m3.subscribe("change", function(s) {
        equals(s.deltas[0].old, 5.5);
        equals(this.val(), 5.95);
      });

      ds.update(ds._rowIdByPosition[0], { vals : 10, valsrandomorder : 10 });
    });
  });

  test("Basic Mean Product Non Syncable", function() {
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

    _.when(ds.fetch()).then(function() {

      var m = ds.mean('vals');
      var m2 = ds.mean('valsrandomorder');
      var m3 = ds.mean(['vals', 'valsrandomorder']);
      var m4 = ds.mean(['vals', 'valsrandomorder', 'randomvals']);

      equals(m, 5.5);
      equals(m2, 5.5);
      equals(m3, 5.5);
      equals(m4, 18.4);

      ds.update(ds._rowIdByPosition[0], { vals : 10, valsrandomorder : 10 });

      equals(m, 5.5);
      equals(m2, 5.5);
      equals(m3, 5.5);
      equals(m4, 18.4);
    });
  });

  test("Basic Time Mean Product", function() {
    var ds = new Dataset({
      data : [
        { "one" : 1,  "t" : "2010/01/01" },
        { "one" : 5,  "t" : "2010/01/15" },
        { "one" : 10, "t" : "2010/01/30" }
      ],
      columns : [
        { name : "t", type : "time", format : 'YYYY/MM/DD' }
      ],
      sync: true
    });

    _.when(ds.fetch()).then(function() {
      var meantime = ds.mean("t");
      equals(meantime.val().format("YYYYMMDD"), moment("2010/01/15").format("YYYYMMDD"));

      meantime.subscribe("change", function() {
        equals(meantime.val().format("YYYYMMDD"), moment("2010/01/10").format("YYYYMMDD"));        
      });

      ds.update({ _id : ds._rowIdByPosition[2], t : "2010/01/20" }, { silent : true });
      ds.update({ _id : ds._rowIdByPosition[1], t : "2010/01/10" });
    });
  });

  // TODO: add time mean product here!!!g

  module("Products :: Sync");

  test("Basic Sync Recomputation", function() {
    
    var ds = Util.baseSyncingSample();
    var max = ds.max("one");

    ok(max.val() === 3, "old max correct");

    ds.update({ _id : ds._rowIdByPosition[0],  one : 22 });

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
        counter = 0;

    max.subscribe('change', function() {
      counter += 1;
    });

    ds.update({ _id : ds._rowIdByPosition[0], one : 22});
    ds.update({ _id : ds._rowIdByPosition[0], one : 34});

    equals(counter, 2);

  });

  test("Basic subscription to product changes on syncable doesn't trigger", function() {
    var ds = Util.baseSample(),
        max = ds.max("one");

    equals(_.isUndefined(max.subscribe), true);
    equals(Dataset.typeOf(max), "number");
  });


  test("Subscription doesn't trigger when value doesn't change", function() {
    var ds = Util.baseSyncingSample(),
        max = ds.max("one"),
        counter = 0;

    max.subscribe('change', function() {
      counter += 1;
    });

    ds.update({ _id : ds._rowIdByPosition[0], one : 22});
    ds.update({ _id : ds._rowIdByPosition[1], one : 2});

    equals(counter, 1);

  });

  module("Products :: Custom");

  test("Defining a custom product", function() {

    var ds = Util.baseSyncingSample();
    var min = Dataset.Product.define(function() {
      var min = Infinity;
      _.each(this._column('one').data, function(value) {
        if (value < min) {
          min = value;
        }
      });
      return min;
    }).apply(ds);

    equals(min.val(), 1, "custum product calcualted the minimum");

    ds.update({ _id : ds._rowIdByPosition[0], one : 22});

    equals(min.val(), 2, "custom product calculated the updated minimum");

  });

  test("Defining a new product on the Miso prototype", function() {

    var ds = Util.baseSyncingSample();
    Dataset.prototype.custom = Dataset.Product.define(function() {
      var min = Infinity;
      _.each(this._column('one').data, function(value) {
        if (value < min) {
          min = value;
        }
      });
      return min;
    });

    var custom = ds.custom();

    equals(custom.val(), 1, "custum product calculated the minimum");

    ds.update({ _id : ds._rowIdByPosition[0], one : 22});

    equals(custom.val(), 2, "custum product calculated the updated minimum");

  });

  test("Defining a new product a dataset", function() {

    var ds = Util.baseSyncingSample();
    ds.custom =  Dataset.Product.define(function() {
      var min = Infinity;
      _.each(this._column('one').data, function(value) {
        if (value < min) {
          min = value;
        }
      });
      return min;
    });

    var custom = ds.custom();

    equals(custom.val(), 1, "custum product calcualted the minimum");

    ds.update({ _id : ds._rowIdByPosition[0], one : 22});

    equals(custom.val(), 2, "custum product calculated the updated minimum");

  });
}(this));
