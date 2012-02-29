(function(global, _) {
  var DS = (global.DS || (global.DS = {}));

  DS.Importers = function(data, options) {};

  /**
  * Simple base parse method, passing data through
  */
  DS.Importers.prototype.extract = function(data) {
    data = _.clone(data);
    data._columns = data.columns;
    delete data.columns;
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

  _.extend(DS.Importers.Local.prototype, DS.Importers.prototype, {
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

  _.extend(DS.Importers.Remote.prototype, DS.Importers.prototype, {
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
      DS.Xhr(_.extend(this.params, {
        success : callback,
        error   : options.error
      }));
    }
  }

);

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

      return DS.Xhr.httpData(settings);
    }
};

DS.Xhr.getJSONP = function(url, success, isScript, error) {
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



}(this, _));
