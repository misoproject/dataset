(function(global, _) {

  // shorthand
  var DS = global.DS;
  var Product = (DS.Product || function() {

    DS.Product = function(options) {
      options = options || (options = {});
      this.data = options.data;

      this._buildUpdate(options.func);

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
      this.calculated(column, function() {
        var max = -Infinity;
        this.data.each(function(row) {
          if (row[column] > max) {
            max = row[column];
          }
        });
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
    calculated : function(column, producer) {
      return new Product({data: this.column(column), func: producer });
    }

  });

}(this, _));

