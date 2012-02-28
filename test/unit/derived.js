(function(global) {
  
  var Util  = global.Util;
  var DS    = global.DS || {};

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
    
    var ds = new DS.Dataset({
      data : getData(),
      strict: true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"]);

      ok(_.isEqual(groupedData._columns[1].data, ["AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData._columns[2].data, [6,15]), "counts correct");
      ok(_.isEqual(groupedData._columns[3].data, [60,150]), "anothercounts correct");
    });
  });

  test("base group by with diff modifier", function() {
    
    var ds = new DS.Dataset({
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

      ok(_.isEqual(groupedData._columns[1].data, ["AZ", "MA"]), "states correct");
      ok(_.isEqual(groupedData._columns[2].data, [6,120]), "counts correct");
      ok(_.isEqual(groupedData._columns[3].data, [6000,120000]), "anothercounts correct" + groupedData._columns[3].data);
    });
  });

  test("group by with preprocessing of categoeies", function() {
    var ds = new DS.Dataset({
      data : getData(),
      strict: true
    });

    _.when(ds.fetch()).then(function(){
      var groupedData = ds.groupBy("state", ["count", "anothercount"], {
        preprocess : function(state) {
          return state + state;
        }
      });

      ok(_.isEqual(groupedData._columns[1].data, ["AZAZ", "MAMA"]), "states correct");
      ok(_.isEqual(groupedData._columns[2].data, [6,15]), "counts correct");
      ok(_.isEqual(groupedData._columns[3].data, [60,150]), "anothercounts correct" + groupedData._columns[3].data);

      groupedData = ds.groupBy("state", ["count", "anothercount"], {
        preprocess : function(state) {
          return "A";
        }
      });

      ok(_.isEqual(groupedData._columns[1].data, ["A"]), "states correct");
      ok(_.isEqual(groupedData._columns[1].data.length, 1), "states correct");
      ok(_.isEqual(groupedData._columns[2].data, [21]), "count correct");
      ok(_.isEqual(groupedData._columns[3].data, [210]), "anothercounts correct" + groupedData._columns[3].data);
    });

  });
}(this));