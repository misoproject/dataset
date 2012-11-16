(function(global, _) {

  var Miso = global.Miso || (global.Miso = {});
  var Dataset = Miso.Dataset;

  /**
  * A Miso.Derived dataset is a regular dataset that has been derived
  * through some computation from a parent dataset. It behaves just like 
  * a regular dataset except it also maintains a reference to its parent
  * and the method that computed it.
  * Parameters:
  *   options
  *     parent - the parent dataset
  *     method - the method by which this derived dataset was computed
  * Returns
  *   a derived dataset instance
  */

  Dataset.Derived = function(options) {
    options = options || {};

    Dataset.call(this);
    
    // save parent dataset reference
    this.parent = options.parent;

    // the id column in a derived dataset is always _id
    // since there might not be a 1-1 mapping to each row
    // but could be a 1-* mapping at which point a new id 
    // is needed.
    this.idAttribute = "_id";
    
    // save the method we apply to bins.
    this.method = options.method;

    this._addIdColumn();

    this.addColumn({
      name : "_oids",
      type : "mixed"
    });

    if (this.parent.syncable) {
      _.extend(this, Miso.Events);
      this.syncable = true;
      this.parent.subscribe("change", this._sync, { context : this });  
    }
  };

  // take in dataset's prototype.
  Dataset.Derived.prototype = new Dataset();

  // inherit all of dataset's methods.
  _.extend(Dataset.Derived.prototype, {
    _sync : function() {
      // recompute the function on an event.
      // TODO: would be nice to be more clever about this at some point.
      this.func.call(this.args);
      this.publish("change");
    }
  });


  // add derived methods to dataview (and thus dataset & derived)
  _.extend(Dataset.DataView.prototype, {

    /**
    * moving average
    * Parameters:
    *   column - The column on which to calculate the average
    *   size - The window size to utilize for the moving average
    *   options
    *     method - the method to apply to all values in a window. Mean by default.
    * Returns:
    *   a miso.derived dataset instance
    */
    movingAverage : function(columns, size, options) {
      
      options = options || {};

      var d = new Dataset.Derived({
        parent : this,
        method : options.method || _.mean,
        size : size,
        args : arguments
      });

      // copy over all columns
      this.eachColumn(function(columnName) {
        
        // don't try to compute a moving average on the id column.
        if (columnName === this.idAttribute) {
          throw "You can't compute a moving average on the id column";
        }

        d.addColumn({
          name : columnName, type : this.column(columnName).type, data : []
        });
      }, this);

      // save column positions on new dataset.
      Dataset.Builder.cacheColumns(d);

      // apply with the arguments columns, size, method
      var computeMovingAverage = function() {

        // normalize columns arg - if single string, to array it.
        if (typeof columns === "string") {
          columns = [columns];
        }

        // copy the ids
        this.column(this.idAttribute).data = this.parent
          .column(this.parent.idAttribute)
          .data.slice(size-1, this.parent.length);

        // copy the columns we are NOT combining minus the sliced size.
        this.eachColumn(function(columnName, column) {
          if (columns.indexOf(columnName) === -1 && columnName !== "_oids") {
            // copy data
            column.data = this.parent.column(columnName).data.slice(size-1, this.parent.length);
          } else {
            // compute moving average for each column and set that as the data 
            column.data = _.movingAvg(this.parent.column(columnName).data, size, this.method);
          }
        }, this);

        this.length = this.parent.length - size + 1;
        
        // generate oids for the oid col
        var oidcol = this.column("_oids");
        oidcol.data = [];
        for(var i = 0; i < this.length; i++) {
          oidcol.data.push(this.parent.column(this.parent.idAttribute).data.slice(i, i+size));
        }
        
        Dataset.Builder.cacheRows(this);
        
        return this;
      };

      d.func = _.bind(computeMovingAverage, d);
      return d.func.call(d.args);
    },

    /**
    * Group rows by the column passed and return a column with the
    * counts of the instance of each value in the column passed.
    */
    countBy : function(byColumn, options) {

      options = options || {};
      var d = new Dataset.Derived({
        parent : this,
        method : _.sum,
        args : arguments
      });

      var parentByColumn = this.column(byColumn);
      //add columns
      d.addColumn({
        name : byColumn,
        type : parentByColumn.type
      });

      d.addColumn({ name : 'count', type : 'number' });
      d.addColumn({ name : '_oids', type : 'mixed' });
      Dataset.Builder.cacheColumns(d);

      var names = d.column(byColumn).data, 
          values = d.column('count').data, 
          _oids = d.column('_oids').data,
          _ids = d.column(d.idAttribute).data;

      function findIndex(names, datum, type) {
        var i;
        for(i = 0; i < names.length; i++) {
          if (Dataset.types[type].compare(names[i], datum) === 0) {
            return i;
          }
        }
        return -1;
      }

      this.each(function(row) {
        var index = findIndex(names, row[byColumn], parentByColumn.type);
        if ( index === -1 ) {
          names.push( row[byColumn] );
          _ids.push( _.uniqueId() );
          values.push( 1 );
          _oids.push( [row[this.parent.idAttribute]] );
        } else {
          values[index] += 1;
          _oids[index].push( row[this.parent.idAttribute]); 
        }
      }, d);

      Dataset.Builder.cacheRows(d);
      return d;
    },

    /**
    * group rows by values in a given column
    * Parameters:
    *   byColumn - The column by which rows will be grouped (string)
    *   columns - The columns to be included (string array of column names)
    *   options 
    *     method - function to be applied, default is sum
    *     preprocess - specify a normalization function for the
    *                  byColumn values if you need to group by some kind of 
    *                  derivation of those values that are not just equality based.
    * Returns:
    *   a miso.derived dataset instance
    */
    groupBy : function(byColumn, columns, options) {
      
      options = options || {};

      var d = new Dataset.Derived({

        // save a reference to parent dataset
        parent : this,
        
        // default method is addition
        method : options.method || _.sum,

        // save current arguments
        args : arguments
      });

      if (options && options.preprocess) {
        d.preprocess = options.preprocess;  
      }

      // copy columns we want - just types and names. No data.
      var newCols = _.union([byColumn], columns);
      
      _.each(newCols, function(columnName) {

        this.addColumn({
          name : columnName,
          type : this.parent.column(columnName).type
        });
      }, d);

      // save column positions on new dataset.
      Dataset.Builder.cacheColumns(d);

      // will get called with all the arguments passed to this
      // host function
      var computeGroupBy = function() {

        var self = this;

        // clear row cache if it exists
        Dataset.Builder.clearRowCache(this);

        // a cache of values
        var categoryPositions = {},
            categoryCount     = 0,
            originalByColumn = this.parent.column(byColumn);

        // bin all values by their
        for(var i = 0; i < this.parent.length; i++) {
          var category = null;
          
          // compute category. If a pre-processing function was specified
          // (for binning time for example,) run that first.
          if (this.preprocess) {
            category = this.preprocess(originalByColumn.data[i]);
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
              var column = this.column(columnToGroup);
              var idCol  = this.column(this.idAttribute);
              column.data[categoryCount] = [];
              idCol.data[categoryCount] = _.uniqueId();
            }, this);

            // add the actual bin number to the right col
            this.column(byColumn).data[categoryCount] = category;

            categoryCount++;
          }

          _.each(columns, function(columnToGroup) {
            
            var column = this.column(columnToGroup),
                binPosition = categoryPositions[category];

            column.data[binPosition].push(this.parent.rowByPosition(i));
          }, this);
        }

        // now iterate over all the bins and combine their
        // values using the supplied method. 
        var oidcol = this._columns[this._columnPositionByName._oids];
        oidcol.data = [];

        _.each(columns, function(colName) {
          var column = this.column(colName);

          _.each(column.data, function(bin, binPos) {
            if (_.isArray(bin)) {
              
              // save the original ids that created this group by?
              oidcol.data[binPos] = oidcol.data[binPos] || [];
              oidcol.data[binPos].push(_.map(bin, function(row) { return row[self.parent.idAttribute]; }));
              oidcol.data[binPos] = _.flatten(oidcol.data[binPos]);

              // compute the final value.
              column.data[binPos] = this.method(_.map(bin, function(row) { return row[colName]; }));
              this.length++;
            }
          }, this);

        }, this);

        Dataset.Builder.cacheRows(this);
        return this;
      };
      
      // bind the recomputation function to the dataset as the context.
      d.func = _.bind(computeGroupBy, d);

      return d.func.call(d.args);
    }
  });

}(this, _));

