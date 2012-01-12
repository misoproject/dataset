module("Products");

var ds = new DS.Dataset({
  data: { columns : [ 
    { name : "one",   data : [1, 2, 3] },
    { name : "two",   data : [4, 5, 6] },
    { name : "three", data : [7, 8, 9] } 
  ] },
  strict: true
});

test("Basic Max Product", function() {
  var max = ds.max("one");
  ok(max.val() === 3, "Max is correct");
})
