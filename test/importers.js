$(document).ready(function() {

  module("Importing Obj");
    
  test("Convert object to dataset", function() {
    var obj = [{"character" : "α", "name" : "alpha", "is_modern" : true, "numeric_value" : 1}, 
      {"character" : "β", "name" : "beta", "is_modern" : true, "numeric_value" : 2}, 
      {"character" : "γ", "name" : "gamma", "is_modern" : true, "numeric_value" : 3}, 
      {"character" : "δ", "name" : "delta", "is_modern" : true, "numeric_value" : 4}, 
      {"character" : "ε", "name" : "epsilon", "is_modern" : false, "numeric_value" : 5}];
      
    var importer = new DS.Importers.Obj(obj);
    var strictData = importer.parse();
    
    // check properties exist
    ok(typeof strictData.rows !== "undefined", "rows property exists");
    ok(typeof strictData.columns !== "undefined", "columns property exists");
    
    // check data size
    ok(strictData.rows.length === 5, "there are 5 rows");
    ok(strictData.columns.length === 4, "there are 4 columns");
    
    // check first row
    _.each(obj, function(row, i){
      ok(_.isEqual(_.values(row), strictData.rows[i].data), "row " + i + " is equal");
    });
    
    // check column types
    ok(strictData.columns[0].name === "character", "character is first column");
    ok(strictData.columns[0].type === "string", "character is string type");
    ok(strictData.columns[1].name === "name", "name is 2nd column");
    ok(strictData.columns[1].type === "string", "name is string type");
    ok(strictData.columns[2].name === "is_modern", "is_modern is 3rd column");
    ok(strictData.columns[2].type === "boolean", "is_modern is boolean type");
    ok(strictData.columns[3].name === "numeric_value", "numeric_value is 4th column");
    ok(strictData.columns[3].type === "number", "numeric_value is boolean type");
    
  });

});
