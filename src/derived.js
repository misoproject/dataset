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

      var d = {
        _columns : []
      };

      if (options && options.preprocess) {
        this.preprocess = options.preprocess;  
      }

      var parser = new Miso.Parsers();

      // copy columns we want - just types and names. No data.
      var newCols = _.union([byColumn], columns);
      _.each(newCols, function(columnName) {
        var newColumn = d._columns.push(_.clone(
          this._columns[this._columnPositionByName[columnName]])
        );

        d._columns[d._columns.length-1].data = [];
      }, this);

      // save column positions on new dataset.
      d = parser._cacheColumns(d);

      // a cache of values
      var categoryPositions = {},
          categoryCount     = 0,
          byColumnPosition  = d._columnPositionByName[byColumn];

      // bin all values by their categories
      for(var i = 0; i < this.length; i++) {
        var category = null;
        if (this.preprocess) {
          category = this.preprocess(this._columns[this._columnPositionByName[byColumn]].data[i]);
        } else {
          category = this._columns[this._columnPositionByName[byColumn]].data[i];  
        }
         
        if (_.isUndefined(categoryPositions[category])) {
            
          // this is a new value, we haven't seen yet so cache
          // its position for lookup of row vals
          categoryPositions[category] = categoryCount;

          // add an empty array to all columns at that position to
          // bin the values
          _.each(columns, function(columnToGroup) {
            var column = d._columns[d._columnPositionByName[columnToGroup]];
            column.data[categoryCount] = [];
          });

          // add the actual bin number to the right col
          d._columns[d._columnPositionByName[byColumn]].data[categoryCount] = category;

          categoryCount++;
        }

        _.each(columns, function(columnToGroup) {
          
          var column = d._columns[d._columnPositionByName[columnToGroup]],
              value  = this._columns[this._columnPositionByName[columnToGroup]].data[i],
              binPosition = categoryPositions[category];

          column.data[binPosition].push(value);
        }, this);
      }

      // now iterate over all the bins and combine their
      // values using the supplied method. 
      _.each(columns, function(colName) {
        var column = d._columns[d._columnPositionByName[colName]];
        _.each(column.data, function(bin, binPos) {
          if (_.isArray(bin)) {
            column.data[binPos] = method.call(this, bin);
          }
        });
      }, this);
    
      // create new dataset based on this data
      d.columns = d._columns;
      delete d._columns;
      var ds = new Miso.Dataset({
        data   : d,
        strict : true
      });

      // TODO: subscribe this to parent dataset!
      var fetcheddata = null;
      ds.fetch({
        success : function() {
          fetcheddata = this;
        }
      });
      return fetcheddata;
    }
  });

}(this, _));

