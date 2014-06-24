// initialize a new dataset
var ds = new Miso.Dataset({
  data: {
    columns : [
      { name : "one", data : [10, 2, 3] },
      { name : "two", data : [1, 20, 3] }
    ]
  },
  strict: true
});

Miso.Dataset.prototype.random = Miso.Dataset.Product.define(function(columns) {

    // assemble all the data
    // values into a single array temporarily
    var values = [];
    _.each(columns, function(column) {
      values.push(column.data);
    }, this);

    // flatten the values
    values = _.flatten(values);

    // get a random value from the total array of values
    // we gathered.
    return values[Math.floor(Math.random() * values.length)];
  }
);

ds.fetch({
  success : function() {
    log(this.random(["one", "two"]));
  }
});
