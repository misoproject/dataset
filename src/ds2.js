/**
* Library Deets go here
* USE OUR CODES
*
* Version 0.0.1.2
*{
 url : "String - url to fetch data from",
 jsonp : "boolean - true if this is a jsonp request",
 delimiter : "String - a delimiter string that is used in a tabular datafile",
 data : "Object - an actual javascript object that already contains the data",
 table : "Element - a DOM table that contains the data",
 format : "String - optional file format specification, otherwise we'll try to guess",
 recursive : "Boolean - if true build nested arrays of objects as datasets",
 strict : "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
 extract : "function to apply to JSON before internal interpretation, optional"
 ready : the callback function to act on once the data is fetched. Isn't reuired for local imports
         but is required for remote url fetching.
 columnNames : {
   oldName : newName
 },
 subsets : {
   name : function(yourParamsHere) {
     return a.filtering;
   }
 }
}
*/

(function(global, _) {

  var DS = (global.DS || function() {
    options = options || (options = {});
    this._options = options;
  });

  DS.datatypes = {
    UNKNOWN: "Unknown",
    NUMBER : 0,
    STRING : 1,
    BOOLEAN: 2,
    ARRAY  : 3,
    OBJECT : 4,
    TIMESTAMP : 5
  };

  _.extend(DS.prototype, {

  });

});


// CONSTS

/*

get dataset
options:
  success - callback
  error   - callback

*/
ds.fetch(options);


/*
  
filtering/selection mechanism
filter:
  columns: [ array of col names]
  filter: {
    columnName : string (equivalency)  
    OR
    columnName : function(value) {}
  }

  filter can also be a function:
    function(row) {
      return row.a === 4 && row.b === 5
    }

*/
ds.where(filter);

ds.where({
  columns : ['a', 'b'],
  filter : {
    'a' : 4
  }
})

/*
Returns a subset of columns
columns is an array of column names
*/
ds.column(name);
ds.columns(columns);


/* 
returns a subset of rows (all column!)
filter is the same as the "conditions" 
*/
ds.rows(filter);


/*
Allows iterating through rows...
*/
ds.each(iterator);
ds.each(function(row) {
  // a row is a key:val object where
  // each key is a column name, and each
  // val is a value for that row.
});

/*
adds a row to the dataset. Format is:
{
  columnName : value
}
If there's a missing value, we'll set that 
column to null. We have to have a value.

When we add a row we'll need to check against all 
internal filsters to see if any views need updating.

options can take silent:true to not trigger add event.
*/
ds.add(rowObject, options);

/*

Removes all rows that match a filter. Also removes
them from the views they might be in (by looking up
row indices in the other views.)

remove triggers a remove event unless options.silent : true.
*/
ds.remove(filter, options);


/*
Updates values on a specific set of rows. We'll use the
returned row ids to find them in the available views and
update those rows too.

update triggers 
*/
ds.update(filter, newProperties, options);


/*
 takes an optional comparator:
 function(row, row2) {
   // return -1, 0 or 1 depending on whether row should come before
   // row 2.
 }

 this needs to percolate to children??
*/
ds.sort(byColumn, comparator);


// math functions that return a single value
// all math functions take a column name.

ds.max
ds.min
ds.freq
ds.mode

// all math functions return an object that has two methods:
ds.max(column).val()
ds.max(column).change(function(event) {
  // do something when the value changes.
});

// all math functions that return multi-values, return a 
// new dataset

// moving average
ds.movingAverage(column, width)

// group by: the by-column, then which columns will be grouped, and optionally
// what function should be applied. By default, it's addition.
ds.groupBy(byColumn, [whichColumns], how)


// ---- events ---
ds.bind(eventName, function, context);
ds.trigger(eventName, eventData);

