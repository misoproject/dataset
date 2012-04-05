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
    sum : function(columns, options) {
      options = options || {};
      var columnObjects = this._findColumns(columns);

      var sumFunc = (function(columns){
        return function() {
          // check column types, can't sum up time.
          _.each(columns, function(col) {
            if (col.type === Miso.types.time.name) {
              throw new Error("Can't sum up time");
            }
          });
          return _.sum(_.map(columns, function(c) { return c._sum(); }));
        };
      }(columnObjects));

      return this._calculated(columnObjects, sumFunc);
    },

    /**
    * return a Product with the value of the maximum 
    * value of the column
    * Parameters:
    *   column - string or array of column names on which the value is calculated 
    */    
    max : function(columns, options) {
      options = options || {};
      var columnObjects = this._findColumns(columns);

      var maxFunc = (function(columns) {
        return function() {

          var max = _.max(_.map(columns, function(c) { 
            return c._max(); 
          }));
          
          // save types and type options to later coerce
          var type = columns[0].type;
          var typeOptions = columns[0].typeOptions;

          // return the coerced value for column type.
          return Miso.types[type].coerce(max, typeOptions);
        };
      }(columnObjects));

      return this._calculated(columnObjects, maxFunc);  
      
    },

    /**
    * return a Product with the value of the minimum 
    * value of the column
    * Paramaters:
    *   columns - string or array of column names on which the value is calculated 
    */    
    min : function(columns, options) {
      options = options || {};
      var columnObjects = this._findColumns(columns);
      
      var minFunc = (function(columns) {
        return function() {

          var min = _.min(_.map(columns, function(c) { return c._min(); }));

           // save types and type options to later coerce
          var type = columns[0].type;
          var typeOptions = columns[0].typeOptions;

          // return the coerced value for column type.
          return Miso.types[type].coerce(min, typeOptions);
        };
      }(columnObjects));

      return this._calculated(columnObjects, minFunc); 
    },

    /**
    * return a Product with the value of the average
    * value of the column
    * Parameters:
    *   column - string or array of column names on which the value is calculated 
    */    
    mean : function(columns, options) {
      options = options || {};
      var columnObjects = this._findColumns(columns);

      var meanFunc = (function(columns){
        return function() {
          var vals = [];
          _.each(columns, function(col) {
            vals.push(col.data);
          });
          
          vals = _.flatten(vals);
          
          // save types and type options to later coerce
          var type = columns[0].type;
          var typeOptions = columns[0].typeOptions;

          // convert the values to their appropriate numeric value
          vals = _.map(vals, function(v) { return Miso.types[type].numeric(v); });

          // return the coerced value for column type.
          return Miso.types[type].coerce(_.mean(vals), typeOptions);   
        };
      }(columnObjects));

      return this._calculated(columnObjects, meanFunc);
    },

    
    // return a Product derived by running the passed function
    // Parameters:
    //   column - column on which the value is calculated 
    //   producer - function which derives the product after
    //              being passed each row
    _calculated : function(columns, producer) {
      var _self = this;

      var prod = new Miso.Product({
        columns : columns,
        func : function(options) {
          options = options || {};
          
          // build a diff delta. We're using the column name
          // so that any subscribers know whether they need to 
          // update if they are sharing a column.
          var delta = this._buildDelta(this.value, producer.apply(_self));

          // because below we are triggering any change subscribers to this product
          // before actually returning the changed value
          // let's just set it here.
          this.value = delta.changed;

          if (_self.syncable) {
            var event = this._buildEvent(delta);

            // trigger any subscribers this might have if the values are diff
            if (!_.isUndefined(delta.old) && !options.silent && delta.old !== delta.changed) {
              this.trigger("change", event);
            }  
          }
        }
      });

      // auto bind to parent dataset if its syncable
      if (this.syncable) {
        this.bind("change", prod._sync, prod); 
        return prod; 
      } else {
        return producer();
      }
      
    }

  });

}(this, _));

