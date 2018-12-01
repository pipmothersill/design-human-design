
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

function randomizeAll(spreadsheetJsonURL) {
	$.getJSON(spreadsheetJsonURL, function(data) {
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
}

// pulls out spreadsheet key from url so link can be shared with others
function getUrlParams() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}


function loadKey() {
	spreadsheetKey = getUrlParams().key;
}

function convertURL() {
	datalist_general = "https://spreadsheets.google.com/feeds/list/" 
						+ spreadsheetKey 
						+ "/od6/public/values?alt=json";
}


function saveToURL() {
	var separator = (window.location.href.indexOf("?") === -1) ? "?" : "&";
	window.location.href = window.location.href + separator + "key=" + spreadsheetKey;
}

//changes

function get_spreadsheet_name(datalist) {

	// $("#google_spreadsheet").click(function();
	// var datalist = 
}
	
$(document).ready(function(){
	
	loadKey();
	convertURL();
	randomizeAll(datalist_general);

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

	$("#upload-button").click(function(){
		$(".upload-modal").toggle();
	});

	$(".step button").click(function(){
		$(this).parent(".step").hide();
		$(this).parent(".step").next().show();
	});

	$(".step1 button").click(function(){
		spreadsheetKey = $("#spreadsheet-key").val();
		convertURL();
		randomizeAll(datalist_general);
		saveToURL();
	});

	// get value from text area

	// get list of words

	// add to spreadsheet
	// get size of spreadsheet
	// generate list of modifications to spreadsheet
	// authenticate sheets api
	// call sheets api to update


});