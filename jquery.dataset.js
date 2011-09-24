/*

  Spec for a dataset management jquery plugin.
  The plugin will provide an object that can be queried.
  

  Formats that should be supported:
  tabular - delimited (specified delimiter)
  json    - array of objects
  dom table - A table object

  Any other types? I don't want to play with XML but if needbe I can be persuaded


  TODO:
    Interpolation 
    
*/

// Creating a new dataset:
// -----------------------

// Constructor Parameters:
{
  url : "String - url to fetch data from",
  jsonp : "boolean - true if this is a jsonp request",
  delimiter : "String - a delimiter string that is used in a tabular datafile",
  data : "Object - an actual javascript object that already contains the data",
  table : "Element - a DOM table that contains the data",
  format : "String - optional file format specification, otherwise we'll try to guess"
}

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

// json
// file endings supporting auto detection: .json
$.dataset.types.JSON

// tabular
// file ending supporting auto detection:
// .csv - "," delimiter unless otherwise specified
// .tsv - "\t" delimiter unless otherwise specified
// any other common formats?
$.dataset.types.TABULAR
$.dataset.types.DOMTABLE
?

// dataset delimiter regex
// TODO: add what delimiters we are going to check for by default:
// columns: , \t : | 
// rows: \n 
// anything else?

// event types:
// change - value change
// 1. On Entire Dataset
// TODO: what should the callback take here? I feel like it needs old value and new value but it also
// needs to know what the position of that was and I don't feel like it needs to also take a column and row
// what do you think alex?
dataset.change(function(??) {
  // do things here on dataset change
});

// 2. On Column
data.column(3).change(function(??) {
  
});

// 3. On Row
data.row(12).change(function(??) {
  
});

// 4. On Field
dataset.column(3).row(4).change(function(oldValue, newValue) {
  // do things here on field value change
});

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
// Note: when calling a math function on a non numeric column, the result will be NaN.

dataset.column(3).min();

=> 3.21 

dataset.column(3).max();

=> 4.2

dataset.column(3).mean();

=> 4

dataset.column(3).mode();

// frequency table
dataset.column(3).freq();

=>[{ 
    value : 12,
    count : 100
  }, ...];

// standard deviation  
dataset.column(3).std();

=> 0.4

// what other math operations might be worth while here?

// column transform:
// -----------------

// allows one to transform a column based on the value it has.
// Note: not sure if transform is the proper function name. Alex pointed out this is just a "map" and
// it may make more sense to have a map.
// Note2: Transformation function needs to be stored on column so that inserted data can be transformed appropriatly - OR SHOULD IT?! < TODO
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

// retrieve any transform function applied to a column:
dataset.column(3).getTransform();

=> function() { ... }

// check if a column has a transform function applied to it.
dataset.column(3).hasTransform();

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
