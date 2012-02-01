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

    _buildDelta : function(old, changed) {
      return {
        old : old,
        changed : changed
      };
    }
  });

  _.extend(DS.Dataset.prototype, {

    /**
    * return a Product with the value of the maximum 
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    max : function(column) {
      return this.calculated(function() {
        var max = -Infinity;
        _.each(this._column(column).data, function(value) {
          if (value > max) {
            max = value;
          }
        });
        return max;
      });
    },

    /**
    * Returns the value of the highest value across all columns
    */ 
    totalMax : function() {
      return this.calculated(function() {
        var max = -Infinity;
        //loop over columns, skip the first, it's _id
        for (var i=1; i < this._columns.length; i++) {
          for (var j=0; j <= this._columns[i].data.length; j++) {
            if (this._columns[i].data[j] > max) {
              max = this._columns[i].data[j];
            }
          }
        }
        return max;
      });
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
    calculated : function(producer) {
      var _self = this;

      var prod = new Product({
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

