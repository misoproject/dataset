Dataset
==============

# About
Dataset is a javascript library for the manipulation and management of datasets in javascript. Dataset is designed to reduce the work involved in creating complex or multiple data visualisations powered by a single set of data, particulary when that data itself changes in realtime or in response to user input. 

# Why use Dataset
As it's designed purely for working with datasets DS addresses the precise painpoints that make working with datasets fiddly. Dataset makes it trivial to load datasets from any format, create subselections of data, deriviative data based on original values or products created by analysing the data and do so so they can react to changes in the underlying data. 

# Setup & Development

Create dev environment:

```
$ npm install
```

Build:

```
$ jake
```

Lint Source:

```
$ jake hint
```

# Importing data to Dataset
Dataset is essentially an augumented matrix.

## Import process stages
Fetch > Extract > Parse

## Creating importers

# Column Typing

## Creating Types

# Metadata

# Querying data from a Dataset
The simplest way to get raw data out of a dataset is to use `ds.each` to iterate over each row as a simple object but dataset has a system by which you can create subselections of data based on dynamic or static criteria which will them be dynamically updated to reflect changes in the dataset.

## Views 
Views consistent of configuration for the selection of specific rows and or columns fro the parent dataset. Views are automatically updated to reflect changes in the parent dataset such as additions that may need to become part of the view, deletions that mean rows orcolumns need to be removed from the view or updates that mean a row may or may not be a valid part of a given view. 

## Lenses
Lenses are essentially named view definitions wrapped in functions for reuse that can are stored on the dataset. Lenses can be called and then updated with new parameters. Lens functions are scoped to the dataset. Lenses can also be passed without setting a set of parameters

# Deriving data from a dataset

## Derivations
/Derivations are essentially new datsets based on and linked to an existing dataset. Derivations can be used to create different forms of data that will be automatically updated when the parent dataset is updated. It is simple to define additional types of derivations. The function wil be passed the value passed in derive.

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
