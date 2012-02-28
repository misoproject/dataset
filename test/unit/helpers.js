function baseSample() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [1, 2, 3] },
      { name : "two",   data : [4, 5, 6] },
      { name : "three", data : [7, 8, 9] } 
    ] },
    strict: true
  });
  return ds;
}


function baseSyncingSample() {
  var ds = new DS.Dataset({
    data: { columns : [ 
      { name : "one",   data : [1, 2, 3] },
      { name : "two",   data : [4, 5, 6] },
      { name : "three", data : [7, 8, 9] } 
    ] },
    strict: true,
    sync : true
  });
  return ds; 
}