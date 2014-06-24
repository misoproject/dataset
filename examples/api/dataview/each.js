var ds = new Miso.Dataset({
  data : [
    { one : 12,  two : 40},
    { one : 1,   two : 40},
    { one : 102, two : 430}
  ]
});
ds.fetch({
  success : function() {
    this.each(function(row) {
      log(JSON.stringify(row));
    });
  }
});
