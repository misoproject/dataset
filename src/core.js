(function(global, _) {

  /* @exports namespace */
  var DS = global.DS = {};

  /**
  * A representation of an event as it is passed through the
  * system. Used for view synchronization and other default
  * CRUD ops.
  * @constructor
  * @param {string} ev - Name of event
  * @param {object|array of objects} deltas - array of deltas.
  */
  DS.Event = function(deltas) {
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
    * Returns true if the event is a deletion
    */
    isDelete : function(delta) {
      if (_.isUndefined(delta.changed) || _.keys(delta.changed).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
    * Returns true if the event is an add event.
    */
    isAdd : function(delta) {
      if (_.isUndefined(delta.old) || _.keys(delta.old).length === 0) {
        return true;
      } else {
        return false;
      }
    },

    /**
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
  
  /**
  * @name DS.Events
  * - Event Related Methods
  * @property {object} DS.Events - A module aggregating some functionality
  *  related to events. Will be used to extend other classes.
  */
  DS.Events = {};

  /**
  * Bind callbacks to dataset events
  * @param {string} ev - name of the event
  * @param {function} callback - callback function
  * @param {object} context - context for the callback. optional.
  * @returns {object} context
  */
  DS.Events.bind = function (ev, callback, context) {
    var calls = this._callbacks || (this._callbacks = {});
    var list  = calls[ev] || (calls[ev] = {});
    var tail = list.tail || (list.tail = list.next = {});
    tail.callback = callback;
    tail.context = context;
    list.tail = tail.next = {};
    return this;
  };

  /**
  * Remove one or many callbacks. If `callback` is null, removes all
  * callbacks for the event. If `ev` is null, removes all bound callbacks
  * for all events.
  * @param {string} ev - event name
  * @param {function} callback - callback function to be removed
  */
  DS.Events.unbind = function(ev, callback) {
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
  };

  /**
  * @public
  * trigger a given event
  * @param {string} eventName - name of event
  */
  DS.Events.trigger = function(eventName) {
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
  };

  /**
  * Used to build event objects accross the application.
  * @param {string} ev - event name
  * @public
  * @param {object|array of objects} delta - change delta object.
  * @returns {object} event - Event object.
  */
  DS.Events._buildEvent = function(delta) {
    return new DS.Event(delta);
  };

  DS.types = {
    string : {
      name : "string",
      coerce : function(v) {
        return _.isNull(v) ? null : v.toString();
      },
      test : function(v) {
        return (typeof v === 'string');
      },
      compare : function(s1, s2) {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      }
    },

    boolean : {
      name : "boolean",
      regexp : /^(true|false)$/,
      coerce : function(v) {
        return !!(v);
      },
      test : function(v) {
        if (typeof v === 'boolean' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function() {
        // what should this really look like?
      }
    },

    number : {  
      name : "number",
      regexp : /^[\-]?[0-9]+([\.][0-9]+)?$/,
      coerce : function(v) {
        if (_.isNull(v)) {
          return null;
        }
        v = Number(v);
        return _.isNaN(v) ? null : v;
      },
      test : function(v) {
        if (typeof v === 'number' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(n1, n2) {
        if (n1 < n2) return -1;
        if (n1 > n2) return 1;
        return 0;
      }
    },

    time : {
      name : "time",
      regexp : /^\d+\/\d+\/\d+$/,
      defaultFormat : "YYYY/MM/DD",
      coerce : function(v, options) {
        options = options || {};
        return moment(v, options.format || this.defaultFormat);
      },
      test : function(v) {
        if (typeof v === 'number' || this.regexp.test( v ) ) {
          return true;
        } else {
          return false;
        }
      },
      compare : function(d1, d2) {
        var d1v = d1.valueOf(),
            d2v = d2.valueOf();

        if (d1v < d2v) return -1;
        if (d1v > d2v) return 1;
        return 0;
      }
    }

  };

  DS.typeOf = function( value ) {
    var types = _.keys(DS.types),
        chosenType;

    //move string to the end
    types.push(types.splice(_.indexOf(types, 'string'), 1)[0]);

    chosenType = _.find(types, function(type) {
      return DS.types[type].test( value );
    });

    chosenType = _.isUndefined(chosenType) ? 'string' : chosenType;

    return chosenType;
  };

}(this, _));
