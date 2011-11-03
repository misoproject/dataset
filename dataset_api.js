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


//Filtering 
ds.filter({
  row : 5, 
  rows : [1,78,3], 
  column : "Name", 
  columns : ["name", "location"],
  silent : true/false,
  fn : function(row) {
    return row.id % 2 === 0 ? true : false;
  }
});

ds.columns("name") === ds.filter({column : "name", clone: false});

ds.columns("name").data === [30,22,32];

ds.columns("name").max() === _.max(ds.columns("name").data);
ds.columns("name").min()
ds.columns("name").mean()
ds.columns("name").mode()
ds.columns("name").freq()
ds.columns("name").std()
ds.columns("name").movingAvg(5);

ds.rows(29) === ds.filter({row : 29});

//Transforms
ds.transform(function(row) {
  this.set("name", "othername");
});

//Derivations
ds.filter({columns: ["name", "population"], silent : true})
  .derive("name", function(rows) {
    this.set('population', sum(rows('population')));
  });

// when modifying the dataset, it's important to preserve the original dataset and to have
// a way to revert any transformation of the data. To do so, before modifying the dataset
// one can call "push" on it, which will allocate a new diff slot. Every subsequent change 
// will be put into that slot.
ds.push();

// When wanting to revert the cumulative changes since the last push, one can call pop
// which will undo whatever was last put on the queue.
ds.pop(); 


//Accessing Metadata
ds.metadata({column : "name"}); // {type: "String", description : "..." };
ds.metadata({row : 44});
ds.metadata(); // dataset metadata


//Events

ds.bind('update', function(event) {
  event === {_id : 45, diff : { population : 254 }, prev : { population : 100} }
});

ds.bind('add', function(event) {
  event === {_id : 46, diff : { population : 254 } } //diff is whole row
});

ds.bind('remove', function(event) {
  event === {_id : 46, prev: { population : 254 } }
});

// data types
Dataset.datatypes.NUMBER
Dataset.datatypes.STRING
Dataset.datatypes.BOOLEAN
Dataset.datatypes.ARRAY
Dataset.datatypes.OBJECT

// Adding Rows
ds.rows.add( { total: 15, paid: true, notes: 'maybe', tax: { value: 15, metadata: test } } )
ds.columns.add( { name: "some new column!", type: "String" }, data )

// Sorting
// Allow the dataset to be sorted by a function. It takes two rows.
ds.sortBy( function(a, b) {
  return (a['total_cost'] > b['total_cost']);
});

//Value Access
ds.get(12, "name");
ds.set(12, { name : "Togo" }, { silent : true });


//This is a rough mapping of how we'll store data internally
{
  columns : [{ _id : _.uniqueId(), name : "one", type : "Integer" }],
  rows : [{ _id : 123, data: : [1], metadata : [{something: true}] }],
  metadata: {}
};

