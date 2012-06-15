(function(global, _) {

  // shorthand
  var Miso = global.Miso;

  /**
  * A Miso.Product is a single computed value that can be obtained 
  * from a Miso.Dataset. When a dataset is syncable, it will be an object
  * that one can subscribe to the changes of. Otherwise, it returns
  * the actual computed value.
  * Parameters:
  *   func - the function that derives the computation.
  *   columns - the columns from which the function derives the computation
  */
  Miso.Product = (Miso.Product || function(options) {
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
  });

  _.extend(Miso.Product.prototype, Miso.Events, {

    /**
    * return the raw value of the product
    * Returns:
    *   The value of the product. Most likely a number.
    */
    val : function() {
      return this.value;
    },

    /**
    * return the type of product this is (numeric, time etc.)
    * Returns
    *   type. Matches the name of one of the Miso.types.
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

  Miso.Product.define = function(func) {
    return function(columns, options) {
      options = options || {};
      var columnObjects = this._findColumns(columns);
      var _self = this;
      options.type = options.type || columnObjects[0].type;
      options.typeOptions = options.typeOptions || columnObjects[0].typeOptions;

      //define wrapper function to handle coercion
      var producer = function() {
        var val = func.call(_self, columnObjects, options);
        return Miso.types[options.type].coerce(val, options.typeOptions);
      };

      if (this.syncable) {
        //create product object to pass back for syncable datasets/views
        var prod = new Miso.Product({
          columns : columnObjects,
          func : function(options) {
            options = options || {};
            var delta = this._buildDelta(this.value, producer.call(_self));
            this.value = delta.changed;
            if (_self.syncable) {
              var event = this._buildEvent(delta);
              if (!_.isUndefined(delta.old) && !options.silent && delta.old !== delta.changed) {
                this.trigger("change", event);
              }
            }
          }
        });
        this.bind("change", prod._sync, prod); 
        return prod; 

      } else {
        return producer.call(_self);
      }

    };
  };


  _.extend(Miso.DataView.prototype, {

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
    * Computes the sum of one or more columns.
    * Parameters:
    *   columns - string or array of column names on which the value is calculated 
    *   options
    *     silent - set to tue to prevent event propagation
    */
    sum : Miso.Product.define( function(columns, options) {
      _.each(columns, function(col) {
        if (col.type === Miso.types.time.name) {
          throw new Error("Can't sum up time");
        }
      });
      return _.sum(_.map(columns, function(c) { return c._sum(); }));
    }),

     /**
    * return a Product with the value of the maximum 
    * value of the column
    * Parameters:
    *   column - string or array of column names on which the value is calculated 
    */    
    max : Miso.Product.define( function(columns, options) {
      return _.max(_.map(columns, function(c) { 
        return c._max(); 
      }));
    }),

  
    /**
    * return a Product with the value of the minimum 
    * value of the column
    * Paramaters:
    *   columns - string or array of column names on which the value is calculated 
    */    
    min : Miso.Product.define( function(columns, options) {
      return _.min(_.map(columns, function(c) { 
        return c._min(); 
      }));
    }),

    /**
    * return a Product with the value of the average
    * value of the column
    * Parameters:
    *   column - string or array of column names on which the value is calculated 
    */    
    mean : Miso.Product.define( function(columns, options) {
      var vals = [];
      _.each(columns, function(col) {
        vals.push(col.data);
      });

      vals = _.flatten(vals);

      // save types and type options to later coerce
      var type = columns[0].type;

      // convert the values to their appropriate numeric value
      vals = _.map(vals, function(v) { return Miso.types[type].numeric(v); });
      return _.mean(vals);   
    })

  });

}(this, _));

