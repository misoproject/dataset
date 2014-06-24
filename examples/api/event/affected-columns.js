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
      log( event.affectedColumns() );
    });
  }
});

ds.add({ one: 3, two: 9 });
