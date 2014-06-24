// all types live under the Miso.types namespace.
// Beware of overriding existing types.
// Nothing is stopping you from doing that.
Miso.Dataset.types.yourCustomType = {

  // provide a name for your type.
  name : 'yourCustomTypeName',

  // provide a method to test any incoming value for whether it
  // fits within the scope of this type.
  // return true if value is of this type. False otherwise.
  test : function(value) {},

  // provide a way to compare two values. This will be used by
  // the sorting algorithm, so be sure to return the correct values:
  // -1 if value1 < value2
  // 1 if value1 > value2
  // 0 if they are equal.
  compare : function(value1, value2) {},

  // how would this value be represented numerically? For example
  // the numeric value of a timestamp is its unix millisecond value.
  // This is used by the various computational functions of columns
  // (like min/max.)
  numeric : function(value) {},

  // convert an incoming value into this specific type.
  // should return the value as would be represented by this type.
  coerce : function(value) {}
};
