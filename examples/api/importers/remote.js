var ds = new Miso.Dataset({
  url: '/data/simple.json'
});

ds.fetch({
  success: function() {
    log( this.column('two').data );
  }
});
