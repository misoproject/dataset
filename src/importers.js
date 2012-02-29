(function(global, _) {

  var Miso = (global.Miso || (global.Miso = {}));

  // ------ data parsers ---------
  Miso.Parsers = function() {};

  _.extend(Miso.Parsers.prototype, {

    /**
    * Creates an internal representation of a column based on
    * the form expected by our strict json.
    * @param {string} name The column name
    * @param {string} type The type of the data in the column
    */
    _buildColumn : function(name, type, data) {
      // if all properties were passed as an object rather
      // than separatly
      if (_.isObject(name) && arguments.length === 1) {
        return new Miso.Column(name);  
      } else {
        return new Miso.Column({
          name : name,
          type : type,
          data : data
        });
      }
    },

    build : function(options) {
      var d = {};

      this._buildColumns(d);
      this._setTypes(d, this.options);
      this._detectTypes(d);
      this._coerceTypes(d);
      this._cacheColumns(d);
      this._cacheRows(d);

      return d;
    },

    _coerceTypes : function(d) {

      // also save raw type function onto column for future computable
      // value extraction
      _.each(d._columns, function(column, index) {
        column.coerce();
      });
      return d;
    },

    _setTypes : function(d, options) {
      options.columnTypes = options.columnTypes || {};
      _.each(d._columns, function(column) {
        var type = options.columnTypes[column.name];
        if (type) {

          // if the type is specified as an object of a form such as:
          // { type : time, format : 'YYYY/MM/DDD'}
          // then take the type property as the type and extend the 
          // column to add a property called
          // typeOptions with the rest of the attributes.
          if (_.isObject(type)) {
            column.type = type.type;
            delete type.type;
            column.typeOptions = type;
          } else {
            column.type = type;
          }
        } 
      });
    },

    _addValue : function(d, columnName, value) {
      var colPos = d._columnPositionByName[columnName];
      d._columns[colPos].data.push(value);
    },

    _detectTypes : function(d, n) {

      _.each(d._columns, function(column) {

        // check if the column already has a type defined. If so, skip
        // this auth detection phase.
        if (_.isUndefined(column.type) || column.type === null) {

          // compute the type by assembling a sample of computed types
          // and then squashing it to create a unique subset.
          var type = _.inject(column.data.slice(0, (n || 5)), function(memo, value) {

            var t = Miso.typeOf(value);

            if (value !== "" && memo.indexOf(t) === -1 && !_.isNull(value)) {
              memo.push(t);
            }
            return memo;
          }, []);

          // if we only have one type in our sample, save it as the type
          if (type.length === 1) {
            column.type = type[0];
          } else if (type.length === 0) {
            // we are assuming that this is a number type because we have
            // no values in the sample. Unfortunate.
            column.type = "number";
          } else {
            throw new Error("This column seems to have mixed types");
          }
        }

      });

      return d;
    },

    /**
    * Used by internal importers to cache the columns and their
    * positions in a fast hash lookup.
    * @param d {object} the data object to append cache to.
    */
    _cacheColumns : function(d) {
      d._columnPositionByName = {};

      // cache columns by their column names
      // TODO: should we cache by _id?
      _.each(d._columns, function(column, index) {
        d._columnPositionByName[column.name] = index;
      });

      return d;
    },

    /**
    * Used by internal importers to cache the rows 
    * in quick lookup tables for any id based operations.
    * @param d {object} the data object to append cache to.
    */
    _cacheRows : function(d) {

      d._rowPositionById = {};
      d._rowIdByPosition = [];

      // cache the row id positions in both directions.
      // iterate over the _id column and grab the row ids
      _.each(d._columns[d._columnPositionByName._id].data, function(id, index) {
        d._rowPositionById[id] = index;
        d._rowIdByPosition.push(id);
      });  

      // cache the total number of rows. There should be same 
      // number in each column's data type
      var rowLengths = _.uniq( _.map(d._columns, function(column) { 
        return column.data.length;
      }));

      if (rowLengths.length > 1) {
        throw new Error("Row lengths need to be the same. Empty values should be set to null." + _.map(d._columns, function(c) { return c.data + "|||" ; }));
      } else {
        d.length = rowLengths[0];
      }

      return d;
    },

    /**
    * Adds an id column to the column definition. If a count
    * is provided, also generates unique ids.
    * @param d {object} the data object to modify
    * @param count {number} the number of ids to generate.
    */
    _addIdColumn : function(d, count) {
      // if we have any data, generate actual ids.
      var ids = [];
      if (count && count > 0) {
        _.times(count, function() {
          ids.push(_.uniqueId());
        });
      }
      d._columns.unshift(
        this._buildColumn("_id", "number", ids)
      );

      return d;
    },


    /**
    * By default we are assuming that our data is in
    * the correct form from the fetching.
    */
    parse : function(data) {
      return data;
    }
  });

  // ------ Strict Parser ---------
  /**
  * Handles basic strict data format.
  * TODO: add verify flag to disable auto id assignment for example.
  */
  Miso.Parsers.Strict = function(data, options) {
    this.options = options || {};
    this._data = this.parse(data);
  };

  _.extend(
    Miso.Parsers.Strict.prototype,
    Miso.Parsers.prototype, {

      _buildColumns : function(d) {
        d._columns = [];
        
        _.each(this._data._columns, function(columnOpts) {
          d._columns.push(this._buildColumn(columnOpts));
        }, this);

        // add row _id column. Generate auto ids if there
        // isn't already a unique id column.
        if (_.pluck(d._columns, "name").indexOf("_id") === -1) {
          this._addIdColumn(d, d._columns[0].data.length);
        }

        return d;
      }

    });

    // -------- Object Parser -----------
    /**
    * Converts an array of objects to strict format.
    * Each object is a flat json object of properties.
    * @params {Object} obj = [{},{}...]
    */
    Miso.Parsers.Obj = function(data, options) {
      this.options = options || {};
      this._data = data;
    };

    _.extend(
      Miso.Parsers.Obj.prototype,
      Miso.Parsers.prototype, {

        _buildColumns : function(d, n) {

          d._columns = [];

          // create column container objects
          var columnNames  = _.keys(this._data[0]);
          _.each(columnNames, function(columnName) {
            d._columns.push(this._buildColumn(columnName, null));
          }, this);

          // add id column
          this._addIdColumn(d);

          // cache them so we have a lookup
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

          return d;
        },

        build : function(options) {

          var d = {};

          this._buildColumns(d);
          // column caching happens inside of build columns this time
          // so that rows know which column their values belong to
          // before we build the data.
          this._setTypes(d, this.options);
          this._detectTypes(d);
          this._coerceTypes(d);
          this._cacheRows(d);
          return d;
        }
      }
    );

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

    Miso.Xhr = function(options) {

      // json|jsonp etc.
      options.dataType = options.dataType && options.dataType.toLowerCase() || null;

      if (options.dataType && 
        (options.dataType === "jsonp" || options.dataType === "script" )) {

          Miso.Xhr.getJSONP(
            options.url,
            options.success,
            options.dataType === "script",
            options.error
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

          return Miso.Xhr.httpData(settings);
        }
    };

    Miso.Xhr.getJSONP = function(url, success, isScript, error) {
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

      script.onerror = function(e) {
        if (error) { 
          error.call(null);
        }
      };

      script.src = url;
      head.insertBefore(script, head.firstChild);
      return;
    };

    Miso.Xhr.httpData = function(settings) {
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

          // if we got an ok response, call success, otherwise fail.
          if (/(2..)/.test(settings.ajax.status)) {
            settings.success.call(settings.ajax, data);  
          } else {
            if (settings.error) {
              settings.error.call(null, settings.ajax.statusText);
            }
          }
        }
      };

      return data;
    };

    Miso.Importers = function(data, options) {};

    /**
    * Simple base parse method, passing data through
    */
    Miso.Importers.prototype.extract = function(data) {
      data = _.clone(data);
      data._columns = data.columns;
      delete data.columns;
      return data;
    };

    /**
    * Local data importer is responsible for just using 
    * a data object and passing it appropriatly.
    */
    Miso.Importers.Local = function(options) {
      this.options = options || (options = {});

      if (this.options.extract) {
        this.extract = this.options.extract;
      }
      this.data = options.data;
      this.parser = this.options.parser || Miso.Importer.Obj;
    };

    _.extend(
      Miso.Importers.Local.prototype,
      Miso.Importers.prototype, {
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
      Miso.Importers.Remote = function(options) {
        options = options || {};
        this._url = options.url;

        if (options.extract) {
          this.extract = options.extract;
        }

        this.parser = options.parser || Miso.Parsers.Obj;

        // Default ajax request parameters
        this.params = {
          type : "GET",
          url : this._url,
          dataType : options.dataType ? options.dataType : (options.jsonp ? "jsonp" : "json")
        };
      };

      _.extend(
        Miso.Importers.Remote.prototype,
        Miso.Importers.prototype,
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
            Miso.Xhr(_.extend(this.params, { 
              success : callback,
              error   : options.error
            }));
          }
        }
      );



}(this, _));
