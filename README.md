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

[ADD ds.each EXAMPLE HERE]

## Views [PICK VIEWS OR LENSES - WE USE BOTH]
Views consistent of configuration for the selection of specific rows and or columns from the parent dataset. Views are automatically updated to reflect changes in the parent dataset such as additions that may need to become part of the view, deletions that mean rows or columns need to be removed from the view or updates that mean a row may or may not be a valid part of a given view. 

## Lenses [HMM HAVING BOTH LENSES OR VIEWS FEELS CONFUSING TO ME.]
Lenses are essentially named view definitions wrapped in functions for reuse that can are stored on the dataset. Lenses can be called and then updated with new parameters. Lens functions are scoped to the dataset. Lenses can also be passed without setting a set of parameters

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

reuseable product

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
