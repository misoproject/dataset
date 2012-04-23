(function(global) {
  
  var Util  = global.Util;
  var Miso    = global.Miso || {};
  
  module("Events");

  test("binding and firing an event", function() {

    var ds = new Miso.Dataset({
      data: { columns : [ { name: "one", data: [1,2] } ] },
      strict: true,
      sync : true
    }),
    result = 0,
    increment = function(by) {
      by = (by || 1);
      result += by;
    };

    ds.bind('ping', increment);

    result = 0;
    ds.trigger('ping', 1);
    equals(result, 1);
  });

  test("unbinding event", function() {
    var ds = new Miso.Dataset({
      data: { columns : [ { name: "one", data: [1,2] } ] },
      strict: true,
      sync : true
    }),
    result = 0,
    increment = function(by) {
      by = (by || 1);
      result += by;
    };

    ds.bind('ping', increment);

    ds.trigger('ping');
    ds.unbind('ping', increment);
    ds.trigger('ping');
    equals(result, 1);
  });

  module("Event Object");

   test("affectedColumns for add event", function() {

    var ds = new Miso.Dataset({
      data: { columns : [ { name: "one", data: [1,2] } ] },
      strict: true,
      sync : true
    });
    ds.fetch({ success: function() {
      this.bind('add', function(event) {
        equals( event.affectedColumns().length, 1);
        ok( event.affectedColumns()[0] === 'one' );
      });
      }
    });

    ds.add({ one: 3 });

  });

  test("affectedColumns for remove event", function() {

    var ds = new Miso.Dataset({
      data: { columns : [ { name: "one", data: [1,2] } ] },
      strict: true,
      sync : true
    });
    ds.fetch({ success: function() {
      this.bind('remove', function(event) {
        equals( event.affectedColumns().length, 1);
        ok( event.affectedColumns()[0] === 'one' );
      });
      }
    });

    ds.remove( ds.column('_id').data[0] );

  });

  test("affectedColumns for update event", function() {

    var ds = new Miso.Dataset({
      data: { columns : [ { name: "one", data: [1,2] } ] },
      strict: true,
      sync : true
    });
    ds.fetch({ success: function() {
      this.bind('change', function(event) {
        equals( event.affectedColumns().length, 1);
        ok( event.affectedColumns()[0] === 'one' );
      });
      }
    });

    ds.update( ds.column('_id').data[0], {one: 9} );

  });

}(this));
