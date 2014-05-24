var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 },
    { one : 2, two : 5, three : 8 }
  ],
  sync: true
});

ds.fetch({
  success: function() {
    this.bind('change', function( event ) {
      log( 'Add ?: ' + Miso.Dataset.Event.isAdd(event.deltas[0]) );
    });
  }
});

//true
ds.add({ one: 3 });

//false
ds.remove(function(row) { return true; });
