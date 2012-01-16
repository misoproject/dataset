(function(global, _) {

  // generic core namespace def.
  var DS = global.DS = {};

  // supported datatypes.
  DS.datatypes = {
    UNKNOWN: "Unknown",
    NUMBER : 0,
    STRING : 1,
    BOOLEAN: 2,
    ARRAY  : 3,
    OBJECT : 4,
    TIMESTAMP : 5
  };

  /**
  * Event related methods. To be attached to all other components.
  */
  DS.Events = {
    /**
    * @public
    * Bind callbacks to dataset events
    * @param {string} ev - name of the event
    * @param {function} callback - callback function
    * @param {object} context - context for the callback. optional.
    */
    bind : function(ev, callback, context) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = calls[ev] || (calls[ev] = {});
      var tail = list.tail || (list.tail = list.next = {});
      tail.callback = callback;
      tail.context = context;
      list.tail = tail.next = {};
      return this;
    }, 

    /**
    * @public
    * Remove one or many callbacks. If `callback` is null, removes all
    * callbacks for the event. If `ev` is null, removes all bound callbacks
    * for all events.
    * @param {string} ev - event name
    * @param {function} callback - callback function to be removed
    */
    unbind : function(ev, callback) {
      var calls, node, prev;
      if (!ev) {
        this._callbacks = null;
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = {};
        } else if (node = calls[ev]) {
          while ((prev = node) && (node = node.next)) {
            if (node.callback !== callback) { 
              continue;
            }
            prev.next = node.next;
            node.context = node.callback = null;
            break;
          }
        }
      }
      return this;
    },

    /**
    * @public
    * trigger a given event
    * @param {string} eventName - name of event
    */
    trigger : function(eventName) {
      var node, calls, callback, args, ev, events = ['all', eventName];
      if (!(calls = this._callbacks)) {
        return this;
      }
      while (ev = events.pop()) {
        if (!(node = calls[ev])) {
          continue;
        }
        args = ev == 'all' ? arguments : Array.prototype.slice.call(arguments, 1);
        while (node = node.next) {
          if (callback = node.callback) {
            callback.apply(node.context || this, args);
          }
        }
      }
      return this;
    },


    /**
    * @public
    * Used to build event objects accross the application.
    * @param {string} ev - event name
    * @param {object|array of objects} delta - change delta object.
    * @returns {object} event - Event object.
    */
    buildEvent : function(ev, delta) {
      return new DS.Event(ev, delta);
    }
  };

  /**
  * @constructor
  * A representation of an event as it is passed through the
  * system. Used for view synchronization and other default
  * CRUD ops.
  * @param {string} ev - Name of event
  * @param {object|array of objects} deltas - array of deltas.
  */
  DS.Event = function(ev, deltas) {
    this.name = ev;
    if (!_.isArray(deltas)) {
      deltas = [deltas];
    }
    this.deltas = deltas;
  };

  _.extend(DS.Event.prototype, {
    affectedColumns : function() {
      var cols = [];
      
      _.each(this.deltas, function(delta) {
        cols = _.union(cols, 
          _.keys(delta.old),
          _.keys(delta.changed)
        );
      });

      return cols;
    }
  });
  _.extend(DS.Event, {
    /**
    * @public
    * Returns true if the event is a deletion
    */
    isDelete : function(delta) {
      if (_.keys(delta.changed).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * @public
    * Returns true if the event is an add event.
    */
    isAdd : function(delta) {
      if (_.keys(delta.old).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * @public
    * Returns true if the event is an update.
    */
    isUpdate : function(delta) {
      if (!this.isDelete(delta) && !this.isAdd(delta)) {
        return true;
      } else {
        return false;
      }
    }
  });

  (function() {

    var classType = {},
      types = "Boolean Number String Function Array Date RegExp Object".split(" "),
      length = types.length,
      i = 0,
      patterns = {
        "number" : /^[-]?[0-9]+([\.][0-9]+)?$/,
        "boolean" : /^(true|false)$/
      };
    for ( ; i < length; i++ ) {
      classType[ "[object " + types[ i ] + "]" ] = types[ i ].toLowerCase();
    }
    
    /**
    * @public
    * Returns the type of an input object.
    * Stolen from jQuery via @rwaldron (http://pastie.org/2849690)
    * @param {?} obj - the object being detected.
    */
    DS.typeOf = function(obj) {
      
      var type = obj == null ?
        String( obj ) :
        classType[ {}.toString.call(obj) ] || "object";

      // if the resulting object is a string, test to see if it's
      // a string of numbers or a boolean. We want those cast
      // properly.
      if (type === "string") {
        _.each(patterns, function(regex, name) {
          if (regex.test(obj)) {
            type = name;
          }
        });
      }
      return type;
    };
  })();

}(this, _));