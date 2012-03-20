(function(global) {
  
  var Util  = global.Util;
  var Miso    = global.Miso || {};

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

  function getGroupByData() {
    return {
      columns : [
        { 
          name : "state",
          type : "string",
          data : ["AZ", "MA"]
        },
        {
          name : "count",
          type : "number",
          data : [6,15]
        },
        {
          name : "anothercount",
          type : "number", 
          data : [60,150]
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

  test("base group by syncable update", function() {
    
    var ds = new Miso.Dataset({
      data : getData(),
      strict: true,
      sync : true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"]);
      var rowid = ds._columns[0].data[0];
      
      ds.update(rowid, {
        state : "MN"
      });

      ok(_.isEqual(groupedData._columns[2].data, ["MN", "AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [1,5,15]), "counts correct");
      ok(_.isEqual(groupedData._columns[4].data, [10,50,150]), "anothercounts correct");
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
              return memo * num; 
            }, 1);
          }
        });

      ok(_.isEqual(groupedData._columns[2].data, ["AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData._columns[3].data, [6,120]), "counts correct");
      ok(_.isEqual(groupedData._columns[4].data, [6000,120000]), "anothercounts correct" + groupedData._columns[3].data);
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
        preprocess : function(state) {
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