var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 }
  ]
});
ds.fetch({
  success: function() {
    this.addColumn({
      type: 'string',
      name: 'four'
    });

    log(this.columnNames());
  }
});
