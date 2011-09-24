jQuery.Dataset
==============

# About

jQuery dataset is a jquery plugin that handles client side dataset management. It is entirely separate from any sort of UI for a reason. It's meant to function as a layer on top of which tools such as data visualization libraries can be written with a separation of concerns between the data and ui.

# Status

Currently, the spec for the library is being written.
See jquery.dataet.js for the spec. In the future, this will contain the proper library and this file will contain the spec. For the sake of allowing comments on code lines, we're keeping it as a src file in github.

# Outstanding Questions:

* Need to think about event subscription model. Event types:
 * Change - What level should this be on? just field? row? column? dataset? I say all of them but then I wonder what the callback should be taking for the larger set ones. For example, the field callback can take an oldValue and newValue, but what would a change callback on column take? I feel like oldColumn, newColumn doesn't make sense - clearly just a single value changed. However, in that situation we would need to specify what actually changed and I'm not sure how to best do that. I added a section for this in the spec but it's pretty basic, lots of question marks...
 * Delete - ?
 * Insert - ?
 <br /><br />^ I think we're going to need to figure out a good way to subscribe to these. I started by just having dataset.column(3).change(callback), but that makes way less sense for "delete" for example.
 
* Do we want to add any pagination support? This complicates math function computation that require the entire dataset.
* We don't particularly feel the need to support XML at the moment. Any arguments against this?
* Need to sort out how to best support geo data in this lib.
* Need to sort out of anything specific needs to happen to support time series
 * A column could be of dataset type
 * anything else?
* Should transforms be stored on a column and then applied to newly inserted data? I (irene) say yes, with an optional flag that prevents that for happening on a set call.

