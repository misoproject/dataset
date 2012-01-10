(function(global, _) {
  
  var DS = (global.DS || (global.DS = {}));

  // ------ data parsers ---------

  DS.Parsers = function() {};

  /**
   * Creates an internal representation of a column based on
   * the form expected by our strict json.
   * @param {string} name The column name
   * @param {string} type The type of the data in the column
   */
  DS.Parsers.prototype._buildColumn = function(name, type, data) {
    return {
      _id : _.uniqueId(),
      name : name,
      type : type,
      data : (data || [])
    };
  };

  DS.Parsers.prototype._addValue = function(d, columnName, value) {
    var colPos = d._columnPositionByName[columnName];
    d.columns[colPos].data.push(value);
  }

  DS.Parsers.prototype._cacheColumns = function(d) {
    d._columnPositionByName = {};
    
    // cache columns by their column names
    // TODO: should we cache by _id?
    _.each(d.columns, function(column, index) {
      d._columnPositionByName[column.name] = index;
    });
  };

  DS.Parsers.prototype._detectTypes = function(d, n) {
    _.each(d.columns, function(column) {
      var type = _.inject(column.data.slice(0, (n || 5)), function(memo, value) {
        if (memo.indexOf(DS.typeOf(value)) == -1) {
          memo.push(DS.typeOf(value));
        }
        return memo;
      }, []);

      // if we only have one type in our sample, save it as the type
      if (type.length === 1) {
        column.type = type[0];
      } else {
        throw new Error("This column seems to have mixed types");
      }
    });
    
    return d;
  };

  /**
   * Used by internal importers to cache the rows and columns
   * in quick lookup tables for any id based operations.
   */
  DS.Parsers.prototype._cacheRows = function(d) {
    
    d._rowPositionById = {};
    d._rowIdByPosition = [];
  
    // cache the row id positions in both directions.
    // iterate over the _id column and grab the row ids
    _.each(d.columns[d._columnPositionByName[_.id]], function(id, index) {
      d._rowPositionById[id] = index;
      d_.rowIdByPosition.push(id);
    });  

    // cache the total number of rows. There should be same 
    // number in each column's data type
    var rowLengths = _.uniq(
      _.map(
        d.columns, 
        function(column) { 
          return column.data.length;
        }
      )
    );

    if (rowLengths.length > 1) {
      throw new Error("Row lengths need to be the same. Empty values should be set to null.");
    } else {
      d.length = rowLengths[0];
    }

  };

  DS.Parsers.prototype._addIdColumn = function(d, count) {
      // if we have any data, generate actual ids.
      var ids = [];
      if (count > 0) {
        _.times(count, function() {
          ids.push(_.uniqueId());
        });
      }
      d.columns.unshift(
        this._buildColumn("_id", "number", ids)
      );
    },

  
  /**
   * By default we are assuming that our data is in
   * the correct form from the fetching.
   */
  DS.Parsers.prototype.parse = function(data) {
    return data;
  };

  // ------ Strict Parser ---------
  /**
   * Handles basic strict data format.
   * TODO: add verify flag to disable auto id assignment for example.
   */
  DS.Parsers.Strict = function(data, options) {
    options = options || {};
    this._data = this.parse(data);
  };

  _.extend(
    DS.Parsers.Strict.prototype,
    DS.Parsers.prototype, {

    _buildColumns : function(n) {
      var columns = this._data.columns;

      // add unique ids to columns
      // TODO do we still need this??
      _.each(columns, function(column) {
        if (typeof column._id === "undefined") {
          column._id = _.uniqueId();
        }
      });

      // add row _id column. Generate auto ids if there
      // isn't already a unique id column.
      if (_.pluck(columns, "name").indexOf("_id") === -1) {
        this._addIdColumn(this._data, columns[0].data.length);
      }

      return columns;
    },

    build : function(options) {
      var d = {};

      // Build columns
      d.columns = this._buildColumns();

      this._cacheColumns(d);
      this._cacheRows(d);
      return d;
    }
  });

  // -------- Object Parser -----------
  /**
   * Converts an array of objects to strict format.
   * Each object is a flat json object of properties.
   * @params {Object} obj = [{},{}...]
   */
  DS.Parsers.Obj = function(data, options) {
    options = options || {};
    this._data = data;
  };

  _.extend(
    DS.Parsers.Obj.prototype,
    DS.Parsers.prototype, {

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

      // add id column if we need to
      if (_.pluck(types, "name").indexOf("_id") === -1) {
        types.unshift(this._buildColumn("_id", "number"));
      }

      return types;
    },

    build : function(options) {

      var d = {};

      // Build columns
      d.columns = this._buildColumns();
      this._cacheColumns(d);

      // Build rows
      _.map(this._data, function(row) {
        
        // iterate over properties in each row and add them
        // to the appropriate column data.
        _.each(row, function(value, key) {
          this._addValue(d, key, value);
        }, this);

        // add a row id
        this._addValue(d, "_id", _.uniqueId());
      }, this);

      this._cacheRows(d);
      return d;
    }
  });


  // -------- Delimited Parser ----------

  /**
   * Handles CSV and other delimited data. Takes in a data string
   * and options that can contain: {
   *   delimiter : "someString" <default is comma> 
   * }
   */
  DS.Parsers.Delimited = function(data, options) {
    options = options || {};

    this.delimiter = options.delimiter || ",";
    this._data = data;

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
  };

  _.extend(
    DS.Parsers.Delimited.prototype,
    DS.Parsers.prototype, {

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

    build : function(options) {

      // convert the csv string into the beginnings of a strict
      // format. The only thing missing is type detection.
      // That happens after all data is parsed.
      var parseCSV = function(delimiterPattern, strData, strDelimiter) {
          
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create an array to hold our data. Give the array
        // a default empty first row.
        var d = {
          columns : []
        };

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // track how many columns we have. Once we reach a new line
        // mark a flag that we're done calculating that.
        var columnCount = 0;
        var columnCountComputed = false;

        // track which column we're on. Start with -1 because we increment it before
        // we actually save the value.
        var columnIndex = -1;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = delimiterPattern.exec(strData)){

          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ];

          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if ( strMatchedDelimiter.length &&
             ( strMatchedDelimiter !== strDelimiter )){
            // we have reached a new row.

            // We are clearly done computing columns.
            columnCountComputed = true;

            // when we're done with a row, reset the row index to 0
            columnIndex = 0;
          } else {
            
            // Find the number of columns we're fetching and
            // create placeholders for them.
            if (!columnCountComputed) {
              columnCount++;
            }

            columnIndex++;
          }


          // Now that we have our delimiter out of the way,
          // let's check to see which kind of value we
          // captured (quoted or unquoted).
          if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[ 2 ].replace(
              new RegExp( "\"\"", "g" ),
              "\""
            );

          } else {

            // We found a non-quoted value.
            var strMatchedValue = arrMatches[ 3 ];
          }

          // Now that we have our value string, let's add
          // it to the data array.
          if (columnCountComputed) {
            
            d.columns[columnIndex].data.push(strMatchedValue); 

          } else {

            // we are building the column names here
            d.columns.push({
              name : strMatchedValue,
              data : [],
              _id  : _.uniqueId()
            });
          }
        }

        // Return the parsed data.
        return d;
      }

      var d = parseCSV(
        this.__delimiterPatterns, 
        this._data, 
        this.delimiter);
      
      this._detectTypes(d);
      this._addIdColumn(d, d.columns[0].data.length);
      this._cacheColumns(d);
      this._cacheRows(d);
      
      return d;
    }
  });


  // ---------- Data Importers -------------

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

  DS.Importers = function(data, options) {};

  /**
   * Simple base parse method, passing data through
   */
  DS.Importers.prototype.extract = function(data) {
    return data;
  };

  /**
   * Local data importer is responsible for just using 
   * a data object and passing it appropriatly.
   */
  DS.Importers.Local = function(options) {
    this.options = options || (options = {});

    if (this.options.extract) {
      this.extract = this.options.extract;
    }
    this.data = options.data;
    this.parser = this.options.parser || DS.Importer.Obj;
  };

  _.extend(
    DS.Importers.Local.prototype,
    DS.Importers.prototype, {
      fetch : function(options) {
        // since this is the local importer, it just
        // passes the data through, parsed.
        this.data = this.extract(this.data);

        // create a new parser and pass the parsed data in
        this.parser = new this.parser(this.data, _.extend({},
          this.options,
          options));
        
        var parsedData = this.parser.build();
        options.success(parsedData);     
      }
    });

  /**
   * A remote importer is responsible for fetching data from a url
   * and passing it through the right parser.
   */
  DS.Importers.Remote = function(options) {
    options = options || {};
    this._url = options.url;

    if (options.extract) {
      this.extract = options.extract;
    }

    this.parser = options.parser || DS.Parsers.Obj;

    // Default ajax request parameters
    this.params = {
      type : "GET",
      url : this._url,
      dataType : options.dataType ? options.dataType : (options.jsonp ? "jsonp" : "json")
    };
  };

  _.extend(
    DS.Importers.Remote.prototype,
    DS.Importers.prototype,
    {
      fetch : function(options) {

        // call the original fetch method of object parsing.
        // we are assuming the parsed version of the data will
        // be an array of objects.
        var callback = _.bind(function(data) {
          data = this.extract(data);
          
          // create a new parser and pass the parsed data in
          this.parser = new this.parser(data, options);
          
          var parsedData = this.parser.build();
          options.success(parsedData);  
          
        }, this);

        // make ajax call to fetch remote url.
        DS.Xhr(_.extend(this.params, { success : callback }));
      }
    }
  );

}(this, _));