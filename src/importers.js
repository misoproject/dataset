(function(global, _) {
  
  var DS = (global.DS || (global.DS = {}));

    /**
   * Base importer class.
   */
  DS.Importers = function() {};

  /**
   * Creates an internal representation of a column based on
   * the form expected by our strict json.
   * @param {string} name The column name
   * @param {string} type The type of the data in the column
   */
  DS.Importers.prototype._buildColumn = function(name, type) {
    return {
      _id : _.uniqueId(),
      name : name,
      type : type
    };
  };

  /**
   * Used by internal importers to cache the rows and columns
   * in quick lookup tables for any id based operations.
   */
  DS.Importers.prototype._cache = function(d) {
    d._byRowId      = {};
    d._byColumnId   = {};
    d._byColumnName = {};

    // cache rows by their _ids.
    _.each(d._rows, function(row) {
      d._byRowId[row._id] = row;
    });

    // cache columns by their column _ids, also cache their position by name.
    _.each(d._columns, function(column, index) {
      column.position = index;
      d._byColumnId[column._id] = column;
      d._byColumnName[column.name] = column;
    });
  };

  /**
  * By default we are assuming that our data is in
  * the correct form from the fetching.
  */
  DS.Importers.prototype.parse = function(data) {
    return data;
  };

  /**
  * Handles basic import.
  * TODO: add verify flag to disable auto id assignment for example.
  */
  DS.Importers.Strict = function(data, options) {
    options = options || {};

    if (options.parse) {
      this.parse = options.parse;
    }

    this._data = this.parse(data);
  };

  _.extend(
    DS.Importers.Strict.prototype,
    DS.Importers.prototype, {
    _buildColumns : function(n) {
      var columns = this._data.columns;

      // verify columns have ids
      _.each(columns, function(column) {
        if (typeof column._id === "undefined") {
          column._id = _.uniqueId();
        }
      });

      return columns;
    },

    fetch : function(options) {
      var d = {};

      // Build columns
      d._columns = this._buildColumns();

      // Build rows
      d._rows = this._data.rows;

      // verify rows have ids
      _.each(d._rows, function(row) {
        if (typeof row._id === "undefined") {
          row._id = _.uniqueId();
        }
      });

      this._cache(d);
      options.success(d);
    }
  });


  /**
   * Converts an array of objects to strict format.
   * @params {Object} obj = [{},{}...]
   */
  DS.Importers.Obj = function(data, options) {
    options = options || {};

    if (options.parse) {
      this.parse = options.parse;
    }

    this._data = this.parse(data);
  };

  _.extend(
    DS.Importers.Obj.prototype,
    DS.Importers.prototype, {

    _buildColumns : function(n) {

      // Pick a sample of n (default is 5) rows
      n = n || 5;

      var sample = this._data.slice(0, n);

      // How many keys do we have?
      var keys  = _.keys(this._data[0]);

      // Aggregate the types. For each key,
      // check if the value resolution reduces to a single type.
      // If it does, call that your type.
      var types = _.map(keys, function(key) {

        // Build a reduced array of types for this key.
        // If we have N values, we are going to hope that at the end we
        // have an array of length 1 with a single type, like ["string"]
        var vals =  _.inject(this._data, function(memo, row) {
          if (memo.indexOf(DS.typeOf(row[key])) == -1) {
            memo.push(DS.typeOf(row[key]));
          }
          return memo;
        }, []);

        if (vals.length == 1) {
          return this._buildColumn(key, vals[0]);
        } else {
          return this._buildColumn(key, DS.datatypes.UNKNOWN);
        }
      }, this);

      return types;
    },

    fetch : function(options) {

      var d = {};

      // Build columns
      d._columns = this._buildColumns();

      // Build rows
      d._rows = _.map(this._data, function(row) {

        var r = {};

        // Assemble a row by iterating over each column and grabbing
        // the values in the order we expect.
        r.data = _.map(d._columns, function(column) {
          return row[column.name];
        });

        // TODO: add id plucking out of data, if exists.
        r._id = _.uniqueId();
        return r;
      });

      this._cache(d);
      options.success(d);
    }
  });


  /**
   * Fetches a remote url of json data and then parses it.
   * @param {string} url The url to fetch
   * @param {object} options An object containing options specfic to this
   * importer, such as { jsonp : true|false }
   */
  DS.Importers.Remote = function(url, options) {
    options = options || {};
    this._url = url;

    if (options.parse) {
      this.parse = options.parse;
    }

    // Default ajax request parameters
    this.params = {
      type : "GET",
      url : this._url,
      dataType : options.jsonp ? "jsonp" : "json"
    };

  };

  _.extend(DS.Importers.Remote.prototype,
    DS.Importers.prototype,
    DS.Importers.Obj.prototype,
    {
      fetch : function(options) {

        // call the original parse method of object parsing.
        var callback = _.bind(function(data) {
          this._data = this.parse(data);
          DS.Importers.Obj.prototype.fetch.apply(this, [options]);
        }, this);

        // make ajax call to fetch remote url.
        $.ajax(this.params).success(callback);
    }
  });

}(this, _));