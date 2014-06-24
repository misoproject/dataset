var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 },
    { one : 2, two : 5, three : 8 }
  ]
});

ds.fetch({
  success: function() {

    log(this.column('two').data);

    // update just the first row
    var firstRow = this.rowByPosition(0);
    this.update({ _id : firstRow._id, one : 100 });

    log(this.rowByPosition(0));

    // update all rows where col three == 7
    this.update(function(row) {
      if (row.three === 7) {
        row.two = 99;
        return row;
      } else {
        return false;
      }
    });

    log(this.column('two').data);
  }
});
