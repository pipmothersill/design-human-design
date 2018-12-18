
// our global array of spreadsheet data JSON will get loaded in here...
var madlib_data;
const categories = [
	'artifacts',
	'inspirations',
	'experiences',
	'attributes',
	'medium',
];

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
	});

	$("#close-modal").click(function(event) {
		event.preventDefault();

		$(".upload-modal").hide();

	})

	// get value from text area

	// get list of words

	// add to spreadsheet
	// get size of spreadsheet
	// generate list of modifications to spreadsheet
	// authenticate sheets api
	// call sheets api to update





	// // Show the file browse dialog
	// document.querySelector('#choose-upload-button').addEventListener('click', function() {
	// 	document.querySelector('#upload-file').click();
	// });


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

		// // Max 2 Mb allowed
		// if(file.size > 2*1024*1024) {
		// 	document.querySelector('#error-message').style.display = 'block';
		// 	document.querySelector('#error-message').innerText = 'Error : Exceeded size 2MB';
		// 	return;
		// }

		// document.querySelector('#upload-choose-container').style.display = 'none';
		// document.querySelector('#upload-file-final-container').style.display = 'block';
		document.querySelector('#file-name').innerText = file.name;
	});


	// // Cancel button event
	// document.querySelector('#cancel-button').addEventListener('click', function() {
	// 	document.querySelector('#error-message').style.display = 'none';
	// 	document.querySelector('#upload-choose-container').style.display = 'block';
	// 	document.querySelector('#upload-file-final-container').style.display = 'none';

	// 	document.querySelector('#upload-file').setAttribute('value', '');
	// });


	// Upload via AJAX
	document.querySelector('#upload-file-button').addEventListener('click', function() {
		var data = new FormData(),
			request;

		data.append('file', document.querySelector('#upload-file').files[0]);

		var request = new XMLHttpRequest();
		request.addEventListener('load', function(e) {
			// document.querySelector('#upload-progress').style.display = 'none';

			if(request.response.error == 1) {
				document.querySelector('#error-message').innerText = request.response.message;
				document.querySelector('#error-message').style.display = 'block';
			}
			else if(request.response.error == 0) {
				// document.querySelector('#cancel-button').click();
				document.querySelector('#file-result').innerHTML = JSON.stringify(request.response);
				
			}
			document.querySelector('#file-result').innerHTML = JSON.stringify(request.response);
			console.log(request.response);
		});
		// request.upload.addEventListener('progress', function(e) {
		// 	var percent_complete = (e.loaded / e.total)*100;
			
		// 	document.querySelector('#upload-percentage').innerText = percent_complete;
		// 	document.querySelector('#upload-progress').style.display = 'block';
		// });
		request.responseType = 'json';
		request.open('post', 'http://localhost:8080/upload'); 
		request.send(data); 
	});

	document.querySelector('#upload-text-button').addEventListener('click', function() {
		fetch(url, {
			method: "GET",
			mode: "cors",
			cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
			credentials: "same-origin", // include, *same-origin, omit
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				// "Content-Type": "application/x-www-form-urlencoded",
			},
			body: JSON.stringify(data), // body data type must match "Content-Type" header
		})
		.then(response => response.json()); // parses response to JSON
		
		var request = new XMLHttpRequest();
		request.addEventListener('load', function(e) {

			document.querySelector('#text-result').innerHTML = JSON.stringify(request.response);
			console.log(request.response);
			saveResponseToSheets(request.response);
		});
		// request.upload.addEventListener('progress', function(e) {
		// 	var percent_complete = (e.loaded / e.total)*100;
			
		// 	document.querySelector('#upload-percentage').innerText = percent_complete;
		// 	document.querySelector('#upload-progress').style.display = 'block';
		// });
		request.responseType = 'json';
		const textInput = encodeURIComponent(document.querySelector('#pasted-text').value)
		request.open('get', 'http://localhost:8080/?text=' + textInput); 
		request.send(); 
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

function saveResponseToSheets(response) {

}