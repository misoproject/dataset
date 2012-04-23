# Dataset.js

Dataset is a JavaScript library that makes managing the data behind client-side visualisations easy, including realtime data. It takes care of the loading, parsing, sorting, filtering and querying of datasets as well as the creation of derivative datasets.

Dataset is part of the [Miso Toolkit](http://misoproject.com).
Read more about Dataset [here](http://misoproject.com/dataset)

## Download 

### Including Dependencies

[miso.ds.dev.zip](https://github.com/misoproject/dataset/tree/master/dist/miso.ds.dev.zip) - Download Development With Dependencies - 0.0.1

[miso.ds.deps.min.js](https://github.com/misoproject/dataset/tree/master/dist/) - Download Production With Dependencies - 0.0.1

### Without Dependencies

The following builds do not have any of the dependencies built in. It is your own responsibility to include them as appropriate script elements in your page.

[miso.ds.js](https://github.com/misoproject/dataset/tree/master/dist/miso.ds.js) - Download Production No Dependencies - 0.0.1

[miso.ds.min.js](https://github.com/misoproject/dataset/tree/master/dist/) - Download Development No Dependencies - 0.0.1

### Dependencies

Dataset has the following dependencies:

* [Underscore.js 1.3.1](http://underscorejs.org/)
* [Underscore.math.js (version unknown)](https://github.com/syntagmatic/underscore.math) 
* [Underscore.deferred.js 0.1.2](https://github.com/wookiehangover/underscore.Deferred)
* [moment.js 1.4.0](http://momentjs.com/) (for date and time parsing)

## Documentation

The full documentation set can be found here:
[http://misoproject.com/dataset/docs.html](http://misoproject.com/dataset/docs.html)

Miso.Dataset works in the browser and in Node.js.

#### Browser support

Include the appropriate libs as script tags in your web pages

#### Node Support

You can require it like so:

```javascript
var Miso = require("miso.dataset");
var ds = new Miso.Dataset...
```

### API

For a detailed API listing, see here:
[http://misoproject.com/dataset/api.html](http://misoproject.com/dataset/api.html)

### Examples

For some more complex examples, see the following page:
[http://misoproject.com/dataset/examples.html](http://misoproject.com/dataset/examples.html)

## Contributing

We welcome pull requests! Some things to keep in mind:

* To run the test server you need the following gems: <b>rack & sinatra</b>
  <br />This is the current gem list:
  <pre>
  albino (1.3.3)
  classifier (1.3.3)
  directory_watcher (1.4.1)
  fast-stemmer (1.0.0)
  jekyll (0.11.2)
  kramdown (0.13.5)
  liquid (2.3.0)
  maruku (0.6.0)
  posix-spawn (0.3.6)
  rack (1.4.0)
  rack-contrib (1.1.0)
  rack-protection (1.2.0)
  rake (0.8.7)
  sinatra (1.3.2)
  syntax (1.0.0)
  tilt (1.3.3)
  </pre>
  
  When those are installed, you can run the test server like so:
  ```cd test && rackup ```
  
* Any new functionality must have tests and ensure all current tests still pass. All tests are located in the ```test/unit``` directory.
* We use cowboy's grunt library to build all our final dependencies. You will need to install grunt per the instructions here: [https://github.com/cowboy/grunt](https://github.com/cowboy/grunt).

## Contact

* For announcements follow @themisoproject on twitter.
* Opening issues here is a great way to let us know when something is broken!
* If you want to chat with us, join #misoproject on irc (freenode).
* Feel free to ping Irene Ros([@ireneros](http://twitter.com/ireneros) on twitter, @iros on github) or Alex Graul ([@alexgraul](http://twitter.com/alexgraul) on both.)
