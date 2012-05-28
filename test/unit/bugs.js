(function(global) {

  var Util  = global.Util;
  var Miso    = global.Miso || {};

  module("Bugs");

  test("#130 - CSV Parser adds together columns with the same name", function() {
    var data = "A,B,C,B\n" +
               "1,2,3,4\n" +
               "5,6,7,8";
    var ds = new Miso.Dataset({
      data : data,
      delimiter : ","
    });

    raises(function() {
      ds.fetch();
    }, Error, 
       "Error while parsing delimited data on row 0. Message: You have more than one column named B");

  });

  test("#125 - Update in a string column with a string number shouldn't fail", function() {
    var ds = new Miso.Dataset({
      data : [
        { a: "g" , b : 1 },
        { a: "sd" , b : 10 },
        { a: "f2" , b : 50 },
        { a: "2" , b : 50 }
      ]
    });

    ds.fetch({
      success : function() {

        // test add
        ds.add({
          a : "1", b : 2
        });
        ok(ds.length, 5);
        
        // test update
        ds.update(function(row) {
          // update all rows
          return true;
        }, { a : "1" , b : 5 });

        equals(ds.rows(function(row) {
          return row.a === "1";
        }).length, 5);

      }
    });
  });

  test("Zero vals convert to null csv delimited", 3, function() {
    stop();
    var ds = new Miso.Dataset({
      url : "data/withzeros.csv",
      delimiter : ","
    });

    ds.fetch({ success : function() {
      ok(_.isEqual(ds.column("a").data, [0,0,4,3]));
      ok(_.isEqual(ds.column("b").data, [0,2,5,0]));
      ok(_.isEqual(ds.column("c").data, [1,3,6,1]));
      start();
    }});

  });

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

  test("Empty row at the end of csv breaks parsing", function() {

    var data = "Col1,Col2,Col3\n"+
               "1,2,3\n" +
               "1,4,5\n" +
               "5,3,4\n" + 
               "";
    
    var ds = new Miso.Dataset({
      data : data,
      delimiter : ","
    });

    _.when(ds.fetch()).then(function() {
      equals(ds.length, 3);
    });
  });
}(this));