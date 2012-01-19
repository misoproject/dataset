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
};

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
  }
}
test("base group by", function() {
  
  var ds = new DS.Dataset({
    data : getData(),
    strict: true
  });

  var groupedData = ds.groupBy("state", ["count", "anothercount"]);

  ok(_.isEqual(groupedData._columns[1].data, ["AZ", "MA"]), "states correct");
  ok(_.isEqual(groupedData._columns[2].data, [6,15]), "counts correct");
  ok(_.isEqual(groupedData._columns[3].data, [60,150]), "anothercounts correct");
});

test("base group by with diff modifier", function() {
  
  var ds = new DS.Dataset({
    data : getData(),
    strict: true
  });

  var groupedData = ds.groupBy("state", 
    ["count", "anothercount"],
    function(array) {
      return _.reduce(array, function(memo, num){ 
        return memo * num; 
      }, 1);
    });

  ok(_.isEqual(groupedData._columns[1].data, ["AZ", "MA"]), "states correct");
  ok(_.isEqual(groupedData._columns[2].data, [6,120]), "counts correct");
  ok(_.isEqual(groupedData._columns[3].data, [6000,120000]), "anothercounts correct" + groupedData._columns[3].data);
});