var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 },
    { one : 2, two : 5, three : 8 },
    { one : 6, two : 8, three : 55 }
  ],
  sync: true
});

ds.fetch({
  success: function() {
    this.min('three').bind('change', function() {
      log("Column 'three' min is: " + this.val());
    });

    this.add({ one: 2, two: 2, three: 2 });
    this.add({ one: 2, two: 2, three: 1 });
    //doesn't trigger as min didn't change
    this.add({ one: 2, two: 2, three: 99 });

  }
});
