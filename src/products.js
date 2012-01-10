(function(global, _) {


  var Product = (global.DS.Product || function() {

  });

  _.extend(Product.prototype, {


    /**
    * return the raw value of the product
    */
    val : function() {},

    /**
    * bind an event 'change' on the product
    * @param {callback} callback function
    */
    change :  function(callback) {

    }

  });

  _.extend(global.DS.prototype, {

    /**
    * return a Product with the value of the maximum 
    * value of the column
    * @param {column} column on which the value is calculated 
    */    
    max : function(column) {},

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
    * return a Product derived by running the passed funciton
    * over all rows
    * @param {column} column on which the value is calculated 
    * @param {producer} function which derives the product after
    * being passed each row. TODO: producer signature
    */    
    calculated : function(column, producer) {}

  });

}(this, _));

