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


  (function() {

    DS.Importers.Delimited = function(data, options) {
      options = options || {};

      if (options.parse) {
        this.parse = options.parse;
      }

      this.delimiter = (options.delimiter || (options.delimiter = ","));

      this.__delimiterPatterns = new RegExp(
        (
          // Delimiters.
          "(\\" + this.delimiter + "|\\r?\\n|\\r|^)" +

          // Quoted fields.
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

          // Standard fields.
          "([^\"\\" + this.delimiter + "\\r\\n]*))"
        ),
        "gi"
      );
      this._data = this.parse(data);
    };

    _.extend(
      DS.Importers.Delimited.prototype,
      DS.Importers.prototype, {

      _buildColumns : function(sample) {

        // How many keys do we have? First row is the keys.
        var keys  = sample.splice(0,1)[0];

        // Aggregate the types. For each key,
        // check if the value resolution reduces to a single type.
        // If it does, call that your type.
        var i = 0;
        var types = _.map(keys, function(key) {
           
          // Build a reduced array of types for this key.
          // If we have N values, we are going to hope that at the end we
          // have an array of length 1 with a single type, like ["string"]
          var vals =  _.inject(sample, function(memo, row) {
            if (memo.indexOf(DS.typeOf(row[i])) == -1) {
              memo.push(DS.typeOf(row[i]));
            }
            return memo;
          }, []);

          i++;

          if (vals.length == 1) {
            return this._buildColumn(key, vals[0]);
          } else {
            return this._buildColumn(key, DS.datatypes.UNKNOWN);
          }
        }, this);

        return types;
      },

      fetch : function(options) {
        var d = {
          _columns : [],
          _rows : []
        };
        var rows = [[]],
            matches = null,
            i = 0;
        
        while (matches = this.__delimiterPatterns.exec(this._data)) {
          
          var delimiter = matches[1];
          
          // new row
          if (delimiter.length && delimiter !== this.delimiter) {
            
            // create column headers.
            if (i == 5) {
              d._columns = this._buildColumns(rows.slice(0, rows.length-2));
            }

            // add all the rows to the _rows collection.
            if (i > 0) {
              //push previous row into the rows array
              d._rows.push({ data : rows[i], _id : _.uniqueId()});
            }

            // add a new row for the next one
            rows.push([]);

            i++;
          }

          if (matches[2]) {
            var value = matches[2].replace(new RegExp("\"\"", "g"), "\"");
          } else {
            var value = matches[3];
          }

          rows[rows.length - 1].push(value);
        }

        // if there was a blank row at the end of the file, remove it.
        if(_.isEqual(rows[rows.length -1], [""])) {
          rows.pop();
        }

        // In case we had less than 5 rows, we may need to generate the cols now.
        if (d._columns.length === 0) {
          d._columns = this._buildColumns(rows.slice(0, rows.length-2));
        }

        // add last row.
        d._rows.push({ data : rows[i], _id : _.uniqueId()});
        
        rows = null;
        this._cache(d);
        options.success(d);
      }
    });
  }());


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

  // this XHR code is from @rwldron.
  var _xhrSetup = {
    url       : "",
    data      : "",
    dataType  : "",
    success   : function() {},
    type      : "GET",
    async     : true,
    xhr : function() {
      return new global.XMLHttpRequest();
    }
  }, rparams = /\?/;

  DS.Xhr = function(options) {

    // json|jsonp etc.
    options.dataType = options.dataType && options.dataType.toLowerCase() || null;

    if (options.dataType && 
       (options.dataType === "jsonp" || options.dataType === "script" )) {

      DS.Xhr.getJSONP(
        options.url,
        options.success,
        options.dataType === "script"
      );

      return;
    }

    var settings = _.extend({}, _xhrSetup, options);
    
    // create new xhr object
    settings.ajax = settings.xhr();

    if (settings.ajax) {
      if (settings.type === "GET" && settings.data) {

        //  append query string
        settings.url += (rparams.test(settings.url) ? "&" : "?") + settings.data;

        //  Garbage collect and reset settings.data
        settings.data = null;
      }

      settings.ajax.open(settings.type, settings.url, settings.async);
      settings.ajax.send(settings.data || null);

      return DS.Xhr.httpData(settings);
    }
  };

  DS.Xhr.getJSONP = function(url, success, isScript) {
    // If this is a script request, ensure that we do not 
    // call something that has already been loaded
    if (isScript) {

      var scripts = document.querySelectorAll("script[src=\"" + url + "\"]");

      //  If there are scripts with this url loaded, early return
      if (scripts.length) {

        //  Execute success callback and pass "exists" flag
        if (success) { 
          success(true);
        }

        return;
      }
    } 

    var head    = document.head || 
        document.getElementsByTagName("head")[0] || 
        document.documentElement,

      script    = document.createElement("script"),
      paramStr  = url.split("?")[ 1 ],
      isFired   = false,
      params    = [],
      callback, parts, callparam;

    // Extract params
    if (paramStr && !isScript) {
      params = paramStr.split("&");
    }
    if (params.length) {
      parts = params[params.length - 1].split("=");
    }
    callback = params.length ? (parts[ 1 ] ? parts[ 1 ] : parts[ 0 ]) : "jsonp";

    if (!paramStr && !isScript) {
      url += "?callback=" + callback;
    }

    if (callback && !isScript) {
      
      // If a callback name already exists
      if (!!window[callback]) {
        callback = callback + (+new Date()) + _.uniqueId();
      }

      //  Define the JSONP success callback globally
      window[callback] = function(data) {
        if (success) { 
          success(data);
        }
        isFired = true;
      };

      //  Replace callback param and callback name
      url = url.replace(parts.join("="), parts[0] + "=" + callback);
    }

    script.onload = script.onreadystatechange = function() {
      if (!script.readyState || /loaded|complete/.test(script.readyState)) {
        
        //  Handling remote script loading callbacks
        if (isScript) {

          //  getScript
          if (success) { 
            success();
          }
        }

        //  Executing for JSONP requests
        if (isFired) {

          //  Garbage collect the callback
          delete window[callback];

          //  Garbage collect the script resource
          head.removeChild(script);
        }
      }
    };

    script.src = url;
    head.insertBefore(script, head.firstChild);
    return;
  };

  DS.Xhr.httpData = function(settings) {
    var data, json = null;
    
    settings.ajax.onreadystatechange = function() {
      if (settings.ajax.readyState === 4) {
        try {
          json = JSON.parse(settings.ajax.responseText);
        } catch (e) {
          // suppress
        }

        data = {
          xml : settings.ajax.responseXML,
          text : settings.ajax.responseText,
          json : json
        };

        if (settings.dataType) {
          data = data[settings.dataType];
        }

        settings.success.call(settings.ajax, data);
      }
    };

    return data;
  };

  /**
   * Fetches a remote url of json data and then parses it.
   * @param {string} url The url to fetch
   * @param {object} options An object containing options specfic to this
   * importer, such as { jsonp : true|false }
   */
  DS.Importers.Remote = function(url, options) {
    options = options || {};
    this._url = url;
    this.importer = options.importer || DS.Importers.Obj;

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

        // call the original fetch method of object parsing.
        // we are assuming the parsed version of the data will
        // be an array of objects.
        var callback = _.bind(function(data) {
          this._data = this.parse(data);
          this.importer.prototype.fetch.apply(this, [options]);
        }, this);

        // make ajax call to fetch remote url.
        DS.Xhr(_.extend(this.params, { success : callback }));
    }
  });

}(this, _));