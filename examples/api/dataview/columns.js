var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 },
    { one : 2, two : 5, three : 8 }
  ]
});

ds.fetch({
  success: function() {
    var oneTwo = this.columns(['one','two']);
    log(this.columnNames());
    log(oneTwo.columnNames());
  }
});
