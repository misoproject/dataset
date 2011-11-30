Dataset
==============

# About

Dataset is a library that handles client side dataset management. It is entirely separate from any sort of UI for a reason. It's meant to function as a layer on top of which tools such as data visualization libraries can be written with a separation of concerns between the data and ui.

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


# Status

Currently, the spec for the library is being written.
See dataset.js for the spec. In the future, this will contain the proper library and this file will contain the spec. For the sake of allowing comments on code lines, we're keeping it as a src file in github.

# Outstanding Questions:

## Interpolation

?

# Resolved:

## Event Subscription Model

Possible event types:

Added support for the following events:

* change
* add
* remove

All event subscription will be handled via bind for now.
An event object will have a "delta" parameter that will contain 1 or more delta objects.

<del>* Change - What level should this be on? just field? row? column? dataset? I say all of them but then I wonder what the callback should be taking for the larger set ones. For example, the field callback can take an oldValue and newValue, but what would a change callback on column take? I feel like oldColumn, newColumn doesn't make sense - clearly just a single value changed. However, in that situation we would need to specify what actually changed and I'm not sure how to best do that. I added a section for this in the spec but it's pretty basic, lots of question marks...
* load - ? (on dataset load, specifically.)
* Delete - ?
* Insert - ?

I think we're going to need to figure out a good way to subscribe to these. I started by just having dataset.column(3).change(callback), but that makes way less sense for "delete" for example.</del>

### Time Series

## Transforms

Transforms will modify underlying data. We'll add a flag that will let you clone the column with new values?
Also not going to re-run transforms on insert. Too complicated if depends on rest of dataset.

<del>Should transforms be stored on a column and then applied to newly inserted data? I (irene) say yes, with an optional flag that prevents that for happening on a set call.

## Constraints on Column insert
Having the ability to specify constraint functions on a column - is that necessary? are we going to have people use the dataset as a writable object as much as a readable object?</del>

Too complicated for first release. We'll think about this as we go along.

<del>Need to sort out of anything specific needs to happen to support time series
* A column could be of dataset type
* anything else?</del>

## Pagination:

No pagination support in release 1.0.
<del>Do we want to add any pagination support? This complicates math function computation that require the entire dataset.</del>

## File formats:

### XML

No XML Support in release 1.0.
<de>We don't particularly feel the need to support XML at the moment. </del>

### GeoJSON

Not going to worry about it right now.
<del>Need to sort out how to best support geo data in this lib.</del>

## Query
Going with the following model:

dataset.columns().filter("onlyNumbers", function(column) {
  return column.isNumber();
})

dataset.rows().filter("thisDecade", function(row) {
  return (row('year') > 2000);
})
// Useful codes from maxogden:
https://github.com/maxogden/recline/blob/master/attachments/script/costco-csv-worker.js
https://github.com/maxogden/recline/blob/master/app.js#L32
