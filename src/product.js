(function(global, _) {

  // shorthand
  var DS = global.DS;
  var Product = (DS.Product || function() {

    DS.Product = function(options) {
      options = options || (options = {});
      
      // save column name. This will be necessary later
      // when we decide whether we need to update the column
      // when sync is called.
      this._column = options.column.name;

      this.func = options.func;

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
      if (_.indexOf(event.affectedColumns(), this._column) > -1) {
        this.value = this.func();
      }
    },

    /**
    * @public
    * return the raw value of the product
    * @returns {?} value - The value of the product. Most likely a number.
    */
    val : function() {
      return this.value;
    },

    _buildDelta : function(old, changed) {
      var delta = {
        old : { },
        changed : { }
      };

      delta.old[this._column] = old;
      delta.changed[this._column] = changed;

      return delta;
    }
  });

  _.extend(DS.Dataset.prototype, {

    /**
    * return a Product with the value of the maximum 
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    max : function(column) {
      
      var prod = this.calculated(column, function(column) {
        var max = -Infinity;
        _.each(column.data, function(value) {
          if (value > max) {
            max = value;
          }
        });
        return max;
      });

      return prod;
    },

    /**
    * return a Product with the value of the minimum 
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    min : function(column) {},

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
    calculated : function(column, producer) {

      column = this._column(column);
      
      var prod = new Product({
        column : column,
        func   : function(options) {

          options = options || {};
          
          // build a diff delta. We're using the column name
          // so that any subscribers know whether they need to 
          // update if they are sharing a column.
          var delta = this._buildDelta(this.value, producer(column));
          var event = this._buildEvent("change", delta);

          // trigger any subscribers this might have if the values are diff
          if (!options.silent && 
              delta.old[this._column] !== delta.changed[this._column]) {
            this.trigger("change", event);  
          }

          // return updated value
          return delta.changed[this._column];
        }
      });

      // auto bind to parent dataset
      this.bind("change", prod.sync, prod);
      return prod;
    }

  });

}(this, _));

