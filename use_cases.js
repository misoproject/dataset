//UNESCO Data
var dataset = new Dataset({url : '/data/unesco_primary_enrolment.json'});

//build list of male enrolment by year, highlighting modeled data
var list = [];
dataset.rows().each(function(row) {
  var klass = '';
  if (row.metadata && row.metadata.estimate) {
    klass = 'estimate'
  }
  list.push( "<li class="+klass+">"+row('year')+": "+row('E.1.M')+"</li>" );
}

//ISO Data
var dataset = new Dataset({url : '/data/iso_3166.json', strict: true});

//Sort countries starting with a by length of official name
dataset
  .filterRows(function(row) {
    return row('name')[0].toLowerCase() === 'a';
  })
  .sortBy(function(a,b) {
    return (a('official_length') > b('official_name'));
});

//Google Spreadsheet
var transform = function(response_json) {
  return response_json["feed"];
}
var dataset = new Dataset({
  url : '/data/google_spreadsheet.json',
  transform: transform
});
