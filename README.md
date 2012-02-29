# Dataset.js

Dataset is a library that makes it easy to work with data on the client. Dataset makes it painless to import &amp; standardise datsets and then select &amp; manipulate data within them.

## Why Dataset

Dataset is designed to solve common problems and patterns around client-side dataset manipulation and management:

* Importing data from distinct sources into a common format
* Iterating over data
* Computing basic products (min, max etc.)
* Being able to subscribe to changes on the data

Unlike more general client-side model frameworks dataset is designed exclusively for working with matricies/tables of data. This allows dataset to provide a rich set of capabilities bit with this specific use case in mind as well as optimise for large numbers of rows in a standard format.

## Download 

### Including Dependancies

[miso.ds.deps.js](https://github.com/misoproject/dataset/tree/master/dist/miso.ds.deps.js) - Download Production With Dependancies - 0.0.1

[miso.ds.deps.min.js](https://github.com/misoproject/dataset/tree/master/dist/) - Download Development With Dependancies - 0.0.1

### Without Dependancies

The following builds do not have any of the dependancies built in. It is your own responsability to include them as appropriate script elements in your page.

[miso.ds.js](https://github.com/misoproject/dataset/tree/master/dist/miso.ds.js) - Download Production No Dependancies - 0.0.1

[miso.ds.min.js](https://github.com/misoproject/dataset/tree/master/dist/) - Download Development No Dependancies - 0.0.1

### Dependancies

Dataset has the following dependancies:

* [Underscore.js 1.3.1](http://underscorejs.org/)
* [Underscore.math.js (version unknown)](https://github.com/syntagmatic/underscore.math) 
* [Underscore.deferred.js 0.1.2](https://github.com/wookiehangover/underscore.Deferred)
* [moment.js 1.4.0](http://momentjs.com/) (for date and time parsing)


## Creating a Dataset

To begin working with your dataset, you first need to import your data. You can import either **local** data (in the form of a variable that happens to contain your data) or **remote** data (in the form of a url that we'll fetch from.)

### Local Importing

Out of the box Dataset can take local data objects or remote urls and import data in almost any common format.


* JSON (including jsonp)
* CSV
* TSV (Any delimiter is acceptable, including tabs) 

There is also a growing library of custom data importers such as: 

* Google Spreadsheets
* NYTimes Congress
* Github) & convert that data into a local dataset. 

#### Importing from a local object array

If you have an array of json objects, you can easily convert them to a Dataset like so:

```javascript
var myData = [
  { state : "Alabama", population : 4802740 },
  { state : "Massachusetts", population : 6587536 }
];

var ds = new DS.Dataset({
  data : myData
});
```

#### Importing from a local "strict" format object

If you happen to have your data preprocessed in what we call a "strict" format, you can speed up your import slightly by initializing your Dataset with the strict flag:

```javascript
var myData = {
  columns : [
    { name : "state", data : ["Alabama", "Massachusetts"] },
    { name : "population", data : [4802740, 6587536] }
  ]
}

var ds = new DS.Dataset({
  data : myData,
  strict: true
});
```

#### Importing from a local delimited string format

If for some reason you actually have all your data as a delimited string on the client side (which is an unlikely but possible,) you can import that into a dataset object too.

```javascript
var mydata = "state,population\n"+
			 "Alabala,4802740\n" +
			 "Massachusetts,6587536";
var ds = new DS.Dataset({
  data : myData,
  delimiter : ","
});
```

### Remote Importing

Most of the time, your data will live somewhere else and you'll want to fetch it via a url. All the above formats would work except you would need to replace your `data` property with with a `url` property like so:

```javascript
var ds = new DS.Dataset({
  url : "http://myserver.com/data/mydata.json"
});
```

#### Google Spreadsheet Importing

If you have a **published** Google Spreadsheet that you would like to import data from, you can do so with the following format:

```javascript
var ds = new DS.Dataset({
  google_spreadsheet : {
    key : "0Asnl0xYK7V16dFpFVmZUUy1taXdFbUJGdGtVdFBXbFE",
    worksheet: "1"
  }
});
```
The google spreadsheet importer is utilizing the format specified here:
[http://code.google.com/apis/gdata/samples/spreadsheet_sample.html](http://code.google.com/apis/gdata/samples/spreadsheet_sample.html)

### Custom Importers

The import system can also easily be extended for custom data formats and other APIs. See the "Write Your Own Importers" section for more information.

## Fetching the Data

Regardless of how you initialized your dataset, it needs to be fetched for the data to be available. To begin fetching your data, simply call `.fetch()` on it. 

Note that if the data is fetched remotely, this is an asyncronous operation, meaning that the code following your fetch call may be attempting to access data that doesn't exist yet! To remedy this you can do one of the following things:

### Pass success/error callbacks:

```javascript
ds.fetch({
  success : function() {
    // do things here after data successfully fetched.
    // note 'this' references the dataset.
  },
  
  error : function() {
    // do things here in case your data fails.
  }
});
```

### Using Deferreds

If you have more than one dataset you need to wait on, or you might be a fan of using deferreds, you can use them as follows:

```javascript
var ds1 = new DS.Dataset({ data : myData1 }),
    ds2 = new DS.Dataset({ data : myData2 });
    
_.when(ds1.fetch(), ds2.fetch()).then(function() {
  // do things when both datasets are fetched.
  // note 'this' is NOT set to the dataset here.
});
```

### Typing 

#### Built in Types

Dataset supports the following prebuilt data types:

* `number`
* `string`
* `boolean`
* `time`

#### Overriding Detected Types

Dataset will attempt to detect what the type of your data is. However, if any of your columns are of a `time` format, it's much more efficient for you to specify that directly as follows:

The format required is:

```javascript:
columTypes : {
  'columnName' : { type : '<known type (see Types Sections)>' … <any additional type required options here.>]
}
```

Dataset will take care of the actual type coercion, making it trivial to convert strings to numbers or timestamps to `moment` objects. For example, coercing the timestamp column into a time column and the total column to a numeric type would look like so:

```javascript

new DS.Dataset({
  url : "http://myserver.com/data/data.json",
  columnTypes : {
    'timestamp' : { type : 'time', format : 'MM/DD YYYY' },
    'total' : { type : 'numeric' }
  }
});
```

#### Custom Types

The type system itself can also be extended to support new rich data types as needed. To read more about that, see "Adding your own data types."

## Accessing Data

### Columns

A column has the following properties:

* `name` - the column name.
* `type` - the column type.
* `data` - the actual data of the column. This is an array.
* `_id`  - a unique column identifier.

Again, it is not recommended to modify the data in the column directly as this will not go through the event system. More on that further down.

#### Getting a Column By Name

```javascript
ds.column(columnName);
```

This returns the actual column object.

#### Iterating Over Columns

```javascript
ds.eachColumn(function(columnName) {
  // do what you need here.
});
```

#### Operations on a column:

##### sum

##### min

##### max

### Rows

#### Accessing a Specific Row

There are two ways to access rows in Dataset:

* By their position (as in, the 3rd row.)
  
  ```javascript
  ds.rowByPosition(index);
  ```

* By their unique identifier (assigned to each row during the data import.)
  
  ```javascript
  ds.rowById(rowId);
  ```

#### Iterating Over Rows

```javascript
ds.each(function(row) {

});
```

Note that the row object is not a direct reference to your actual data row (as in, if you modify it, it won't actually trigger a change in your dataset.) To change your dataset, you need to use the `update` method.

The row object will look as follows:

```javascript
{ columnName : 'value', … }
```

Note that each row has a unique identifier assiged to it called `_id`. Do not attempt to change that value unless you're feeling destructive.


## Data Modification

### Rows

#### Adding a Row

#### Removing a Row

#### Updating Rows


## Sorting

You can sort your Dataset by specifying a comparator on your constructor or at any later point like so:

```javascript
// initialize a new dataset
var ds = new DS.Dataset({
  data: { columns : [ 
    { name : "one",   data : [10, 2, 3, 14, 3, 4] },
    { name : "two",   data : [4,  5, 6, 1,  1, 1] },
    { name : "three", data : [7,  8, 9, 1,  1, 1] } 
  ] },
  strict: true
});

// define a comparator
ds.comparator = function(r1, r2) {
  if (r1.one > r2.one) {return 1;}
  if (r1.one < r2.one) {return -1;}
  return 0;
};

_.when(ds.fetch(), function(){
  ds.sort();
  
  // your data now looks like so:
  // [2,3,3,4,10,14]
  // [5,6,1,1,4,1]
  // [8,9,1,1,7,1]
});
```

### Selection
Dataset makes it easy to select sections of your columns and rows based on either static or function based criteria.

```javascript
  var ds = new DS.Dataset({ ... });

  ds.select({
    rows : function(row) {
      return row.total > 5000 ? true : false
    },
    columns : ['name', 'total']
  });
```

### Grouping &amp; Modification
Dataset comes with a powerful set of abilities to modify your data to generate moving averages, group data by other rows and other abilities. These will create a new dataset and leave the original untouched.

```javascript
  var ds = new DS.Dataset({ ... });

  ds.groupBy('state', ['income', 'expenditure']);
  ds.movingAvg('income', { width : 3 } )
```

### Products
Generate numbers about your data - min, max, mean, mode.

```javascript
  var ds = new DS.Dataset({ ... });

  ds.mode('income');
  ds.max('income');
```


### Realtime / Live updates
Products, Modifications and Selections can all be live, meaning changes and updates to the underlying dataset will be reflected in those as well, making it easy to handle sophisticated visualisations on top of realtime data. 

Live products, modifications and selections emit events and can have callbacks bound to them changing. The synced versions of each can accessed as such:

#### Selections

```javascript
  var ds = new DS.Dataset({ ... });

  var view = ds.view({ rows : function(row) {
    return row.assets > 100000;
  });

  //events
  view.on('add', function() { ... });
  view.on('remove', function() { ... });
  view.on('update', function() { ... });
```

#### Modifications

```javascript
  var ds = new DS.Dataset({ ... });

  ds.derive('groupBy', 'state', ['income', 'expenditure']);
```

#### Products

```javascript
  var ds = new DS.Dataset({ ... });

  ds.product('max', 'assets');
```

***
***
***
***

## What Dataset doesn't do

2. Explain why it exists
  - Why we made it
  - What it does
  - What it doesn't do


3. Creating a new dataset

  -- Sources
  3.1 From local object
  3.2 From remote object

  -- Types
  3.3 Array of Objects
  3.4 CSV

 -- Custom
  3.5 Google Spreadsheet

4. Iterating over rows in dataset
  -- Example
  -- Explaining row object
  -- Note that there is NO link between row object and actual row.

5. Creating a view
  -- Explain how views work
  -- Show example of creating a view
  -- Saving a view for later retrieval
  -- Creating a saved view that is parameterized
  -- Updating a view manually
 
6. Events
  -- Create a view
  -- Tie some event to it
  -- Change something about original dataset

7. Computed Values
  -- Explain that by computed values we mean a single numeric result
  -- Show how to create them (max, min etc.)
  -- Show how you can bind an event to it.

8. Aggregate Selections
  -- Explain what that means
  -- Show example doing a group by
  -- Bind to it
  -- Change something about original dataset

IF YOU WANT TO EXTEND DATASET OR UNDERSTAND HOW IT WORKS
===========================================================

This is where ALL the advanced stuff goes

1. Terminology
  -- Importer
  -- Parser
  -- View
  -- Product
  -- Derivative

2. Explain file structure in the repo
  -- Explain the inheritance.

3. Explain the basic event system

4. Explain the internal representation of dataset

5. Importers
  -- Talk about basic structure
  -- Talk about required signature
  -- Show example here of a custom importer

6. Parsers
  -- Talk about basic DS.Parsers object and what it gives you
  -- Talk about existing parsers
  -- Talk about required functionality from a parser
  -- Show example here of a custom parser

6. Views
  -- What advanced things do we want to talk about here?
  -- Talk about sync.
  -- Talk about how Views are the non destructive side of dataset

7. Derivatives
  -- Explain that derivatives are still datasets
  -- Explain how they maintain their connection
  -- Show example of new derivative
  -- Explain how using the base parser might be useful here.

8. Products
  -- What is this.calculated? Explain how products work.
  -- Creating your own
  -- Show example of creating a product.

... What else?



# Old Outline to pull things out of:

Dataset
==============

# About
Dataset is a javascript library for the manipulation and management of datasets in javascript. Dataset is designed to reduce the work involved in creating complex or multiple data visualisations powered by a single set of data, particulary when that data itself changes in realtime or in response to user input. 

# Why use Dataset
As it's designed purely for working with datasets. DS addresses the precise painpoints that make working with datasets challenging. Dataset makes it trivial to:

* load datasets from any format
* create subselections of data
* create 'derivative' data based on original values 
* compute 'products' created by analysing the data
* maintain an implicit connection between subselections, derivatives and products. 

# Setup & Development

## For using Dataset in your projects: 

Download `dist/ds.min.js` OR
an unminified version for development `dist/ds.js`

Note that this includes a built version of dependancies - `underscore.js` and `moment.js`.

## For modifying dataset or contributing back:

```
$ npm install
```

Build:

```
$ jake
```

Lint Source separatly (which happens as part of the full build process):

```
$ jake hint
```

# Initializing a Dataset

[GO OVER CONSTRUCTOR PROPERTIES HERE. CREATE A DATASET]

# Importing data to Dataset
Dataset is essentially an augumented matrix.

## Import process stages
Fetch > Extract > Parse

* Fetching data can be done from a *remote* source, such as a URL but also from a *local* object, such as an array of json objects.
* Extracting the data involves literally extracting it from the entire data that comes in through the fetch. Sometimes that just means taking a specific property in an object which actually contains the data, and sometimes that involves parsing strings. All depends on the format.
* Parsing involves actually converting whatever format the data comes in to our internal representation. More about that later.

## Creating importers
[Advanced - MOVE THIS FURTHER DOWN]

# Column Typing
[Intermediate - MOVE THIS FURTHER DOWN]

## Creating Types
[Advanced - MOVE THIS FURTHER DOWN]

# Metadata

# Querying data from a Dataset
The simplest way to get raw data out of a dataset is to use `ds.each` to iterate over each row as a simple object but dataset has a system by which you can create subselections of data based on dynamic or static criteria. This subset will then maintain a 'link' to the original dataset and dynamically update to reflect changes in the dataset.

## Views 
Views consistent of configuration for the selection of specific rows and or columns from the parent dataset. Views are automatically updated to reflect changes in the parent dataset such as additions that may need to become part of the view, deletions that mean rows need to be removed from the view or updates that mean a row may or may not be a valid part of a given view. 

Columns can be selected by a single column name, an array or an columns names. Rows can be selected by an object with specific values for columns or a function which returns true for rows that should be included. The function will be passed the row as an object as well as its index and will have the context of the full dataset.
```javascript
var ds = new Miso.DS({ });

ds.where({ columns : ['2008', '2009'], rows : function(row) {
  row.total > 500;
} });

ds.where({ rows: { mobile : true } });

ds.columns(['primary', 'secondary']);
ds.column('RWA');

ds.rows({ capacity : 'large' });
```

[ADD ds.each EXAMPLE HERE]

## Views [PICK VIEWS OR LENSES - WE USE BOTH]
Views consistent of configuration for the selection of specific rows and or columns from the parent dataset. Views are automatically updated to reflect changes in the parent dataset such as additions that may need to become part of the view, deletions that mean rows or columns need to be removed from the view or updates that mean a row may or may not be a valid part of a given view. 

## Lenses [HMM HAVING BOTH LENSES OR VIEWS FEELS CONFUSING TO ME.]
Lenses are essentially named view definitions wrapped in functions for reuse that can are stored on the dataset. Lenses can be called and then updated with new parameters. Lens functions are scoped to the dataset. Lenses can also be passed without setting a set of parameters

```javascript
var ds = new Miso.DS({ });

ds.lens('byState', function(state) {
  return this.rows(function(row) {
    row.state === state;
  });
});

ds.lens.byState('AK');
```

# Deriving data from a dataset

## Derivations
Derivations are essentially new datsets based on and linked to an existing dataset. For example, grouping rows together by a specific categorical column will create new rows with new values. Derivations can be used to create different forms of data that will be automatically updated when the parent dataset is updated. It is simple to define additional types of derivations. The function wil be passed the value passed in derive.

## Products
Products are operations on views or datasets that produce a single value. Like views products are updated when the parent dataset or view is updated.

```javascript
var ds = new Miso.DS({ ... });

//return a max product for the named column
var maximum = ds.max('columnName'); 

//get the current value for maximum
maxmium.val();

//bind something to maximum changing
maximum.bind('change', function(delta) {
  alert('Max changed from ' + delta.old + ' to ' + delta.changed.');
});
```

There are some simple products such as min/max/mean built into dataset but it is also trivial to create custom products for specific situations with a minimum of boilerplate as both one-offs and reuseable types;

One-off product

```javascript
var ds = new Miso.DS({ ... });

var variance = ds.calculated(function() {
  var variance, 
      mean = this.mean('columnName');
  this.each(function(row) {
    variance += row['columnName'] * row['columnName'];
  });
  return variance / this.length;
});
```

Reuseable product

```javascript
var ds = new Miso.DS({ ... });
ds.variance = function(column) {
  return ds.calculated(function() {
    var variance, 
        mean = this.mean(column);
    this.each(function(row) {
      variance += row[column] * row[column];
    });
    return variance / this.length;
  });
};

//Shared between datasets
Miso.DS.prototype.variance = ...//same as above
```


# Event binding &amp; realtime datasets
