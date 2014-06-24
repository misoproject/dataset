var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 },
    { one : 2, two : 5, three : 8 }
  ]
});

ds.fetch({
  success: function() {
    var oneTwo = this.where({
      // copy over the one column
      columns: ['one'],
      // and only where the values are > 1
      rows: function(row) {
        return row.one > 1;
      }
    });

    log(oneTwo.length, oneTwo.toJSON());
  }
});
