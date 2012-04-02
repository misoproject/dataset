(function(global) {

  var Util  = global.Util;
  var Miso    = global.Miso || {};

  module("Bug Drive Tests");
  test("Zero vals convert to null", function() {
    var data = [
      { a : 0, b : 0, c: 1},
      { a : 0, b : 0, c: 1},
      { a : 0, b : 1, c: 1},
      { a : 1, b : 0, c: 1}
    ];

    var ds = new Miso.Dataset({
      data : data 
    });

    ds.fetch();

    ok(_.isEqual(ds.column("a").data, [0,0,0,1]));
    ok(_.isEqual(ds.column("b").data, [0,0,1,0]));
    ok(_.isEqual(ds.column("c").data, [1,1,1,1]));
  });

  module("Fetching");
  test("Basic fetch + success callback", function() {
    var ds = new Miso.Dataset({
      data: [
        { one : 1, two : 4, three : 7 },
        { one : 2, two : 5, three : 8 },
        { one : 3, two : 6, three : 9 }
      ]
    });

    ds.fetch({
      success: function() {
        equals(this instanceof Miso.Dataset, true);
        ok(_.isEqual(this.columnNames(), ["one", "two", "three"]));
      }
    });
  });

  // these tests pass but take FOREVER....!
  test("Basic fetch + error callback", 1, function() {
    var ds = new Miso.Dataset({
      url: 'http://madeupurl2345675432124.com/json.json'
    });
    stop();
    ds.fetch({
      error: function() {
        ok(true, "Error called");
        start();
      }
    });
    
  });

  test("Basic fetch jsonp + error callback", 1, function() {
    var ds = new Miso.Dataset({
      url: 'http://madeupurl2345675432124.com/json.json?callback=',
      jsonp : true
    });
    stop();
    ds.fetch({
      error: function() {
        ok(true, "Error called");
        start();
      }
    });
  });

  test("Basic fetch + deferred callback", function() {
    var ds = new Miso.Dataset({
      data: [
        { one : 1, two : 4, three : 7 },
        { one : 2, two : 5, three : 8 },
        { one : 3, two : 6, three : 9 }
      ]
    });

    _.when(ds.fetch()).then(function() {
      equals(ds instanceof Miso.Dataset, true);
      ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]));
    });
  });

  test("Instantiation ready callback", function() {
    var ds = new Miso.Dataset({
      data: [
        { one : 1, two : 4, three : 7 },
        { one : 2, two : 5, three : 8 },
        { one : 3, two : 6, three : 9 }
      ],
      ready : function() {
        equals(this instanceof Miso.Dataset, true);
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

  test("String raw extraction", 3, function() {
    var ds = new Miso.Dataset({
      data : Miso.alphabet_strict,
      strict: true
    }).fetch({
      success: function() {
        equals(this._columns[3].type, "boolean");
        equals(this._columns[3].name, "is_modern");
        equals(this._columns[3].numericAt(1), 1);
      }
    });
  });

  test("Time raw extraction", 2, function() {
    var ds = new Miso.Dataset({
      data : [
        { 'character' : '12/31 2012' },
        { 'character' : '01/31 2011' }
      ],
      columns : [
        { name : "character",  type : 'time', format : 'MM/DD YYYY' }
      ]
    });
    _.when(ds.fetch()).then(function(){
      equals(ds._columns[1].type, "time");
      equals(ds._columns[1].numericAt(1), moment('01/31 2011', 'MM/DD YYYY').valueOf());
    });
  });

}(this));
