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
        this.raw = function() {
          return column.rawValue(this.value);
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
      if (_.isUndefined(columns)) {
        columns = this.columnNames();
      }

      columns = _.isArray(columns) ? columns : [columns];
      var columnObjects = [];

      // verify this is an appropriate type for this function
      _.each(columns, function(column) {
        
        column = this._columns[this._columnPositionByName[column]];

        // check that this is a numeric column type. We can't
        // sum up non numeric types, that makes no sense.
        if (column.type !== DS.types.number.name) {
          throw new Error("You can't add up a non numeric column type.");
        }  
        columnObjects.push(column);

      }, this);
      
      
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
    
    /**
    * return a Product with the value of the maximum 
    * value of the column
    * @param {column/columns} column or array of columns on which the value is calculated 
    */    
    max : function(columns) {
      if (_.isUndefined(columns)) {
        columns = this.columnNames();
      }

      columns = _.isArray(columns) ? columns : [columns];
      var columnObjects = [];

      // verify this is an appropriate type for this function
      _.each(columns, function(column) {
        
        column = this._columns[this._columnPositionByName[column]];

        // check that this is a numeric/date column type. We can't
        // sum up non numeric types, that makes no sense.
        if (column.type !== DS.types.number.name &&
            column.type !== DS.types.time.name) {
          throw new Error("You can't find the maxumum of a non numeric or date column.");
        }  

        columnObjects.push(column);
      }, this);

      return this.calculated(columnObjects, function(columns) {
        return function() {
          var max = -Infinity, columnObject;
          for (var i= 0; i < columns.length; i++) {
            columnObject = columns[i];

            for (var j= 0; j < columnObject.data.length; j++) {
              if (DS.types[columnObject.type].compare(columnObject.data[j], max) > 0) {
                max = columnObject.raw(j);
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
      if (_.isUndefined(columns)) {
        columns = this.columnNames();
      }
      columns = _.isArray(columns) ? columns : [columns];
      var columnObjects = [];

      // verify this is an appropriate type for this function
      _.each(columns, function(column) {
        
        column = this._columns[this._columnPositionByName[column]];

        // check that this is a numeric/date column type. We can't
        // sum up non numeric types, that makes no sense.
        if (column.type !== DS.types.number.name &&
            column.type !== DS.types.time.name) {
          throw new Error("You can't find the maxumum of a non numeric or date column.");
        }

        columnObjects.push(column);
      }, this);

      return this.calculated(columnObjects, function(columns) {
        return function() {
          var min = Infinity, columnObject;
          for (var i= 0; i < columns.length; i++) {
            columnObject = columns[i];
            for (var j= 0; j < columnObject.data.length; j++) {
              if (DS.types[columnObject.type].compare(columnObject.data[j], min) < 0) {
                min = columnObject.raw(j);
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

