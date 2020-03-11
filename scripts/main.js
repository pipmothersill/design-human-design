// our global array of spreadsheet data JSON will get loaded in here...
var madlib_data;
var autoFunctionID;
var autoOn = false;
const categories = [
	'artifacts',
	'inspirations',
	'experiences',
	'attributes',
	'medium',
];
const nltkServer = {
	text: 'https://us-east4-looking-sideways.cloudfunctions.net/extract-keywords?type=text',
	webpage: 'https://us-east4-looking-sideways.cloudfunctions.net/extract-keywords?type=webpage',
	pdf: 'https://us-east4-looking-sideways.cloudfunctions.net/extract-keywords?type=pdf',
}
const sheetsServer = {
	append: 'https://us-east4-looking-sideways.cloudfunctions.net/update-spreadsheet?method=append',
	update: 'https://us-east4-looking-sideways.cloudfunctions.net/update-spreadsheet?method=update',
}

const masterSheetKey = '1r1HWyQ7goAWwoHd7O1x-ph1i7DuJAGwoqsnnj2c_lvE';
var spreadsheetKey = '1cZw75v499DH_tryJGFyTHB3k8-Vr4AG7aV1Oj_OgWj0';
var projectName = '';
var sheetShape = {
	"artifacts": 0,
	"inspirations": 0,
	"experiences": 0,
	"attributes": 0,
	"medium": 0
};

var cachedValues = {
	"artifacts": [],
	"inspirations": [],
	"experiences": [],
	"attributes": [],
	"medium": []
}


function randomize(category) {
	$(".growText-animation").toggle().toggle();
	$(".fadeText-animation").toggle().toggle();
	// TODO: make sure no redundant words
	const len = cachedValues[category].length;
	let newValue;
	if (len === 0) {
		newValue = '';
		console.error('empty list of ' + category);
	} else {
		//choose a random entry of our madlib_data of the correct category
		const random_i = Math.floor(Math.random() * len);
		// const newValue = madlib_data[random_i]['gsx$' + category]['$t'];
		newValue = cachedValues[category][random_i];
		// use JQuery for more readable versions of document.getElementById...
		// ie. $(".aclass") gets all elements with that class, $("#anid") gets the element with that id
		// I changed the ids of the input elts you're updating to be more easily accessible here
	}
	
	$("#" + category + "_input").val(newValue);
}

function randomizeAll(spreadsheetJsonURL) {
	document.querySelector(".madlib-container").classList.remove('fadeIn')
	return ajax(spreadsheetJsonURL, 'GET')
		.then(response => response.json())
		.then(data => {
			if (!data.feed.hasOwnProperty('entry')) {
				console.error('Spreadsheet is empty!');
				data.feed.entry = [];
			}
			console.log(data.feed.entry);
			// spreadsheet data comes in as a big array, let's set a global array to that for easy access
			madlib_data = data.feed.entry;
			getCachedValues();
			// the parameters passed in match the titles in your google spreadsheet - so we can easily pull out data in the randomize fn
			categories.map(randomize);
			document.querySelector('.madlib-container').classList.add('fadeIn');
			return madlib_data;
		});
}

