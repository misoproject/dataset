module("Max");
test("max function on all values", 1, function() {

	var obj = [{a: 'test', b: 4}, {a: 6.231, b: 2}];
	var ds = new DS({ data : obj });

	equal( 6.231 , ds.max() , "Maximum value is 6.231" )
});

test("max function on subset of columns", 2, function() {

	var obj = [{a: 'test', b: 4}, {a: 6.231, b: 2}];
	var ds = new DS({ data : obj });

	equal(4, ds.max("b"), "Max of b column is 4");
	equal(4, ds.max(["b"]), "Max of b column is 4");
});

module("Min");
test("min function on all values", 1, function() {
	var obj = [{a: 'test', b: 4}, {a: 6.231, b: 2}];
	var ds = new DS({ data : obj });

	equal( 2 , ds.min() , "Miniumum value is 2" )
});

test("min function on subset of columns", 3, function() {
	var obj = [{a: 'test', b: 4}, {a: 6.231, b: 2}];
	var ds = new DS({ data : obj });

	equal(2, ds.min("b"), "Min of b column is 2");
	equal(2, ds.min(["b"]), "Min of b column is 2");
	equal(6.231, ds.min(["a"]), "Min of a column is 6.231");
});
