//UNESCO Data
var dataset = $.dataset({url : '/data/unesco_primary_enrolment.json'});

//ISO Data
var dataset = $.dataset({url : '/data/iso_3166.json'});

//Google Spreadsheet
var transform = function(response_json) {
  return response_json["feed"];
}
var dataset = $.dataset({
  url : '/data/google_spreadsheet.json',
  transform: transform
});
