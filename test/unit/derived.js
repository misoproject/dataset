(function(global) {
  
  var Miso    = global.Miso || {};

  module("CountBy");
  var countData = {
    columns : [
      { name : "things", 
        data : [1,2,3,4,5,6,7,8,9,10], 
        type : "numeric" 
      },
      { name : "category", 
        data : ['a','b','a','a','c','c', null,'a','b','c'], 
        type : "string" 
      },
      { name : "stuff", 
        data : [window, window, {}, {}, undefined, null, null, [], [1], 6], 
        type : "mixed" 
      }
    ]
  };

  test("counting a mess", function() {
    var ds = new Miso.Dataset({
      data : countData,
      strict: true
    }).fetch({ success :function() {
      var counted = this.countBy('stuff'),
          nullCount = counted.rows(function(row) {
            return row.stuff === null;
          }).rowByPosition(0).count,
          objCount = counted.rows(function(row) {
            return _.isEqual(row.stuff, {});
          }).rowByPosition(0).count,
          arrCount = counted.rows(function(row) {
            return _.isEqual(row.stuff, []);
          }).rowByPosition(0).count;
      
      equals(6, counted.columns().length);
      equals(3, nullCount);
      equals(2, objCount);
      equals(1, arrCount);

    }});


  });

  test("Counting rows", function() {
  var ds = new Miso.Dataset({
      data : countData,
      strict: true
    }).fetch({ success :function() {
      
      var counted = this.countBy('category'),
          aCount = counted.rows(function(row) {
            return row.category === 'a';
          }).rowByPosition(0).count,
          bCount = counted.rows(function(row) {
            return row.category === 'b';
          }).rowByPosition(0).count,
          nullCount = counted.rows(function(row) {
            return row.category === null;
          }).rowByPosition(0).count;
      
      equals(4, counted.columns().length);
      equals(4, aCount);
      equals(2, bCount);
      equals(1, nullCount);

      // equals(ma.length, this.length - 2);
    }});
  });


  test("Counting rows with custom idAttribute", function() {
  var ds = new Miso.Dataset({
      data : countData,
      strict: true,
      idAttribute : "things"
    }).fetch({ success :function() {
      
      var counted = this.countBy('category'),
          aCount = counted.rows(function(row) {
            return row.category === 'a';
          }).rowByPosition(0).count,
          bCount = counted.rows(function(row) {
            return row.category === 'b';
          }).rowByPosition(0).count,
          nullCount = counted.rows(function(row) {
            return row.category === null;
          }).rowByPosition(0).count;
      
      equals(4, counted.columns().length);
      equals(4, aCount);
      equals(2, bCount);
      equals(1, nullCount);

      // equals(ma.length, this.length - 2);
    }});
  });

  test("Counting rows with moment objs", function() {
  var ds = new Miso.Dataset({
      data : [

        { a : "2002 01 01", b : 1 },
        { a : "2002 01 01", b : 3 }
      ],
      columns : [
        { name : 'a', type : 'time', format : 'YYYY MM DD'}
      ]
    }).fetch({ success :function() {
      var counted = this.countBy('a'),
          aCount = counted.column('count').data;

      equals(counted.length, 1);
      ok(_.isEqual(aCount, [2]));
    }});
  });

  module("Moving Average");

  _.mixin({
    movingAvg : function(arr, size, method) {
      method = method || _.mean;
      var win, i, newarr = [];
      for(i = size-1; i <= arr.length; i++) {
        win = arr.slice(i-size, i);
        if (win.length === size) {
          newarr.push(method(win)); 
        }
      }
      return newarr;
    }
  });

  function getMovingAverageData() {
    return {
      columns : [
        { name : "A", data : [1,2,3,4,5,6,7,8,9,10],          type : "numeric" },
        { name : "B", data : [10,9,8,7,6,5,4,3,2,1],          type : "numeric" },
        { name : "C", data : [10,20,30,40,50,60,70,80,90,100],type : "numeric" }
      ]
    };
  }

  test("Basic Moving Average", function() {
    var ds = new Miso.Dataset({
      data : getMovingAverageData(),
      strict: true
    }).fetch({ success :function() {
      
      var ma = this.movingAverage(["A", "B", "C"], 3);

      equals(ma.length, this.length - 2);
      ok(_.isEqual(ma.column("A").data, _.movingAvg(this.column("A").data, 3)));
      ok(_.isEqual(ma.column("B").data, _.movingAvg(this.column("B").data, 3)), "Actual" + ma.column("B").data + " ,expected: " + _.movingAvg(this.column("B").data, 3));
      ok(_.isEqual(ma.column("C").data, _.movingAvg(this.column("C").data, 3)));
    }});
  });

  test("Basic Moving Average custom idAttribute", function() {
    var ds = new Miso.Dataset({
      data : getMovingAverageData(),
      strict: true,
      idAttribute : "A"
    }).fetch({ success :function() {
      
      var ma = this.movingAverage(["B", "C"], 3);
      equals(ma.length, this.length - 2);
      ok(_.isEqual(ma.column("B").data, _.movingAvg(this.column("B").data, 3)), "Actual" + ma.column("B").data + " ,expected: " + _.movingAvg(this.column("B").data, 3));
      ok(_.isEqual(ma.column("C").data, _.movingAvg(this.column("C").data, 3)));
    }});
  });

  test("Basic Moving Average custom idAttribute should fail when including id col", 1, function() {
    var ds = new Miso.Dataset({
      data : getMovingAverageData(),
      strict: true,
      idAttribute : "A"
    }).fetch({ success :function() {
      
      raises(function(){
        var ma = this.movingAverage(["A","B"], 3);  
      });
    
    }});
  });

  test("Single column moving average", function() {
    var ds = new Miso.Dataset({
      data : getMovingAverageData(),
      strict: true
    }).fetch({ success :function() {
      
      var ma = this.movingAverage(["A"], 3);
      equals(ma.length, this.length - 2);
      ok(_.isEqual(ma.column("A").data, _.movingAvg(this.column("A").data, 3)));
      ok(_.isEqual(ma.column("_id").data, this.column("_id").data.slice(2, this.length)));
      
      var firstId = this.column("_id").data[0];
      var lastId = this.column("_id").data[this.length-1];
      
      ok(_.isEqual(ma.column("_oids").data[0], [firstId, firstId+1, firstId+2]));
      ok(_.isEqual(ma.column("_oids").data[ma.length-1], [lastId-2, lastId-1, lastId]));

      ok(_.isEqual(ma.column("B").data, [8,7,6,5,4,3,2,1]));
      ok(_.isEqual(ma.column("C").data, [30,40,50,60,70,80,90,100]));
    }});
  });

  test("Alternate Method Moving Average", function() {
    var ds = new Miso.Dataset({
      data : getMovingAverageData(),
      strict: true
    }).fetch({ success :function() {
      
      var ma = this.movingAverage(["A", "B", "C"], 3, { method : _.variance});
      equals(ma.length, this.length - 2);
      ok(_.isEqual(ma.column("A").data, _.movingAvg(this.column("A").data, 3, _.variance)));
      ok(_.isEqual(ma.column("B").data, _.movingAvg(this.column("B").data, 3, _.variance)));
      ok(_.isEqual(ma.column("C").data, _.movingAvg(this.column("C").data, 3, _.variance)));
    }});
  });

  test("Syncing moving average", function() {
    var ds = new Miso.Dataset({
      data : getMovingAverageData(),
      strict: true,
      sync : true
    }).fetch({ success :function() {
      
      var ma = this.movingAverage(["A", "B", "C"], 3);
      equals(ma.length, this.length - 2);
      ok(_.isEqual(ma.column("A").data, _.movingAvg(this.column("A").data, 3)));
      ok(_.isEqual(ma.column("B").data, _.movingAvg(this.column("B").data, 3)));
      ok(_.isEqual(ma.column("C").data, _.movingAvg(this.column("C").data, 3)));

      this.update({ _id : this.column("_id").data[0],
        A : 100, B : 100, C : 100
      });

      ok(_.isEqual(ma.column("A").data, _.movingAvg([100,2,3,4,5,6,7,8,9,10], 3)));
      ok(_.isEqual(ma.column("B").data, _.movingAvg([100,9,8,7,6,5,4,3,2,1], 3)));
      ok(_.isEqual(ma.column("C").data, _.movingAvg([100,20,30,40,50,60,70,80,90,100], 3)));
    }});
  });

  module("Group By");
  function getData() {
    return {
      columns : [
        { 
          name : "state",
          type : "string",
          data : ["AZ", "AZ", "AZ", "MA", "MA", "MA"]
        },
        {
          name : "count",
          type : "number",
          data : [1,2,3,4,5,6]
        },
        {
          name : "anothercount",
          type : "number", 
          data : [10,20,30,40,50,60]
        }
      ]
    };
  }

  test("base group by", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"]);

      ok(_.isEqual(groupedData._columns[2].data, ["AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [6,15]), "counts correct");
      ok(_.isEqual(groupedData._columns[4].data, [60,150]), "anothercounts correct");
    });
  });

  test("base group by with custom idAttribute", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true,
      idAttribute: "count"
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["anothercount"]);

      ok(_.isEqual(groupedData.column("state").data, ["AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData.column("anothercount").data, [60,150]), "anothercounts correct");
    });
  });

  test("base group by syncable update", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true,
      sync : true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"]);
      var rowid = ds._columns[0].data[0];
      
      ds.update({
        _id : rowid,
        state : "MN"
      });

      ok(_.isEqual(groupedData._columns[2].data, ["MN", "AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [1,5,15]), "counts correct");
      ok(_.isEqual(groupedData._columns[4].data, [10,50,150]), "anothercounts correct");
    });
  });

  test("base group by syncable update with custom idAttribute", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true,
      sync : true,
      idAttribute: "count"
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["anothercount"]);
      var rowid = ds._columns[0].data[0];
      
      ds.update({
        count : rowid,
        state : "MN"
      });

      // TODO: the count column get overwritten since these are new rows... so it really
      // is no longer a count column. It's just an id column. Not sure what to do about it
      // at this point. Should it just go back to being an _id column? I think maybe?
      ok(_.isEqual(groupedData.column("_oids").data, [[1], [2,3], [4,5,6]]), "oids correct");
      ok(_.isEqual(groupedData.column("state").data, ["MN", "AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData.column("anothercount").data, [10,50,150]), "anothercounts correct");
    });
  });

  test("base group by syncable add (existing category)", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true,
      sync : true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"]);
      
      ds.add({
        state : "AZ", count : 100, anothercount : 100
      });

      ok(_.isEqual(groupedData._columns[2].data, ["AZ", "MA"]), groupedData._columns[2].data);
      ok(_.isEqual(groupedData._columns[3].data, [106,15]),     groupedData._columns[3].data);
      ok(_.isEqual(groupedData._columns[4].data, [160,150]),    groupedData._columns[4].data);
    });
  });

  test("base group by syncable add (new category)", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true,
      sync : true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"]);
      
      ds.add({
        state : "MN", count : 100, anothercount : 100
      });

      ok(_.isEqual(groupedData._columns[2].data, ["AZ", "MA", "MN"]), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [6,15,100]), "counts correct");
      ok(_.isEqual(groupedData._columns[4].data, [60,150,100]), "anothercounts correct");
    });
  });

  test("base group by syncable remove (remove category)", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true,
      sync : true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"]);
      var rowid = ds._columns[0].data[0];
      ds.remove(rowid);

      ok(_.isEqual(groupedData._columns[2].data, ["AZ", "MA"]), groupedData._columns[2].data);
      ok(_.isEqual(groupedData._columns[3].data, [5,15]),      groupedData._columns[3].data);
      ok(_.isEqual(groupedData._columns[4].data, [50,150]),     groupedData._columns[4].data);
    });
  });

  test("base group by with diff modifier", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", 
        ["count", "anothercount"], {
          method : function(array) {
            return _.reduce(array, function(memo, num){ 
              if ( _.isUndefined(num) || _.isNull(num) ) {
                num = 1;
              }
              return memo * num; 
            }, 1);
          }
        });

      ok(_.isEqual(groupedData._columns[2].data, ["AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [6,120]), "counts correct");
      ok(_.isEqual(groupedData._columns[4].data, [6000,120000]), "anothercounts correct");
    });
  });

  test("group by with preprocessing of categoeies", function() {
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"], {
        preprocess : function(state) {
          return state + state;
        }
      });

      ok(_.isEqual(groupedData._columns[2].data, ["AZAZ", "MAMA"]), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [6,15]), "counts correct");
      ok(_.isEqual(groupedData._columns[4].data, [60,150]), "anothercounts correct" + groupedData._columns[3].data);

      groupedData = ds.groupBy("state", ["count", "anothercount"], {
        preprocess : function() {
          return "A";
        }
      });

      ok(_.isEqual(groupedData._columns[2].data, ["A"]), "states correct");
      ok(_.isEqual(groupedData._columns[2].data.length, 1), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [21]), "count correct");
      ok(_.isEqual(groupedData._columns[4].data, [210]), "anothercounts correct" + groupedData._columns[3].data);
    });

  });
}(this));

