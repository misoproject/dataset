
(function(global) {

  var Util = global.Util = global.Util || {};
  var Miso = global.Miso || {};

  Util.baseSample = function() {
    var ds = null;

    new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1, 2, 3] },
        { name : "two",   data : [4, 5, 6] },
        { name : "three", data : [7, 8, 9] } 
      ] },
      strict: true
    }).fetch({
      success : function() {
        ds = this;
      }
    });
    return ds;
  };

  Util.baseSampleCustomID = function() {
    var ds = null;

    new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1, 2, 3] },
        { name : "two",   data : [4, 5, 6] },
        { name : "three", data : [7, 8, 9] } 
      ] },
      strict: true,
      idAttribute: "one"
    }).fetch({
      success : function() {
        ds = this;
      }
    });
    return ds;
  };

  Util.baseSyncingSample = function() {
    var ds = null;

    new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1, 2, 3] },
        { name : "two",   data : [4, 5, 6] },
        { name : "three", data : [7, 8, 9] } 
      ] },
      strict: true,
      sync : true
    }).fetch({
      success : function() {
        ds = this;
      }
    });
    return ds;
  };

  Util.baseSyncingSampleCustomidAttribute = function() {
    var ds = null;

    new Miso.Dataset({
      data: { columns : [ 
        { name : "one",   data : [1, 2, 3] },
        { name : "two",   data : [4, 5, 6] },
        { name : "three", data : [7, 8, 9] } 
      ] },
      idAttribute : "one",
      strict: true,
      sync : true
    }).fetch({
      success : function() {
        ds = this;
      }
    });
    return ds;
  };

}(this));

