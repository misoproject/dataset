(function(global, _) {

  var DS = (global.DS || (global.DS = {}));

  // ------ data parsers ---------
  DS.Parsers = function( options ) {
    this.options = options || {};
  };

  _.extend(DS.Parsers.prototype, {

    //this is the main function for the parser,
    //it must return an object with the columns names
    //and the data in columns
    parse : function() {},

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

            var t = DS.typeOf(value);

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

   
  });
}(this, _));
