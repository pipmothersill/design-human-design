
// our global array of spreadsheet data JSON will get loaded in here...
var madlib_data;

function randomize(category) {
	//choose a random entry of our madlib_data of the correct category
	var random_i = Math.floor( Math.random() * madlib_data.length );
	var newValue = madlib_data[random_i]['gsx$'+category]['$t'];

	// use JQuery for more readable versions of document.getElementById...
	// ie. $(".aclass") gets all elements with that class, $("#anid") gets the element with that id
	// I changed the ids of the input elts you're updating to be more easily accessible here
 	$("#"+category+"_input").val(newValue);
}

//changes

function get_spreadsheet_name(datalist) {

	// $("#google_spreadsheet").click(function();
	// var datalist = 
}
	
$(document).ready(function(){

	$.getJSON(datalist_general, function(data) {
	   //console.log to see stuff in developer tools
	   console.log(data.feed.entry);
	   // spreadsheet data comes in as a big array, let's set a global array to that for easy access
	   madlib_data = data.feed.entry;

	   // the parameters passed in match the titles in your google spreadsheet - so we can easily pull out data in the randomize fn
	   randomize('artifacts');
	   randomize('inspirations');
	   randomize('experiences');
	   randomize('attributes');
	   randomize('medium');
	   $(".madlib-container").addClass("fadeIn");
	   
	});

$("#print-button").click(function(){
	console.log("HEY")
	html2canvas(document.body, {
	  onrendered: function(canvas) {
	     var a = document.createElement('a');
        // toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
        a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
        a.download = 'design_human_design.jpg';
        a.click();
	  }
	});
});



});