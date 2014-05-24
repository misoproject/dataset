(function(global, _) {

  var Dataset = global.Miso.Dataset;

  /**
   * Tests the type of a given input against the registered Miso types and
   * returns the closest match.
   *
   * @name typeOf
   * @memberof Miso.Dataset
   *
   * @param {mixed} value - The value to test
   * @param {Object} [options]
   * @param {String} [format] - For `time` type only. Describes the format.
   *
   * @externalExample {runnable} type-of
   *
   * @returns {String}
   */
  Dataset.typeOf = function(value, options) {
    var types = _.keys(Dataset.types),
        chosenType;

    //move string and mixed to the end
    types.push(types.splice(_.indexOf(types, 'string'), 1)[0]);
    types.push(types.splice(_.indexOf(types, 'mixed'), 1)[0]);

    chosenType = _.find(types, function(type) {
      return Dataset.types[type].test(value, options);
    });

    chosenType = _.isUndefined(chosenType) ? 'string' : chosenType;

    return chosenType;
  };
  
  /**
   * Miso types are used to set and manage the data types on columns. These
   * sets of functions handle testing what type data is and coercing it into
   * the correct format for a given type. The type system is completely
   * extensible, making it easy to create rich custom types for your data when
   * it would be helpful to do so. All types must have the following interface.
   *
   * @namespace types
   * @memberof Miso.Dataset
   *
   * @externalExample types
   */
  Dataset.types = {
    
    mixed :
    /**
     * @namespace mixed
     * @memberof Miso.Dataset.types
     */
    {
      name : 'mixed',
      /**
       * Coerces the value, given the is the mixed type it's a passthrough.
       *
       * @memberof Miso.Dataset.types.mixed
       * @name coerce
       * @method
       *
       * @param {mixed} v - Value to be coerced
       */
      coerce : function(v) {
        if (_.isNull(v) || typeof v === "undefined" || _.isNaN(v)) {
          return null;
        }
        return v;
      },
      /**
       * Tests whether the value is of the given type. Given this is the mixed
       * type it will always be true.
       *
       * @memberof Miso.Dataset.types.mixed
       * @name test
       * @method
       *
       * @returns {Boolean}
       */
      test : function() {
        return true;
      },
      /**
       * Compares two mixed type values
       *
       * @memberof Miso.Dataset.types.mixed
       * @name compare
       * @method
       *
       * @param {mixed} s1 - First value to be compared
       * @param {mixed} s2 - Second value to be compared
       *
       * @returns {Number}
       */
      compare : function(s1, s2) {
        if ( _.isEqual(s1, s2) ) { return 0; }
        if (s1 < s2)  { return -1;}
        if (s1 > s2)  { return 1; }
      },
      /**
       * @memberof Miso.Dataset.types.mixed
       * @name numeric
       * @method
       *
       * @param {mixed} v - Value to be coerced to numeric
       *
       * @returns {Number} The numeric representation of a mixed value. If it's
       *                   an integer, then it coerces it. Otherwise it returns
       *                   0.
       */
      numeric : function(v) {
        return v === null || _.isNaN(+v) ? null : +v;
      }
    },

    string :
    /**
     * @namespace string
     * @memberof Miso.Dataset.types
     */
    {
      name : "string",
      /**
       * Coerces the value to a string.
       *
       * @memberof Miso.Dataset.types.string
       * @name coerce
       * @method
       *
       * @param {mixed} v - Value to be coerced
       *
       * @returns {String}
       */
      coerce : function(v) {
        if (_.isNaN(v) || v === null || typeof v === "undefined") {
          return null;
        }
        return v.toString();
      },

      /**
       * Tests whether the value is a string.
       *
       * @memberof Miso.Dataset.types.string
       * @name test
       * @method
       *
       * @param {mixed} v - The value to be tested
       *
       * @returns {Boolean}
       */
      test : function(v) {
        return (v === null || typeof v === "undefined" || typeof v === 'string');
      },

      /**
       * Compares two `string` type values
       *
       * @memberof Miso.Dataset.types.string
       * @name compare
       * @method
       *
       * @param {String} s1 - First value to be compared
       * @param {String} s2 - Second value to be compared
       *
       * @returns {Number}
       */
      compare : function(s1, s2) {
        if (s1 == null && s2 != null) { return -1; }
        if (s1 != null && s2 == null) { return 1; }
        if (s1 < s2) { return -1; }
        if (s1 > s2) { return 1;  }
        return 0;
      },

      /**
       * Returns the numeric representation of a string value
       *
       * @memberof Miso.Dataset.types.string
       * @name numeric
       * @method
       *
       * @param {mixed} value - Value to be coerced to numeric
       *
       * @returns {Number}
       */
      numeric : function(value) {
        if (_.isNaN(+value) || value === null) {
          return null;
        } else if (_.isNumber(+value)) {
          return +value;
        } else {
          return null;
        }
      }
    },

    "boolean" :
    /**
     * The boolean type is used for columns of true/false booleans.
     *
     * @namespace boolean
     * @memberof Miso.Dataset.types
     */
    {
      name : "boolean",
      regexp : /^(true|false)$/,
      /**
       * Coerces the value to a boolean, uses javascript truthy/falsy.
       *
       * @memberof Miso.Dataset.types.boolean
       * @name coerce
       * @method
       *
       * @param {mixed} v - Value to be coerced
       *
       * @returns {Boolean}
       */
      coerce : function(v) {
        if (_.isNaN(v) || v === null || typeof v === "undefined") {
          return null;
        }
        if (v === 'false') { return false; }
        return Boolean(v);
      },
      /**
       * Tests whether the value is a boolean.
       *
       * @memberof Miso.Dataset.types.boolean
       * @name test
       * @method
       *
       * @param {mixed} v - Value to be tested
       *
       * @returns {Boolean}
       */
      test : function(v) {
        if (v === null || typeof v === "undefined" || typeof v === 'boolean' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      /**
       * Compares two boolean type values
       *
       * @memberof Miso.Dataset.types.boolean
       * @name compare
       * @method
       *
       * @param {Boolean} n1 - First value to be compared
       * @param {Boolean} n2 - Second value to be compared
       *
       * @return {Number}
       */
      compare : function(n1, n2) {
        if (n1 == null && n2 != null) { return -1; }
        if (n1 != null && n2 == null) { return 1; }
        if (n1 == null && n2 == null) { return 0; }
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      /**
       * Returns the numeric representation of a boolean value - false is 0,
       * true 1.
       *
       * @memberof Miso.Dataset.types.boolean
       * @name numeric
       * @method
       *
       * @param {mixed} value - Value to be coerced to numeric
       *
       * @returns {Number}
       */
      numeric : function(value) {
        if (value === null || _.isNaN(value)) {
          return null;
        } else {
          return (value) ? 1 : 0;  
        }
      }
    },

    number :
    /**
     * The number type is used for columns of numbers.
     *
     * @namespace number
     * @memberof Miso.Dataset.types
     */
    {
      name : "number",
      regexp : /^\s*[\-\.]?[0-9]+([\.][0-9]+)?\s*$/,
      /**
       * Coerces the value to a number, a passthrough.
       *
       * @memberof Miso.Dataset.types.number
       * @name coerce
       * @method
       *
       * @param {mixed} v - Value to be coerced
       *
       * @returns {Number}
       */
      coerce : function(v) {
        var cv = +v;
        if (_.isNull(v) || typeof v === "undefined" || _.isNaN(cv)) {
          return null;
        }
        return cv;
      },
      /**
       * Tests whether the value is a number.
       *
       * @memberof Miso.Dataset.types.number
       * @name test
       * @method
       *
       * @param {mixed} v - Value to be tested
       *
       * @returns {Boolean}
       */
      test : function(v) {
        if (v === null || typeof v === "undefined" || typeof v === 'number' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      /**
       * Compares two `number` type values
       *
       * @memberof Miso.Dataset.types.number
       * @name compare
       * @method
       *
       * @param {Number} n1 - First value to be compared
       * @param {Number} n2 - Second value to be compared
       * @returns {Number}
       */
      compare : function(n1, n2) {
        if (n1 == null && n2 != null) { return -1; }
        if (n1 != null && n2 == null) { return 1; }
        if (n1 == null && n2 == null) { return 0; }
        if (n1 === n2) { return 0; }
        return (n1 < n2 ? -1 : 1);
      },
      /**
       * Returns the numeric representation of a `number` which will be..the
       * number.
       *
       * @memberof Miso.Dataset.types.number
       * @name numeric
       * @method
       *
       * @param {mixed} value - Value to be coerced to numeric
       *
       * @returns {Number}
       */
      numeric : function(value) {
        if (_.isNaN(value) || value === null) {
          return null;
        }
        return value;
      }
    },

    time :
    /**
     * The time type is used for columns of dates & timestamps, this uses
     * [moment.js](http://momentjs.com/) internally and returns moment objects.
     *
     * @namespace time
     * @memberof Miso.Dataset.types
     */
     {
      name : "time",
      format : "DD/MM/YYYY",
      _formatLookup : [
        ['DD', "\\d{2}"],
        ['D' ,  "\\d{1}|\\d{2}"],
        ['MM', "\\d{2}"],
        ['M' , "\\d{1}|\\d{2}"],
        ['YYYY', "\\d{4}"],
        ['YY', "\\d{2}"],
        ['A', "[AM|PM]"],
        ['hh', "\\d{2}"],
        ['h', "\\d{1}|\\d{2}"],
        ['mm', "\\d{2}"],
        ['m', "\\d{1}|\\d{2}"],
        ['ss', "\\d{2}"],
        ['s', "\\d{1}|\\d{2}"],
        ['ZZ',"[-|+]\\d{4}"],
        ['Z', "[-|+]\\d{2}:\\d{2}"]
      ],
      _regexpTable : {},

      _regexp: function(format) {
        //memoise
        if (this._regexpTable[format]) {
          return new RegExp(this._regexpTable[format], 'g');
        }

        //build the regexp for substitutions
        var regexp = format;
        _.each(this._formatLookup, function(pair) {
          regexp = regexp.replace(pair[0], pair[1]);
        }, this);

        // escape all forward slashes
        regexp = regexp.split("/").join("\\/");

        // save the string of the regexp, NOT the regexp itself.
        // For some reason, this resulted in inconsistant behavior
        this._regexpTable[format] = regexp; 
        return new RegExp(this._regexpTable[format], 'g');
      },

      /**
       * Coerces the value to a time.
       *
       * @memberof Miso.Dataset.types.time
       * @name coerce
       * @method
       *
       * @param {mixed} v - Value to be coerced
       * @param {Object} [options]
       * @param {String} options.format - Time format. See
       *                                  [Moment.js](http://momentjs.com/)
       *                                  documentation.
       */
      coerce : function(v, options) {
        options = options || {};

        if (_.isNull(v) || typeof v === "undefined" || _.isNaN(v)) {
          return null;
        }

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

      /**
       * Tests whether the value is a time.
       *
       * @memberof Miso.Dataset.types.time
       * @name test
       * @method
       *
       * @param {mixed} v - Value to be tested
       *
       * @returns {Boolean}
       */
      test : function(v, options) {
        options = options || {};
        if (v === null || typeof v === "undefined") {
          return true;
        }
        if (_.isString(v) ) {
          var format = options.format || this.format,
              regex = this._regexp(format);
          return regex.test(v);
        } else {
          //any number or moment obj basically
          return true;
        }
      },
      /**
       * Compares two `time` type values
       *
       * @memberof Miso.Dataset.types.time
       * @name compare
       * @method
       *
       * @param {time} d1 - First value to be compared
       * @param {time} d2 - Second value to be compared
       *
       * @returns {Number}
       */
      compare : function(d1, d2) {
        if (d1 < d2) {return -1;}
        if (d1 > d2) {return 1;}
        return 0;
      },
      /**
       * Returns the numeric representation of a time which will be an [epoch
       * time](http://en.wikipedia.org/wiki/Unix_time).
       *
       * @memberof Miso.Dataset.types.time
       * @name numeric
       * @method
       *
       * @param {mixed} value - Value to be coerced to numeric
       *
       * @returns {Number}
       */
      numeric : function( value ) {
        if (_.isNaN(value) || value === null) {
          return null;
        }
        return value.valueOf();
      }
    }
  };

}(this, _));
