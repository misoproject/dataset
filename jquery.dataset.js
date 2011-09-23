/*

  Spec for a dataset management jquery plugin.
  The plugin will provide an object that can be queried.
  

  Formats that should be supported:
  tabular - delimited (specified delimiter)
  json    - array of objects
  dom table - A table object

  Any other types? I don't want to play with XML but if needbe I can be persuaded


  TODO:
    Think about event callbacks for changes
    Store transformation for value insertion
    Pagination??
    Add standard deviation
    Add mean
    Add freq table
    Interpolation 
    
*/

// Creating a new dataset:
// -----------------------

// Using a url - json:
var dataset = $.dataset({url : 'http://mydata.com/stuff.json'});

// jsonp
var dataset = $.dataset({url : 'http://mydata.com/stuff.json', jsonp: true});

// Using a url - tabular (note delimiter specified):
var dataset = $.dataset({url : 'http://mydata.com/stuff.csv', delimiter: ","}); 

// From existing object:
var dataObj = [{ id: 1, count: 12 }, { id: 2, count: 14 }],
    dataset = $.dataset({ data: dataObj });

// From dom table
var datatable = $('table#datatable'),
    dataset = $.dataset({ table: datatable });

// dataset metadata
// ---------------

// what metadata about columns do we want here?

// dataset types
// -------------
$.dataset.types.JSON
$.dataset.types.TABULAR
$.dataset.types.DOMTABLE
?


// columns
// --------

// data types
$.dataset.datatypes.NUMBER
$.dataset.datatypes.STRING
$.dataset.datatypes.BOOLEAN
$.dataset.datatypes.ARRAY
$.dataset.datatypes.OBJECT

// getting all columns:
dataset.columns();

=> [{ name : "Column1", type: "number|string|boolean|array|object", position: 0 ... }, ... ] //any other types?

// getting specific column:
dataset.column(3);
dataset.column("name");

=> { name: "Column5", type: "number", position: 3 ... };

// typechecking
dataset.column(3).isNumber();
dataset.column(3).isString();
dataset.column(3).isBoolean();
dataset.column(3).isArray();
dataset.column(3).isObject();

// type setting
dataset.column(3).setType($.dataset.datatypes.NUMBER);
// This will result in the column being iterated over and converted appropriately.

// math:
// -----------------------
dataset.column(3).min();

=> 3.21 

dataset.column(3).max();

=> 4.2

dataset.column(3).average();

=> 4

// what other math operations might be worth while here?

// column transform:
// -----------------

// allows one to transform a column based on the value it has.
dataset.column(3).transform(function(value) {
  
  // this modifier accesses column. Should it access field?
  this.setType($.dataset.datatypes.BOOLEAN);

  // return value becomes the new row value
  if (value > 1) {
    return true;
  } else {
    return false;
  }
});

// rows
// ----

// get all rows - returns rows in what format? Native format of dataset? Should this be consistent?
dataset.rows();

if json:
=> [ { id: 1, name: "Bob"}, { id: 2, name: "Sallie" }...];

if csv/table:
=> [ [1, "Bob"], [2, "Sallie"] ...];


// get specific row - same question as above about consistency...
dataset.rows(3);

if json:
=> { id: 1, name: "Bob"};

if csv/table:
=> [1, "Bob"];

// dataset transformation:
// -----------------------

dataset.toJSON();

=> [ { id: 1, name: "Bob"}, { id: 2, name: "Sallie" }...];

dataset.toArray();

=> [ [1, "Bob"], [2, "Sallie"] ...];

dataset.toTabular("\t");

=> "1\tBob\n2\tSallie";

// any other export format here?

// value access:
// -------------

dataset.column(3).row(2);

=> "Bob"

dataset.column("name").row(2);

=> "Bob"

// setting value: 
dataset.column("name").row(2).set(12);
// this should throw a type check error based on the column type. It could also just return undefined instead if we don't want to throw errors - any preference here?


// Useful codes from maxogden:
https://github.com/maxogden/recline/blob/master/attachments/script/costco-csv-worker.js
https://github.com/maxogden/recline/blob/master/app.js#L32
