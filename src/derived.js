(function(global, _) {

  var Miso = (global.Miso = global.Miso || {});

  _.extend(global.Miso.Dataset.prototype, {
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
    * @params {object} options 
    *   method function to be applied, default addition
    *   preprocess - specify a normalization function for the
    * byColumn values if you need to group by some kind of derivation of 
    * those values that are not just equality based.
    */
    groupBy : function(byColumn, columns, options) {
      
      options = options || {};

      // TODO: should we check type match here?
      // default method is addition
      var method = options.method || _.sum;

      var d = new Miso.Dataset();

      if (options && options.preprocess) {
        d.preprocess = options.preprocess;  
      }

      // copy columns we want - just types and names. No data.
      var newCols = _.union([byColumn], columns);
      
      _.each(newCols, function(columnName) {

        d.addColumn({
          name : columnName,
          type : this.column(columnName).type,
          data : []
        });
      }, this);

      // save column positions on new dataset.
      Miso.Builder.cacheColumns(d);

      // a cache of values
      var categoryPositions = {},
          categoryCount     = 0,
          byColumnPosition  = d._columnPositionByName[byColumn],
          originalByColumn = this.column(byColumn);

      // bin all values by their
      for(var i = 0; i < this.length; i++) {
        var category = null;
        
        // compute category. If a pre-processing function was specified
        // (for binning time for example,) run that first.
        if (d.preprocess) {
          category = d.preprocess(originalByColumn.data[i]);
        } else {
          category = originalByColumn.data[i];  
        }
         
        if (_.isUndefined(categoryPositions[category])) {
            
          // this is a new value, we haven't seen yet so cache
          // its position for lookup of row vals
          categoryPositions[category] = categoryCount;

          // add an empty array to all columns at that position to
          // bin the values
          _.each(columns, function(columnToGroup) {
            var column = d.column(columnToGroup);
            var idCol  = d.column("_id");
            column.data[categoryCount] = [];
            idCol.data[categoryCount] = _.uniqueId();
          });

          // add the actual bin number to the right col
          d.column(byColumn).data[categoryCount] = category;

          categoryCount++;
        }

        _.each(columns, function(columnToGroup) {
          
          var column = d.column(columnToGroup),
              value  = this.column(columnToGroup).data[i],
              binPosition = categoryPositions[category];

          column.data[binPosition].push(value);
        }, this);
      }

      // now iterate over all the bins and combine their
      // values using the supplied method. 
      _.each(columns, function(colName) {
        var column = d.column(colName);
        _.each(column.data, function(bin, binPos) {
          if (_.isArray(bin)) {
            column.data[binPos] = method.call(this, bin);
            d.length++;
          }
        });
      }, this);

      Miso.Builder.cacheRows(d);
      return d;
    }
  });

}(this, _));

