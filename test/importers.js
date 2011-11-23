$(document).ready(function() {

  (function() {

     function verifyImport(obj, strictData) {
         // check properties exist
        ok(typeof strictData._rows !== "undefined", "rows property exists");
        ok(typeof strictData._columns !== "undefined", "columns property exists");
        
        // check data size
        ok(strictData._rows.length === 5, "there are 5 rows");
        ok(strictData._columns.length === 4, "there are 4 columns");

        // verify all rows have ids
        _.each(strictData._rows, function(row, i) {
          ok(typeof row._id !== "undefined", "Row " + i + " has an _id.");
        });

        // verify row caches were put into place by importers.
        ok(typeof strictData._byRowId !== "undefined", "by row id cached");
        ok(typeof strictData._byColumnId !== "undefined", "by column id cached");
        ok(typeof strictData._byColumnName !== "undefined", "by column name cached");
        ok(_.keys(strictData._byRowId).length == strictData._rows.length, "Same number of rows in both row references");
        ok(_.keys(strictData._byColumnId).length == strictData._columns.length, "Same number of columns in both columns references");
        ok(_.keys(strictData._byColumnName).length == strictData._columns.length, "Same number of columns in both columns references");

        // Verify all column position have been set.
        _.each(strictData._columns, function(column, i) {
          ok(column.position === i, "proper column position has been set");
        });
    };
     
    module("Importing Obj");   
    test("Convert object to dataset", function() {
      var obj = [{"character" : "α", "name" : "alpha", "is_modern" : true, "numeric_value" : 1}, 
        {"character" : "β", "name" : "beta", "is_modern" : true, "numeric_value" : 2}, 
        {"character" : "γ", "name" : "gamma", "is_modern" : true, "numeric_value" : 3}, 
        {"character" : "δ", "name" : "delta", "is_modern" : true, "numeric_value" : 4}, 
        {"character" : "ε", "name" : "epsilon", "is_modern" : false, "numeric_value" : 5}];
        
      var importer = new DS.Importers.Obj(obj);
      var strictData = importer.parse();
      
      verifyImport(obj, strictData);

       // check first row
      _.each(obj, function(row, i){
        ok(_.isEqual(_.values(row), strictData._rows[i].data), "row " + i + " is equal");      
        ok(typeof strictData._rows[i].data !== "undefined", "row " + i + " has an id");
      });

      // check column types
      ok(strictData._columns[0].name === "character", "character is first column");
      ok(strictData._columns[0].type === "string", "character is string type");
      ok(strictData._columns[1].name === "name", "name is 2nd column");
      ok(strictData._columns[1].type === "string", "name is string type");
      ok(strictData._columns[2].name === "is_modern", "is_modern is 3rd column");
      ok(strictData._columns[2].type === "boolean", "is_modern is boolean type");
      ok(strictData._columns[3].name === "numeric_value", "numeric_value is 4th column");
      ok(strictData._columns[3].type === "number", "numeric_value is boolean type"); 

    });

    module("Strict Importer")
    test("Basic Strict Import", function() {
      var obj = { "metadata" : {"name" : "Greek Alphabet" },
    "columns" : [ 
      {"name" : "character", "type" : "string"}, 
      {"name" : "is_modern", "type" : "boolean"}, 
      {"name" : "name", "type" : "string"}, 
      {"name" : "numeric_value", "type" : "number"} 
    ],
    "rows" : [   
      { data : ["α","alpha",true,1] },
      { data : ["β","beta",true,2] },
      { data : ["γ","gamma",true,3] },
      { data : ["δ","delta",true,4] },
      { data : ["ε","epsilon",false,5] }]};
      
      var importer = new DS.Importers.Strict(obj);
      var strictData = importer.parse();
      
      verifyImport(obj, strictData);

          // check column types
      ok(strictData._columns[0].name === "character", "character is first column");
      ok(strictData._columns[0].type === "string", "character is string type");
      ok(strictData._columns[1].name === "is_modern", "is_modern is 2nd column");
      ok(strictData._columns[1].type === "boolean", "is_modern is boolean type");
      ok(strictData._columns[2].name === "name", "name is 3rd column");
      ok(strictData._columns[2].type === "string", "name is string type");
      ok(strictData._columns[3].name === "numeric_value", "numeric_value is 4th column");
      ok(strictData._columns[3].type === "number", "numeric_value is number type"); 
    });
  })();
});
