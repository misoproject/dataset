/*

  Spec for a dataset management plugin.
  The plugin will provide an object that can be queried.

  Formats that should be supported:
  tabular - delimited (specified delimiter)
  json    - array of objects
  dom table - A table object
    
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
var ds = new Dataset({url : 'http://mydata.com/stuff.json'});

// jsonp
var ds = new Dataset({url : 'http://mydata.com/stuff.json', jsonp: true});

// Using a url - tabular (note delimiter specified):
var ds = new Dataset({url : 'http://mydata.com/stuff.csv', delimiter: ","}); 

// From existing object:
var dataObj = [{ id: 1, count: 12 }, { id: 2, count: 14 }],
    ds = new Dataset({ data: dataObj });

// From dom table
var datatable = $('table#datatable'),
    ds = new Dataset({ table: datatable });

// dataset metadata
// ---------------

// what metadata about columns do we want here?
ds.columns('GER.1.M').metadata
=> {"definition": "Gross Enrolment Ratio for male students, see http://..."}
ds.columns('GER.1.M').metadata({
  definition: "Gross Enrolment Ratio for male students, see UNESCO Doc 3.23.332"
});

// dataset types
// -------------

// json
// file endings supporting auto detection: .json
Dataset.types.JSON

// tabular
// file ending supporting auto detection:
// .csv - "," delimiter unless otherwise specified
// .tsv - "\t" delimiter unless otherwise specified
// any other common formats?
Dataset.types.TABULAR
Dataset.types.DOMTABLE
?

// dataset delimiter regex
// TODO: add what delimiters we are going to check for by default:
// columns: , \t : | 
// rows: \n 
// anything else?

// dataset transformations
// -----------------------

// cell delta:
{ row : 3, column : 4, oldValue: { value : 12 } , newValue : { value : 14 }}

// column / row / dataset delta
// a collection of cell delta operations.
[{ row : 3, column: 4, oldValue: { value : 12 } , newValue : { value : 14 }}, 
 { row : 3, column: 4, oldValue: { value : 12 } , newValue : { value : 14 }} ...]

// when modifying the dataset, it's important to preserve the original dataset and to have
// a way to revert any transformation of the data. To do so, before modifying the dataset
// one can call "push" on it, which will allocate a new diff slot. Every subsequent change 
// will be put into that slot.
ds.push();

// When wanting to revert the cumulative changes since the last push, one can call pop
// which will undo whatever was last put on the queue.
ds.pop(); 

// TODO: Do transformations that happen without having called push modify the dataset?

// Events
// -------

// event object:
// Has event type;
event.type = ["change" | "add" | "remove"];

// Has delta
// See the dataset transformations section above. 
// Delta will either be a single delta object or an array of deltas.
event.delta

// CHANGE event
// gets triggered when the value changes.

// 1. Subscribe on entire dataset:
ds.bind('change', function(event) {});

// 2. Subscribe on Column
ds.columns(3).bind('change', function(event) {});

// 3. Subscribe on Row
ds.rows(12).bind('change', function(event) {});

// 4. Subscribe on Field
ds.columns(3).rows(4).bind('change', function(event) {});

ds({ row : x, column : y}).bind ... <- this way you can add more flexability about extracting a subset.

// Column / Row add/remove events

// REMOVE event
// gets triggered on row or column remove

ds.columns.bind('remove', function(column) {});
ds.rows.bind('remove', function(row) {});

// ADD event
// gets triggered on row or column add
ds.rows.bind('add', function(row) {});
ds.columns.bind('add', function(column) {});


// columns
// --------

// data types
Dataset.datatypes.NUMBER
Dataset.datatypes.STRING
Dataset.datatypes.BOOLEAN
Dataset.datatypes.ARRAY
Dataset.datatypes.OBJECT

// Explicit support for nested datasets could allow for a variety of smarter operations
// with a touch more magic than simple OBJECT or ARRAY would allow. Nested arrays
// can be recursively be built as datasets when passed in.
Dataset.datatypes.DATASET

// getting all columns:
ds.columns();

// getting specific column:
ds.columns(3);
ds.columns("Column1");

=> { name : "Column1", 
      type: "number|string|boolean|array|object|dataset", 
      position: 3,
      metadata : {} ... }

// getting a number of columns
// would return the same type of object as dataset.columns.filter
ds.columns('Column1','Column2')

=> [{ name : "Column1", 
      type: "number|string|boolean|array|object|dataset", 
      position: 0,
      metadata : {} ... },
    { name : "Column2", 
      type: "number|string|boolean|array|object|dataset", 
      position: 3,
      metadata : {} ... } 
    ...]

// typechecking
ds.columns(3).isNumber();
ds.columns(3).isString();
ds.columns(3).isBoolean();
ds.columns(3).isArray();
ds.columns(3).isObject();

// type setting
ds.columns(3).setType(Dataset.datatypes.NUMBER);
// This will result in the column being iterated over and converted appropriately.

// column math:
// -----------------------
// Note: when calling a math function on a non numeric column, the result will be NaN.

ds.columns(3).min();

=> 3.21 

ds.columns(3).max();

=> 4.2

ds.columns(3).mean();

=> 4

ds.columns(3).mode();

// frequency table
ds.columns(3).freq();

=>[{ 
    value : 12,
    count : 100
  }, ...];

// standard deviation  
ds.columns(3).std();

=> 0.4

// moving average, with subset 5.
ds.columns(3).movingAvg(5);

=> [1, 2, 4];

// TODO: what other math operations might be worth while here?

// column transformation:
// ---------------------

// Allows one to modify a column based on the value it has.
// Without any flags, this is a destructive operation in that 
// it will alter the column being transformed.
ds.columns(3).transform(function(value) {
  
  // this modifier accesses column. Should it access field?
  this.setType(Dataset.datatypes.BOOLEAN);

  // return value becomes the new row value
  if (value > 1) {
    return true;
  } else {
    return false;
  }
});

// Passing in clone will return a new column without modifying the original.
// New column won't be appended to dataset.
// Passing silent true, will not trigger change events.
ds.columns(3).transform(
  myTransformFunction, { 
    clone:  true, 
    silent: true 
  }
));

// Adding Rows
// Array of values in order:
ds.rows.add( [ 15, true, 'maybe', {value: 15, metadata: test} ] )

// JSON object that corresponds to a single row:
ds.rows.add( { total: 15, paid: true, notes: 'maybe', tax: { value: 15, metadata: test } ] )

// Addding columns
ds.columns.add( { name: "some new column!", metdata: {}, type: "String" }, data )

// Removing columns and rows
ds.columns(3).remove()
ds.rows(3).remove()

// Sorting
// Allow the dataset to be sorted by a function. It takes two
// rows?
ds.sortBy( function(a, b) {
  return (a['total_cost'] > b['total_cost']);
});

//Filtering / Querying
//Do these return a partial version of the dataset?
//Internally filters could be stored as a sparse array of returned values
//If the filter functions themselves are then stored they could be applied
//to new rows and the sparse array updated on add/update/delete
//Filters could also then trigger change events, which could be used
//to trigger updates to their clients.
ds.columns().filter(function(column) {
  return column.isNumber();
})

ds.rows().filter(function(row) {
  return (rows('year') > 2000);
}).bind('change', function(filterset) {
  this.update();
});
// rows
// ----

// get all rows 
// TODO: What format? Native to input? Our format?
ds.rows();

if json:
=> [ { id: 1, name: "Bob"}, { id: 2, name: "Sallie" }...];

if csv/table:
=> [ [1, "Bob"], [2, "Sallie"] ...];


// get specific row - same question as above about consistency...
ds.rows(3);

if json:
=> { id: 1, name: "Bob"};

if csv/table:
=> [1, "Bob"];

// dataset transformation:
// -----------------------

ds.toJSON();

=> //Internal/strict format?

ds.toArray();

=> [ [1, "Bob"], [2, "Sallie"] ...];

ds.toTabular("\t");
//default to using the delimiter specified on init?

=> "1\tBob\n2\tSallie";

// any other export format here?

// value access:
// -------------

ds.columns(3).rows(2);

=> {value: "Bob", metadata: {}}

ds.columns("name").rows(2);

=> {value: "Bob", metadata: {}}

// setting value: 
ds.columns("name").rows(2).set(
  { 'value' : 12, 
    metadata: {} 
  }, 
  { silent: true } //won't trigger a change event.
); 
// TODO: what should happen if the value is not correct for the column type?
