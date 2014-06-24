var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 },
    { one : 2, two : 5, three : 8 },
    { one : 9, two : 10, three : 11 }
  ]
});

ds.fetch({ success: function() {
  log("Before Sort", this.toJSON());

  this.sort(function(rowA, rowB) {
    if (rowA.three > rowB.three) {
      return -1;
    }
    if (rowA.three < rowB.three) {
      return 1;
    }
    return 0;
  });

  log("After Sort", this.toJSON());
}});
