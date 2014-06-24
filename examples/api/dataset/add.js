var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 }
  ]
});
ds.fetch({
  success: function() {
    this.add({ one: 44, two: 9 });
    log( this.column('two').data );
    log( this.column('three').data );
  }
});
