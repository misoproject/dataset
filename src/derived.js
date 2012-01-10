(function(global, _) {

  _.extend(global.DS.prototype, {
    /**
    * moving average
    * @param {column} column on which to calculate the average
    * @param {width} direct each side to take into the average
    */
    movingAverage : function(column, width) {

    },

    /**
    * group rows by values in a given column
    * @param {byColumn} column by which rows will be grouped
    * @param {columns} columns to be included
    * @param {method} function to be applied, default addition
    */
    groupBy : function(byColumn, columns, method) {}

  });

}(this, _));

