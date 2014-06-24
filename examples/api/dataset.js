var ds = new Miso.Dataset({
  data: [
    { one : 1, two : 4, three : 7 }
  ]
});

var ds2 = new Miso.Dataset({
  url: '/data/simple.json'
});

log( ds instanceof Miso.Dataset );
log( ds2 instanceof Miso.Dataset );