// pulls out spreadsheet key from url so link can be shared with others
function getUrlParams() {
	var vars = [],
		hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

function hasKey() {
	return (getUrlParams().hasOwnProperty('key') && getUrlParams().key.length > 1) || (getCookie('key') && getCookie('key').length == 44);
}

function loadKey() {
	spreadsheetKey = getUrlParams().key || getCookie('key');
	document.getElementById('spreadsheet-key').value = spreadsheetKey;
	document.getElementById('project-name').value = getCookie('name') || '';
}

function convertURL() {
	datalist_general = "https://spreadsheets.google.com/feeds/list/" +
		spreadsheetKey +
		"/od6/public/values?alt=json";
}

function saveToURL() {
	const newURL = window.location.origin + window.location.pathname + "?key=" + spreadsheetKey;
	window.history.pushState({}, "", newURL);
}

function saveToCookie() {
	setCookie('name', projectName);
	setCookie('key', spreadsheetKey);
}

function saveToSheets(dataToSave) {
	return randomizeAll(datalist_general).then(response => {
		const updates = {};
		for (let i = 0; i < categories.length; i++) {
			const categoryName = categories[i];
			updates[categoryName] = {
				firstEmptyRow: sheetShape[categoryName] + 2,
				newEntries: dataToSave[categoryName]
			}
		}

		return ajax(sheetsServer.update, "POST", {
			id: spreadsheetKey,
			updates: updates
		}).then(response => {
			randomizeAll(datalist_general);
		});
	});
}

function setLinks() {
	if (projectName.length === 0) {
		projectName = getCookie('name');
	}
	document.querySelector('.project-db-link')
		.setAttribute('href', `https://docs.google.com/spreadsheets/d/${spreadsheetKey}`);
	const subject = encodeURIComponent(`${projectName} design(human)design website`);
	const body = encodeURIComponent(`${projectName} site: ${window.location.href}\nView or edit the database here: https://docs.google.com/spreadsheets/d/${spreadsheetKey}`);
	document.querySelector('.project-email')
		.setAttribute('href', `mailto:?subject=${subject}&body=${body}`);
	document.querySelector('.project-name')
		.setAttribute('href', projectName);
	document.querySelector('.project-name-display').innerHTML = projectName;
}


function saveToMasterSpreadsheet(projectKey) {
	projectName = document.getElementById('project-name').value;
	ajax(sheetsServer.append, "POST", {
		masterKey: masterSheetKey,
		projectKey: projectKey,
		projectName: projectName
	});
}

function getSheetShape() {
	let shape = {};
	const max_len = madlib_data.length;
	categories.map(category => {
		for (let i = max_len - 1; i >= 0; i--) {
			const element = madlib_data[i]['gsx$' + category]['$t'];
			if (element !== "") {
				shape[category] = i + 1;
				return;
			}
		}
		shape[category] = max_len;
		return;
	});
	sheetShape = shape;
	return shape;
}

function getCachedValues() {
	const max_len = madlib_data.length;
	categories.map(category => {
		let foundLastItem = false;
		cachedValues[category] = [];
		sheetShape[category] = 0;
		for (let i = max_len - 1; i >= 0; i--) {
			const element = madlib_data[i]['gsx$' + category]['$t'];
			if (element !== "") {
				cachedValues[category].push(element);
				if (!foundLastItem) {
					sheetShape[category] = i + 1;
					foundLastItem = true;
				}
			}
		}
		if (!foundLastItem) sheetShape[category] = max_len;
	});
}


$(document).ready(function () {


	if (hasKey()) {
		loadKey();
		convertURL();
	}
	setLinks();
	randomizeAll(datalist_general);


	$("#home-button").click(event => {
		event.preventDefault();
		randomizeAll(datalist_general);
	})

	$("#auto-button").click(event => {
		event.preventDefault();
		autoOn = !autoOn;
		if (autoOn) {
			randomizeAll(datalist_general);
			autoFunctionID = setInterval(function () {
				randomizeAll(datalist_general);
			}, 8000);
		} else {
			clearInterval(autoFunctionID);
		}
		$("#auto-button").toggleClass("fade");
	})

	$("#print-button").click(function () {
		$(".corner-button").hide();
		html2canvas(document.body, {
			onrendered: function (canvas) {
				$(".corner-button").show();
				var a = document.createElement('a');
				// toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
				a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
				a.download = 'design_human_design.jpg';
				a.click();
			}
		});
	});

	$("#upload-button").click(function (event) {
		event.preventDefault();
		let modal = document.querySelector(".upload-modal");
		let hidden = (modal.classList.contains('hidden'));
		hidden ? modal.classList.remove('hidden') : modal.classList.add('hidden');
		document.querySelectorAll('.step').forEach(element => element.style.display = 'none');
		document.querySelector('.step.step1').style.display = 'block';
	});

	bindStepHandlers();

	$('.theme-page-button').click(function (event) {
		$('.step3').after(hiddenStep);
		$('.step3 .next').click();
		checkboxlimit(document.forms.starter.themes, 2);
		$('.theme-page-button').remove();
		$('#upload-inspiration').click(function (event) {
			$('.theme-checkbox:checked').map(function () {
				const themeName = $(this).closest('label').text();
				loadTheme(themeName);
			});
		});
		bindStepHandlers();
	});

	$("#key-upload").click(uploadKeyHandler);

	$("#close-modal").click(function (event) {
		event.preventDefault();

		document.querySelector(".upload-modal").classList.add('hidden');

	})


	// When a new file is selected
	document.querySelector('#upload-file').addEventListener('change', function (event) {
		var file = this.files[0],
			pdf_mime_type = 'application/pdf';


		// Validate MIME type
		if (file.type !== pdf_mime_type) {
			document.querySelector('#status-message-file').innerText = 'Error : Only PDF files allowed';
			return;
		}

		document.querySelector('#file-name').innerText = file.name;
	});


	// Upload via AJAX
	document.querySelector('#upload-file-button').addEventListener('click', function (event) {
		document.querySelector('#status-message-file').innerText = 'Loading...';
		var data = new FormData();

		data.append('file', document.querySelector('#upload-file').files[0]);

		getPDFKeywords(data).then(response => {
				document.querySelector('#status-message-file').innerText = `File parsed and loaded!`
				// document.querySelector('#file-result').innerHTML = JSON.stringify(response);
				console.log(response);
				saveToSheets(response);
			})
			.catch(err => {
				document.querySelector('#status-message-file').innerText = `Error: ${JSON.stringify(err)}`
			})
	});

	document.querySelector('#upload-text-button').addEventListener('click', function (event) {
		document.querySelector('#status-message-text').innerText = 'Loading...';
		const textInput = encodeURIComponent(document.querySelector('#pasted-text').value);

		getTextKeywords(textInput).then(response => {
				document.querySelector('#status-message-text').innerText = 'Text parsed and loaded!';
				// document.querySelector('#text-result').innerHTML = JSON.stringify(response);
				console.log(response);
				saveToSheets(response);
			})
			.catch(err => {
				document.querySelector('#status-message-text').innerText = `Error: ${JSON.stringify(err)}`
			})
	});

	document.querySelector('#upload-webpage-button').addEventListener('click', function (event) {
		document.querySelector('#status-message-webpage').innerText = 'Loading...';
		const url = encodeURIComponent(document.querySelector('#upload-webpage').value);

		getWebpageKeywords(url).then(response => {
				document.querySelector('#status-message-webpage').innerText = 'Webpage parsed and loaded!';
				// document.querySelector('#webpage-result').innerHTML = JSON.stringify(response);
				console.log(response);
				saveToSheets(response);
			})
			.catch(err => {
				document.querySelector('#status-message-webpage').innerText = `Error: ${JSON.stringify(err)}`
			})
	});
});

function uploadKeyHandler(event) {
	document.querySelector('#status-message-key').innerText = 'Loading...';
	event.preventDefault();
	let inputtedKey = $("#spreadsheet-key").val();
	const match = /([a-zA-Z0-9-_]{44})/.exec(inputtedKey);
	inputtedKey = match[1];
	let oldKey = spreadsheetKey;
	if (!inputtedKey || inputtedKey.length !== 44) {
		document.querySelector('#status-message-key').innerText = 'Error : Invalid key';
		return;
	} else {
		spreadsheetKey = inputtedKey;
		convertURL();
		randomizeAll(datalist_general).then(response => {
			document.querySelector('#status-message-key').innerText = 'Success: spreadsheet loaded';
			saveToURL();
			saveToMasterSpreadsheet(spreadsheetKey);
			setLinks();
			saveToCookie();
		}).catch(error => {
			document.querySelector('#status-message-key').innerText = 'Error : Invalid key';
			spreadsheetKey = oldKey;
			convertURL();
		});
	}
}

function getWebpageKeywords(url) {
	return ajax(nltkServer.webpage + "&url=" + encodeURIComponent(url), "GET")
		.then(response => response.json());
}

function getTextKeywords(text) {
	return ajax(nltkServer.text + "&text=" + text, "GET")
		.then(response => response.json());
}

function getPDFKeywords(data) {
	return ajax(nltkServer.pdf, "POST", data, false)
		.then(response => response.json());
}

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

function ajax(url, method, data = {}, isJSON = true) {
	let params = {
		method: method,
		mode: "cors",
		cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
		credentials: "same-origin", // include, *same-origin, omit
		redirect: "follow", // manual, *follow, error
		referrer: "no-referrer", // no-referrer, *client
	}
	if (isJSON && Object.keys(data).length !== 0) {
		params.body = JSON.stringify(data);
		params.headers = {
			"Content-Type": "application/json; charset=utf-8",
		};
	}
	if (!isJSON) {
		params.body = data;
	}

	return fetch(url, params);
}

function bindStepHandlers() {
	$(".step .next").click(function (event) {
		$(this).parent(".step").hide();
		$(this).parent(".step").next().show();
	});

	$(".step .prev").click(function (event) {
		$(this).parent(".step").hide();
		$(this).parent(".step").prev().show();
	});
}


const hiddenStep = `<div class="step step35">
			<button class="prev">Previous</button>
			<button class="next">Next</button>
			<h3>What concepts do you want to reframe?</h3>
			<section>
				<p>Here are some inspiration starters to get you going (select up to two):
				</p>
				<form id="starter" name="starter">
					<label><input type="checkbox" name="themes" class="theme-checkbox"/>Health</label><br />
					<label><input type="checkbox" name="themes" class="theme-checkbox"/>Environment</label><br />
					<label><input type="checkbox" name="themes" class="theme-checkbox"/>Work</label><br />
					<label><input type="checkbox" name="themes" class="theme-checkbox"/>Creativity</label><br />
					<label><input type="checkbox" name="themes" class="theme-checkbox"/>Knowledge</label><br />
					<label><input type="checkbox" name="themes" class="theme-checkbox"/>Technology</label><br />
				</form>
				<button id="upload-inspiration">Upload inspiration starters</button>
			</section>
		</div>`;

// from http://www.javascriptkit.com/script/script2/checkboxlimit.shtml
function checkboxlimit(checkgroup, limit) {
	for (let i = 0; i < checkgroup.length; i++) {
		checkgroup[i].onclick = function () {
			let checkedcount = 0;
			for (let i = 0; i < checkgroup.length; i++)
				checkedcount += (checkgroup[i].checked) ? 1 : 0;
			if (checkedcount > limit) {
				console.log("You can only select a maximum of " + limit + " checkboxes");
				this.checked = false;
			}
		}
	}
}

loadTheme = (theme) => {
	ajax("./scripts/cached_results.json", "GET")
		.then(response => response.json())
		.then(response => {
			let themeData = response[theme];
			saveToSheets(themeData);
		});
}

// const starter = {
// 	common: {
// 		artifacts: [
// 			'an object',
// 			'an interaction',
// 			'a website',
// 			'a service',
// 			'an image',
// 			'an app',
// 			'an experience',
// 			'an installation',
// 			'a technology',
// 			'a brand',
// 			'a concept',
// 			'a book',
// 			'a bottle',
// 			'a building',
// 			'a vehicle'
// 		],
// 		inspirations: [

// 		],
// 		experiences: [],
// 		attributes: [
// 			"forms",
// 			"brand touchpoints",
// 			"wireframes",
// 			"virtual reality",
// 			"augmented reality",
// 			"digital technology",
// 			"analog technology",
// 			"concept sketches",
// 			"personas",
// 			"design research",
// 			"journey mapping"
// 		],
// 		medium: [
// 			'virtual reality',
// 			'augmented reality',
// 			'Blockchain',
// 			'Internet of Things',
// 			'artificial intelligence',
// 			'pen & paper',
// 			'paint',
// 			'collage',
// 			'video',
// 			'code',
// 			'existing objects',
// 			'biomaterials information',
// 			'digital technology',
// 			'analog technology',
// 			'audio'
// 		]
// 	},
// 	Health: [
// 		'https://en.wikipedia.org/wiki/Health_care',
// 		'https://en.wikipedia.org/wiki/Medicine',
// 		'https://en.wikipedia.org/wiki/Psychology'
// 	],
// 	Environment: [
// 		'https://en.wikipedia.org/wiki/Built_environment',
// 		'https://en.wikipedia.org/wiki/Social_environment',
// 		'https://en.wikipedia.org/wiki/Ecology'
// 	],
// 	Work: [
// 		'https://en.wikipedia.org/wiki/Employment',
// 		'https://en.wikipedia.org/wiki/Office',
// 		'https://en.wikipedia.org/wiki/Workplace',
// 		'https://en.wikipedia.org/wiki/Collaboration'
// 	],
// 	Creativity: [
// 		'https://en.wikipedia.org/wiki/Creativity',
// 		'https://en.wikipedia.org/wiki/Technology',
// 		'https://en.wikipedia.org/wiki/Art',
// 		'https://en.wikipedia.org/wiki/Design'
// 	],
// 	Knowledge: [
// 		'https://en.wikipedia.org/wiki/Epistemology',
// 		'https://en.wikipedia.org/wiki/Learning',
// 		'https://en.wikipedia.org/wiki/Intelligence',
// 		'https://en.wikipedia.org/wiki/Wisdom'
// 	],
// 	Technology: [
// 		'https://en.wikipedia.org/wiki/Technology',
// 		'https://en.wikipedia.org/wiki/Machine',
// 		'https://en.wikipedia.org/wiki/Computer',
// 		'https://en.wikipedia.org/wiki/Science'
// 	]
// };

// addToCache = async (url, cache) => {
// 	console.log("getting " + url);
// 	return getWebpageKeywords(url).then(response => {
// 		console.log(response);
// 		cache.artifacts = cache.artifacts.concat(response.artifacts);
// 		cache.inspirations = cache.inspirations.concat(response.inspirations);
// 		cache.experiences = cache.experiences.concat(response.experiences);
// 		cache.attributes = cache.attributes.concat(response.attributes);
// 		cache.medium = cache.medium.concat(response.medium);
// 	});
// }

// starterCache = {
// 	"Health": {...starter.common},
// 	"Environment": {...starter.common},
// 	"Work": {...starter.common},
// 	"Creativity": {...starter.common},
// 	"Knowledge": {...starter.common},
// 	"Technology": {...starter.common}
// }


// generateCache = async () => {
// 	for (let i = 0; i < Object.keys(starterCache).length; i++) {
// 		let theme = Object.keys(starterCache)[i];
// 		for (let j = 0; j < starter[theme].length; j++) {
// 			let url = starter[theme][j];
// 			await addToCache(url, starterCache[theme]);
// 		}
// 	}
// }



// function download(content, fileName, contentType) {
// 	var a = document.createElement("a");
// 	var file = new Blob([content], { type: contentType });
// 	a.href = URL.createObjectURL(file);
// 	a.download = fileName;
// 	a.click();
// }


// async function hello() {
// 	await generateCache();
// 	download(JSON.stringify(starterCache), 'json.txt', 'text/plain');
// }

// hello();