(function(global) {
  
  var Util  = global.Util;
  var DS    = global.DS || {};

  module("Fetching");
  test("Basic fetch + success callback", function() {
    var ds = new DS.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1, 2, 3] },
        { name : "two",   data : [4, 5, 6] },
        { name : "three", data : [7, 8, 9] } 
      ] },
      strict: true
    });
    ds.fetch({
      success: function() {
        equals(this instanceof DS.Dataset, true);
        ok(_.isEqual(this.columnNames(), ["one", "two", "three"]));
      }
    });
  });

  // these tests pass but take FOREVER....!
  // test("Basic fetch + error callback", 1, function() {
  //   var ds = new DS.Dataset({
  //     url: 'http://madeupurl2345675432124.com/json.json'
  //   });
  //   stop();
  //   ds.fetch({
  //     error: function() {
  //       ok(true, "Error called");
  //       start();
  //     }
  //   });
    
  // });

  // test("Basic fetch jsonp + error callback", 1, function() {
  //   var ds = new DS.Dataset({
  //     url: 'http://madeupurl2345675432124.com/json.json?callback=',
  //     jsonp : true
  //   });
  //   stop();
  //   ds.fetch({
  //     error: function() {
  //       ok(true, "Error called");
  //       start();
  //     }
  //   });
  // });

  test("Basic fetch + deferred callback", function() {
    var ds = new DS.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1, 2, 3] },
        { name : "two",   data : [4, 5, 6] },
        { name : "three", data : [7, 8, 9] } 
      ] },
      strict: true
    });
    _.when(ds.fetch()).then(function() {
      equals(ds instanceof DS.Dataset, true);
      ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]));
    });
  });

  test("Instantiation ready callback", function() {
    var ds = new DS.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1, 2, 3] },
        { name : "two",   data : [4, 5, 6] },
        { name : "three", data : [7, 8, 9] } 
      ] },
      strict: true,
      ready : function() {
        equals(this instanceof DS.Dataset, true);
        ok(_.isEqual(this.columnNames(), ["one", "two", "three"]));
      }
    }).fetch();
  });

  module("Type raw extraction");
  test("Numeric raw extraction", 2, function() {
    var ds = Util.baseSample();
    equals(ds._columns[1].type, "number");
    equals(ds._columns[1].numericAt(1), ds._columns[1].data[1]);    
  });

  test("String raw extraction", 2, function() {
    var ds = new DS.Dataset({
      data : DS.alphabet_strict,
      strict: true
    }).fetch({
      success: function() {
        equals(this._columns[2].type, "string");
        equals(this._columns[2].numericAt(1), 1);
      }
    });
  });

  test("Time raw extraction", 2, function() {
    var ds = new DS.Dataset({
      data : [
        { 'character' : '12/31 2012' },
        { 'character' : '01/31 2011' }
      ],
      columnTypes : {
        character : { type : 'time', format : 'MM/DD YYYY' }
      }
    });
    _.when(ds.fetch()).then(function(){
      equals(ds._columns[1].type, "time");
      equals(ds._columns[1].numericAt(1), moment('01/31 2011', 'MM/DD YYYY').valueOf());
    });
  });

}(this));
