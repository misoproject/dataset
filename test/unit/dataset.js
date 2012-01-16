module("Dataset functions");

test("adding a row", function() {
  var ds = baseSample();
  ds.add( { one: 10 } );

  equals(ds._columns[1].data.length, 4, "row adding to 'one'");
  _.each([2,3], function(i) {
    equals(ds._columns[i].data.length, 4, "column length increased on "+ds._columns[i].name);
    strictEqual(ds._columns[i].data[3], null, "null added to column "+ds._columns[i].name);
  });
});
