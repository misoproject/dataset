(function(global, _) {

  // shorthand
  var DS = global.DS;
  var Product = (DS.Product || function() {

    DS.Product = function(options) {
      options = options || (options = {});
      
      this.func = options.func;
      //this._buildUpdate(options.func);

      this.value = this.func();
      return this;
    };

    return DS.Product;
  }());

  _.extend(Product.prototype, DS.Events, DS.Syncable, {

    /**
    * Internal function to create the function to be run when the
    * parent dataset changes
    * @param {func} raw function to be fun
    */
    _buildUpdate: function(func) {
      func = _.bind(func, this);
      this.func = function() {
        func();
        this.trigger('change');
      };
      this.data.bind('change', this.func);
    },

    /**
    * return the raw value of the product
    */
    val : function() {
      return this.value;
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
      
      var column = this._column(column);
      return new Product({
        func : function() {
          return producer(column);
        }
      });
    }

  });

}(this, _));

