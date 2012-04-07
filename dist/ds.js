//     Underscore.js 1.3.1
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.1';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var result = [];
    _.reduce(initial, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
        memo[memo.length] = el;
        result[result.length] = array[i];
      }
      return memo;
    }, []);
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(/\\\\/g, '\\').replace(/\\'/g, "'");
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape || noMatch, function(match, code) {
           return "',_.escape(" + unescape(code) + "),'";
         })
         .replace(c.interpolate || noMatch, function(match, code) {
           return "'," + unescape(code) + ",'";
         })
         .replace(c.evaluate || noMatch, function(match, code) {
           return "');" + unescape(code).replace(/[\r\n\t]/g, ' ') + ";__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', '_', tmpl);
    if (data) return func(data, _);
    return function(data) {
      return func.call(this, data, _);
    };
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

//   Math.js

(function() {

  var math = this.math = {};

  // Arithmetic mean
  // math.mean([1,2,3])
  //   => 2
  math.mean = math.ave = math.average = function(obj, key) {
    return math.sum(obj, key) / _(obj).size();
  };

  // math.median([1,2,3,4])
  //   => 2.5
  //   TODO {}, [{}]
  math.median = function(arr) {
    var middle = (arr.length + 1) /2;
    var sorted = math.sort(arr);
    return (sorted.length % 2) ? sorted[middle - 1] : (sorted[middle - 1.5] + sorted[middle - 0.5]) / 2;
  };

  // Power, exponent
  // math.pow(2,3)
  //   => 8
  math.pow = function(x, n) {
     if (_.isNumber(x))
        return Math.pow(x, n);
     if (_.isArray(x))
        return _.map(x, function(i) { return _.pow(i,n); });
  };

  // Scale to max value
  // math.scale(1,[2,5,10])
  //   => [ 0.2, 0.5, 1]
  math.scale = function(arr, max) {
    var max = max || 1;
    var max0 = _.max(arr);
    return _.map(arr, function(i) { return i * (max/max0); });
  };

  // Slope between two points
  // math.slope([0,0],[1,2])
  //   => 2
  math.slope = function(x, y) {
    return (y[1] - x[1]) / (y[0]-x[0]);
  };

  // Numeric sort
  // math.sort([3,1,2])
  //   => [1,2,3]
  math.sort = function(arr) {
    return arr.sort(function(a, b){
      return a - b;
    });
  };

   // math.stdDeviation([1,2,3])
  //   => 0.816496580927726
  math.stdDeviation = math.sigma = function(arr) {
    return Math.sqrt(_(arr).variance());
  };

  // Sum of array
  // math.sum([1,2,3])
  //   => 6
  // math.sum([{b: 4},{b: 5},{b: 6}], 'b')
  //   => 15
  math.sum = function(obj, key) {
    if (_.isArray(obj) && typeof obj[0] === 'number') {
      var arr = obj;
    } else {
      var key = key || 'value';
      var arr = _(obj).pluck(key);
    }
    var val = 0;
    for (var i=0, len = arr.length; i<len; i++)
      val += arr[i];
    return val;
  };

  // math.transpose(([1,2,3], [4,5,6], [7,8,9]])
  //   => [[1,4,7], [2,5,8], [3,6,9]]
  math.transpose = function(arr) {
    var trans = [];
    _(arr).each(function(row, y){
      _(row).each(function(col, x){
        if (!trans[x]) trans[x] = [];
        trans[x][y] = col;
      });
    });
    return trans;
  };
 
  // math.variance([1,2,3])
  //   => 2/3
  math.variance = function(arr) {
    var mean = _(arr).mean();
    return _(arr).chain().map(function(x) { return _(x-mean).pow(2); }).mean().value();
  };
  
  _.mixin(math);

})();
/* Moment.js | version : 1.3.0 | author : Tim Wood | license : MIT */
(function(a,b){function q(a){this._d=a}function r(a,b){var c=a+"";while(c.length<b)c="0"+c;return c}function s(b,c,d,e){var f=typeof c=="string",g=f?{}:c,h,i,j,k;return f&&e&&(g[c]=e),h=(g.ms||g.milliseconds||0)+(g.s||g.seconds||0)*1e3+(g.m||g.minutes||0)*6e4+(g.h||g.hours||0)*36e5,i=(g.d||g.days||0)+(g.w||g.weeks||0)*7,j=(g.M||g.months||0)+(g.y||g.years||0)*12,h&&b.setTime(+b+h*d),i&&b.setDate(b.getDate()+i*d),j&&(k=b.getDate(),b.setDate(1),b.setMonth(b.getMonth()+j*d),b.setDate(Math.min((new a(b.getFullYear(),b.getMonth()+1,0)).getDate(),k))),b}function t(a){return Object.prototype.toString.call(a)==="[object Array]"}function u(b){return new a(b[0],b[1]||0,b[2]||1,b[3]||0,b[4]||0,b[5]||0,b[6]||0)}function v(b,d){function u(d){var e,i;switch(d){case"M":return f+1;case"Mo":return f+1+s(f+1);case"MM":return r(f+1,2);case"MMM":return c.monthsShort[f];case"MMMM":return c.months[f];case"D":return g;case"Do":return g+s(g);case"DD":return r(g,2);case"DDD":return e=new a(h,f,g),i=new a(h,0,1),~~((e-i)/864e5+1.5);case"DDDo":return e=u("DDD"),e+s(e);case"DDDD":return r(u("DDD"),3);case"d":return l;case"do":return l+s(l);case"ddd":return c.weekdaysShort[l];case"dddd":return c.weekdays[l];case"w":return e=new a(h,f,g-l+5),i=new a(e.getFullYear(),0,4),~~((e-i)/864e5/7+1.5);case"wo":return e=u("w"),e+s(e);case"ww":return r(u("w"),2);case"YY":return r(h%100,2);case"YYYY":return h;case"a":return m>11?t.pm:t.am;case"A":return m>11?t.PM:t.AM;case"H":return m;case"HH":return r(m,2);case"h":return m%12||12;case"hh":return r(m%12||12,2);case"m":return n;case"mm":return r(n,2);case"s":return o;case"ss":return r(o,2);case"zz":case"z":return(b.toString().match(k)||[""])[0].replace(j,"");case"Z":return(p>0?"+":"-")+r(~~(Math.abs(p)/60),2)+":"+r(~~(Math.abs(p)%60),2);case"ZZ":return(p>0?"+":"-")+r(~~(10*Math.abs(p)/6),4);case"L":case"LL":case"LLL":case"LLLL":case"LT":return v(b,c.longDateFormat[d]);default:return d.replace(/(^\[)|(\\)|\]$/g,"")}}var e=new q(b),f=e.month(),g=e.date(),h=e.year(),l=e.day(),m=e.hours(),n=e.minutes(),o=e.seconds(),p=e.zone(),s=c.ordinal,t=c.meridiem;return d.replace(i,u)}function w(b,d){function p(a,b){var d;switch(a){case"M":case"MM":e[1]=~~b-1;break;case"MMM":case"MMMM":for(d=0;d<12;d++)if(c.monthsParse[d].test(b)){e[1]=d;break}break;case"D":case"DD":case"DDD":case"DDDD":e[2]=~~b;break;case"YY":b=~~b,e[0]=b+(b>70?1900:2e3);break;case"YYYY":e[0]=~~Math.abs(b);break;case"a":case"A":o=b.toLowerCase()==="pm";break;case"H":case"HH":case"h":case"hh":e[3]=~~b;break;case"m":case"mm":e[4]=~~b;break;case"s":case"ss":e[5]=~~b;break;case"Z":case"ZZ":h=!0,d=b.match(n),d[1]&&(f=~~d[1]),d[2]&&(g=~~d[2]),d[0]==="-"&&(f=-f,g=-g)}}var e=[0,0,1,0,0,0,0],f=0,g=0,h=!1,i=b.match(m),j=d.match(l),k,o;for(k=0;k<j.length;k++)p(j[k],i[k]);return o&&e[3]<12&&(e[3]+=12),o===!1&&e[3]===12&&(e[3]=0),e[3]+=f,e[4]+=g,h?new a(a.UTC.apply({},e)):u(e)}function x(a,b){var c=Math.min(a.length,b.length),d=Math.abs(a.length-b.length),e=0,f;for(f=0;f<c;f++)~~a[f]!==~~b[f]&&e++;return e+d}function y(a,b){var c,d=a.match(m),e=[],f=99,g,h,i;for(g=0;g<b.length;g++)h=w(a,b[g]),i=x(d,v(h,b[g]).match(m)),i<f&&(f=i,c=h);return c}function z(a,b,d){var e=c.relativeTime[a];return typeof e=="function"?e(b||1,!!d,a):e.replace(/%d/i,b||1)}function A(a,b){var c=d(Math.abs(a)/1e3),e=d(c/60),f=d(e/60),g=d(f/24),h=d(g/365),i=c<45&&["s",c]||e===1&&["m"]||e<45&&["mm",e]||f===1&&["h"]||f<22&&["hh",f]||g===1&&["d"]||g<=25&&["dd",g]||g<=45&&["M"]||g<345&&["MM",d(g/30)]||h===1&&["y"]||["yy",h];return i[2]=b,z.apply({},i)}function B(a,b){c.fn[a]=function(a){return a!=null?(this._d["set"+b](a),this):this._d["get"+b]()}}var c,d=Math.round,e={},f=typeof module!="undefined",g="months|monthsShort|monthsParse|weekdays|weekdaysShort|longDateFormat|calendar|relativeTime|ordinal|meridiem".split("|"),h,i=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|dddd?|do?|w[o|w]?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|zz?|ZZ?|LT|LL?L?L?)/g,j=/[^A-Z]/g,k=/\([A-Za-z ]+\)|:[0-9]{2} [A-Z]{3} /g,l=/(\\)?(MM?M?M?|dd?d?d|DD?D?D?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|ZZ?|T)/g,m=/(\\)?([0-9]+|([a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+|([\+\-]\d\d:?\d\d))/gi,n=/([\+\-]|\d\d)/gi,o="1.3.0",p="Month|Date|Hours|Minutes|Seconds|Milliseconds".split("|");c=function(c,d){if(c===null)return null;var e;return c&&c._d instanceof a?e=new a(+c._d):d?t(d)?e=y(c,d):e=w(c,d):e=c===b?new a:c instanceof a?c:t(c)?u(c):new a(c),new q(e)},c.version=o,c.lang=function(a,b){var d,h,i,j=[];if(b){for(d=0;d<12;d++)j[d]=new RegExp("^"+b.months[d]+"|^"+b.monthsShort[d].replace(".",""),"i");b.monthsParse=b.monthsParse||j,e[a]=b}if(e[a])for(d=0;d<g.length;d++)h=g[d],c[h]=e[a][h]||c[h];else f&&(i=require("./lang/"+a),c.lang(a,i))},c.lang("en",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},meridiem:{AM:"AM",am:"am",PM:"PM",pm:"pm"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},ordinal:function(a){var b=a%10;return~~(a%100/10)===1?"th":b===1?"st":b===2?"nd":b===3?"rd":"th"}}),c.fn=q.prototype={clone:function(){return c(this)},valueOf:function(){return+this._d},"native":function(){return this._d},toString:function(){return this._d.toString()},toDate:function(){return this._d},format:function(a){return v(this._d,a)},add:function(a,b){return this._d=s(this._d,a,1,b),this},subtract:function(a,b){return this._d=s(this._d,a,-1,b),this},diff:function(a,b,e){var f=c(a),g=this._d-f._d,h=this.year()-f.year(),i=this.month()-f.month(),j=this.day()-f.day(),k;return b==="months"?k=h*12+i+j/30:b==="years"?k=h+i/12:k=b==="seconds"?g/1e3:b==="minutes"?g/6e4:b==="hours"?g/36e5:b==="days"?g/864e5:b==="weeks"?g/6048e5:b==="days"?g/3600:g,e?k:d(k)},from:function(a,b){var d=this.diff(a),e=c.relativeTime,f=A(d,b);return b?f:(d<=0?e.past:e.future).replace(/%s/i,f)},fromNow:function(a){return this.from(c(),a)},calendar:function(){var a=c(),b=c([a.year(),a.month(),a.date()]),d=this.diff(b,"days",!0),e=c.calendar,f=e.sameElse,g=d<-6?f:d<-1?e.lastWeek:d<0?e.lastDay:d<1?e.sameDay:d<2?e.nextDay:d<7?e.nextWeek:f;return this.format(typeof g=="function"?g.apply(this):g)},isLeapYear:function(){var a=this.year();return a%4===0&&a%100!==0||a%400===0},isDST:function(){return this.zone()!==c([this.year()]).zone()},day:function(a){var b=this._d.getDay();return a==null?b:this.add({d:a-b})}};for(h=0;h<p.length;h++)B(p[h].toLowerCase(),p[h]);B("year","FullYear"),c.fn.zone=function(){return this._d.getTimezoneOffset()},f&&(module.exports=c),typeof window!="undefined"&&(window.moment=c)})(Date);

(function(global, _) {

  /* @exports namespace */
  var DS = global.DS = {};

  /**
  * A representation of an event as it is passed through the
  * system. Used for view synchronization and other default
  * CRUD ops.
  * @constructor
  * @param {string} ev - Name of event
  * @param {object|array of objects} deltas - array of deltas.
  */
  DS.Event = function(deltas) {
    if (!_.isArray(deltas)) {
      deltas = [deltas];
    }
    this.deltas = deltas;
  };

  _.extend(DS.Event.prototype, {
    affectedColumns : function() {
      var cols = [];
      
      _.each(this.deltas, function(delta) {
        cols = _.union(cols, 
          _.keys(delta.old),
          _.keys(delta.changed)
        );
      });

      return cols;
    }
  });

   _.extend(DS.Event, {
    /**
    * Returns true if the event is a deletion
    */
    isDelete : function(delta) {
      if (_.isUndefined(delta.changed) || _.keys(delta.changed).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * Returns true if the event is an add event.
    */
    isAdd : function(delta) {
      if (_.isUndefined(delta.old) || _.keys(delta.old).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * Returns true if the event is an update.
    */
    isUpdate : function(delta) {
      if (!this.isDelete(delta) && !this.isAdd(delta)) {
        return true;
      } else {
        return false;
      }
    }
  });
  
  /**
  * @name DS.Events
  * - Event Related Methods
  * @property {object} DS.Events - A module aggregating some functionality
  *  related to events. Will be used to extend other classes.
  */
  DS.Events = {};

  /**
  * Bind callbacks to dataset events
  * @param {string} ev - name of the event
  * @param {function} callback - callback function
  * @param {object} context - context for the callback. optional.
  * @returns {object} context
  */
  DS.Events.bind = function (ev, callback, context) {
    var calls = this._callbacks || (this._callbacks = {});
    var list  = calls[ev] || (calls[ev] = {});
    var tail = list.tail || (list.tail = list.next = {});
    tail.callback = callback;
    tail.context = context;
    list.tail = tail.next = {};
    return this;
  };

  /**
  * Remove one or many callbacks. If `callback` is null, removes all
  * callbacks for the event. If `ev` is null, removes all bound callbacks
  * for all events.
  * @param {string} ev - event name
  * @param {function} callback - callback function to be removed
  */
  DS.Events.unbind = function(ev, callback) {
    var calls, node, prev;
    if (!ev) {
      this._callbacks = null;
    } else if (calls = this._callbacks) {
      if (!callback) {
        calls[ev] = {};
      } else if (node = calls[ev]) {
        while ((prev = node) && (node = node.next)) {
          if (node.callback !== callback) { 
            continue;
          }
          prev.next = node.next;
          node.context = node.callback = null;
          break;
        }
      }
    }
    return this;
  };

  /**
  * @public
  * trigger a given event
  * @param {string} eventName - name of event
  */
  DS.Events.trigger = function(eventName) {
    var node, calls, callback, args, ev, events = ['all', eventName];
    if (!(calls = this._callbacks)) {
      return this;
    }
    while (ev = events.pop()) {
      if (!(node = calls[ev])) {
        continue;
      }
      args = ev == 'all' ? arguments : Array.prototype.slice.call(arguments, 1);
      while (node = node.next) {
        if (callback = node.callback) {
          callback.apply(node.context || this, args);
        }
      }
    }
    return this;
  };

  /**
  * Used to build event objects accross the application.
  * @param {string} ev - event name
  * @public
  * @param {object|array of objects} delta - change delta object.
  * @returns {object} event - Event object.
  */
  DS.Events._buildEvent = function(delta) {
    return new DS.Event(delta);
  };

  DS.types = {
    string : {
      name : "string",
      coerce : function(v) {
        return _.isNull(v) ? null : v.toString();
      },
      test : function(v) {
        return (typeof v === 'string');
      },
      compare : function(s1, s2) {
        if (s1 < s2) {return -1;}
        if (s1 > s2) {return 1;}
        return 0;
      },
      // returns a raw value that can be used for computations
      // should be numeric. In the case of a string, just return its index.
      // TODO: not sure what this should really be... thinking about scales here
      // for now, but we may want to return a hash or something instead...
      numeric : function(value, index) {
        return index;
      }
    },

    boolean : {
      name : "boolean",
      regexp : /^(true|false)$/,
      coerce : function(v) {
        if (v === 'false') { return false; }
        return Boolean(v);
      },
      test : function(v) {
        if (typeof v === 'boolean' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(n1, n2) {
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      numeric : function(value) {
        return (value) ? 1 : 0;
      }
    },

    number : {  
      name : "number",
      regexp : /^[\-\.]?[0-9]+([\.][0-9]+)?$/,
      coerce : function(v) {
        if (_.isNull(v)) {
          return null;
        }
        v = Number(v);
        return _.isNaN(v) ? null : v;
      },
      test : function(v) {
        if (typeof v === 'number' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(n1, n2) {
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      numeric : function(value) {
        return value;
      }
    },

    time : {
      name : "time",
      format : "DD/MM/YYYY",
      _formatLookup : [
        ['DD', "\\d{2}"],
        ['MM', "\\d{2}"],
        ['YYYY', "\\d{4}"],
        ['YY', "\\d{2}"]
      ],
      _regexpTable : {},

      _regexp: function(format) {
        //memoise
        if (this._regexpTable[format]) {
          return this._regexpTable[format];
        }

        //build the regexp for substitutions
        var regexp = format;
        _.each(this._formatLookup, function(pair) {
          regexp = regexp.replace(pair[0], pair[1]);
        }, this);


        return this._regexpTable[format] = new RegExp(regexp, 'g');
      },

      coerce : function(v, options) {
        options = options || {};
        // if string, then parse as a time
        if (_.isString(v)) {
          var format = options.format || this.format;
          return moment(v, format);   
        } else if (_.isNumber(v)) {
          return moment(v);
        } else {
          return v;
        }

      },

      test : function(v, format) {
        if (_.isString(v) ) {
          format = format || this.format;
          return this._regexp(format).test(v);
        } else {
          //any number or moment obj basically
          return true;
        }
      },
      compare : function(d1, d2) {
        if (d1 < d2) {return -1;}
        if (d1 > d2) {return 1;}
        return 0;
      },
      numeric : function( value ) {
        return value.valueOf();
      }
    }
  };

  DS.typeOf = function( value ) {
    var types = _.keys(DS.types),
        chosenType;

    //move string to the end
    types.push(types.splice(_.indexOf(types, 'string'), 1)[0]);

    chosenType = _.find(types, function(type) {
      return DS.types[type].test( value );
    });

    chosenType = _.isUndefined(chosenType) ? 'string' : chosenType;

    return chosenType;
  };

}(this, _));

(function(global, _) {

  var DS = global.DS;

  /**
  * @constructor
  *
  * Creates a new view.
  * @param {object} options - initialization parameters:
  *   parent : parent dataset
  *   filter : filter specification TODO: document better
  */
  DS.View = function(options) {
    //rowFilter, columnFilter, parent
    options = options || (options = {});

    if (_.isUndefined(options.parent)) {
      throw new Error("A view must have a parent specified.");
    } 
    this.parent = options.parent;
    this._initialize(options);

    return this;
  };

  _.extend(DS.View.prototype, DS.Events, {

    _initialize: function(options) {
      
      // save filter
      this.filter = {
        columns : this._columnFilter(options.filter.columns || undefined),
        rows    : this._rowFilter(options.filter.rows || undefined)
      };

      // initialize columns.
      this._columns = this._selectData();

      // pass through strict importer
      // TODO: Need to cache all data here, so.... need to
      // either pass through importer, or pull that out. Maybe
      // the data caching can happen elsewhere?
      // right now just passing through default parser.
      var tempParser = new DS.Parsers();
      _.extend(this, 
        tempParser._cacheColumns(this), 
        tempParser._cacheRows(this));

      // bind to parent
      this.parent.bind("change", this.sync, this);
    },

    /**
    * @public
    * Syncs up the current view based on a passed delta.
    */
    sync : function(event) {
      var deltas = event.deltas;
 
      // iterate over deltas and update rows that are affected.
      _.each(deltas, function(d, deltaIndex) {
        
        // find row position based on delta _id
        var rowPos = this._rowPositionById[d._id];

        // ===== ADD NEW ROW

        if (typeof rowPos === "undefined" && DS.Event.isAdd(d)) {
          // this is an add event, since we couldn't find an
          // existing row to update and now need to just add a new
          // one. Use the delta's changed properties as the new row
          // if it passes the filter.
          if (this.filter.rows && this.filter.rows(d.changed)) {
            this._add(d.changed);  
          }
        } else {

          //===== UPDATE EXISTING ROW
          if (rowPos === "undefined") { return; }
          
          // iterate over each changed property and update the value
          _.each(d.changed, function(newValue, columnName) {
            
            // find col position based on column name
            var colPos = this._columnPositionByName[columnName];
            if (_.isUndefined(colPos)) { return; }
            this._columns[colPos].data[rowPos] = newValue;

          }, this);
        }


        // ====== DELETE ROW (either by event or by filter.)
        // TODO check if the row still passes filter, if not
        // delete it.
        var row = this.rowByPosition(rowPos);
    
        // if this is a delete event OR the row no longer
        // passes the filter, remove it.
        if (DS.Event.isDelete(d) || 
            (this.filter.row && !this.filter.row(row))) {

          // Since this is now a delete event, we need to convert it
          // to such so that any child views, know how to interpet it.

          var newDelta = {
            _id : d._id,
            old : this.rowByPosition(rowPos),
            changed : {}
          };

          // replace the old delta with this delta
          event.deltas.splice(deltaIndex, 1, newDelta);

          // remove row since it doesn't match the filter.
          this._remove(rowPos);
        }

      }, this);

      // trigger any subscribers 
      this.trigger("change", event);
     
    },

    /**
    * Returns a dataset view based on the filtration parameters 
    * @param {filter} object with optional columns array and filter object/function 
    * @param {options} options object
    */
    where : function(filter, options) {
      options = options || {};
      
      options.parent = this;
      options.filter = filter || {};

      return new DS.View(options);
    },

    _selectData : function() {
      var selectedColumns = [];

      _.each(this.parent._columns, function(parentColumn) {
        
        // check if this column passes the column filter
        if (this.filter.columns(parentColumn)) {
          selectedColumns.push({
            name : parentColumn.name,
            data : [], 
            type : parentColumn.type,
            _id : parentColumn._id
          });
        }

      }, this);

      // get the data that passes the row filter.
      this.parent.each(function(row) {

        if (!this.filter.rows(row)) { 
          return; 
        }

        for(var i = 0; i < selectedColumns.length; i++) {
          selectedColumns[i].data.push(row[selectedColumns[i].name]);
        }
      }, this);

      return selectedColumns;
    },

    /**
    * Returns a normalized version of the column filter function
    * that can be executed.
    * @param {name\array of names} columnFilter - function or column name
    */
    _columnFilter: function(columnFilter) {
      var columnSelector;

      // if no column filter is specified, then just
      // return a passthrough function that will allow
      // any column through.
      if (_.isUndefined(columnFilter)) {
        columnSelector = function() {
          return true;
        };
      } else { //array
        columnFilter.push('_id');
        columnSelector = function(column) {
          return _.indexOf(columnFilter, column.name) === -1 ? false : true;
        };
      }

      return columnSelector;
    },

    /**
    * Returns a normalized row filter function
    * that can be executed 
    */
    _rowFilter: function(rowFilter) {
      
      var rowSelector;

      //support for a single ID;
      if (_.isNumber(rowFilter)) {
        rowFilter = [rowFilter];
      }

      if (_.isUndefined(rowFilter)) {
        rowSelector = function() { 
          return true;
        };

      } else if (_.isFunction(rowFilter)) {
        rowSelector = rowFilter;

      } else { //array
        rowSelector = function(row) {
          return _.indexOf(rowFilter, row._id) === -1 ? false : true;
        };
      }

      return rowSelector;
    },

    /**
    * @public
    * Returns a dataset view of the given column name
    * @param {string} name - name of the column to be selected
    */
    column : function(name) {
      return new DS.View({
        filter : { columns : [name] },
        parent : this
      });
    },

    /**
    * @private
    * Column accessor that just returns column object
    * witout creating a view of it. Used for Products.
    * @param {string} name - Column name.
    * @returns {object} column 
    */
    _column : function(name) {
      var pos = this._columnPositionByName[name];
      return this._columns[pos];
    },

    /**
    * Returns a dataset view of the given columns 
    * @param {array} filter - an array of column names
    */    
    columns : function(columnsArray) {
     return new DS.View({
        filter : { columns : columnsArray },
        parent : this
      });
    },

    /**
    * Returns the names of all columns, not including id column.
    * @returns {array} columnNames
    */
    columnNames : function() {
      var cols = _.pluck(this._columns, 'name');
      cols.shift();
      return cols;
    },

    /**
    * @public
    * Iterates over all rows in the dataset
    * @param {function} iterator - function that is passed each row
    * iterator(rowObject, index, dataset)
    * @param {object} context - options object. Optional.
    */    
    each : function(iterator, context) {
      for(var i = 0; i < this.length; i++) {
        iterator.apply(context || this, [this.rowByPosition(i), i]);
      }
    },

    /**
    * Iterates over each column.
    * @param {function} iterator - function that is passed each column name
    * iterator(colName, index, dataset)
    * @param {object} context - options object. Optional.
    */
    eachColumn : function(iterator, context) {
      // skip id col
      for(var i = 1; i < this.length; i++) {
        iterator.apply(context || this, [this._columns[i].name, i]);
      }  
    },

    /**
    * @public
    * Returns a single row based on its position (NOT ID.)
    * @param {number} i - position index
    * @returns {object} row
    */
    rowByPosition : function(i) {
      return this._row(i);
    },

    /** 
    * @public
    * Returns a single row based on its id (NOT Position.)
    * @param {number} id - unique id
    * @returns {object} row
    */
    rowById : function(id) {
      return this._row(this._rowPositionById[id]);
    },

    /**
    * @private
    * A row retriever based on index position in column data.
    * @param {number} i - position index
    * @returns {object} row
    */
    _row : function(pos) {
      var row = {};
      _.each(this._columns, function(column) {
        row[column.name] = column.data[pos];
      });
      return row;   
    },

    /**
    * @private
    * Deletes a row from all columns and caches.
    * Never manually call this. Views are immutable. This is used
    * by the auto syncing capability. Using this against your view
    * will result in dataloss. Only datasets can have rows be removed.
    * @param {number} rowPos - the row to delete at any position
    */
    _remove : function(rowId) {
      var rowPos = this._rowPositionById[rowId];

      // remove all values
      _.each(this._columns, function(column) {
        column.data.splice(rowPos, 1);
      });
      
      // update caches
      delete this._rowPositionById[rowId];
      this._rowIdByPosition.splice(rowPos, 1);
      this.length--;

      return this;
    },

    /**
    * @private
    * Adds a row to the appropriate column positions
    * and updates caches. This should never be called directly!
    * @param {object} row - A row representation.
    */
    _add : function(row, options) {
      
      if (_.isUndefined(this.comparator)) {
        
        // add all data
        _.each(this._columns, function(column) {
          column.data.push(row[column.name] ? row[column.name] : null);
        });

        // add row indeces to the cache
        this._rowIdByPosition.push(row._id);
        this._rowPositionById[row._id] = this._rowIdByPosition.length;
          
      } else {
        
        var insertAt = function(at, value, into) {
          Array.prototype.splice.apply(into, [at, 0].concat(value));
        };

        var i;
        for(i = 0; i < this.length; i++) {
          var row2 = this.rowByPosition(i);
          if (this.comparator(row, row2) < 0) {
            
            _.each(this._columns, function(column) {
              insertAt(i, (row[column.name] ? row[column.name] : null), column.data);
            });
            
            break;
          }
        }
    
        // rebuild position cache... 
        // we could splice it in but its safer this way.
        this._rowIdByPosition = [];
        this._rowPositionById = {};
        this.each(function(row, i) {
          this._rowIdByPosition.push(row._id);
          this._rowPositionById[row._id] = i;
        });
      }

      this.length++;
      
      return this;
    },

    /**
    * Returns a dataset view of filtered rows
    * @param {function|array} filter - a filter function or object, 
    * the same as where
    */    
    rows : function(filter) {
      return new DS.View({
        filter : { rows : filter },
        parent : this
      });
    },

    /**
    * Sort rows based on comparator
    *
    * roughly taken from here: 
    * http://jxlib.googlecode.com/svn-history/r977/trunk/src/Source/Data/heapsort.js
    * License:
    *   Copyright (c) 2009, Jon Bomgardner.
    *   This file is licensed under an MIT style license
    *
    * @param {object} options - Optional.
    */    
    sort : function(options) {
      options = options || {};
      
      if (_.isUndefined(this.comparator)) {
        throw new Error("Cannot sort without this.comparator.");
      } 

      var count = this.length, end;

      if (count === 1) {
        // we're done. only one item, all sorted.
        return;
      }

      var swap = _.bind(function(from, to) {
      
        // move second row over to first
        var row = this.rowByPosition(to);

        _.each(row, function(value, column) {
          var colPosition = this._columnPositionByName[column],
              value2 = this._columns[colPosition].data[from];
          this._columns[colPosition].data.splice(from, 1, value);
          this._columns[colPosition].data.splice(to, 1, value2);
        }, this);
      }, this);

      var siftDown = _.bind(function(start, end) {
        var root = start, child;
        while (root * 2 <= end) {
          child = root * 2;
          var root_node = this.rowByPosition(root);

          if ((child + 1 < end) && 
              this.comparator(
                this.rowByPosition(child), 
                this.rowByPosition(child+1)
              ) < 0) {
            child++;  
          }

          if (this.comparator(
                root_node, 
                this.rowByPosition(child)) < 0) {
                  
            swap(root, child);
            root = child;
          } else {
            return;
          }
     
        }
          
      }, this);
      

      // puts data in max-heap order
      var heapify = function(count) {
        var start = Math.round((count - 2) / 2);
        while (start >= 0) {
          siftDown(start, count - 1);
          start--;
        }  
      };

      if (count > 2) {
        heapify(count);

        end = count - 1;
        while (end > 1) {
          
          swap(end, 0);
          end--;
          siftDown(0, end);

        }
      } else {
        if (this.comparator(
            this.rowByPosition(0), 
            this.rowByPosition(1)) > 0) {
          swap(0,1);
        }
      }
      this.trigger("sort");
    }
  });

}(this, _));

/**
Library Deets go here
USE OUR CODES

Version 0.0.1.2
*/

(function(global, _, moment) {

  var DS = global.DS;

  /**
  * @constructor
  *
  * Instantiates a new dataset.
  * @param {object} options - optional parameters. 
  *   url : "String - url to fetch data from",
  *   jsonp : "boolean - true if this is a jsonp request",
  *   delimiter : "String - a delimiter string that is used in a tabular datafile",
  *   data : "Object - an actual javascript object that already contains the data",
  *   table : "Element - a DOM table that contains the data",
  *   format : "String - optional file format specification, otherwise we'll try to guess",
  *   recursive : "Boolean - if true build nested arrays of objects as datasets",
  *   strict : "Whether to expect the json in our format or whether to interpret as raw array of objects, default false",
  *   extract : "function to apply to JSON before internal interpretation, optional"
  *   ready : the callback function to act on once the data is fetched. Isn't reuired for local imports
  *           but is required for remote url fetching.
  *   columnNames : {
  *     oldName : newName
  *   },
  *   columnTypes : {
  *     name : typeName || { type : name, ...additionalProperties }
  *   }
  *   google_spreadsheet: {
  *     key : "", worksheet(optional) : ""
  *   },
  *   sorted : true (optional) - If the dataset is already sorted, pass true
  *     so that we don't trigger a sort otherwise.
  *   comparator : function (optional) - takes two rows and returns 1, 0, or -1  if row1 is
  *     before, equal or after row2. 
  }
  */

  DS.Dataset = function(options) {
    options = options || (options = {});
    this._initialize(options);
    return this;
  };

  _.extend(DS.Dataset.prototype, DS.View.prototype, {

    /**
    * @private
    * Internal initialization method. Reponsible for data parsing.
    * @param {object} options - Optional options  
    */
    _initialize: function(options) {

      // initialize importer from options or just create a blank
      // one for now, we'll detect it later.
      var importer = options.importer || null;

      // default parser is object parser, unless otherwise specified.
      var parser  = options.parser || DS.Parsers.Obj;

      // figure out out if we need another parser.
      if (_.isUndefined(options.parser)) {
        if (options.strict) {
          parser = DS.Parsers.Strict;
        } else if (options.delimiter) {
          parser = DS.Parsers.Delimited;
        } else if (options.google_spreadsheet) {
          parser = DS.Parsers.GoogleSpreadsheet;
        }
      }

      // set up some base options for importer.
      var importerOptions = _.extend({}, 
        options,
      { parser : parser });

      if (options.delimiter) {
        importerOptions.dataType = "text";
      }

      if (options.google_spreadsheet) {
        _.extend(importerOptions, options.google_spreadsheet);
      }

      // initialize the proper importer
      if (importer === null) {
        if (options.url) {
          importer = DS.Importers.Remote;
        } else if (options.google_spreadsheet) {
          importer = DS.Importers.GoogleSpreadsheet;
          delete options.google_spreadsheet;
        } else {
          importer = DS.Importers.Local;
        }
      }

      // initialize actual new importer.
      importer = new importer(importerOptions);

      // save comparator if we have one
      if (options.comparator) {
        this.comparator = options.comparator;  
      }

      if (importer !== null) {
        importer.fetch(_.extend({
          success: _.bind(function(d) {
            _.extend(this, d);

            // if a comparator was defined, sort the data
            if (this.comparator) {
              this.sort();
            }

            // call ready method
            if (options.ready) {
              options.ready.call(this);
            }
          }, this)
          }, options));
        }
    },

    /**
    * Add a row to the dataset
    * TODO: multiple rows?
    * @param {object} row - an object representing a row in the form of:
    * {columnName: value}
    * @param {object} options - options
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    add : function(row, options) {
      if (!row._id) {
        row._id = _.uniqueId();
      }

      this._add(row, options);
      if (!options || !options.silent) {
        this.trigger('add', this._buildEvent({ changed : row }) );
        this.trigger('change', this._buildEvent({ changed : row }) );
      }
    },

    /**
    * Remove all rows that match the filter
    * TODO: single row by id?
    * @param {function} filter - function applied to each row
    * @param {object} options - options. Optional.
    *   silent: boolean, do not trigger an add (and thus view updates) event
    */    
    remove : function(filter, options) {
      filter = this._rowFilter(filter);
      var deltas = [];

      this.each(function(row, rowIndex) {
        if (filter(row)) {
          this._remove(row._id);
          deltas.push( { old: row } );
        }
      });
      if (!options || !options.silent) {
        var ev = this._buildEvent( deltas );
        this.trigger('change', ev );
        this.trigger('remove', ev );
      }
    },

    /**
    * Update all rows that match the filter
    * TODO: dynamic values
    * @param {function} filter - filter rows to be updated
    * @param {object} newProperties - values to be updated.
    * @param {object} options - options. Optional.
    */    
    update : function(filter, newProperties, options) {
      filter = this._rowFilter(filter);

      var newKeys = _.keys(newProperties),
          deltas = [];

      this.each(function(row, rowIndex) {
        if (filter(row)) {
          _.each(this._columns, function(c) {
            if (_.indexOf(newKeys, c.name) !== -1) {
              if ((c.type !== 'untyped') && (c.type !== DS.typeOf(newProperties[c.name]))) {
                throw("incorrect value '"+newProperties[c.name]+"' of type "+DS.typeOf(newProperties[c.name])+" passed to column with type "+c.type);
              }
              c.data[rowIndex] = newProperties[c.name];
            }
          }, this);

          deltas.push( { _id : row._id, old : row, changed : newProperties } );
        }
      }, this);

      if (!options || !options.silent) {
        var ev = this._buildEvent( deltas );
        this.trigger('change', ev );
        this.trigger('remove', ev );
      }

    }

  });
}(this, _, moment));


(function(global, _) {

  // shorthand
  var DS = global.DS;
  var Product = (DS.Product || function() {

    DS.Product = function(options) {
      options = options || (options = {});
      
      // save column name. This will be necessary later
      // when we decide whether we need to update the column
      // when sync is called.
      this.func = options.func;

      // determine the product type (numeric, string, time etc.)
      if (options.columns) {
        var column = options.columns;
        if (_.isArray(options.columns)) {
          column = options.columns[0];
        }
        
        this.valuetype = column.type;
        this.numeric = function() {
          return column.toNumeric(this.value);
        };
      }

      this.value = this.func({ silent : true });
      return this;
    };

    return DS.Product;
  }());

  _.extend(Product.prototype, DS.Events, {

    /**
    * @public
    * This is a callback method that is responsible for recomputing
    * the value based on the column its closed on.
    */
    sync : function(event) {
      this.value = this.func();
    },

    /**
    * @public
    * return the raw value of the product
    * @returns {?} value - The value of the product. Most likely a number.
    */
    val : function() {
      return this.value;
    },

    /**
    * @public
    * return the type of product this is (numeric, time etc.)
    * @returns {?} type.
    */
    type : function() {
      return this.valuetype;
    },

    _buildDelta : function(old, changed) {
      return {
        old : old,
        changed : changed
      };
    }
  });

  _.extend(DS.Dataset.prototype, {

    sum : function(columns) {
      columns = this._columnsToArray(columns);
      var columnObjects = this._toColumnObjects(columns);

      return this.calculated(columnObjects, function(columns){
        return function() {
          var sum = 0;
          for (var i= 0; i < columns.length; i++) {
            sum += _.sum(columns[i].data);
          }
          return sum;
        };
      }(columnObjects));
    },

    _columnsToArray : function(columns) {
      if (_.isUndefined(columns)) {
        columns = this.columnNames();
      }
      columns = _.isArray(columns) ? columns : [columns];
      // verify this is an appropriate type for this function
      
      return columns;
    },

    _toColumnObjects : function(columns) {
      var columnObjects = [];
      _.each(columns, function(column) {
        column = this._columns[this._columnPositionByName[column]];
        columnObjects.push(column);
      }, this);
      return columnObjects;
    },
    
    /**
    * return a Product with the value of the maximum 
    * value of the column
    * @param {column/columns} column or array of columns on which the value is calculated 
    */    
    max : function(columns) {
      columns = this._columnsToArray(columns);
      var columnObjects = this._toColumnObjects(columns);

      return this.calculated(columnObjects, function(columns) {
        return function() {
          var max = -Infinity, columnObject;
          for (var i= 0; i < columns.length; i++) {
            columnObject = columns[i];

            for (var j= 0; j < columnObject.data.length; j++) {
              if (DS.types[columnObject.type].compare(columnObject.data[j], max) > 0) {
                max = columnObject.numericAt(j);
              }
            }
          }
          
          // save types and type options to later coerce
          var type = columnObject.type;
          var typeOptions = columnObject.typeOptions;

          // return the coerced value for column type.
          return DS.types[type].coerce(max, typeOptions);
        };
      }(columnObjects));
    },

    /**
    * return a Product with the value of the minimum 
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    min : function(columns) {
      columns = this._columnsToArray(columns);
      var columnObjects = this._toColumnObjects(columns);
    
      return this.calculated(columnObjects, function(columns) {
        return function() {
          var min = Infinity, columnObject;
          for (var i= 0; i < columns.length; i++) {
            columnObject = columns[i];
            for (var j= 0; j < columnObject.data.length; j++) {
              if (DS.types[columnObject.type].compare(columnObject.data[j], min) < 0) {
                min = columnObject.numericAt(j);
              }
            }
          }
           // save types and type options to later coerce
          var type = columnObject.type;
          var typeOptions = columnObject.typeOptions;

          // return the coerced value for column type.
          return DS.types[type].coerce(min, typeOptions);
        };
      }(columnObjects));
    },

    /**
    * return a Product with the value of the average
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    mean : function(column) {},

    /*
    * return a Product with the value of the mode
    * of the column
    * @param {column} column on which the value is calculated 
    */    
    mode : function(column) {},

    /*
    * return a Product derived by running the passed function
    * @param {column} column on which the value is calculated 
    * @param {producer} function which derives the product after
    * being passed each row. TODO: producer signature
    */    
    calculated : function(columns, producer) {
      var _self = this;

      var prod = new Product({
        columns : columns,
        func : function(options) {
          options = options || {};
          
          // build a diff delta. We're using the column name
          // so that any subscribers know whether they need to 
          // update if they are sharing a column.
          var delta = this._buildDelta( this.value, producer.apply(_self) );
          var event = this._buildEvent( "change", delta );

          // trigger any subscribers this might have if the values are diff
          if (!_.isUndefined(delta.old) && !options.silent && delta.old !== delta.changed) {
            this.trigger("change", event);
          }

          // return updated value
          return delta.changed;
        }
      });

      // auto bind to parent dataset
      this.bind("change", prod.sync, prod);
      return prod;
    }

  });

}(this, _));


(function(global, _) {

  var DS = (global.DS = global.DS || {});

  _.extend(global.DS.Dataset.prototype, {
    /**
    * moving average
    * @param {column} column on which to calculate the average
    * @param {width} direct each side to take into the average
    */
    movingAverage : function(column, width) {

    },

    /**
    * group rows by values in a given column
    * @param {byColumn} column by which rows will be grouped
    * @param {columns} columns to be included
    * @param {method} function to be applied, default addition
    */
    groupBy : function(byColumn, columns, method) {
      // TODO: should we check type match here?
      // default method is addition
      method = method || function(array) {
        return _.reduce(array, function(memo, num){ 
          return memo + num; 
        }, 0);
      };

      var d = {
        _columns : []
      };

      var parser = new DS.Parsers();

      // copy columns we want - just types and names. No data.
      var newCols = _.union([byColumn], columns);
      _.each(newCols, function(columnName) {
        var newColumn = d._columns.push(_.clone(
          this._columns[this._columnPositionByName[columnName]])
        );

        d._columns[d._columns.length-1].data = [];
      }, this);

      // save column positions on new dataset.
      d = parser._cacheColumns(d);

      // a cache of values
      var categoryPositions = {},
          categoryCount     = 0,
          byColumnPosition  = d._columnPositionByName[byColumn];

      // bin all values by their categories
      for(var i = 0; i < this.length; i++) {
        var category = this._columns[this._columnPositionByName[byColumn]].data[i];
         
        if (_.isUndefined(categoryPositions[category])) {
            
          // this is a new value, we haven't seen yet so cache
          // its position for lookup of row vals
          categoryPositions[category] = categoryCount;

          // add an empty array to all columns at that position to
          // bin the values
          _.each(columns, function(columnToGroup) {
            var column = d._columns[d._columnPositionByName[columnToGroup]];
            column.data[categoryCount] = [];
          });

          // add the actual bin number to the right col
          d._columns[d._columnPositionByName[byColumn]].data[categoryCount] = category;

          categoryCount++;
        }

        _.each(columns, function(columnToGroup) {
          
          var column = d._columns[d._columnPositionByName[columnToGroup]],
              value  = this._columns[this._columnPositionByName[columnToGroup]].data[i],
              binPosition = categoryPositions[category];

          column.data[binPosition].push(value);
        }, this);
      }

      // now iterate over all the bins and combine their
      // values using the supplied method. 
      _.each(columns, function(colName) {
        var column = d._columns[d._columnPositionByName[colName]];
        _.each(column.data, function(bin, binPos) {
          if (_.isArray(bin)) {
            column.data[binPos] = method.call(this, bin);
          }
        });
      }, this);
    
      // create new dataset based on this data
      d.columns = d._columns;
      delete d._columns;
      var ds = new DS.Dataset({
        data   : d,
        strict : true
      });

      // TODO: subscribe this to parent dataset!
      return ds;
    }
  });

}(this, _));


(function(global, _) {

  var DS = (global.DS || (global.DS = {}));

  // ------ data parsers ---------
  DS.Parsers = function() {};

  _.extend(DS.Parsers.prototype, {

    /**
    * Creates an internal representation of a column based on
    * the form expected by our strict json.
    * @param {string} name The column name
    * @param {string} type The type of the data in the column
    */
    _buildColumn : function(name, type, data) {
      return {
        _id : _.uniqueId(),
        name : name,
        type : type,
        data : (data || [])
      };
    },

    build : function(options) {
      var d = {};

      this._buildColumns(d);
      this._setTypes(d, this.options);
      this._detectTypes(d);
      this._coerceTypes(d);
      this._cacheColumns(d);
      this._cacheRows(d);

      return d;
    },

    _coerceTypes : function(d) {

      // also save raw type function onto column for future computable
      // value extraction
      _.each(d._columns, function(column, index) {

        column.toNumeric = DS.types[column.type].numeric;
        column.numericAt = function(index) {
          return column.toNumeric( column.data[index], index );
        };

        // coerce data based on detected type.
        column.data = _.map(column.data, function(datum) {
          return DS.types[column.type].coerce(datum, column.typeOptions);
        });
      });
      return d;
    },

    _setTypes : function(d, options) {
      options.columnTypes = options.columnTypes || {};
      _.each(d._columns, function(column) {
        var type = options.columnTypes[column.name];
        if (type) {

          // if the type is specified as an object of a form such as:
          // { type : time, format : 'YYYY/MM/DDD'}
          // then take the type property as the type and extend the 
          // column to add a property called
          // typeOptions with the rest of the attributes.
          if (_.isObject(type)) {
            column.type = type.type;
            delete type.type;
            column.typeOptions = type;
          } else {
            column.type = type;
          }
        } 
      });
    },

    _addValue : function(d, columnName, value) {
      var colPos = d._columnPositionByName[columnName];
      d._columns[colPos].data.push(value);
    },

    _detectTypes : function(d, n) {

      _.each(d._columns, function(column) {

        // check if the column already has a type defined. If so, skip
        // this auth detection phase.
        if (_.isUndefined(column.type) || column.type === null) {

          // compute the type by assembling a sample of computed types
          // and then squashing it to create a unique subset.
          var type = _.inject(column.data.slice(0, (n || 5)), function(memo, value) {

            var t = DS.typeOf(value);

            if (value !== "" && memo.indexOf(t) == -1 && !_.isNull(value)) {
              memo.push(t);
            }
            return memo;
          }, []);

          // if we only have one type in our sample, save it as the type
          if (type.length === 1) {
            column.type = type[0];
          } else if (type.length === 0) {
            // we are assuming that this is a number type because we have
            // no values in the sample. Unfortunate.
            column.type = "number";
          } else {
            throw new Error("This column seems to have mixed types");
          }
        }

      });

      return d;
    },

    /**
    * Used by internal importers to cache the columns and their
    * positions in a fast hash lookup.
    * @param d {object} the data object to append cache to.
    */
    _cacheColumns : function(d) {
      d._columnPositionByName = {};

      // cache columns by their column names
      // TODO: should we cache by _id?
      _.each(d._columns, function(column, index) {
        d._columnPositionByName[column.name] = index;
      });

      return d;
    },

    /**
    * Used by internal importers to cache the rows 
    * in quick lookup tables for any id based operations.
    * @param d {object} the data object to append cache to.
    */
    _cacheRows : function(d) {

      d._rowPositionById = {};
      d._rowIdByPosition = [];

      // cache the row id positions in both directions.
      // iterate over the _id column and grab the row ids
      _.each(d._columns[d._columnPositionByName._id].data, function(id, index) {
        d._rowPositionById[id] = index;
        d._rowIdByPosition.push(id);
      });  

      // cache the total number of rows. There should be same 
      // number in each column's data type
      var rowLengths = _.uniq( _.map(d._columns, function(column) { 
        return column.data.length;
      }));

      if (rowLengths.length > 1) {
        throw new Error("Row lengths need to be the same. Empty values should be set to null." + _.map(d._columns, function(c) { return c.data + "|||" ; }));
      } else {
        d.length = rowLengths[0];
      }

      return d;
    },

    /**
    * Adds an id column to the column definition. If a count
    * is provided, also generates unique ids.
    * @param d {object} the data object to modify
    * @param count {number} the number of ids to generate.
    */
    _addIdColumn : function(d, count) {
      // if we have any data, generate actual ids.
      var ids = [];
      if (count && count > 0) {
        _.times(count, function() {
          ids.push(_.uniqueId());
        });
      }
      d._columns.unshift(
        this._buildColumn("_id", "number", ids)
      );

      return d;
    },


    /**
    * By default we are assuming that our data is in
    * the correct form from the fetching.
    */
    parse : function(data) {
      return data;
    }
  });

  // ------ Strict Parser ---------
  /**
  * Handles basic strict data format.
  * TODO: add verify flag to disable auto id assignment for example.
  */
  DS.Parsers.Strict = function(data, options) {
    this.options = options || {};
    this._data = this.parse(data);
  };

  _.extend(
    DS.Parsers.Strict.prototype,
    DS.Parsers.prototype, {

      _buildColumns : function(d) {
        d._columns = this._data._columns;

        // add unique ids to columns
        // TODO do we still need this??
        _.each(d._columns, function(column) {
          if (typeof column._id === "undefined") {
            column._id = _.uniqueId();
          }
        });

        // add row _id column. Generate auto ids if there
        // isn't already a unique id column.
        if (_.pluck(d._columns, "name").indexOf("_id") === -1) {
          this._addIdColumn(this._data, d._columns[0].data.length);
        }

        return d;
      }

    });

    // -------- Object Parser -----------
    /**
    * Converts an array of objects to strict format.
    * Each object is a flat json object of properties.
    * @params {Object} obj = [{},{}...]
    */
    DS.Parsers.Obj = function(data, options) {
      this.options = options || {};
      this._data = data;
    };

    _.extend(
      DS.Parsers.Obj.prototype,
      DS.Parsers.prototype, {

        _buildColumns : function(d, n) {

          d._columns = [];

          // create column container objects
          var columnNames  = _.keys(this._data[0]);
          _.each(columnNames, function(columnName) {
            d._columns.push(this._buildColumn(columnName, null));
          }, this);

          // add id column
          this._addIdColumn(d);

          // cache them so we have a lookup
          this._cacheColumns(d);

          // Build rows
          _.map(this._data, function(row) {

            // iterate over properties in each row and add them
            // to the appropriate column data.
            _.each(row, function(value, key) {
              this._addValue(d, key, value);
            }, this);

            // add a row id
            this._addValue(d, "_id", _.uniqueId());
          }, this);

          return d;
        },

        build : function(options) {

          var d = {};

          this._buildColumns(d);
          // column caching happens inside of build columns this time
          // so that rows know which column their values belong to
          // before we build the data.
          this._setTypes(d, this.options);
          this._detectTypes(d);
          this._coerceTypes(d);
          this._cacheRows(d);
          return d;
        }
      });


      // -------- Delimited Parser ----------

      /**
      * Handles CSV and other delimited data. Takes in a data string
      * and options that can contain: {
      *   delimiter : "someString" <default is comma> 
      * }
      */
      DS.Parsers.Delimited = function(data, options) {
        this.options = options || {};

        this.delimiter = this.options.delimiter || ",";
        this._data = data;

        this.__delimiterPatterns = new RegExp(
          (
            // Delimiters.
            "(\\" + this.delimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + this.delimiter + "\\r\\n]*))"
          ),
          "gi"
        );
      };

      _.extend(
        DS.Parsers.Delimited.prototype,
        DS.Parsers.prototype, {

          _buildColumns : function(d, sample) {

            d._columns = [];

            // convert the csv string into the beginnings of a strict
            // format. The only thing missing is type detection.
            // That happens after all data is parsed.
            var parseCSV = function(delimiterPattern, strData, strDelimiter) {

              // Check to see if the delimiter is defined. If not,
              // then default to comma.
              strDelimiter = (strDelimiter || ",");

              // Create an array to hold our data. Give the array
              // a default empty first row.


              // Create an array to hold our individual pattern
              // matching groups.
              var arrMatches = null;

              // track how many columns we have. Once we reach a new line
              // mark a flag that we're done calculating that.
              var columnCount = 0;
              var columnCountComputed = false;

              // track which column we're on. Start with -1 because we increment it before
              // we actually save the value.
              var columnIndex = -1;

              // Keep looping over the regular expression matches
              // until we can no longer find a match.
              while (arrMatches = delimiterPattern.exec(strData)){

                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];

                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if ( strMatchedDelimiter.length &&
                  ( strMatchedDelimiter !== strDelimiter )){
                    // we have reached a new row.

                    // We are clearly done computing columns.
                    columnCountComputed = true;

                    // when we're done with a row, reset the row index to 0
                    columnIndex = 0;
                  } else {

                    // Find the number of columns we're fetching and
                    // create placeholders for them.
                    if (!columnCountComputed) {
                      columnCount++;
                    }

                    columnIndex++;
                  }


                  // Now that we have our delimiter out of the way,
                  // let's check to see which kind of value we
                  // captured (quoted or unquoted).
                  var strMatchedValue = null;
                  if (arrMatches[ 2 ]){

                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    strMatchedValue = arrMatches[ 2 ].replace(
                      new RegExp( "\"\"", "g" ),
                      "\""
                    );

                  } else {

                    // We found a non-quoted value.
                    strMatchedValue = arrMatches[ 3 ];
                  }

                  // Now that we have our value string, let's add
                  // it to the data array.
                  if (columnCountComputed) {

                    d._columns[columnIndex].data.push(strMatchedValue); 

                  } else {

                    // we are building the column names here
                    d._columns.push({
                      name : strMatchedValue,
                      data : [],
                      _id  : _.uniqueId()
                    });
                  }
              }

              // Return the parsed data.
              return d;
            };

            parseCSV(
              this.__delimiterPatterns, 
              this._data, 
            this.delimiter);

            this._addIdColumn(d, d._columns[0].data.length);

            return d;
          }

        });


        // ---------- Data Importers -------------

        // this XHR code is from @rwldron.
        var _xhrSetup = {
          url       : "",
          data      : "",
          dataType  : "",
          success   : function() {},
          type      : "GET",
          async     : true,
          xhr : function() {
            return new global.XMLHttpRequest();
          }
        }, rparams = /\?/;

        DS.Xhr = function(options) {

          // json|jsonp etc.
          options.dataType = options.dataType && options.dataType.toLowerCase() || null;

          if (options.dataType && 
            (options.dataType === "jsonp" || options.dataType === "script" )) {

              DS.Xhr.getJSONP(
                options.url,
                options.success,
                options.dataType === "script"
              );

              return;
            }

            var settings = _.extend({}, _xhrSetup, options);

            // create new xhr object
            settings.ajax = settings.xhr();

            if (settings.ajax) {
              if (settings.type === "GET" && settings.data) {

                //  append query string
                settings.url += (rparams.test(settings.url) ? "&" : "?") + settings.data;

                //  Garbage collect and reset settings.data
                settings.data = null;
              }

              settings.ajax.open(settings.type, settings.url, settings.async);
              settings.ajax.send(settings.data || null);

              return DS.Xhr.httpData(settings);
            }
        };

        DS.Xhr.getJSONP = function(url, success, isScript) {
          // If this is a script request, ensure that we do not 
          // call something that has already been loaded
          if (isScript) {

            var scripts = document.querySelectorAll("script[src=\"" + url + "\"]");

            //  If there are scripts with this url loaded, early return
            if (scripts.length) {

              //  Execute success callback and pass "exists" flag
              if (success) { 
                success(true);
              }

              return;
            }
          } 

          var head    = document.head || 
          document.getElementsByTagName("head")[0] || 
          document.documentElement,

          script    = document.createElement("script"),
          paramStr  = url.split("?")[ 1 ],
          isFired   = false,
          params    = [],
          callback, parts, callparam;

          // Extract params
          if (paramStr && !isScript) {
            params = paramStr.split("&");
          }
          if (params.length) {
            parts = params[params.length - 1].split("=");
          }
          callback = params.length ? (parts[ 1 ] ? parts[ 1 ] : parts[ 0 ]) : "jsonp";

          if (!paramStr && !isScript) {
            url += "?callback=" + callback;
          }

          if (callback && !isScript) {

            // If a callback name already exists
            if (!!window[callback]) {
              callback = callback + (+new Date()) + _.uniqueId();
            }

            //  Define the JSONP success callback globally
            window[callback] = function(data) {
              if (success) { 
                success(data);
              }
              isFired = true;
            };

            //  Replace callback param and callback name
            url = url.replace(parts.join("="), parts[0] + "=" + callback);
          }

          script.onload = script.onreadystatechange = function() {
            if (!script.readyState || /loaded|complete/.test(script.readyState)) {

              //  Handling remote script loading callbacks
              if (isScript) {

                //  getScript
                if (success) { 
                  success();
                }
              }

              //  Executing for JSONP requests
              if (isFired) {

                //  Garbage collect the callback
                delete window[callback];

                //  Garbage collect the script resource
                head.removeChild(script);
              }
            }
          };

          script.src = url;
          head.insertBefore(script, head.firstChild);
          return;
        };

        DS.Xhr.httpData = function(settings) {
          var data, json = null;

          settings.ajax.onreadystatechange = function() {
            if (settings.ajax.readyState === 4) {
              try {
                json = JSON.parse(settings.ajax.responseText);
              } catch (e) {
                // suppress
              }

              data = {
                xml : settings.ajax.responseXML,
                text : settings.ajax.responseText,
                json : json
              };

              if (settings.dataType) {
                data = data[settings.dataType];
              }

              settings.success.call(settings.ajax, data);
            }
          };

          return data;
        };

        DS.Importers = function(data, options) {};

        /**
        * Simple base parse method, passing data through
        */
        DS.Importers.prototype.extract = function(data) {
          data = _.clone(data);
          data._columns = data.columns;
          delete data.columns;
          return data;
        };

        /**
        * Local data importer is responsible for just using 
        * a data object and passing it appropriatly.
        */
        DS.Importers.Local = function(options) {
          this.options = options || (options = {});

          if (this.options.extract) {
            this.extract = this.options.extract;
          }
          this.data = options.data;
          this.parser = this.options.parser || DS.Importer.Obj;
        };

        _.extend(
          DS.Importers.Local.prototype,
          DS.Importers.prototype, {
            fetch : function(options) {
              // since this is the local importer, it just
              // passes the data through, parsed.
              this.data = this.extract(this.data);

              // create a new parser and pass the parsed data in
              this.parser = new this.parser(this.data, _.extend({},
                this.options,
                options));

                var parsedData = this.parser.build();
                options.success(parsedData);     
            }
          });

          /**
          * A remote importer is responsible for fetching data from a url
          * and passing it through the right parser.
          */
          DS.Importers.Remote = function(options) {
            options = options || {};
            this._url = options.url;

            if (options.extract) {
              this.extract = options.extract;
            }

            this.parser = options.parser || DS.Parsers.Obj;

            // Default ajax request parameters
            this.params = {
              type : "GET",
              url : this._url,
              dataType : options.dataType ? options.dataType : (options.jsonp ? "jsonp" : "json")
            };
          };

          _.extend(
            DS.Importers.Remote.prototype,
            DS.Importers.prototype,
            {
              fetch : function(options) {

                // call the original fetch method of object parsing.
                // we are assuming the parsed version of the data will
                // be an array of objects.
                var callback = _.bind(function(data) {
                  data = this.extract(data);

                  // create a new parser and pass the parsed data in
                  this.parser = new this.parser(data, options);

                  var parsedData = this.parser.build();
                  options.success(parsedData);  

                }, this);

                // make ajax call to fetch remote url.
                DS.Xhr(_.extend(this.params, { success : callback }));
              }
            }
          );



}(this, _));

// --------- Google Spreadsheet Parser -------
// This is utilizing the format that can be obtained using this:
// http://code.google.com/apis/gdata/samples/spreadsheet_sample.html

(function(global, _) {

  var DS = (global.DS || (global.DS = {}));

/**
* @constructor
* Google Spreadsheet Parser. 
* Used in conjunction with the Google Spreadsheet Importer.
* Requires the following:
* @param {object} data - the google spreadsheet data.
* @param {object} options - Optional options argument.
*/
DS.Parsers.GoogleSpreadsheet = function(data, options) {
  this.options = options || {};
  this._data = data;
};

_.extend(DS.Parsers.GoogleSpreadsheet.prototype, DS.Parsers.prototype, {

  _buildColumns : function(d, n) {
    d._columns = [];

    var positionRegex = /([A-Z]+)(\d+)/; 
    var columnPositions = {};

    _.each(this._data.feed.entry, function(cell, index) {

      var parts = positionRegex.exec(cell.title.$t),
      column = parts[1],
      position = parseInt(parts[2], 10);

      if (_.isUndefined(columnPositions[column])) {

        // cache the column position
        columnPositions[column] = d._columns.length;

        // we found a new column, so build a new column type.
        d._columns.push(this._buildColumn(cell.content.$t, null, []));

      } else {

        // find position: 
        var colpos = columnPositions[column];

        // this is a value for an existing column, so push it.
        d._columns[colpos].data[position-1] = cell.content.$t; 
      }
    }, this);

    // fill whatever empty spaces we might have in the data due to 
    // empty cells
    d.length = _.max(d._columns, function(column) { 
      return column.data.length; 
    }).data.length - 1; // for column name

    _.each(d._columns, function(column, index) {

      // slice off first space. It was alocated for the column name
      // and we've moved that off.
      column.data.splice(0,1);

      for (var i = 0; i < d.length; i++) {
        if (_.isUndefined(column.data[i]) || column.data[i] === "") {
          column.data[i] = null;
        }
      }
    });

    // add row _id column. Generate auto ids if there
    // isn't already a unique id column.
    if (_.pluck(d._columns, "name").indexOf("_id") === -1) {
      this._addIdColumn(d, d._columns[0].data.length);
    }

    return d;
  }

});

/**
* @constructor
* Instantiates a new google spreadsheet importer.
* @param {object} options - Options object. Requires at the very least:
*     key - the google spreadsheet key
*     worksheet - the index of the spreadsheet to be retrieved.
*   OR
*     url - a more complex url (that may include filtering.) In this case
*           make sure it's returning the feed json data.
*/
DS.Importers.GoogleSpreadsheet = function(options) {
  options = options || {};
  if (options.url) {

    options.url = options.url;

  } else {

    if (_.isUndefined(options.key)) {

      throw new Error("Set options.key to point to your google document.");
    } else {

      options.worksheet = options.worksheet || 1;
      options.url = "https://spreadsheets.google.com/feeds/cells/" + options.key + "/" + options.worksheet + "/public/basic?alt=json-in-script&callback=";
      delete options.key;
      delete options.worksheet;
    }
  }

  this.parser = DS.Parsers.GoogleSpreadsheet;
  this.params = {
    type : "GET",
    url : options.url,
    dataType : "jsonp"
  };

  return this;
};

_.extend(
  DS.Importers.GoogleSpreadsheet.prototype, 
DS.Importers.Remote.prototype);

}(this, _));

// -------- Delimited Parser ----------

/**
* Handles CSV and other delimited data. Takes in a data string
* and options that can contain: {
*   delimiter : "someString" <default is comma> 
* }
*/

(function(global, _) {

  var DS = (global.DS || (global.DS = {}));


  DS.Parsers.Delimited = function(data, options) {
    this.options = options || {};

    this.delimiter = this.options.delimiter || ",";
    this._data = data;

    this.__delimiterPatterns = new RegExp(
      (
        // Delimiters.
        "(\\" + this.delimiter + "|\\r?\\n|\\r|^)" +

        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

        // Standard fields.
        "([^\"\\" + this.delimiter + "\\r\\n]*))"
      ),
      "gi"
    );
  };

  _.extend(DS.Parsers.Delimited.prototype, DS.Parsers.prototype, {

    _buildColumns : function(d, sample) {

      d._columns = [];

      // convert the csv string into the beginnings of a strict
      // format. The only thing missing is type detection.
      // That happens after all data is parsed.
      var parseCSV = function(delimiterPattern, strData, strDelimiter) {

        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create an array to hold our data. Give the array
        // a default empty first row.


        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // track how many columns we have. Once we reach a new line
        // mark a flag that we're done calculating that.
        var columnCount = 0;
        var columnCountComputed = false;

        // track which column we're on. Start with -1 because we increment it before
        // we actually save the value.
        var columnIndex = -1;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = delimiterPattern.exec(strData)){

          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ];

          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if ( strMatchedDelimiter.length &&
            ( strMatchedDelimiter !== strDelimiter )){
              // we have reached a new row.

              // We are clearly done computing columns.
              columnCountComputed = true;

              // when we're done with a row, reset the row index to 0
              columnIndex = 0;
            } else {

              // Find the number of columns we're fetching and
              // create placeholders for them.
              if (!columnCountComputed) {
                columnCount++;
              }

              columnIndex++;
            }


            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            var strMatchedValue = null;
            if (arrMatches[ 2 ]){

              // We found a quoted value. When we capture
              // this value, unescape any double quotes.
              strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
              );

            } else {

              // We found a non-quoted value.
              strMatchedValue = arrMatches[ 3 ];
            }

            // Now that we have our value string, let's add
            // it to the data array.
            if (columnCountComputed) {

              d._columns[columnIndex].data.push(strMatchedValue); 

            } else {

              // we are building the column names here
              d._columns.push({
                name : strMatchedValue,
                data : [],
                _id  : _.uniqueId()
              });
            }
        }

        // Return the parsed data.
        return d;
      };

      parseCSV(
        this.__delimiterPatterns, 
        this._data, 
      this.delimiter);

      this._addIdColumn(d, d._columns[0].data.length);

      return d;
    }

  });


}(this, _));
