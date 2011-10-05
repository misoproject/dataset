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
  format : "String - optional file format specification, otherwise we'll try to guess",
  recursive: "Boolean - if true build nested arrays of objects as datasets",
  strict: "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
  parse: "function to apply to JSON before internal interpretation, optional"
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
dataset.columns('GER.1.M').metadata
=> {"definition": "Gross Enrolment Ratio for male students, see http://..."}
dataset.columns('GER.1.M').metadata({
  definition: "Gross Enrolment Ratio for male students, see UNESCO Doc 3.23.332"
});

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

// event object:
event.delta = returns the formats below.

// cell delta:
// { row : 3, column : 4, oldValue: { value : 12 } , newValue : { value : 14 }}

// column / row / dataset delta
[{ row : 3, column: 4, oldValue: { value : 12 } , newValue : { value : 14 }}, { row : 3, column: 4, oldValue: { value : 12 } , newValue : { value : 14 }} ...]

dataset.push(); // combines the last deltas since preious push into a single delta array
dataset.pop(); // undoes the last set of deltas


dataset.bind('change', function(event) {
  // do things here on dataset change
});

// 2. On Column
data.columns(3).bind('change', function(event) {});

// 3. On Row
data.rows(12).bind('change', function(event) {});

// 4. On Field
dataset.columns(3).rows(4).bind('change', function(event) {
  // do things here on field value change
});

// Column / Row add/remove events
dataset.columns.bind('add', function(column) {});
dataset.columns.bind('remove', function(column) {});
dataset.rows.bind('add', function(row) {});
dataset.rows.bind('remove', function(row) {});

// columns
// --------

// data types
$.dataset.datatypes.NUMBER
$.dataset.datatypes.STRING
$.dataset.datatypes.BOOLEAN
$.dataset.datatypes.ARRAY
$.dataset.datatypes.OBJECT
$.dataset.datatypes.DATASET
//explicit support for nested datasets could allow for a variety of smarter operations
//with a touch more magic than simple OBJECT or ARRAY would allow. Nested arrays
//can be recursively be built as datasets when passed in.

// getting all columns:
dataset.columns();

// getting a number of columns
// would return the same type of object as dataset.columns.filter
dataset.columns('name','otherName')

=> [{ name : "Column1", type: "number|string|boolean|array|object", position: 0 ... }, ... ] //any other types?

// getting specific column:
dataset.columns(3);
dataset.columns("name");

=> { name: "Column5", type: "number", position: 3 ... };

// typechecking
dataset.columns(3).isNumber();
dataset.columns(3).isString();
dataset.columns(3).isBoolean();
dataset.columns(3).isArray();
dataset.columns(3).isObject();

// type setting
dataset.columns(3).setType($.dataset.datatypes.NUMBER);
// This will result in the column being iterated over and converted appropriately.

// TODO: need to define a row object, a column object

// math:
// -----------------------
// Note: when calling a math function on a non numeric column, the result will be NaN.

dataset.columns(3).min();

=> 3.21 

dataset.columns(3).max();

=> 4.2

dataset.columns(3).mean();

=> 4

dataset.columns(3).mode();

// frequency table
dataset.columns(3).freq();

=>[{ 
    value : 12,
    count : 100
  }, ...];

// standard deviation  
dataset.columns(3).std();

=> 0.4

// moving average, with subset 5.
dataset.columns(3).movingAvg(5);

=> [1, 2, 4];

// what other math operations might be worth while here?

// column transformation:
// -----------------

// allows one to map a column based on the value it has.
// Note2: Transformation function needs to be stored on column so that inserted data can be transformed appropriatly - OR SHOULD IT?! < TODO
dataset.columns(3).transform(function(value) {
  
  // this modifier accesses column. Should it access field?
  this.setType($.dataset.datatypes.BOOLEAN);

  // return value becomes the new row value
  if (value > 1) {
    return true;
  } else {
    return false;
  }
});

dataset.columns(3).transform(myTransform, { clone: true, silent: true }));

// Adding Rows
dataset.rows.add( [ 15,true,'maybe',{value: 15, metadata: test} ] )
dataset.rows.add( {total: 15, paid: true, notes: 'maybe', tax: {value: 15, metadata: test} ] )

// Addding columns
dataset.columns.add( { name: "some new column!", metdata: {}, type: "String" }, data )

// Removing columns and rows
dataset.columns(3).remove()
dataset.rows(3).remove()

// will return a copy of the column and will NOT modify the actual raw data?
// does transform trigger the change event?
//optionally return an object to modify metadata, otherwise return value assumed to be value
dataset.columns(3).transform(someFunction, { clone : true });

data.columns(3).change(function(event) {
   listDisplay.update(event.delta);    
});

dataset.columns(3).transform(function(cell) {
    return Math.sin(cell.value); 
});

//Sorting - allow the dataset to be sorted by a function
dataset.sortBy(function(a,b) {
  return (a['total_cost'] > b['total_cost']);
});

//Filtering / Querying
//Do these return a partial version of the dataset?
dataset.columns().filter(function(column) {
  return column.isNumber();
})

dataset.rows().filter(function(row) {
  return (rows('year') > 2000);
})

// retrieve any transform function applied to a column:
dataset.columns(3).getTransform();

=> function() { ... }

// check if a column has a transform function applied to it.
dataset.columns(3).hasTransform();

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

=> //Internal/strict format?

dataset.toArray();

=> [ [1, "Bob"], [2, "Sallie"] ...];

dataset.toTabular("\t");
//default to using the delimiter specified on init?

=> "1\tBob\n2\tSallie";

// any other export format here?

// value access:
// -------------

dataset.columns(3).rows(2);

=> {value: "Bob", metadata: {}}

dataset.columns("name").rows(2);

=> {value: "Bob", metadata: {}}

// setting value: 
dataset.columns("name").rows(2).set({ 'value' : 12, metadata: {} }, {silent: true}); //won't trigger a change event.

// this should throw a type check error based on the column type. It could also just return undefined instead if we don't want to throw errors - any preference here?


// Useful codes from maxogden:
https://github.com/maxogden/recline/blob/master/attachments/script/costco-csv-worker.js
https://github.com/maxogden/recline/blob/master/app.js#L32

