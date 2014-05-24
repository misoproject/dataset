(function(global, _) {

  var Miso = global.Miso || (global.Miso = {});
  var Dataset = global.Miso.Dataset;

  /**
   * A Miso.Product is a single computed value that can be obtained from a
   * Miso.Dataset. When a dataset is syncable, it will be an object that one
   * can subscribe to the changes of. Otherwise, it returns the actual computed
   * value.
   *
   * @constructor
   * @name Product
   * @memberof Miso.Dataset
   *
   * @param {Object} [options]
   * @param {Function} options.func - the function that derives the computation
   * @param {mixed} options.columns - the columns from which the function
   *                                  derives the computation
   */
  Dataset.Product = function(options) {
    options = options || {};
    
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

    this.func({ silent : true });
    return this;
  };

  _.extend(Dataset.Product.prototype, Miso.Events,
    /** @lends Miso.Dataset.Product.prototype */
    {

    /**
     * @externalExample {runnable} product/val
     *
     * @returns {mixed} the raw value of the product, most likely a number
     */
    val : function() {
      return this.value;
    },

    /**
     * @returns the type of product this is (numeric, time etc.) Matches the
     *          name of one of the Miso.types.
     */
    type : function() {
      return this.valuetype;
    },
    
    //This is a callback method that is responsible for recomputing
    //the value based on the column its closed on.
    _sync : function(event) {
      this.func();
    },

    // builds a delta object.
    _buildDelta : function(old, changed) {
      return {
        old : old,
        changed : changed
      };
    }
  });

  /**
   * Use this method to define a new product.
   *
   * @memberof Miso.Dataset.Product
   *
   * @param {Function} func - The function which will be wrapped to create a
   *                          product. Function signature is function(columns,
   *                          options)
   *
   * @externalExample {runnable} product/define
   *
   * @returns {Function}
   */
  Dataset.Product.define = function(func) {
    return function(columns, options) {
      options = options || {};
      var columnObjects = this._findColumns(columns);
      var _self = this;
      options.type = options.type || columnObjects[0].type;
      options.typeOptions = options.typeOptions || columnObjects[0].typeOptions;

      //define wrapper function to handle coercion
      var producer = function() {
        var val = func.call(_self, columnObjects, options);
        return Dataset.types[options.type].coerce(val, options.typeOptions);
      };

      if (this.syncable) {
        //create product object to pass back for syncable datasets/views
        var prod = new Dataset.Product({
          columns : columnObjects,
          func : function(options) {
            options = options || {};
            var delta = this._buildDelta(this.value, producer.call(_self));
            this.value = delta.changed;
            if (_self.syncable) {
              var event = Dataset.Events._buildEvent(delta, this);
              if (!_.isUndefined(delta.old) && !options.silent && delta.old !== delta.changed) {
                this.publish("change", event);
              }
            }
          }
        });
        this.subscribe("change", prod._sync, { context : prod }); 
        return prod; 

      } else {
        return producer.call(_self);
      }

    };
  };


  _.extend(Dataset.DataView.prototype,
    /** @lends Miso.Dataset.DataView.prototype */
    {

    // finds the column objects that match the single/multiple
    // input columns. Helper method.
    _findColumns : function(columns) {
      var columnObjects = [];

      // if no column names were specified, get all column names.
      if (_.isUndefined(columns)) {
        columns = this.columnNames();
      }

      // convert columns to an array in case we only got one column name.
      columns = _.isArray(columns) ? columns : [columns];

      // assemble actual column objecets together.
      _.each(columns, function(column) {
        column = this._columns[this._columnPositionByName[column]];
        columnObjects.push(column);
      }, this);

      return columnObjects;
    },

    /**
     * If the dataset has `sync` enabled this will return a
     * `Miso.Dataset.Product` that can be used to bind events to and access the
     * current value.  Otherwise it will return the current value - the sum of
     * the numeric form of the values in the column.
     *
     * @method
     *
     *
     * @param {String|String[]} columns - column name(s) on which the value is
     *                                    calculated
     *
     * @externalExample {runnable} dataview/sum
     *
     * @returns {Miso.Dataset.Product|Number}
     */
    // TODO: Remove unused `options` argument
    sum : Dataset.Product.define( function(columns, options) {
      _.each(columns, function(col) {
        if (col.type === Dataset.types.time.name) {
          throw new Error("Can't sum up time");
        }
      });
      return _.sum(_.map(columns, function(c) { return c._sum(); }));
    }),

    /**
     * If the dataset has `sync` enabled this will return a
     * `Miso.Dataset.Product` that can be used to bind events to and access the
     * current value.  Otherwise it will return the current value - the highest
     * numeric value in that column.
     *
     * @method
     *
     * @param {String|String[]} column - column name(s) on which the value is
     *                                   calculated
     *
     * @externalExample {runnable} dataview/max
     *
     * @returns {Miso.Dataset.Product|Number}
     */
    // TODO: Remove unused `options` argument
    max : Dataset.Product.define( function(columns, options) {
      return _.max(_.map(columns, function(c) { 
        return c._max(); 
      }));
    }),

  
    /**
     * If the dataset has `sync` enabled this will return a
     * `Miso.Dataset.Product` that can be used to bind events to and access the
     * current value.  Otherwise it will return the current value - the lowest
     * numeric value in that column.
     *
     * @method
     *
     * @param {String[]} columns - array of column names on which the value is
     *                             calculated
     *
     * @externalExample {runnable} dataview/min
     *
     * @returns {Miso.Dataset.Product|Number}
     */
    min : Dataset.Product.define( function(columns, options) {
      return _.min(_.map(columns, function(c) { 
        return c._min(); 
      }));
    }),

    /**
     * If the dataset has `sync` enabled this will return a
     * `Miso.Dataset.Product` that can be used to bind events to and access the
     * current value.  Otherwise it will return the current value - the mean or
     * average of the numeric form of the values in the column.
     *
     * @method
     *
     * @param {String[]} columns - array of column names on which the value is
     *                             calculated
     *
     * @externalExample {runnable} dataview/mean
     *
     * @returns {Miso.Dataset.Product|Number}
     */
    mean : Dataset.Product.define( function(columns, options) {
      var vals = [];
      _.each(columns, function(col) {
        vals.push(col.data);
      });

      vals = _.flatten(vals);

      // save types and type options to later coerce
      var type = columns[0].type;

      // convert the values to their appropriate numeric value
      vals = _.map(vals, function(v) { return Dataset.types[type].numeric(v); });
      return _.mean(vals);   
    })

  });

}(this, _));

