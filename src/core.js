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
