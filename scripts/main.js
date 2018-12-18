
// our global array of spreadsheet data JSON will get loaded in here...
var madlib_data;
const categories = [
	'artifacts',
	'inspirations',
	'experiences',
	'attributes',
	'medium',
];
const sheetsServer = 'http://designhumandesign.media.mit.edu:3000';
const nltkServer = 'http://designhumandesign.media.mit.edu:8080';
const masterSheetKey = '1r1HWyQ7goAWwoHd7O1x-ph1i7DuJAGwoqsnnj2c_lvE';
var projectName = '';


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
	   categories.map(randomize);
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

function hasKey() {
	return getUrlParams().hasOwnProperty('key') && getUrlParams().key.length > 1;
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
	const separator = (window.location.href.indexOf("?") === -1) ? "?" : "&";
	const newURL = window.location.origin + window.location.pathname + separator + "key=" + spreadsheetKey;
	window.history.pushState({}, "", newURL);
}

function saveToCookie() {

}	

function saveToSheets(dataToSave) {
	const shape = getSheetShape();
	const updates = {};
	for (let i = 0; i < categories.length; i++) {
		const categoryName = categories[i];
		updates[categoryName] = {
			firstEmptyRow: shape[categoryName],
			newEntries: dataToSave[categoryName]
		}
		
	}
	ajax(sheetsServer + '/update', "POST", {
		id: spreadsheetKey,
		updates: updates
	});
}

function saveToMasterSpreadsheet(projectKey) {
	ajax(sheetsServer + '/append', "POST", {
		masterKey: masterSheetKey,
		projectKey: projectKey,
		projectName: projectName
	});
}

function getSheetShape() {
	let shape = {};
	const max_len = madlib_data.length;
	categories.map(category => {
		for (let i = 0; i < max_len; i++) {
			const element = madlib_data[i]['gsx$'+category]['$t'];
			if (element === "") {
				shape[category] = i;
				return;
			}
		}
		shape[category] = max_len;
		return;
	});
	return shape;
}


$(document).ready(function(){
	
	if (hasKey()) {
		loadKey();
		convertURL();
	}
	randomizeAll(datalist_general);

	$("#print-button").click(function(){
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

	$("#upload-button").click(function(event) {
		event.preventDefault();
		
		$(".upload-modal").toggle();
	});

	$(".step .next").click(function(event) {
		$(this).parent(".step").hide();
		$(this).parent(".step").next().show();
	});
	$(".step .prev").click(function(event) {
		$(this).parent(".step").hide();
		$(this).parent(".step").prev().show();
	});

	$("#key-upload").click(function(event) {
		event.preventDefault();

		spreadsheetKey = $("#spreadsheet-key").val();
		convertURL();
		randomizeAll(datalist_general);
		saveToURL();
		saveToMasterSpreadsheet(spreadsheetKey);
	});

	$("#close-modal").click(function(event) {
		event.preventDefault();

		$(".upload-modal").hide();

	})


	// When a new file is selected
	document.querySelector('#upload-file').addEventListener('change', function() {
		var file = this.files[0],
			pdf_mime_type = 'application/pdf';
		
		document.querySelector('#error-message').style.display = 'none';
		
		// Validate MIME type
		if(file.type !== pdf_mime_type) {
			document.querySelector('#error-message').style.display = 'block';
			document.querySelector('#error-message').innerText = 'Error : Only PDF files allowed';
			return;
		}

		document.querySelector('#file-name').innerText = file.name;
	});


	// Upload via AJAX
	document.querySelector('#upload-file-button').addEventListener('click', function() {
		var data = new FormData();

		data.append('file', document.querySelector('#upload-file').files[0]);

		ajax(nltkServer + '/upload', "POST", data).then(response => response.json()).then(response => {
			document.querySelector('#file-result').innerHTML = JSON.stringify(response);
			console.log(response);
			saveToSheets(response);
		});
	});

	document.querySelector('#upload-text-button').addEventListener('click', function() {
		const textInput = encodeURIComponent(document.querySelector('#pasted-text').value);

		ajax(nltkServer, "POST", {
			text: textInput
		}).then(response => response.json()).then(response => {
			document.querySelector('#text-result').innerHTML = JSON.stringify(response);
			console.log(response);
			saveToSheets(response);
		})
	});
});


function setCookie(key, value) {
    document.cookie = encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(value)) + ";path=/";
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function ajax(url, method, data = {}) {
	let params = {
		method: method,
		mode: "cors",
		cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
		credentials: "same-origin", // include, *same-origin, omit
		redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
	}
	if (Object.keys(data).length !== 0) {
		params.body = JSON.stringify(data);
		params.headers = {
			"Content-Type": "application/json; charset=utf-8",
		};
	}
	return fetch(url, params);
}