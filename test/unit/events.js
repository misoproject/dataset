(function(global) {
  
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

    ds.subscribe('ping', increment);

    result = 0;
    ds.publish('ping', 1);
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

    ds.subscribe('ping', increment);

    ds.publish('ping');
    ds.unsubscribe('ping', increment);
    ds.publish('ping');
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
      this.subscribe('add', function(event) {
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
      this.subscribe('remove', function(event) {
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
      this.subscribe('change', function(event) {
        equals( event.affectedColumns().length, 1);
        ok( event.affectedColumns()[0] === 'one' );
      });
      }
    });

    ds.update({_id : ds.column('_id').data[0], one: 9});

  });

  test("affectedColumns for update event with custom idAttribute", function() {

    var ds = new Miso.Dataset({
      data: { columns : [ 
        { name: "one", data: [1,2] },
        { name: "two", data: [4,5] } 
      ]},
      idAttribute : "two",
      strict: true,
      sync : true
    });
    ds.fetch({ success: function() {
      this.subscribe('change', function(event) {
        equals( event.affectedColumns().length, 1);
        ok( event.affectedColumns()[0] === 'one' );
      });
      }
    });

    ds.update({ two : ds.column('two').data[0], one: 9} );
  });

}(this));
