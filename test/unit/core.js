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

  test("Resetting dataset should set length to 0", function() {
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
    equals(ds.length, 4);
    ds.reset();
    equals(ds.length, 0);
  });

  test("On subsequent row additions, a derived dataset should update correctly", function() {
    var data = [
      { seq : 0, q : 1, e : 0, x : 1 },
      { seq : 0, q : 2, e : 1, x : 2 } 
    ];

    var ds = new Miso.Dataset({
      data : data,
      sync : true
    });

    var gb;
    ds.fetch({ success: function() {
      gb = ds.groupBy("seq", ["q","e","x"]);

      equals(gb.length, 1);
      ok(_.isEqual(gb.column("q").data, [3]));
      ok(_.isEqual(gb.column("e").data, [1]));
      ok(_.isEqual(gb.column("x").data, [3]));

      gb.bind("change", function() {
         equals(gb.length, 2);
        ok(_.isEqual(gb.column("q").data, [3,50]));
        ok(_.isEqual(gb.column("e").data, [1,12]));
        ok(_.isEqual(gb.column("x").data, [3,70]));
      });

      ds.add([
        { seq : 1, q : 10, e : 1,  x : 30 },
        { seq : 1, q : 40, e : 11, x : 40 }
      ]);      
    }});
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
