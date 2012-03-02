(function(global) {

  var Util  = global.Util;
  var DS    = global.DS || {};

  var dsObj = {
    data: [
      { one : 1, two : 4, three : 7 },
      { one : 2, two : 5, three : 8 },
      { one : 3, two : 6, three : 9 }
    ]
  } 

  module("Fetching");
  test("Basic fetch + success callback", function() {
    var ds = new DS.Dataset(dsObj);
    ds.fetch({
      success: function() {
        equals(this instanceof DS.Dataset, true);
        console.log(this, this.columnNames() );
        ok(_.isEqual(this.columnNames(), ["one", "two", "three"]));
      }
    });
  });

  test("Basic fetch + deferred callback", function() {
    var ds = new DS.Dataset(dsObj);
    _.when(ds.fetch()).then(function() {
      equals(ds instanceof DS.Dataset, true);
      ok(_.isEqual(ds.columnNames(), ["one", "two", "three"]));
    });
  });

  test("Instantiation ready callback", function() {
    dsObj.ready = function() {
      equals(this instanceof DS.Dataset, true);
      ok(_.isEqual(this.columnNames(), ["one", "two", "three"]));
    }
    var ds = new DS.Dataset(dsObj).fetch();
  });


}(this));
