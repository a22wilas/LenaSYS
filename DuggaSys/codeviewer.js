/********************************************************************************

   Documentation

*********************************************************************************

Execution Order
---------------------
 #1 setup() is first function to be called this then invokes returned() callback through AJAX
 #2 returned() is next function to be called as a callback from setup.

Testing Link:

codeviewer.php?exampleid=1&courseid=1&cvers=45656

How to use
---------------------
# Upload the files you wish to display in the file editor
# Create a new codeviewer
# Pick a template
# Click the cogwheel and pick the file you wish to display in the 'File' select box
# Click 'Save'

-------------==============######## Documentation End ###########==============-------------
*/

/********************************************************************************

   Globals

*********************************************************************************/

var retData; // Data returned from setup
var tokens = []; // Array to hold the tokens.
var allBlocks = []; // Array holding collapsible tokens
var dmd = 0; // Variable used to determine forward/backward skipping with the forward/backward buttons
var genSettingsTabMenuValue = "wordlist";
var codeSettingsTabMenuValue = "implines";
var querystring = parseGet();
var courseid;
var exampleid;
var cvers;
var template7maximizebuttonpressed = false;
var template8maximizebuttonpressed = false;
var sectionData; // Variable that stores all the data that is sent from Section, which contains the ordering of the code examples.
var codeExamples = []; // Array that contains all code examples in the same order that was assigned in Section before pressing one of the examples.
var currentPos; // Variable for the current position that determines where in the list of code examples you are.


/********************************************************************************

   SETUP

*********************************************************************************/

function setup() {
	try {
		courseid = querystring['courseid'];
		exampleid = querystring['exampleid'];
		cvers = querystring['cvers'];

		AJAXService("EDITEXAMPLE", {
			courseid: courseid,
			exampleid: exampleid,
			cvers: cvers
		}, "CODEVIEW");
	} catch (e) {
		alert("Error while setting up: " + e.message)
	}
}


function returnedError(error) {
	if (error.responseText) {
		document.querySelector('#div2').innerHTML += " and show them this message:<br><br>"+error.responseText;
	}
}

function fillBurger() {
	var boxes = retData['box'];
	var burgerMenu = document.querySelector('#burgerMenu');
	var str = "";
	boxes.forEach(box => {
		str += "<div class='burgerOption DarkModeBackgrounds' onclick='setShowPane("+box[0]+");'>"+box[4]+"</div>";	
	});
	str += "<div class='burgerOption DarkModeBackgrounds' onclick='showAllViews();'>All views</div>";
	burgerMenu.innerHTML = str;
}

//-----------------------------------------------------------------
// returned: Fetches returned data from all sources
//-----------------------------------------------------------------

function returned(data) 
{
	retData = data;
	sectionData = JSON.parse(localStorage.getItem("ls-section-data"));
	// User can choose template if no template has been chosen and the user has write access.
	if ((retData['templateid'] == 0)) {
		if (retData['writeaccess'] == "w") {
			alert("A template has not been chosen for this example. Please choose one.");
			$("#chooseTemplateContainer").css("display", "flex");
			return;
		} else {
			alert("The administrator of this code example has not yet chosen a template.");
			return;
		}
	}
	changeCSS("../Shared/css/" + retData['stylesheet']);

	//Checks current example name with all the examples in codeExamples[] to find a match
	//and determine current position.
	for(i = 0; i < sectionData['entries'].length; i++){
		if(retData['examplename'] == sectionData['entries'][i]['examplename'] && retData['sectionname'] == sectionData['entries'][i]['entryname']){
			currentPos = i;
		}
		else if(sectionData['entries'][i]['link'] == exampleid){
			currentPos = i;
		}
	}

	//Fixes the five next code examples in retData to match the order that was assigned in Section.
	var j = 0;
	var posAfter = currentPos+1;

	retData['after'] = [];
	for(i = currentPos; i <= sectionData['entries'].length-1; i++){
		if(j < 5){
			if(currentPos == sectionData['entries'].length-1 && posAfter + j == sectionData['entries'].length){
				retData['after'] = [];
				break;
			}
			if(posAfter + j == sectionData['entries'].length){
				//Not ideal to have this here but this is needed to not get an arrayOutOfBounds Error.
				break;
			}
			if(sectionData['entries'][posAfter + j]['kind'] == 1){
				posAfter++;
				continue;
			}

			retData['after'].push(sectionData['entries'][posAfter + j]);
			retData['after'][j][1] = sectionData['entries'][posAfter + j]['entryname'];
			retData['after'][j][0] = (String)(sectionData['entries'][posAfter + j]['link']);

			for(k = 0; k < retData['beforeafter'].length; k++){
				if(retData['beforeafter'][k][0] == retData['after'][j][0]){			
					retData['after'][j][2] = retData['beforeafter'][k][2]
					break;
				}
			}
			retData['exampleno'] = posAfter;
			j++;
		}else{
			break
		}
	}

	//Fixes the five code examples before the current one in retData to match the order that was assigned in Section.
	j = 0;
	var posBefore = currentPos-1;
	retData['before'] = [];
	for(i = currentPos; i > 0; i--){
		if(j < 5){
			if(currentPos==1 && posBefore - j == 0){
				retData['before'] = [];
				break;
			}
			if(sectionData['entries'][posBefore - j]['kind']== 1){
				posBefore--;
				continue;
			}

			retData['before'].push(sectionData['entries'][posBefore - j]);
			retData['before'][j][1] = sectionData['entries'][posBefore - j]['entryname'];
			retData['before'][j][0] = (String)(sectionData['entries'][posBefore - j]['link']);

			for(k = 0; k < retData['beforeafter'].length; k++){
				if(retData['beforeafter'][k][0] == retData['before'][j][0] ){					
					retData['before'][j][2] = retData['beforeafter'][k][2]
					break;
				}
			}
			retData['exampleno'] = posBefore;
			j++;
		}else{
			break
		}
	}
	if (retData['deleted']) {
		window.location.href = 'sectioned.php?courseid='+courseid+'&coursevers='+cvers;
	}

	if ($('#fileedButton').length) {
		document.getElementById('fileedButton').onclick = new Function("navigateTo('/fileed.php','?courseid=" + courseid + "&coursevers=" + cvers + "');");
		document.getElementById('fileedButton').style = "display:table-cell;";
	}

	if (retData['debug'] != "NONE!") alert(retData['debug']);

	// Disables before and after button if there are no available example before or after.
	// Works by checking if the current example is last or first in the order of examples.
	//If there are no examples this disables being able to jump through (the non-existsing) examples

	if (retData['before'].length != 0 && retData['after'].length != 0 || retData['before'].length == 0 || retData['after'].length == 0) {
		if (retData['exampleno'] == 0 || retData['before'].length == 0) {
			document.querySelector("#beforebutton").style.opacity = "0.4";
			document.querySelector("#beforebutton").style.pointerEvents = "none";
		}
		if (retData['exampleno'] == sectionData['entries'].length || retData['after'].length == 0) {
			document.querySelector("#afterbutton").style.opacity = "0.4";
			document.querySelector("#afterbutton").style.pointerEvents = "none";
		}
	} else if (retData['before'].length == 0 && retData['after'].length == 0) {
		document.querySelector("#beforebutton").style.opacity = "0.4";
		document.querySelector("#beforebutton").style.pointerEvents = "none";
		document.querySelector("#afterbutton").style.opacity = "0.4";
		document.querySelector("#afterbutton").style.pointerEvents = "none";
	}

	// Disables the play button if there is no playlink
	if (typeof retData['playlink'] == 'undefined' || retData['playlink'] == "" || retData['playlink'] == null) {
		document.querySelector("#playbutton").style.opacity = "0.4";
		document.querySelector("#playbutton").style.pointerEvents = "none";
	} else {
		retData['playlink'] = retData['playlink'].replace(/\&\#47\;/g, "/");
	}

	// Fill Section Name and Example Name
	var exName = document.querySelector('#exampleName');
	if (data['examplename'] != null) {
		exName.innerHTML = data['examplename'];
	}
	var exSection = document.querySelector('#exampleSection');
	if (data['sectionname'] != null) {
		exSection.innerHTML = data['sectionname'] + "&nbsp;:&nbsp;";
	}
	var mobExName = document.querySelector('#mobileExampleName');
	var mobExSection = document.querySelector('#mobileExampleSection');
	mobExName.innerHTML = data['examplename'];
	mobExSection.innerHTML = data['sectionname'] + "&nbsp;:&nbsp;";

	// Clear div2
	$("#div2").html("");

	// Possible crash warning if returned number of boxes is wrong
	if (retData['numbox'] == 0 || retData['numbox'] == null) {
		var debug = "Debug: Nr boxes ret: " + retData['numbox'] + ", may cause page crash"
		console.log(debug);
	}

	// Create boxes
	if (retData['numbox'] > retData['box'].length) {
		alert("Number of boxes is inconsistent\n" + retData['numbox'] + "\n" + retData['box'].length);
	}

	for (var i = 0; i < retData['numbox']; i++) {
		var contentid = "box" + retData['box'][i][0];
		var boxid = retData['box'][i][0];
		var boxtype = retData['box'][i][1].toUpperCase();
		var boxcontent = retData['box'][i][2];
		var boxwordlist = retData['box'][i][3];
		var boxfilename = retData['box'][i][5];
		var boxmenuheight = 0;

		// don't create templatebox if it already exists
		if ($("#" + contentid).length == 0) {
			addTemplatebox(contentid);
		}

		if (boxtype === "CODE") {
			// Print out code example in a code box
			var boxtypeCodebox = document.getElementById(contentid);
			boxtypeCodebox.removeAttribute("contenteditable");
			boxtypeCodebox.classList.remove("descbox");
			boxtypeCodebox.classList.add("codebox");
			createboxmenu(contentid, boxid, boxtype);

			// Make room for the menu by setting padding-top equal to height of menubox
			// Without this fix the code box is placed at same height as the menu, obstructing first lines of the code
			// Setting boxmenuheight to 0, possible cause to example malfunction?
			if ($("#" + contentid + "menu").height() == null) {
				boxmenuheight = 0;
			} else {
				boxmenuheight = $("#" + contentid + "menu").height();
			}
			$("#" + contentid).css("margin-top", boxmenuheight - 1);
			// Indentation fix of content
			boxcontent = tabLine(boxcontent);

			// Render code
			rendercode(boxcontent, boxid, boxwordlist, boxfilename);

			// set font size
			$("#box" + boxid).css("font-size", retData['box'][boxid - 1][6] + "px");

		} else if (boxtype === "DOCUMENT") {
			// Print out description in a document box

			var boxtypeDescbox = document.getElementById(contentid);
			boxtypeDescbox.classList.remove("codebox");
			boxtypeDescbox.classList.add("descbox");

			var desc = boxcontent;
			desc = replaceAll("&nbsp;", " ", desc);
			desc = parseMarkdown(desc);

			//Change all asterisks to the html code for asterisks
			desc = desc.replace(/\*/g, "&#42;");
			// Highlight important words
			important = retData.impwords;
			for (var j = 0; j < important.length; j++) {
				//Prevent important word spans to be created for HTML events.
				if(htmlEventArray.includes(important[j])){
					var sstr = important[j];
				}else{
					var sstr = "<span id='IWW' class='impword' onclick='popupDocumentation(\"" + important[j] + "\", \"unspecified\");' onmouseout='highlightKeyword(\"" + important[j] + "\")' onmouseover='highlightKeyword(\"" + important[j] + "\")'>" + important[j] + "</span>";
				}
				//Interpret asterisks in important word as literals and not as character with special meaning
				if (important[j].indexOf('*') != -1) {
					important[j] = important[j].replace(/\*/g, "&#42;");
				}
				//make sure that not partial words gets highlighted
				var regExp = new RegExp("\\b" + important[j] + "\\b", "g");
				desc = desc.replace(regExp, sstr);
			}
			//Replace the html code for asterisks with asterisks
			desc = desc.replace(/\&\#42\;/g, "*");

			/* Assign Content */
			$("#" + contentid).html(desc);
			$("#" + contentid).css("margin-top", boxmenuheight);
			createboxmenu(contentid, boxid, boxtype);

			// set font size
			$("#box" + boxid).css("font-size", retData['box'][boxid - 1][6] + "px");

			// Make room for the menu by setting padding-top equals to height of menubox
			if ($("#" + contentid + "menu").height() == null) {
				boxmenuheight = 0;
			} else {
				boxmenuheight = $("#" + contentid + "menu").height();
			}
			$("#" + contentid).css("margin-top", boxmenuheight);

		} else if (boxtype === "IFRAME") {
			createboxmenu(contentid, boxid, boxtype);
			
			var boxtypeframebox = document.getElementById(contentid);
			boxtypeframebox.classList.remove("codebox", "descbox");
			boxtypeframebox.classList.add("framebox");

			// If multiple versions exists use the one with highest priority.
			// cvers BEFORE courseid BEFORE global
			var previewFile = retData['box'][i][5];
			var previewLink = "";

			// Remove html-entitied slashes...
			previewFile = previewFile.replace(/&#47;/g, "/");
			if (previewFile.indexOf("http://") == 0 || previewFile.indexOf("https://") == 0) {
				// Preview to external link
				previewLink = previewFile;
			} else {
				previewLink = retData['box'][i][2];;
			}

			if (window.location.protocol === "https:") {
				previewLink = previewLink.replace("http://", "https://");
			} else {
				previewLink = previewLink.replace("https://", "http://");
			}

			$("#box" + boxid).html("<iframe src='" + previewLink + "'></iframe>");
			if ($("#" + contentid + "menu").height() == null) {
				boxmenuheight = 0;
			} else {
				boxmenuheight = $("#" + contentid + "menu").height();
			}
			$("#" + contentid).css("margin-top", boxmenuheight);

		} else if (boxtype == "NOT DEFINED") {
			if (retData['writeaccess'] == "w") {
				createboxmenu(contentid, boxid, boxtype);
				// Make room for the menu by setting padding-top equals to height of menubox
				if ($("#" + contentid + "menu").height() == null) {
					boxmenuheight = 0;
				} else {
					boxmenuheight = $("#" + contentid + "menu").height();
				}
				$("#" + contentid).css("margin-top", boxmenuheight);
			}
		}
	}

	var ranges = getBlockRanges(allBlocks);
	for (var i = 0; i < Object.keys(ranges).length; i++) {
		var boxid = Object.keys(ranges)[i];
		createBlocks(ranges[boxid], boxid);
	}

	//hides maximize button if not supported
	hideMaximizeAndResetButton();

	// Allows resizing of boxes on the page
	//If firefox is the browser do not allow resizing. (firefox resizing is currently)
	var userAgent = navigator.userAgent;

	if(userAgent.match(/firefox|fxios/i)){
		console.log('Resizing is broken in firefox');
	}

	resizeBoxes("#div2", retData["templateid"]);
	var titles = [...document.querySelectorAll('[contenteditable="true"]')];

	titles.forEach(title => {
		title.addEventListener('keypress', updateTitle);
	})

	fillBurger();

	if (querystring['showPane']) {
		showBox(querystring['showPane']);
	}

	resetBoxes();
}

function returnedTitle(data) {
	// Update title in retData too in order to keep boxtitle and boxtitle2 synced

	retData['box'][data.id - 1][4] = data.title;
	var boxWrapper = document.querySelector('#box' + data.id + 'wrapper');
	var titleSpan = boxWrapper.querySelector('#boxtitle2');
	titleSpan.innerHTML = data.title;
	fillBurger();
}

function handleFiles(files) {	
	var file = files[0];
    reader = new FileReader();

	const supportedFiles = ["js", "php", "html", "txt", "java", "sr", "sql"];
	
	for(let type of supportedFiles) {
		if (file.name.split('.').pop() === type) {
			console.log(reader.readAsText(file));
			break;
		}
	}

    reader.onload = event => {
		var iframe = document.getElementById("iframeFileed").contentWindow;
		showHiddenIframe();

		document.querySelector("#iframeFileed").addEventListener( "load", function(e) {
			// IFrame querys
			iframe.showFilePopUp('GFILE');
			iframe.document.querySelector('#uploadedfile').files = files;
			iframe.uploadDroppedFile();

			// Lastly, apply the new file to that of the code viewer
			updateContent(file.name);
		}, { once: true });
    };


}

function handleDrop(e)
{
	let dt = e.dataTransfer;
	let files = dt.files;

	handleFiles(files);
}

function initFileDropZone(id)
{
	dropArea = document.getElementById(id);

	['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => 
		{
		  dropArea.addEventListener(eventName, preventDefaults, false);
		})

		;['dragenter', 'dragover'].forEach(eventName => 
		{
		  dropArea.addEventListener(eventName, highlight, false)
		})

		;['dragleave', 'drop'].forEach(eventName => 
		{
		  dropArea.addEventListener(eventName, unhighlight, false)
		})

		dropArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults (e)
{
  e.preventDefault();
  e.stopPropagation();
}

//Supposed to highligt area when dragging file over drop-area: NOT WORKING CURRENTLY. - probably style.css related.
function highlight(e) 
{
	dropArea.classList.add('highlight');
}

//Supposed to darken the area when removing dragged file from drop-area: NOT WORKING CURRENTLY. - probably style.css related.
function unhighlight(e) 
{
	dropArea.classList.remove('highlight');
} 

//---------------------------------------------------------------------------------
// This functions convert tabs to "&#9;""
// The indexOf() method returns the position of the first time of a specified value
// (in this example is the search word "\t" which stands for tab) in a string.
// This method returns then -1 if the "search word" does not exist in the string.
// Text.slice truncates the text string were the tab is placed by useing tabindex
// as a index. And then adds "&#9;" to the text string. "&#9;" replace the tab
// utill "tokenize" functions is called then &#9; is being replaces by 4 spaces.
// So the loop will check the whole text the function assign "start" the value of
// tabindex so the loop can keep on looking for tabs in the same place where it left off
//                Is called by returned(data) in codeviewer.js
//---------------------------------------------------------------------------------

var tabLine = function (text) {
	var start = 0;
	var tabIndex;

	while ((tabIndex = text.indexOf('\t', start)) != -1) {
		text = text.slice(0, tabIndex) + "&#9; " + text.slice(tabIndex + 1);
		start = tabIndex;
	}
	return text;
};

//----------------------------------------------------------------------------------
// editImpWords: adds/removes important words to the #impword selectbox
// and stores each added/removed word in the addedWords array and the removedWords array
//                Is called at line 201/204 in codeviewer.php
//---------------------------------------------------------------------------------

var addedWords = [];
var removedWords = [];

function editImpWords(editType) 
{
	var word = document.getElementById("impword").value;
	var left = 0;
	var right = 0;
	//Check if the word contains an uneven amount of parenthesis
	// * if so do not add the word to important words, it will break the page
	for (var i = 0; i < word.length; i++) {
		if (word[i] == '(') {
			left++;
		} else if (word[i] == ')') {
			right++;
		}
	}
	//If there is an uneven amount set uneven
	var uneven = false;
	if (left != right) {
		uneven = true;
	}
	// word can't contain any whitespaces
	if (editType == "+" && word != "" && /\s/.test(word) == false && uneven == false) {
		var exists = false;
		// Checks if the word already exists as an option in the selectbox
		$('#impwords option').each(function () {
			if (this.value == word) {
				exists = true;
			}
		});
		if (exists == false) {
			$("#impwords")[0].innerHTML += '<option>' + word + '</option>';
			document.getElementById("impword").value = word;
			addedWords.push(word);
		}
	} else if (editType == "-") {
		word = $('option:selected', "#impwords").text();
		$('option:selected', "#impwords").remove();
		removedWords.push(word);
	}
}

//----------------------------------------------------------------------------------
// displayEditExample: Displays the dialogue box for editing a code example
//
//----------------------------------------------------------------------------------

function displayEditExample() {
	document.getElementById("title").value = $('<textarea />').html(retData['examplename']).text();
	document.getElementById("secttitle").value = $('<textarea />').html(retData['sectionname']).text();
	changeDirectory(document.getElementById("boxcontent"));
	document.getElementById("playlink").value = retData['playlink'];

	var iw = retData['impwords'];
	var str = "";
	for (var i = 0; i < iw.length; i++) {
		str += "<option>" + iw[i] + "</option>";
	}
	document.getElementById("impwords").innerHTML = str;
	
	// Set beforeid and afterid if set
	var beforeid = "UNK";
	if (retData['before'] !== null) {
		if (retData['before'].length !== 0) {
			beforeid = retData['before'][0][0];
		}
	}
	var afterid = "UNK";
	if (retData['after'] !== null) {
		if (retData['after'].length !== 0) {
			afterid = retData['after'][0][0];
		}
	}
	// Variables used to fetch filename for current codebox
	var bestr = "";
	var afstr = "";
	var ba = retData['beforeafter'];
	for (var i = 0; i < ba.length; i++) {
		if (ba[i][0] == beforeid) {
			bestr += "<option selected='selected' value='" + ba[i][0] + "'>" + ba[i][1] + ":" + ba[i][2] + "</option>";
		} else {
			bestr += "<option value='" + ba[i][0] + "'>" + ba[i][1] + ":" + ba[i][2] + "</option>";
		}
		if (ba[i][0] == afterid) {
			afstr += "<option selected='selected' value='" + ba[i][0] + "'>" + ba[i][1] + ":" + ba[i][2] + "</option>";
		} else {
			afstr += "<option value='" + ba[i][0] + "'>" + ba[i][1] + ":" + ba[i][2] + "</option>";
		}
	}
	document.getElementById("before").innerHTML += bestr;
	document.getElementById("after").innerHTML += afstr;
	document.getElementById("editExampleContainer").style.display = "flex";
}

//----------------------------------------------------------------------------------
// updateExample: Updates example data in the database if changed
//----------------------------------------------------------------------------------

function updateExample() {
	// Set beforeid if set
	var beforeid = "UNK";
	if (retData['before'].length != 0) {
		beforeid = retData['before'][0][0];
	}
	var afterid = "UNK";
	if (retData['after'].length != 0) {
		afterid = retData['after'][0][0];
	}

	// Checks if any field in the edit box has been changed, an update would otherwise be unnecessary
	if ((removedWords.length > 0) || (addedWords.length > 0) || ($("#before option:selected").val() != beforeid && beforeid != "UNK") || ($("#after option:selected").val() != afterid && afterid != "UNK") || ($("#playlink").val() != retData['playlink']) || ($("#title").val() != retData['examplename']) || ($("#secttitle").val() != retData['sectionname'])) {
		var courseid = querystring['courseid'];
		var cvers = querystring['cvers'];
		var exampleid = querystring['exampleid'];
		var playlink = document.getElementById("playlink").value;
		var examplename = document.getElementById("title").value;
		var sectionname = document.getElementById("secttitle").value;

		var beforeid = $("#before option:selected").val();
		var afterid = $("#after option:selected").val();

		AJAXService("EDITEXAMPLE", {
			courseid: courseid,
			cvers: cvers,
			exampleid: exampleid,
			beforeid: beforeid,
			afterid: afterid,
			playlink: playlink,
			examplename: examplename,
			sectionname: sectionname,
			addedWords: addedWords,
			removedWords: removedWords
		}, "CODEVIEW");

		// Clears the important words and prevents multiple inserts..
		addedWords = [];
		removedWords = [];
	}

	document.getElementById("editExampleContainer").style.display = "none"; 
}

function removeExample() {
	var courseid = querystring['courseid'];
	var cvers = querystring['cvers'];
	var exampleid = querystring['exampleid'];
	var lid = querystring['lid'];

	AJAXService("DELEXAMPLE", {
		courseid: courseid,
		cvers: cvers,
		exampleid: exampleid,
		lid: lid
	}, "CODEVIEW");
}

//----------------------------------------------------------------------------------
// displayEditContent: Displays the dialogue box for editing a content pane
//                Is called by createboxmenu in codeviewer.js
//----------------------------------------------------------------------------------

var openBoxID;

function displayEditContent(boxid) 
{
	editRowsEnterPress();
	document.getElementById("boxtitle2").removeAttribute("contenteditable");
	// The information stored about the box is fetched
	var box = retData['box'][boxid - 1];

	// Keeps track of the currently open box. Used when saving the box content.
	openBoxID = boxid;

	document.getElementById("boxtitle").value = box[4];
	document.getElementById("boxcontent").value = box[1];

	changeDirectory($("#boxcontent"));

	if (box[5] != null) {
		box[5] = box[5].replace(/&#47;/g, "/");
		document.getElementById("filename").value = box[5]; 
	} else {
		document.getElementById("filename").value = "";
	}

	document.getElementById("fontsize").value = box[6];

	var wordl = retData['wordlists'];
	var str = "";
	for (var i = 0; i < wordl.length; i++) {
		str += "<option value='" + wordl[i][0] + "'>" + wordl[i][1] + "</option>";
	}
	$("#wordlist").html(str);
	$("#wordlist").val(box[3]);

	var str = "";
	for (var i = 0; i < retData['improws'].length; i++) {
		if (retData['improws'][i][0] == boxid) {
			str += "<option>" + retData['improws'][i][1] + " - " + retData['improws'][i][2] + "</option>";
		}
	};
	document.getElementById("improws").innerHTML = str;

	document.getElementById("editContentContainer").style.display = "flex";
}
// -----------------------------------------------------------------------------------------------
// Listen to enterpress on "important rows" inputfield and runs the same function as the + button
// -----------------------------------------------------------------------------------------------

var enterPress; // Variable that is used to check enter press or button press
function editRowsEnterPress(){
	var inputRowFrom = document.getElementById("improwfrom");
	inputRowFrom.addEventListener("keypress", function(event) {
		if (event.key === "Enter") {
			enterPress = true;
			event.preventDefault();
			editImpRows("+");
		}
	});
	var inputRowTo = document.getElementById("improwto");
	inputRowTo.addEventListener("keypress", function(event) {
		if (event.key === "Enter") {
			enterPress = true;
			event.preventDefault();
			editImpRows("+"); 	
		}
	});	
}

//----------------------------------------------------------------------------------
// changeDirectory: Changes the directory in which you choose your code or description
// 					in the Edit Content box.
//----------------------------------------------------------------------------------

function changeDirectory(kind) {
	var dir;
	var str = "";

	var kindNum;
	if (kind.id) {
		kindNum = kind.id.split('_')[1];
	}

	if (kindNum) {
		var chosen = document.getElementById("filename_" + kindNum).value;
		var wordlist = document.getElementById('wordlist_' + kindNum);
		var filenameBox = document.getElementById("filename_" + kindNum);
	} else {
		var chosen = document.getElementById("filename").value;
		var wordlist = document.getElementById('wordlist');
		var filenameBox = document.getElementById("filename");
	}

	if ($(kind).val() == "CODE") {
		dir = retData['directory'][0];
		wordlist.disabled = false;
	} else if ($(kind).val() == "IFRAME") {
		dir = retData['directory'][2];
		wordlist.disabled = 'disabled';
	} else if ($(kind).val() == "DOCUMENT") {
		dir = retData['directory'][1];
		wordlist.value = '4';
		wordlist.disabled = 'disabled';
	}

	// Fill the file selection dropdown with files
	//---------------------------------------------------------------------

	for (var i = 0; i < dir.length; i++) {
		if (chosen == dir[i].filename) {
			str += "<option selected='selected' value='" + dir[i].filename.replace(/'/g, '&apos;') + "'>" + dir[i].filename + "</option>";
		} 
		else if (dir[i].filename == "---===######===---"){
			str += "<option disabled hidden value='" + dir[i].filename.replace(/'/g, '&apos;') + "'>" + dir[i].filename + "</option>"
		}
		else {
			str += "<option value='" + dir[i].filename.replace(/'/g, '&apos;') + "'>" + dir[i].filename + "</option>";
		}
	}



	filenameBox.innerHTML = str;
	document.getElementById("playlink").innerHTML = str;
}

//----------------------------------------------------------------------------------
// btnPress reset a boolean when the "+" button is pressed
//----------------------------------------------------------------------------------
function btnPress(){
	enterPress = false;
}
//----------------------------------------------------------------------------------
// editImpRows: Adds and removes important rows
//                Is called at line 165/169 in EditorV50.php
//----------------------------------------------------------------------------------

var addedRows = new Array();
var removedRows = new Array();

function editImpRows(editType) 
{
	var rowFrom = parseInt(document.getElementById("improwfrom").value);
	var rowTo = parseInt(document.getElementById("improwto").value);
	var row = document.getElementById("improwfrom").value + " - " + document.getElementById("improwto").value;
	
	if (editType == "+" &&
		rowFrom <= rowTo &&
		rowFrom > 0 &&
		rowTo > 0) {
		var exists = false;
		$('#improws option').each(function () {
			if (this.value == row) {
				exists = true;
			}
		});

		if (exists == false) {
			document.getElementById("improws").innerHTML += '<option>' + row + '</option>';
			document.getElementById("improwfrom").value ="";
			document.getElementById("improwto").value ="";
			addedRows.push([openBoxID, rowFrom, rowTo]);
		}
	} else if (editType == "-") {
		FromTo = $('option:selected', "#improws").text().split(" - ");
		$('option:selected', "#improws").remove();
		removedRows.push([openBoxID, FromTo[0], FromTo[1]]);

	} else if (enterPress === false){
		//alert("editType == +: " + (editType=="+") + " (rowFrom <= rowTo): " + (rowFrom <= rowTo) + " (rowFrom > 0): " + (rowFrom > 0) + " (rowTo > 0): " + (rowTo > 0) + " rowFrom: " + rowFrom + " rowTo: " + rowTo);
		alert("Incorrect value(s) (from: " + rowFrom + " to: " + rowTo + ")  for important rows!");
	}
}

//----------------------------------------------------------------------------------
// updateContent: Updates the box if changes has been made
//----------------------------------------------------------------------------------

function updateContent(file) 
{
	var box = retData['box'][openBoxID - 1];
	var useBoxContent = true;

	// Default to using openbox data and use regular retData as fallback incase it's not open
	if (!box) {
		useBoxContent = false;
		box = retData['box'][retData['box'].length - 1];
	}

		
	// Check if a drag and drop instance is created
	if(file != null){
		var useBoxContent = true;
		filename = file;
	}
	else{
		var filename = $("#filename option:selected").val();
	}

	// First a check to is done to see if any changes has been made, then the new values are assigned and changed
	// TODO: Handle null values
	if (useBoxContent) {
		if (box[1] != document.querySelector("#boxcontent").value || box[3] != document.querySelector("#wordlist").value || box[4] != document.querySelector("#boxtitle").value || box[5] != $("#filename option:selected").val() || box[6] != $("#fontsize option:selected").val() || addedRows.length > 0 || removedRows.length > 0) {
			try {
				var boxtitle = document.querySelector("#boxtitle").value;
				var boxcontent = $("#boxcontent option:selected").val();
				var wordlist = document.querySelector("#wordlist").value;
				var fontsize = $("#fontsize option:selected").val();
				var exampleid = querystring['exampleid'];
				var boxid = box[0];

				AJAXService("EDITCONTENT", {courseid: querystring['courseid'], exampleid: exampleid, boxid: boxid, boxtitle: boxtitle, boxcontent: boxcontent, wordlist: wordlist, filename: filename, fontsize: fontsize, removedRows: removedRows, addedRows: addedRows}, "BOXCONTENT");				

				addedRows = [];
				removedRows = [];
			} catch (e) {
				alert("Error when updating content: " + e.message);
			}
			setTimeout("location.reload()", 500);
		}
	} else {
		if (box[4] != document.querySelector("#boxtitle2").textContent) {
			try {
				AJAXService("EDITTITLE", {exampleid: querystring['exampleid'], courseid: querystring['courseid'], boxid: box[0], boxtitle: document.querySelector("#boxtitle").textContent}, "BOXTITLE");
			} catch (e) {
				alert("Error when updating content: " + e.message);
			}
		}
	}
}

/*-----------------------------------------------------------------------
  -              updateTitle: Updates the title being edited            -
  -----------------------------------------------------------------------*/
function updateTitle(e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		var titleSpan = e.target;
		var box = titleSpan.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
		var boxid = box.id.substring(3, 4);
		var title = titleSpan.innerHTML.replace(/&nbsp;/g, '');

		// Trim title, max characters allowed is 20
		title = title.trim();
		if (title.length > 20) {
			title = title.substring(0, 20);
		}
		title = title.trim(); // Trim title again if the substring caused trailing whitespaces



		AJAXService("EDITTITLE", {
			exampleid: querystring['exampleid'],
			courseid: querystring['courseid'],
			boxid: boxid,
			boxtitle: title
		}, "BOXTITLE");
		window.getSelection().removeAllRanges();
		titleSpan.blur();
	}
}
//----------------------------------------------------------------------------------
// addTemplatebox: Adds a new template box to div2
//				   Is called by returned(data) in codeviewer.js
//----------------------------------------------------------------------------------

function addTemplatebox(id) {
	str = "<div id='" + id + "wrapper' ";
	if (id == ("box" + retData['numbox'])) {
		str += "class='boxwrapper activebox'>";
	} else {
		str += "class='boxwrapper deactivatedbox'>";
	}
	// Add copy to clipboard notification. Must be added here for everything to work correctly.
	str += "<div id='notification" + id + "' class='copy-notification'><img src='../Shared/icons/Copy.svg' />Copied To Clipboard</div>";
	str += "<div id='" + id + "' class='box'></div>";
	str += "</div>";

	str = str + document.getElementById("div2").innerHTML;
	document.getElementById("div2").innerHTML = str;
}

//----------------------------------------------------------------------------------
// createboxmenu: Creates the menu at the top of a box.
//                Is called by returned(data) in codeviewer.js
//----------------------------------------------------------------------------------

function createboxmenu(contentid, boxid, type) {
	if ($("#" + contentid + "menu").length == 0) {
		var boxmenu = document.createElement("div");
		$("#" + contentid + "wrapper").append(boxmenu);
		boxmenu.setAttribute("class", "buttomenu2 buttomenu2Style");
		boxmenu.setAttribute("id", contentid + "menu");

		var str = "<table cellspacing='2'><tr>";

		// If reader has write access the settings button is shown along with box title
		if (retData['writeaccess'] == "w") {
			if (type == "DOCUMENT") {
				str += "<td class='butto2 editcontentbtn showdesktop codedropbutton' id='settings' title='Edit box settings' onclick='displayEditContent(" + boxid + ");' ><img src='../Shared/icons/general_settings_button.svg' /></td>";
				str += '<td id = "boxtitlewrapper" class="butto2 boxtitlewrap" title="Title"><span id="boxtitle2" class="boxtitleEditable" onblur="updateContent();">' + retData['box'][boxid - 1][4] + '</span></td>';
				str += "<div id='iframeBoxes'><td class='butto2 editbtn' onclick='showIframe(\""+boxid+"\",\""+kind +"\");'><img title='Edit file' class='markdownIcon' src='../Shared/icons/newMarkdown.svg'></div>";
			} else if (type == "CODE") {
				str += "<td class='butto2 editcontentbtn showdesktop codedropbutton' id='settings' title='Edit box settings' onclick='displayEditContent(" + boxid + ");' ><img src='../Shared/icons/general_settings_button.svg' /></td>";
				str += '<td id = "boxtitlewrapper" class="butto2 boxtitlewrap" title="Title"><span id="boxtitle2" class="boxtitleEditable" onblur="updateContent();">' + retData['box'][boxid - 1][4] + '</span></td>';
				str += "<div id='iframeBoxes'><td class='butto2 editbtn' onclick='showIframe(\""+boxid+"\",\""+kind +"\");'><img title='Edit file' class='markdownIcon' src='../Shared/icons/newMarkdown.svg'></div>";
			} else if (type == "IFRAME") {
				str += "<td class='butto2 editcontentbtn showdesktop codedropbutton' id='settings' title='Edit box settings' onclick='displayEditContent(" + boxid + ");' ><img src='../Shared/icons/general_settings_button.svg' /></td>";
				str += '<td id = "boxtitlewrapper" class="butto2 boxtitlewrap" title="Title"><span id="boxtitle2" class="boxtitleEditable" onblur="updateContent();">' + retData['box'][boxid - 1][4] + '</span></td>';
				str += "<div id='iframeBoxes'><td class='butto2 editbtn' onclick='showIframe(\""+boxid+"\",\""+kind +"\");'><img title='Edit file' class='markdownIcon' src='../Shared/icons/newMarkdown.svg'></div>";
			} else {
				str += "<td class='butto2 showdesktop'>";
				str += "<select class='chooseContentSelect' onchange='changeboxcontent(this.value,\"" + boxid + "\",\"" + contentid + "\");removeboxmenu(\"" + contentid + "menu\");'>";
				str += "<option>Choose content</option>";
				str += "<option value='CODE'>Code example</option>";
				str += "<option value='DOCUMENT'>Description section</option>";
				str += "</select>";
				str += '</td>';
			}
			// If reader doesn't have write access, only the boxtitle is shown
		} else {
			str += '<td id="boxtitlewrapper" class="boxtitlewrap"><span class="boxtitle">' + retData['box'][boxid - 1][4] + '</span></td>';
		}

		if(retData['box'][boxid - 1][1] == "DOCUMENT"){
			var kind = 2;
		}
		if(retData['box'][boxid - 1][1] == "CODE"){
			var kind = 3;
		}
		if(retData['box'][boxid - 1][1] == "PREVIEW"){
			var kind = 2;
		}

		// Add resize, reset and edit buttons
		str += "<div id='maximizeBoxes'><td class='butto2 maximizebtn' title='Maximize box' onclick='maximizeBoxes(" + boxid + ");'><img src='../Shared/icons/MaxButton.svg' /></div>";
		str += "<div id='minimizeBoxes'><td class='butto2 minimizebtn' title='Minimize box' onclick='minimizeBoxes(" + boxid + ");'><img src='../Shared/icons/MinButton.svg' /></div>";
		str += "<div id='resetBoxes'><td class='butto2 resetbtn' title='Reset' onclick='resetBoxes();'><img src='../Shared/icons/ResetButton.svg' /></div>";
    

		// Show the copy to clipboard button for code views only
		if (type == "CODE") {
			str += "<td class='butto2 copybutton' id='copyClipboard' title='Copy to clipboard' onclick='copyCodeToClipboard(" + boxid + ");' ><img id='copyIcon' src='../Shared/icons/Copy.svg' /></td>";
		}
		
		str += '</tr></table>';
		boxmenu.innerHTML = str;
		$(boxmenu).click(function (event) {
			if ($(window).width() <= 1100) {
				toggleClass($("#" + boxmenu.parentNode.id).attr("id"));
			}
		});
		initFileDropZone(contentid);
	}
}

//----------------------------------------------------------------------------------
// toggleClass: Modifies class using Jquery to contain "activebox" class selector
//				Used by createboxmenu(contentid, boxid, type) in codeviewer.js
//----------------------------------------------------------------------------------

function toggleClass(id) {
	var className = document.getElementById(id).getAttribute('class');
	var box = document.querySelector(".boxwrapper");
	box.classList.add("deactivatedbox");
	box.classList.remove("activebox");
	if (className.indexOf("activebox") > -1) {
		var removeActivebox = document.getElementById(id)
		removeActivebox.classList.remove("activebox");
		removeActivebox.classList.add("deactivatedbox");
	} else {
		var addActivebox = document.getElementById(id);
		addActivebox.classList.remove("deactivatedbox");
		addActivebox.classList.add("activebox");
	}
}

//----------------------------------------------------------------------------------
// displayDrop: Modifies class using Jquery to contain "activebox" class selector
//				TODO: Check if actually used, could not find within our files
//                Is called by [this function] in [this file]
//----------------------------------------------------------------------------------

function displayDrop(dropid) {
	drop = $("#" + dropid);
	if ($(drop).is(":hidden")) {
		$(".dropdown").css({
			display: "none"
		});
		drop.style.display = "block";
	} else {
		drop.style.display = "none";
	}
}

//----------------------------------------------------------------------------------
// highlightop: Highlights and Dehighlights an operator and corresponding operator in code window
//                Is called by rendercode in codeviewer.js
//----------------------------------------------------------------------------------

function highlightop(otherop, thisop) {
	document.getElementById(otherop).classList.toggle("hi");
	document.getElementById(thisop).classList.toggle("hi");
}

//----------------------------------------------------------------------------------
// highlightHtml: Highlights and Dehighlights an html-tag and corresponding html-tag in code window
//                Is called by rendercode in codeviewer.js
//----------------------------------------------------------------------------------

function highlightHtml(otherTag, thisTag) {
	document.getElementById(otherTag).classList.toggle("html");
	document.getElementById(thisTag).classList.toggle("html");
}	

//Arrays containing HTML attributes and event-attributes. Needs to be filled with a complete list of attributes, the array contains only the most common ones for now.
htmlAttrArray = new Array('action', 'class', 'disabled', 'href', 'id', 'rel', 'src', 'style', 'title', 'type');
htmlEventArray = new Array('onclick', 'onmouseout', 'onmouseleave', 'onmouseover', 'onmouseenter','onload', 'onkeydown','onkeyup','onkeypress','oninput');

//----------------------------------------------------------------------------------
// 	popupDocumentation: Creates a pop-up window containing relevant documentation to a
//	specified important word that has been clicked. Diffrent types of documentation
//	appears for different kinds of words clicked on (HTML documentation directs to W3Schools, PHP
//	documentation directs to PHP.net).    
//----------------------------------------------------------------------------------

function popupDocumentation(id, lang) {
	var url;

	// If id exists in htmlArray, change type of popup to HTML Tag (if id is "var", send to PHP-documentation anyways due to var being a PHP variable). 
	// This is used to prevent HTML tags within PHP code from sending PHP-documentation.
	if(htmlArray.includes(id) && id != "var"){
		lang = "html";
	}
	if(cssArray.includes(id)){
		lang = "css";
	}
	if(lang == "html"){
		var elementValue = document.getElementById(id).textContent;
		// Change HTML h1-h6 tags to hn in order to link to correct documentation.
		if(elementValue == "h1" || elementValue == "h2" || elementValue == "h3" || elementValue == "h4" || elementValue == "h5" || elementValue == "h6"){
			elementValue = "hn";
		}
		url = "https://www.w3schools.com/tags/tag_"+elementValue+".asp";
	}else if(lang == "multi"){
		if(htmlAttrArray.includes(id)){
			url = "https://www.w3schools.com/tags/att_"+id+".asp";
		}else if(htmlEventArray.includes(id)){
			url = "https://www.w3schools.com/tags/ev_"+id+".asp";
		}else{
			url = "https://www.php.net/results.php?q="+id+"&l=en&p=all";
		}
	}else if(lang == "css"){
		url = "https://www.w3schools.com/css/";
	}else{
		url ="https://www.google.com/search?q="+id;
	}
	window.open(url,'popup','width=600, height=600');
}

//----------------------------------------------------------------------------------
// Skip: Handles skipping either forward or backward. If pressed show menu
//                Is called by createhotdogmenu in codeviewer.js
// TODO: Check usage of function now that DragNDrop of example order is
// implemented
//----------------------------------------------------------------------------------

var dmd;

function Skip(skipkind) 
{
	if (skipkind == "bd") {
		dmd = 1;
	} else if (skipkind == "bu") {
		if (retData['before'].length != 0 && dmd == 1) {
			navigateExample(retData['before'][0][0]);
		}
		dmd = 0;
	}
	if (skipkind == "fd") {
		dmd = 2;
	} else if (skipkind == "fu") {
		if (retData['after'].length != 0 && dmd == 2) {
			navigateExample(retData['after'][0][0]);
		}
		dmd = 0;
	}
	if (skipkind == "bd" || skipkind == "fd") {
		document.getElementById("forwdrop").style.display = "none";
		document.getElementById("backwdrop").style.display = "none";
	}

	setTimeout(function () {
		execSkip()
	}, 1000);
}

//----------------------------------------------------------------------------------
// execSkip:
//				Used by Skip in codeviewer.js
//----------------------------------------------------------------------------------

function execSkip() {
	str = "";
	
	//Holding backwards button
	if (dmd == 1) {

		for (i = 0; i < retData['before'].length; i++) {
			str += "<span id='F" + retData['before'][i][1] + "' onclick='navigateExample(\"" + retData['before'][i][0] + "\")' class='dropdownitem dropdownitemStyle'>" + retData['before'][i][1] + ":" + retData['before'][i][2] + "</span>";		
		}
		document.getElementById("backwdropc").innerHTML = str;
		document.getElementById("backwdrop").style.display = "block";
		dmd = 0;
	} 
	
	//Holding forwards button
	else if (dmd == 2) {

		for (i = 0; i < retData['after'].length; i++) {
			str += "<span id='F" + retData['after'][i][1] + "' onclick='navigateExample(\"" + retData['after'][i][0] + "\")' class='dropdownitem dropdownitemStyle'>" + retData['after'][i][1] + ":" + retData['after'][i][2] + "</span>";
		}
		document.getElementById("forwdropc").innerHTML = str;
		document.getElementById("forwdrop").style.display = "block";
		dmd = 0;
	}

	//Hides dropdown if click outside.
	document.addEventListener("click", function (e) {
		// Code to make it do not disappear when you hold 1s.
		if(document.getElementById("afterbutton").contains(e.target) || document.getElementById("beforebutton").contains(e.target)){
		
		}
		else if (!document.getElementById("backwdrop").contains(e.target) || !document.getElementById("forwdrop").contains(e.target)) {
			
			document.getElementById("backwdrop").style.display = "none";
			document.getElementById("forwdrop").style.display = "none";

		}
	});
	
}

//Retrieve height for building menu.
$(window).load(function () {
	var windowHeight = $(window).height();
	textHeight = windowHeight - 50;
	$("#table-scroll").css("height", textHeight);
});

$(window).resize(function () {
	var windowHeight = $(window).height();
	textHeight = windowHeight - 50;
	$("#table-scroll").css("height", textHeight);

});

document.addEventListener("drop", function (e) {
	// cancel drop
	e.preventDefault();
});

/********************************************************************************

   UI Hookups

*********************************************************************************/

//----------------------------------------------------------------------------------
// changeboxcontent: Called when the contents of the boxes at the top of a content div is changed
// 					Used by createboxmenu in codeviewer.js
//----------------------------------------------------------------------------------

function changeboxcontent(boxcontent, boxid) {
	AJAXService("changeboxcontent", "&boxid=" + boxid + "&boxcontent=" + boxcontent);
}

/********************************************************************************

   HTML freeform editing code

*********************************************************************************/

//----------------------------------------------------------
// highlightKeyword: Highlights and Dehighlights an important word from the important word list
//                Is called by [this function] in codeviewer.js
//----------------------------------------------------------

function highlightKeyword(kw) {
	kwDoubleQuotes = '"'+kw+'"';
	kwSingleQuote = "'"+kw+"'";

	$(".impword").each(function () {
		if(this.classList.contains("imphi")){
			this.classList.remove("imphi");
		}
		else if(this.innerHTML == kw || this.innerHTML == kwDoubleQuotes || this.innerHTML == kwSingleQuote) {
			this.classList.add("imphi");
		}
	});
}

/********************************************************************************

   Tokenizer

*********************************************************************************/

//----------------------------------------------------------
// Token class and storage definition
//                Is called by [this function] in [this file]
//----------------------------------------------------------

function token(kind, val, fromchar, tochar, row) {
	this.kind = kind;
	this.val = val;
	this.from = fromchar;
	this.to = tochar;
	this.row = row;
}

//----------------------------------------------------------
// Store token in tokens array
// Creates a new token object using the constructor
//                Is called by [this function] in [this file]
//----------------------------------------------------------

function maketoken(kind, val, from, to, rowno) {
	newtoken = new token(kind, val, from, to, rowno);
	tokens.push(newtoken);
}

//----------------------------------------------------------
// Writes error from tokenizer
//                Is called by [this function] in [this file]
//----------------------------------------------------------

function error(str, val, row) {
	var debug = "Tokenizer error: " + str + val + " at row " + row;
	alert("Tokenizer Error: " + str + val + " at row " + row);
}

//----------------------------------------------------------------------------------
// replaceAll: Used by tokenizer to replace all instances of find string with replace string in str.
//             The idea behind this is to  cancel the html entities introduced to allow streaming of content
//                Is called by [this function] in [this file]
//----------------------------------------------------------------------------------

function replaceAll(find, replace, str) {
	return str.replace(new RegExp(find, 'g'), replace);
}

//----------------------------------------------------------
// Tokenize: Tokenizer partly based on ideas from the very clever tokenizer written by Douglas Cockford
//           The tokenizer is passed a string, and a string of prefix and suffix terminators
//                Is called by [this function] in [this file]
//----------------------------------------------------------

function tokenize(instring, inprefix, insuffix) {
	// replace HTML-entities
	instring = replaceAll("&amp;", "&", instring);
	instring = replaceAll("&#9;", " ", instring);

	var from; // index of the start of the token.
	var i = 0; // index of the current character.
	var length = instring.length; // length of the string
	var currentCharacter; // current character.
	var currentNum; // current numerical value
	var currentQuoteChar; // current quote character
	var currentStr; // current string value.
	var currentBlock = {}; // current block value.
	var row = 1; // current row value

	currentCharacter = instring.charAt(i);
	while (currentCharacter) { // currentCharacter == first character in each word
		from = i;
		if (currentCharacter <= ' ') { // White space and carriage return
			if((currentCharacter=='\n')||(currentCharacter=='\r')||(currentCharacter =='')){
				maketoken('newline',"",i,i,row);
				currentStr="";
				row++;
			}else{
				currentStr=currentCharacter;
			}
				
			i++;
			while(true){
				currentCharacter=instring.charAt(i);
				if(currentCharacter>' '||!currentCharacter) break;
				if((currentCharacter=='\n')||(currentCharacter=='\r')||(currentCharacter =='')){
					maketoken('whitespace',currentStr,from,i,row);				                
					maketoken('newline',"",i,i,row);
					currentStr="";
					// White space Row (so we get one white space token for each new row) also increase row number
					row++;
				}else{
					currentStr += currentCharacter;
				}
				i++;
			}
			if(currentStr!="") maketoken('whitespace',currentStr,from,i,row);
		} else if ((currentCharacter >= 'a' && currentCharacter <= 'z') || (currentCharacter >= 'A' && currentCharacter <= 'Z')) { // Names i.e. Text
			currentStr = currentCharacter;
			i++;
			while (true) {
				currentCharacter = instring.charAt(i);
				if ((currentCharacter >= 'a' && currentCharacter <= 'z') || (currentCharacter >= 'A' && currentCharacter <= 'Z') || (currentCharacter >= '0' && currentCharacter <= '9') || currentCharacter == '_') {
					currentStr += currentCharacter;
					i++;
				} else {
					break;
				}
			}
			maketoken('name', currentStr, from, i, row);
		} else if (currentCharacter >= '0' && currentCharacter <= '9') { // Number token
			currentStr = currentCharacter;
			i++;
			while (true) {
				currentCharacter = instring.charAt(i);
				if (currentCharacter < '0' || currentCharacter > '9') break;
				i++;
				currentStr += currentCharacter;
			}
			if (currentCharacter == '.') {
				i++;
				currentStr += currentCharacter;
				for (;;) {
					currentCharacter = instring.charAt(i);
					if (currentCharacter < '0' || currentCharacter > '9') break;
					i++;
					currentStr += currentCharacter;
				}
			}
			if (currentCharacter == '#') {
				for (var j = 0; j <= 6; j++) {
					if ((currentCharacter >= '0' || currentCharacter <= '9') || (currentCharacter >= 'a' || currentCharacter <= 'f') || (currentCharacter >= 'A' || currentCharacter <= 'F')) {
						i++;
						currentStr += currentCharacter;
						currentCharacter = instring.charAt(i);
					} else {
						break;
					}
				}
				i++;
				currentStr += currentCharacter;
				currentCharacter = instring.charAt(i);

				if (currentCharacter == 'e' || currentCharacter == 'E') {
					i++;
					currentStr += currentCharacter;
					currentCharacter = instring.charAt(i);
					if (currentCharacter == '-' || currentCharacter == '+') {
						i += 1;
						currentStr += currentCharacter;
						currentCharacter = instring.charAt(i);
					}
					if (currentCharacter < '0' || currentCharacter > '9') error('Bad Exponent in Number: ', currentStr, row);
					do {
						i++;
						currentStr += currentCharacter;
						currentCharacter = instring.charAt(i);
					} while (currentCharacter >= '0' && currentCharacter <= '9');
				}

				if (currentCharacter >= 'a' && currentCharacter <= 'z') {
					//if currentStr is not finite (aka non-numerical) then it is a bad number!
					if (!isFinite(currentStr)) {
						currentStr += currentCharacter;
						i += 1;
						error('Bad Number: ', currentStr, row);
					}
				}
			}

			currentNum = currentStr;

			if (isFinite(currentNum)) {
				maketoken('number', currentNum, from, i, row);
			} else {
				error('Bad Number: ', currentStr, row);
			}
		} else if (currentCharacter == '\'' || currentCharacter == '"') { // String .. handles c style breaking codes. Ex: "elem" or "text"
			currentStr = '';
			currentQuoteChar = currentCharacter;
			i++;
			while (true) {
				currentCharacter = instring.charAt(i);
				if (currentCharacter < ' ') {
					if ((currentCharacter == '\n') || (currentCharacter == '\r') || (currentCharacter == '')) row++; // Add row if this white space is a row terminator
					/* Added a multiline string handler, no error message needed
					error('Unterminated String: ', currentStr, row);
					break; */
				}

				if (currentCharacter == currentQuoteChar) break;

				if (currentCharacter == '\\') {
					i += 1;
					if (i >= length) {
						error('Unterminated String: ', currentStr, row);
						break;
					}
					currentCharacter = instring.charAt(i);
					nextCharacter = instring.charAt(i+1);

					if (currentCharacter == 'b') {
						if (nextCharacter == currentQuoteChar) {
							currentCharacter = "\\b";
						} else {
							currentCharacter = '\b';
							break;
						}
					}
					if (currentCharacter == 'f') {
						if (nextCharacter == currentQuoteChar) {
							currentCharacter = "\\f";
						} else {
							currentCharacter = '\f';
							break;
						}
					}
					if (currentCharacter == 'n') {
						if (nextCharacter == currentQuoteChar) {
							currentCharacter = "\\n";
						} else {
							currentCharacter = '\n';
							break;
						}
					}
					if (currentCharacter == 'r') {
						if (nextCharacter == currentQuoteChar) {
							currentCharacter = "\\r";
						} else {
							currentCharacter = '\r';
							break;
						}
					}
					if (currentCharacter == 't') {
						if (nextCharacter == currentQuoteChar) {
							currentCharacter = "\\t";
						} else {
							currentCharacter = '\t';
							break;
						}
					}
					if (currentCharacter == 'u') {
						if (i >= length) {
							error('Unterminated String: ', currentStr, row);
							break;
						}
						currentCharacter = parseInt(this.substr(i + 1, 4), 16);
						if (!isFinite(currentCharacter) || currentCharacter < 0) {
							error('Unterminated String: ', currentStr, row);
							break;
						}
						currentCharacter = String.fromCharCode(currentCharacter);
						i += 4;
						break;
					}
				}
				currentStr += currentCharacter;
				i++;
			}
			i++;
			maketoken('string', currentCharacter + currentStr + currentCharacter, from, i, row);
			currentCharacter = instring.charAt(i);

		} else if (currentCharacter == '/' && instring.charAt(i + 1) == '/') { // Comment of // type ... does not cover block comments
			i++;
			currentStr = currentCharacter;
			while (true) {
				currentCharacter = instring.charAt(i);
				if (currentCharacter == '\n' || currentCharacter == '\r' || currentCharacter == '') {
					break;
				} else {
					currentStr += currentCharacter;
				}
				i++;
			}
			maketoken('rowcomment', currentStr, from, i, row);
			/* This does not have to be here because a newline creates in coderender function
			maketoken('newline',"",i,i,row); */

		} else if (currentCharacter == '<' && instring.charAt(i + 1) == '!' && instring.charAt(i + 2) == '-' && instring.charAt(i + 3) == '-') { // Comment of <!-- type
			i++;
			currentStr = currentCharacter;
			while (true) {
				currentCharacter = instring.charAt(i);
				if (currentCharacter == '\n' || currentCharacter == '\r' || currentCharacter == '') {
					break;
				} else {
					currentStr += currentCharacter;
				}
				i++;
			}
			maketoken('rowcomment', currentStr, from, i, row);

		} else if (currentCharacter == '/' && instring.charAt(i + 1) == '*') { // Block comment of /* type
			i++;
			currentStr = currentCharacter;
			while (true) {
				currentCharacter = instring.charAt(i);
				if ((currentCharacter == '*' && instring.charAt(i + 1) == '/') || (i == length)) {
					currentStr += "*/"
					i += 2;
					currentCharacter = instring.charAt(i);
					break;
				}
				if (currentCharacter == '\n' || currentCharacter == '\r' || currentCharacter == '') {
					// don't make blockcomment or newline if currentStr is empty
					if (currentStr != "") {
						maketoken('blockcomment', currentStr, from, i, row);
						maketoken('newline', "", i, i, row);
						row++;
						currentStr = "";
					}
				} else {
					currentStr += currentCharacter;
				}
				i++;
			}
			maketoken('blockcomment', currentStr, from, i, row);
		} else if (inprefix.indexOf(currentCharacter) >= 0) { // Multi-character Operators
			currentStr = currentCharacter;
			i++;
			while (true) {
				currentCharacter = instring.charAt(i);
				if (i >= length || insuffix.indexOf(currentCharacter) < 0) {
					break;
				}
				currentStr += currentCharacter;
				i++;
			}
			maketoken('operator', currentStr, from, i, row);
		} else { // Single-character Operators
			i++;
			maketoken('operator', currentCharacter, from, i, row);
			currentCharacter = instring.charAt(i);
		}
	}
  
  console.log(tokens);
}

//----------------------------------------------------------------------------------
//	Function to change the popoverbox for different html tags
//	The case name is the name of the html tag
//----------------------------------------------------------------------------------

function popoverbox(titleData) {
	var popoverMessage = "test";
	if (titleData == "html") {
		popoverMessage = "Defines the root of an HTML document";
	} else if (titleData == "head") {
		popoverMessage = "Defines information about the document";
	} else if (titleData == "body") {
		popoverMessage = "Defines the document's body";
	} else if (titleData == "div") {
		popoverMessage = "Defines a section in a document";
	} else if (titleData == "span") {
		popoverMessage = "Defines a section in a document";
	} else if (titleData == "doctype") {
		popoverMessage = "An instruction to the web browser about what version of HTML the page is written in";
	} else if (titleData == "") {
		popoverMessage = "";
	}

	return popoverMessage;
}

//----------------------------------------------------------------------------------
// Renders a set of tokens from a string into a code viewer div
// Requires tokens created by a cockford-type tokenizer
//                Is called by [this function] in [this file]
//----------------------------------------------------------------------------------

function rendercode(codestring, boxid, wordlistid, boxfilename) {
	var destinationdiv = "box" + boxid;
	tokens = [];

	important = [];
	for (var i = 0; i < retData.impwords.length; i++) {
		important[i] = retData.impwords[i];
	}

	keywords = [];
	for (var i = 0; i < retData['words'].length; i++) {
		if (retData['words'][i][0] == wordlistid) {
			keywords[retData['words'][i][1]] = retData['words'][i][2];
		}
	}

	improws = [];
	for (var i = 0; i < retData.improws.length; i++) {
		if ((retData['improws'][i][0]) == boxid) {
			improws.push(retData.improws[i]);
		}
	}
	tokenize(codestring, "<>+-&", "=>&:");

	// Iterate over token objects and print kind of each token and token type in window
	printout = $("#" + destinationdiv);
	str = "";
	cont = "";
	lineno = 0;
	str += "<div id='textwrapper" + boxid + "' class='normtextwrapper'>";

	pcount = 0;
	parenthesis = new Array();
	bcount = 0;
	bracket = new Array();
	cbcount = 0;
	cbracket = new Array();

	htmlArray = new Array('wbr', 'video', 'u', 'time', 'template', 'svg', 'summary', 'section', 's', 'ruby', 'rt', 'rp', 'progress', 'picture', 'output', 'nav', 'meter', 'mark', 'main', 'img', 'iframe', 'header', 'footer', 'figure', 'figcaption', 'dialog', 'details', 'datalist', 'data', 'bdi', 'audio', 'aside', 'article', 'html', 'head', 'body', 'div', 'span', 'doctype', 'title', 'link', 'meta', 'style', 'canvas', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'abbr', 'acronym', 'address', 'bdo', 'blockquote', 'cite', 'q', 'code', 'ins', 'del', 'dfn', 'kbd', 'pre', 'samp', 'var', 'br', 'a', 'base', 'img', 'area', 'map', 'object', 'param', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot', 'col', 'colgroup', 'caption', 'form', 'input', 'textarea', 'select', 'option', 'optgroup', 'button', 'label', 'fieldset', 'legend', 'script', 'noscript', 'b', 'i', 'tt', 'sub', 'sup', 'big', 'small', 'hr', 'relativelayout', 'textview', 'webview', 'manifest', 'uses', 'permission', 'application', 'activity', 'intent');
	htmlArrayNoSlash = new Array('area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'textview', 'webview', 'uses');
	cssArray = new Array('accelerator', 'azimuth', 'background', 'background-attachment', 'background-color', 'background-image', 'background-position', 'background-position-x', 'background-position-y', 'background-repeat', 'behavior', 'border', 'border-bottom', 'border-bottom-color', 'border-bottom-style', 'border-bottom-width', 'border-collapse', 'border-color', 'border-left', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right',
		'border-right-color', 'border-right-style', 'border-right-width', 'border-spacing', 'border-style', 'border-top', 'border-top-color', 'border-top-style', 'border-top-width', 'border-width', 'bottom', 'caption-side', 'clear', 'clip', 'color', 'content', 'counter-increment', 'counter-reset', 'cue', 'cue-after', 'cue-before', 'cursor', 'direction', 'display', 'elevation', 'empty-cells', 'filter', 'float', 'font', 'font-family', 'font-size',
		'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'height', 'ime-mode', 'include-source', 'layer-background-color', 'layer-background-image', 'layout-flow', 'layout-grid', 'layout-grid-char', 'layout-grid-char-spacing', 'layout-grid-line', 'layout-grid-mode', 'layout-grid-type', 'left', 'letter-spacing', 'line-break', 'line-height', 'list-style', 'list-style-image', 'list-style-position', 'list-style-type', 'margin',
		'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'marker-offset', 'marks', 'max-height', 'max-width', 'min-height', 'min-width', '-moz-binding', '-moz-border-radius', '-moz-border-radius-topleft', '-moz-border-radius-topright', '-moz-border-radius-bottomright', '-moz-border-radius-bottomleft', '-moz-border-top-colors', '-moz-border-right-colors', '-moz-border-bottom-colors', '-moz-border-left-colors', '-moz-opacity', '-moz-outline',
		'-moz-outline-color', '-moz-outline-style', '-moz-outline-width', '-moz-user-focus', '-moz-user-input', '-moz-user-modify', '-moz-user-select', 'orphans', 'outline', 'outline-color', 'outline-style', 'outline-width', 'overflow', 'overflow-X', 'overflow-Y', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'page', 'page-break-after', 'page-break-before', 'page-break-inside', 'pause', 'pause-after', 'pause-before', 'pitch',
		'pitch-range', 'play-during', 'position', 'quotes', '-replace', 'richness', 'right', 'ruby-align', 'ruby-overhang', 'ruby-position', '-set-link-source', 'size', 'speak', 'speak-header', 'speak-numeral', 'speak-punctuation', 'speech-rate', 'stress', 'scrollbar-arrow-color', 'scrollbar-base-color', 'scrollbar-dark-shadow-color', 'scrollbar-face-color', 'scrollbar-highlight-color', 'scrollbar-shadow-color', 'scrollbar-3d-light-color', 'scrollbar-track-color',
		'table-layout', 'text-align', 'text-align-last', 'text-decoration', 'text-indent', 'text-justify', 'text-overflow', 'text-shadow', 'text-transform', 'text-autospace', 'text-kashida-space', 'text-underline-position', 'top', 'unicode-bidi', '-use-link-source', 'vertical-align', 'visibility', 'voice-family', 'volume', 'white-space', 'widows', 'width', 'word-break', 'z-index', 'zoom', 'word-spacing', 'word-wrap', 'writing-mode');
	var cssTagCount = 0;
	var htmlTagCount = 0;

	htmlTag = new Array();
	cssTag = new Array();

	//html part
	pid = "";
	var iwcounter = 0;
	for (i = 0; i < tokens.length; i++) {
		tokenvalue = String(tokens[i].val);

		if (tokens[i].kind == "rowcomment" || tokens[i].kind == "blockcomment" || tokens[i].kind == "string" || tokens[i].kind == "number" || tokens[i].kind == "name") {
			// Fix to remove html tags in strings
			tokenvalue = tokenvalue.replace(/&/g, "&amp;");
			tokenvalue = tokenvalue.replace(/\</g, "&lt;");
			tokenvalue = tokenvalue.replace(/\>/g, "&gt;");
		}
		// Make white space characters
		tokenvalue = tokenvalue.replace(/ /g, '&nbsp;');
		tokenvalue = tokenvalue.replace(/\\t/g, '&nbsp;&nbsp;');

		if (tokens[i].kind == "rowcomment") {
			cont += "<span class='comment'>" + tokenvalue + "</span>";
		} else if (tokens[i].kind == "blockcomment") {
			cont += "<span class='comment'>" + tokenvalue + "</span>";
		} else if (tokens[i].kind == "string") {
			// To represent a multilined string in the codeviewer window
			if (tokenvalue.includes('\n') || tokenvalue.includes('\r')) {
				var tokenString =tokenvalue;
				var partialTokenString;
				var currentTokenCharacter;
				var tokenIndex = 0;
				var tokenQuotationMark = tokenString.charAt(0);

				partialTokenString = "";
				while (true) {
					currentTokenCharacter = tokenString.charAt(tokenIndex);
					if (currentTokenCharacter == tokenQuotationMark && tokenIndex != 0) {
						// At the end of the string
						partialTokenString += currentTokenCharacter;
						cont += `<span class='string'>${partialTokenString}</span>`;
						break;
					}
					if (currentTokenCharacter < ' ') {
						if ((currentTokenCharacter == '\n') || (currentTokenCharacter == '\r') || (currentTokenCharacter == '')) {
							// Creates a new line when a line break character is in the string
							cont += `<span class='string'>${partialTokenString}</span>`;
							lineno++;
							str += `<div id='${boxfilename}-line${lineno}' style='line-height:21px'><span class='blockBtnSlot'></span>${cont}</div>`;
							cont = "";
							partialTokenString = "";
						}
					}
					// replace '<' and '>' with &lt; and &gt; to prevent html tags in the string to mess with the HTML DOM
					if (currentTokenCharacter == '<') currentTokenCharacter = '&lt;';
					if (currentTokenCharacter == '>') currentTokenCharacter = '&gt;';
					tokenIndex++;
					partialTokenString += currentTokenCharacter;
				}
			} else {
				cont+=`<span class='string'>${tokenvalue}</span>`;
			}
		} else if (tokens[i].kind == "number") {
			cont += "<span class='number'>" + tokenvalue + "</span>";
		} else if (tokens[i].kind == "name") {
			var foundkey = 0;
			//If tokenvalue exists in the array for important words
			if (important.indexOf(tokenvalue) != -1) {
				foundkey = 2;
				//Uses smart indexing to find if token value exists in array, if tokenvalue == length the statement is true
			} else if (keywords[tokenvalue] != null) {
				foundkey = 1;
			}

			if (foundkey == 1) {
				cont += "<span class='keyword" + keywords[tokenvalue] + "'>" + tokenvalue + "</span>";
			} else if (foundkey == 2) {
				iwcounter++;
				cont += "<span id='IW" + iwcounter + "' class='impword' onclick='popupDocumentation(\"" + tokenvalue + "\", \"multi\");' onmouseover='highlightKeyword(\"" + tokenvalue + "\")' onmouseout='highlightKeyword(\"" + tokenvalue + "\")'>" + tokenvalue + "</span>";
			} else {
				cont += tokenvalue;
			}

		} else if (tokens[i].kind == "operator") {
			if (tokenvalue == "(") {
				pid = "PA" + pcount + boxid;
				pcount++;
				parenthesis.push(pid);
				cont += "<span id='" + pid + "' class='oper' onmouseover='highlightop(\"P" + pid + "\",\"" + pid + "\");' onmouseout='highlightop(\"P" + pid + "\",\"" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == ")") {
				pid = parenthesis.pop();
				cont += "<span id='P" + pid + "' class='oper' onmouseover='highlightop(\"" + pid + "\",\"P" + pid + "\");' onmouseout='highlightop(\"" + pid + "\",\"P" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == "[") {
				pid = "BR" + bcount;
				bcount++;
				bracket.push(pid);
				cont += "<span id='" + pid + "' class='oper' onmouseover='highlightop(\"P" + pid + "\",\"" + pid + "\");' onmouseout='highlightop(\"P" + pid + "\",\"" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == "]") {
				pid = bracket.pop();
				cont += "<span id='P" + pid + "' class='oper' onmouseover='highlightop(\"" + pid + "\",\"P" + pid + "\");' onmouseout='highlightop(\"" + pid + "\",\"P" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == "{") {
				// [token row position, 1 = opening bracket, codeviewer box id]
				allBlocks.push([tokens[i].row, 1, parseInt(boxid)]);
				pid = "CBR" + cbcount + boxid;
				cbcount++;
				cbracket.push(pid);
				cont += "<span id='" + pid + "' class='oper' onmouseover='highlightop(\"P" + pid + "\",\"" + pid + "\");' onmouseout='highlightop(\"P" + pid + "\",\"" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == "}") {
				// [token row position, 0 = closing bracket, codeviewer box id]
				allBlocks.push([tokens[i].row, 0, parseInt(boxid)]);
				pid = cbracket.pop();
				cont += "<span id='P" + pid + "' class='oper' onmouseover='highlightop(\"" + pid + "\",\"P" + pid + "\");' onmouseout='highlightop(\"" + pid + "\",\"P" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == "<") {
				// This statement checks the character after < to make sure it is a valid tag.
                                coloringcode = tokens[i].val + "" + tokens[i + 1].val+"" + tokens[i + 2].val;
				switch(coloringcode) {
					case "<html>":
					case "</html":
						fontcolor = "red";
						break;
					case "<link ":
						fontcolor = "blue";
						break;
					case "<h1>":
					case "</h1":
						fontcolor = "darkorchid";
						break;
					case "<title>":
					case "</title":
						fontcolor = "green";
						break;
					case "<body>":
					case "</body":
						fontcolor = "#941535";
						break;
					case "<p>":
					case "</p":
						fontcolor = "#a3a300";
						break;
					case "<script ":
					case "</script":
						fontcolor = "#ff8000";
						break;
                    case "<header>":
					case "</header":
						fontcolor = "#FF1493";
						break;
					default: 
						fontcolor = "#00ff";
						break;
				}

				// Enables collapsible html tags
				if (String(tokens[i + 1].kind) == "name") {
					// Ensures that void elements do not count as opening html tags
					if (htmlArrayNoSlash.indexOf(tokens[i + 1].val.toLowerCase()) == -1) {
						// [token row position, 1 = opening html tag, codeviewer box id]
						allBlocks.push([tokens[i + 1].row, 1, parseInt(boxid)]);
					}	
				}
				else if (String(tokens[i + 1].kind) == "operator" && String(tokens[i + 1].val) == "/" && String(tokens[i + 2].kind) == "name") {
					// [token row position, 0 = closing html tag, codeviewer box id]
					allBlocks.push([tokens[i + 1].row, 0, parseInt(boxid)]);
				}

				tokenvalue = "&lt;";
				if (isNumber(tokens[i + 1].val) == false && tokens[i + 1].val != "/" && tokens[i + 1].val != "!" && tokens[i + 1].val != "?") {
					if (htmlArray.indexOf(tokens[i + 1].val.toLowerCase()) > -1) {
						var k = 2;
						var foundEnd = false;

						//If a > has been found on the same line as an < and the token to the left of < is in htmlArray then it classes it as an html-tag
						while (i + k < tokens.length) {
							if (tokens[i + k].val == ">") {
								foundEnd = true;
								break;
							}
							k++;
						}
						if (foundEnd) {
							pid = "html" + htmlTagCount + boxid;
							htmlTagCount++;
							if (htmlArrayNoSlash.indexOf(tokens[i + 1].val.toLowerCase()) == -1) {
								htmlTag.push(pid);
							}
							cont += "&lt" + "<span style='color: "+fontcolor+"' id='" + pid + "' class='oper' onclick='popupDocumentation(this.id, \"html\");' onmouseover='highlightHtml(\"P" + pid + "\",\"" + pid + "\");' onmouseout='highlightHtml(\"P" + pid + "\",\"" + pid + "\");'>" + tokens[i + 1].val;
							cont += "</span>";
							i = i + 1;
						} else {
							cont += "<span class='oper'>" + tokenvalue + "</span>";
						}
					} else {
						cont += "<span class='oper'>" + tokenvalue + "</span>";
					}
				} else if (tokens[i + 1].val == "/") {
					if (htmlArray.indexOf(tokens[i + 2].val.toLowerCase()) > -1) {
						if (htmlArrayNoSlash.indexOf(tokens[i + 1].val.toLowerCase()) == -1) {
							pid = htmlTag.pop();
						} else {
							htmlTagCount++;
							pid = "html" + htmlTagCount + boxid;
						}
						cont += "&lt" + tokens[i + 1].val + "<span style='color: "+fontcolor+"'  id='P" + pid + "' class='oper' onclick='popupDocumentation(this.id, \"html\");' onmouseover='highlightHtml(\"" + pid + "\",\"P" + pid + "\");' onmouseout='highlightHtml(\"" + pid + "\",\"P" + pid + "\");'>" + tokens[i + 2].val + "</span>" + tokens[i + 3].val;
						i = i + 3;
					} else {
						cont += "<span class='oper'>" + tokenvalue + "</span>";
					}
				} else {
					cont += "<span class='oper'>" + tokenvalue + "</span>";
				}
			} else {
				cont += "<span class='oper'>" + tokenvalue + "</span>";
			}
		} else {
			cont += tokenvalue;
		}
		// tokens.length-1 so the last line will be printed out
		if (tokens[i].kind == "newline" || i == tokens.length - 1) {
			// Help empty lines to be printed out
			if (cont == "") cont = "&nbsp;";
			// Count how many linenumbers that'll be needed
			lineno++;
			// Print out normal rows if no important exists
			if (improws.length == 0) {
				str += "<div id='" + boxfilename + "-line" + lineno + "' style='line-height:21px' ><span class='blockBtnSlot'></span>" + cont + "</div>";
			} else {
				// Print out important lines
				for (var kp = 0; kp < improws.length; kp++) {
					if (lineno >= parseInt(improws[kp][1]) && lineno <= parseInt(improws[kp][2])) {
						str += "<div id='" + boxfilename + "-line" + lineno + "' class='impo' style='line-height:21px'><span class='blockBtnSlot'></span>" + cont + "</div>";
						break;
					} else {
						if (kp == (improws.length - 1)) {
							str += "<div id='" + boxfilename + "-line" + lineno + "' style='line-height:21px'><span class='blockBtnSlot'></span>" + cont + "</div>";
						}
					}
				}
			}
			cont = "";
		}
	}
	str += "</div>";

	// Print out rendered code and border with numbers
	printout.html(createCodeborder(lineno, improws) + str);

	//css part
	pid = "";
	var iwcounter = 0;
	for (i = 0; i < tokens.length; i++) {
		tokenvalue = String(tokens[i].val);
		// Make white space characters
		tokenvalue = tokenvalue.replace(/ /g, '&nbsp;');
		tokenvalue = tokenvalue.replace(/\\t/g, '&nbsp;&nbsp;');

		if (tokens[i].kind == "rowcomment") {
			cont += "<span class='comment'>" + tokenvalue + "</span>";
		} else if (tokens[i].kind == "blockcomment") {
			cont += "<span class='comment'>" + tokenvalue + "</span>";
		} else if (tokens[i].kind == "string") {
			cont += "<span class='string' >" + tokenvalue + "</span>";
		} else if (tokens[i].kind == "number") {
			cont += "<span class='number'>" + tokenvalue + "</span>";
		} else if (tokens[i].kind == "name") {
			var foundkey = 0;
			//If tokenvalue exists in the array for important words
			if (important.indexOf(tokenvalue) != -1) {
				foundkey = 2;
				//Uses smart indexing to find if token value exists in array, if tokenvalue == length the statement is true
			} else if (keywords[tokenvalue] != null) {
				foundkey = 1;
			}

			if (foundkey == 1) {
				cont += "<span class='keyword" + keywords[tokenvalue] + "'>" + tokenvalue + "</span>";
			} else if (foundkey == 2) {
				iwcounter++;
				cont += "<span id='IW" + iwcounter + "' class='impword' onclick='popupDocumentation(this.id, \"multi\");' onmouseover='highlightKeyword(\"" + tokenvalue + "\")' onmouseout='highlightKeyword(\"" + tokenvalue + "\")'>" + tokenvalue + "</span>";
			} else {
				cont += tokenvalue;
			}

		} else if (tokens[i].kind == "operator") {
			if (tokenvalue == "{") {
				pid = "CBR" + cbcount + boxid;
				cbcount++;
				cbracket.push(pid);
				cont += "<span id='" + pid + "' class='oper' onmouseover='highlightop(\"P" + pid + "\",\"" + pid + "\");' onmouseout='highlightop(\"P" + pid + "\",\"" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == "}") {
				pid = cbracket.pop();
				cont += "<span id='P" + pid + "' class='oper' onmouseover='highlightop(\"" + pid + "\",\"P" + pid + "\");' onmouseout='highlightop(\"" + pid + "\",\"P" + pid + "\");'>" + tokenvalue + "</span>";
			} else if (tokenvalue == "<") {
				// This statement checks the character after < to make sure it is a valid tag.

				tokenvalue = "&lt;";
				if (isNumber(tokens[i + 1].val) == false && tokens[i + 1].val != "/" && tokens[i + 1].val != "!" && tokens[i + 1].val != "?") {
					if (cssArray.indexOf(tokens[i + 1].val.toLowerCase()) > -1) {
						var k = 2;
						var foundEnd = false;

						//If a > has been found on the same line as an < and the token to the left of < is in htmlArray then it classes it as an html-tag
						while (i + k < tokens.length) {
							if (tokens[i + k].val == ">") {
								foundEnd = true;
								break;
							}
							k++;
						}

						if (foundEnd) {
							pid = "css" + cssTagCount + boxid;
							cssTagCount++;
							if (cssArray.indexOf(tokens[i + 1].val.toLowerCase()) == -1) {
								cssTag.push(pid);
							}
							cont += "&lt" + "<span style='color: "+fontcolor+"'  id='" + pid + "' class='oper' onmouseover='highlightCss(\"P" + pid + "\",\"" + pid + "\");' onmouseout='deHighlightCss(\"P" + pid + "\",\"" + pid + "\");'>" + tokens[i + 1].val;
							cont += "</span>";
							i = i + 1;
						} else {
							cont += "<span class='oper'>" + tokenvalue + "</span>";
						}
					} else {
						cont += "<span class='oper'>" + tokenvalue + "</span>";
					}
				} else if (tokens[i + 1].val == "/") {
					if (cssArray.indexOf(tokens[i + 2].val.toLowerCase()) > -1) {
						if (cssArray.indexOf(tokens[i + 1].val.toLowerCase()) == -1) {
							pid = cssTag.pop();
						} else {
							cssTagCount++;
							pid = "css" + cssTagCount + boxid;
						}
						cont += "&lt" + tokens[i + 1].val + "<span style='color: "+fontcolor+"' id='P" + pid + "' class='oper' onmouseover='highlightHtml(\"" + pid + "\",\"P" + pid + "\");' onmouseout='highlightHtml(\"" + pid + "\",\"P" + pid + "\");'>" + tokens[i + 2].val + "</span>" + tokens[i + 3].val;
						i = i + 3;
					} else {
						cont += "<span class='oper'>" + tokenvalue + "</span>";
					}
				} else {
					cont += "<span class='oper'>" + tokenvalue + "</span>";
				}
			} else {
				cont += "<span class='oper'>" + tokenvalue + "</span>";
			}
		} else {
			cont += tokenvalue;
		}
		// tokens.length-1 so the last line will be printed out
		if (tokens[i].kind == "newline" || i == tokens.length - 1) {
			// Help empty lines to be printed out
			if (cont == "") cont = "&nbsp;";
			// Count how many linenumbers that'll be needed
			lineno++;
			// Print out normal rows if no important exists
			if (improws.length == 0) {
				str += "<div id='" + boxfilename + "-line" + lineno + "' style='line-height:21px'><span class='blockBtnSlot'></span>" + cont + "</div>";
			} else {
				// Print out important lines
				for (var kp = 0; kp < improws.length; kp++) {
					if (lineno >= parseInt(improws[kp][1]) && lineno <= parseInt(improws[kp][2])) {
						str += "<div id='" + boxfilename + "-line" + lineno + "' class='impo' style='line-height:21px'><span class='blockBtnSlot'></span>" + cont + "</div>";
						break;
					} else {
						if (kp == (improws.length - 1)) {
							str += "<div id='" + boxfilename + "-line" + lineno + "' style='line-height:21px' ><span class='blockBtnSlot'></span>" + cont + "</div>";
						}
					}
				}
			}
			cont = "";
		}
	}
	str += "</div>";

	// Print out rendered code and border with numbers
	printout.css(createCodeborder(lineno, improws) + str);
 	var borders = [...document.querySelectorAll('.codeborder')];
	borders.forEach(border => {
		var parentScrollHeight = border.parentNode.scrollHeight;
		var parentHeight = border.parentNode.clientHeight;
		border.style.height = parentScrollHeight;
		border.style.minHeight = parentHeight;
	});
}

function getBlockRanges(blocks) {
	var boxBlocks = []; // Array to hold each box array

	// Sort by boxid and split array depending on how many boxes we have
	blocks.sort(([a,b,c], [d,e,f]) => f - c);

	var tempArray = [];
	for (var i = 0; i < blocks.length; i++) {
		if (i !== 0 && blocks[i-1][2] !== blocks[i][2]) {
			// Last iteration had a different boxid, start a new array
			boxBlocks.push(tempArray);
			tempArray = [];
		}
		tempArray.push(blocks[i]);
	}
	boxBlocks.push(tempArray);

	// Sort the arrays
	for (var i = 0; i < boxBlocks.length; i++) {
		boxBlocks[i].sort(([a,b], [c,d]) => a - c);
	}

	// Determine block ranges
	var boxRanges = {};
	var ranges = [];
	var openBlock = false;
	var blocks;
	for (var i = 0; i < boxBlocks.length; i++) {
		blocks = boxBlocks[i];
		if (blocks.length < 1) continue;
		for (var j = 0; j < blocks.length; j++) {
			// If there are no open blocks and the bracket is a closing bracket, do nothing.
			if (!openBlock && blocks[j][1] === 0) continue;
			
			// Opening bracket
			if (blocks[j][1] === 1) {
				ranges.push([blocks[j][0], 0]);
				openBlock = true;
			}
			// Closing bracket
			if (blocks[j][1] === 0) {
				// Find first entry in ranges array with no closing bracket
				for (var k = ranges.length - 1; k > -1; k--) {
					if (ranges[k][1] === 0) {
						
						if (ranges[k][0] !== blocks[j][0]) {
							// We found the first open bracket, and the block is completed
							ranges[k][1] = blocks[j][0];
						} else { 
							// If the opening bracket is on the same row as the closing bracket we remove that entry
							ranges.splice(k, 1);
						}
						break;
					}
				}
				
				// Check if there are any open blocks in the ranges array
				var containsOpenBlock = function(arr) {
					return arr.includes(0)
				}
				if (!ranges.some(containsOpenBlock)) openBlock = false;
			}
		}
		openBlock = false;
		var key = boxBlocks[i][0][2];
		boxRanges[key] = ranges;
		ranges = [];
	}
	return boxRanges;
}

function createBlocks(ranges, boxid) {
	var wrapper = document.querySelector('#textwrapper'+boxid);
	for (var i = 0; i < ranges.length; i++) {
		var blockStartRow = wrapper.querySelector("div[id$='"+ranges[i][0]+"']");
		var buttonSlot = blockStartRow.querySelector("span:first-child");
		buttonSlot.classList.add('open-block');
		buttonSlot.classList.add('occupied');
		buttonSlot.id = i;

		buttonSlot.addEventListener('click', (e) => {
			var button = e.target;
			button.classList.toggle('open-block');
			button.classList.toggle('closed-block');
			var rowsInBlock = Array(ranges[button.id][1] - ranges[button.id][0]).fill().map((_, idx) => ranges[button.id][0] + idx);
			toggleRows(rowsInBlock, button);
		});
	}
}

function toggleRows(rows, button) {
	var baseRow = button.parentNode;
	var wrapper = baseRow.parentNode;
	var box = wrapper.parentNode;
	var numbers = [...box.querySelectorAll('.codeborder div')];
	var display;
	var ellipses = document.createElement('span');
	ellipses.classList.add('blockEllipses');
	ellipses.innerHTML = ' ...';

	if (button.classList.contains('closed-block')) {
		display = 'none';
		baseRow.appendChild(ellipses);
	} else {
		display = 'block';
		ellipses = baseRow.querySelector('.blockEllipses');
		baseRow.removeChild(ellipses);
	}
	
	for (var i = 1; i < rows.length; i++) {
		wrapper.querySelector("div[id$='"+rows[i]+"']").style.display = display;
		numbers[rows[i] - 1].style.display = display;
	}
}


//----------------------------------------------------------------------------------
// createCodeborder: function to create a border with line numbers
//                Is called by rendercode in codeviewer.js
//----------------------------------------------------------------------------------

function createCodeborder(lineno, improws) {
	var str = "<div class='codeborder' style='z-index: 2;'>"; // The z-index places the code border above the copy to clipboard notification
	for (var i = 1; i <= lineno; i++) {
		// Print out normal numbers
		if (improws.length == 0) {
			str += "<div class='no'>" + (i) + "</div>";
		} else {
			// Print out numbers for an important row
			for (var kp = 0; kp < improws.length; kp++) {
				if (i >= parseInt(improws[kp][1]) && i <= parseInt(improws[kp][2])) {
					str += "<div class='impono'>" + (i) + "</div>";
					break;
				} else {
					if (kp == (improws.length - 1)) {
						str += "<div class='no'>" + (i) + "</div>";
					}
				}
			}
		}
	}

	str += "</div>";
	return str;
}

//----------------------------------------------------------------------------------
// changetemplate: Change template by updating hidden field
//                Is called at line 223-229 in EditorV50.php
//----------------------------------------------------------------------------------

function changetemplate(templateno) 
{
	$(".tmpl").each(function (index) {
		$(this).css("background", "#ccc");
	});

	document.getElementById("templat" + templateno).style.backgroundColor = "#fc4";
	document.getElementById("templateno").value = templateno;

	var templateOptions = document.getElementById('templateOptions');
	var boxes;
	switch (templateno) {
		case '1':
			boxes = 2;
			break;
		case '2':
			boxes = 2;
			break;
		case '3':
			boxes = 3;
			break;
		case '4':
			boxes = 3;
			break;
		case '5':
			boxes = 4;
			break;
		case '6':
			boxes = 4;
			break;
		case '7':
			boxes = 4;
			break;
		case '8':
			boxes = 3;
			break;
		case '9':
			boxes = 5;
			break;
		case '10':
			boxes = 1;
			break;
	}

	var str = "";
	var wordl = retData['wordlists'];

	for (var i = 0; i < boxes; i++) {
		str += "<tr><td><label>Kind: </label><select class='templateSelect' id='boxcontent_" + i + "' onchange='changeDirectory(this)'>";
		str += "<option value='CODE'>Code</option><option value='IFRAME'>Preview</option><option value='DOCUMENT'>Document</option></select></td>";
		str += "<td><label>File: </label><select class='templateSelect' id='filename_" + i + "'></select></td>";
		str += "<td><label>Wordlist: </label><select class='templateSelect' id='wordlist_" + i + "'>";
		for (var j = 0; j < wordl.length; j++) {
			str += "<option value='" + wordl[j][0] + "'>" + wordl[j][1] + "</option>";
		}
		str += "</select></td></tr>";
	}
	templateOptions.innerHTML = str;
	for (var i = 0; i < boxes; i++) {
		changeDirectory(document.querySelector('#boxcontent_' + i));
	}
}

//----------------------------------------------------------------------------------
// updateTemplate: Write template hidden field to database
//                Is called at line 234 in EditorV50.php
//----------------------------------------------------------------------------------

function updateTemplate() {
	templateno = $("#templateno").val();
	$("#chooseTemplateContainer").css("display", "none");
 
	var selectBoxes = [...document.querySelectorAll('#templateOptions select')];
	var examples = selectBoxes.length / 3;
	try {
		var courseid = querystring['courseid'];
		var exampleid = querystring['exampleid'];
		var cvers = querystring['cvers'];
		var templateno = $("#templateno").val();
		var content = [];
		for (var i = 0; i < examples; i++) {
			var values = [$("#boxcontent_" + i).val(), $("#filename_" + i).val(), $("#wordlist_" + i).val()];
			content.push(values);
		}
		AJAXService("SETTEMPL", {
			courseid: courseid,
			exampleid: exampleid,
			cvers: cvers,
			templateno: templateno,
			content: content
		}, "CODEVIEW");
	} catch (e) {
		alert("Error when updating template: " + e.message)
	}
}

//----------------------------------------------------------------------------------
// closeEditContent:
//                Is called at line 141 in EditorV50.php
//----------------------------------------------------------------------------------

function closeEditContent() {
	var editBox = document.getElementById("boxtitle2");
	editBox.setAttribute("contenteditable", true);
	document.getElementById("editContentContainer").style.display = "none";
	openBoxID = null;
}

//----------------------------------------------------------------------------------
// closeEditExample:
//                Is called at line 183 in EditorV50.php
//----------------------------------------------------------------------------------

function closeEditExample() {
	var closeEditExample = document.getElementById("editExampleContainer");
	closeEditExample.style.display = "none";
}

//----------------------------------------------------------------------------------
// openTemplateWindow:
//                Is called at line 53 in EditorV50.php
//----------------------------------------------------------------------------------

function openTemplateWindow() {
	document.getElementById("chooseTemplateContainer").style.display = "flex";
}

//----------------------------------------------------------------------------------
// closeTemplateWindow:
//                Is called at line 218 in EditorV50.php
//----------------------------------------------------------------------------------

function closeTemplateWindow() {
	document.getElementById("chooseTemplateContainer").style.display = "none";
}

//----------------------------------------------------------------------------------
// Play:
//					Is called at line 195 in EditorV50.php and line 56 in navheader.php
//----------------------------------------------------------------------------------

function Play(event) {
	if (retData['playlink'] != null) {
		if (retData['playlink'].indexOf("http") == 0) {
			window.location.href = retData['playlink'];
		} else {
			var urlText = "";
			if (retData['public'] === "1") {
				urlText = "global/" + retData['playlink'];
			} else {
				urlText = retData['courseid'] + "/" + retData['playlink'];
			}
			//current url for the page
			surl = window.location.href;
			//relative path
			var prefix = "/../courses/";
			surl = surl.substring(0, surl.lastIndexOf("/"));
			var win = window.open(surl + prefix + urlText, '_blank');
			win.focus();

		}
	}
}

function minimizeBoxes(boxid) 
{
	thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
	thisBox1 = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
	thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
	thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
	thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
	thisBox5 = document.querySelector('#box' + 5 + 'wrapper #boxtitlewrapper');
	var boxid = boxid;
	var parentDiv = document.getElementById("div2");
	var boxValArray = initResizableBoxValues(parentDiv);
	var templateid = retData['templateid'];

	getLocalStorageProperties(boxValArray);

	//For template 1
	if (templateid == 1) {
		if (boxid == 1) {
			document.querySelector(boxValArray['box' + 2]['id']).style.width = "100%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.width = "0%";
			alignBoxesWidth(boxValArray, 1, 2);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
			document.querySelector(boxValArray['box' + 1]['id']).style.width = "100%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.width = "0%";
			alignBoxesWidth(boxValArray, 1, 2);
            thisBox1.classList.remove('hidden');
            setTimeout(function () {
                thisBox1.classList.remove('visuallyhidden');
            }, 20);
		}
	}

	//for template 2
	if (templateid == 2) {
		if (boxid == 1) {
			document.querySelector(boxValArray['box' + 2]['id']).style.height = "100%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.height ="10%";
			alignBoxesHeight2boxes(boxValArray, 1, 2);
		}
			if (boxid == 2) {
			document.querySelector(boxValArray['box' + 1]['id']).style.height = "100%";

			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "10%";
			alignBoxesHeight2boxes(boxValArray, 2, 1);
		}
	}

	//for template 3
	if (templateid == 3) {
		if(boxid == 1){
			for (var i = 1; i <= 3; i++) {
				document.querySelector(boxValArray['box' + i]['id']).style.height = "50%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.height = "10%";
				document.querySelector(boxValArray['box' + i]['id']).style.width = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
			}
			thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.add('hidden');
                thisBox.classList.add('visuallyhidden');
            }, 20);
		}else{
			for (var i = 1; i <= 3; i++) {
				document.querySelector(boxValArray['box' + i]['id']).style.height = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.height = "10%";
			}
			thisBox.classList.remove('hidden');
		}
	}

	//for template 4
	if (templateid == 4){
		if(boxid == 3){
			for(var i = 1; i <= 3; i++){	
				document.querySelector(boxValArray['box' + i]['id']).style.height = "90%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.height = "10%";
				document.querySelector(boxValArray['box' + i]['id']).style.width = "50%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.width = "100%";
			}
			thisBox1.classList.remove('hidden');
			thisBox2.classList.remove('hidden');
			thisBox1.classList.remove('visuallyhidden');
			thisBox2.classList.remove('visuallyhidden');
		}else{
			for(var i = 1; i <= 3; i++){
				document.querySelector(boxValArray['box' + i]['id']).style.width = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
			}
			thisBox1.classList.remove('hidden');
			thisBox2.classList.remove('hidden');
			thisBox1.classList.remove('visuallyhidden');
			thisBox2.classList.remove('visuallyhidden');
            setTimeout(function () {
                thisBox.classList.add('hidden');
                thisBox.classList.add('visuallyhidden');
            }, 20);	
		}	
	}

    //for template 5
    if(templateid == 5){
        if(boxid == 1 || boxid == 3){
			document.querySelector(boxValArray['box' + (boxid + 1)]['id']).style.width = "100%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
            thisBox2.classList.remove('hidden');
            thisBox4.classList.remove('hidden');
            thisBox2.classList.remove('visuallyhidden');
            thisBox4.classList.remove('visuallyhidden');
            setTimeout(function () {
                thisBox.classList.add('hidden');
                thisBox.classList.add('visuallyhidden');
            }, 20);    
        }else{
            document.querySelector(boxValArray['box' + (boxid - 1)]['id']).style.width = "100%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
            thisBox1.classList.remove('hidden');
            thisBox3.classList.remove('hidden');
            thisBox1.classList.remove('visuallyhidden');
            thisBox3.classList.remove('visuallyhidden');
            setTimeout(function () {
                thisBox.classList.add('hidden');
                thisBox.classList.add('visuallyhidden');
            }, 20);    
        }

	}

	//for template 6
	if(templateid == 6){
		if(boxid == 1){
			for(var i = 1; i <= 4; i++){
				document.querySelector(boxValArray['box' + i]['id']).style.width = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
			}
            setTimeout(function () {
                thisBox.classList.add('hidden');
                thisBox.classList.add('visuallyhidden');
            }, 20); 
		}
		if(boxid == 2){
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignBoxesHeight3stack(boxValArray, 2, 3, 4);
		}
		if(boxid == 3){
			document.querySelector(boxValArray['box' + 2]['id']).style.height = "50%";
			document.querySelector(boxValArray['box' + 4]['id']).style.height = "50%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignBoxesHeight3stack(boxValArray, 2, 3, 4);
		}
		if(boxid == 4){
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignBoxesHeight3stack(boxValArray, 2, 3, 4);
		}
	}

	//for template 7
	if(templateid == 7){
		if(boxid == 1){
			for(var i = 1; i <= 4; i++){	
				document.querySelector(boxValArray['box' + i]['id']).style.width = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
			}
			setTimeout(function () {
                thisBox.classList.add('hidden');
                thisBox.classList.add('visuallyhidden');
            }, 20); 
		}
		if(boxid == 2){
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignBoxesHeight3stack(boxValArray, 2, 3, 4);
		}
		if(boxid == 3){
			document.querySelector(boxValArray['box' + 2]['id']).style.height = "50%";
			document.querySelector(boxValArray['box' + 4]['id']).style.height = "50%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignBoxesHeight3stack(boxValArray, 2, 3, 4);
		}
		if(boxid == 4){
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignBoxesHeight3stack(boxValArray, 2, 3, 4);
		}
	}

	//for template 8
	if(templateid == 8){
		if(boxid == 1){
			for(i = 1; i <= 3; i++){
				document.querySelector(boxValArray['box' + i]['id']).style.width = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
			}
			thisBox2.classList.remove('hidden');
			thisBox3.classList.remove('hidden');
			thisBox2.classList.remove('visuallyhidden');
			thisBox3.classList.remove('visuallyhidden');
			setTimeout(function () {
				thisBox.classList.add('hidden');
				thisBox.classList.add('visuallyhidden');
			}, 20);	
		}else{
			for(var i = 1; i <= 3; i++){
				document.querySelector(boxValArray['box' + i]['id']).style.height = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.height = "10%";
			}
		}
	}

	//for template 9
	if(templateid == 9){
		if(boxid == 1){
			for(var i = 1; i <= 5; i++){
				document.querySelector(boxValArray['box' + i]['id']).style.width = "100%";
				document.querySelector(boxValArray['box' + boxid]['id']).style.width = "10%";
			}
			setTimeout(function () {
                thisBox.classList.add('hidden');
                thisBox.classList.add('visuallyhidden');
            }, 20); 
		}
		if(boxid == 2){
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
		}
		if(boxid == 3){
			document.querySelector(boxValArray['box' + 2]['id']).style.height = "33%";
			document.querySelector(boxValArray['box' + 4]['id']).style.height = "33%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
		}
		if(boxid == 4){
			document.querySelector(boxValArray['box' + 2]['id']).style.height = "33%";
			document.querySelector(boxValArray['box' + 5]['id']).style.height = "33%";
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
		}
		if(boxid == 5){
			document.querySelector(boxValArray['box' + boxid]['id']).style.height = "0%";
			alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
		}
	}	
}

function hideCopyButtons(templateid, boxid) {
	var totalBoxes = getTotalBoxes(templateid);

	for (var i = 1; i <= totalBoxes; i++) {
		var copyBtn = document.querySelector('#box'+i+'wrapper #copyClipboard');
		if (i !== boxid) {
			if (!copyBtn) continue;
			copyBtn.style.display = "none";
		} else {
			if (!copyBtn) continue;
			copyBtn.style.display = "table-cell";
		}
	}
}

function showCopyButtons(templateid) {	
	var totalBoxes = getTotalBoxes(templateid);

		for (var i = 1; i <= totalBoxes; i++) {
		if (document.querySelector('#box' + i).className == 'box codebox') {
		document.querySelector('#box' + i + 'wrapper #copyClipboard').style.display = 'table-cell'
		}
	}
}

function getTotalBoxes(template) {
	var totalBoxes;

	if(template == 1){
		totalBoxes = 2;
	}
	if(template == 2){
		totalboxes = 2;
	}
	if(template == 3){
		totalboxes = 3;
	}
	if(template == 4){
		totalboxes = 3;
	}
	if(template == 5){
		totalBoxes = 4;
	}
	if(template == 6){
		totalBoxes = 4;
	}
	if(template == 7){
		totalboxes = 4;
	}
	if(template == 8){
		totalboxes = 3;
	}
	if(template == 9){
		totalboxes = 5;
	}
	if(template == 10){
		totalboxes = 1;
	}
	return totalBoxes;
}

//-----------------------------------------------------------------------------
// maximizeBoxes: Adding maximize functionality for the boxes
//					Is called with onclick() by maximizeButton
//-----------------------------------------------------------------------------

function maximizeBoxes(boxid) 
{
	var boxid = boxid;
	var parentDiv = document.getElementById("div2");
	var boxValArray = initResizableBoxValues(parentDiv);
	var templateid = retData['templateid'];

	getLocalStorageProperties(boxValArray);
	hideCopyButtons(templateid, boxid);
	showCopyButtons(templateid);
	saveInitialBoxValues();

	//For template 1
	if (templateid == 1) {
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            $(boxValArray['box' + 2]['id']).width("0%");
            $(boxValArray['box' + boxid]['id']).width("100%");
            alignBoxesWidth(boxValArray, 1, 2);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			alignBoxesWidth(boxValArray, 1, 2);
           	thisBox.classList.remove('hidden');
    		setTimeout(function () {
      			thisBox.classList.remove('visuallyhidden');
			}, 20);
		}
	}

	//for template 2
	if (templateid == 2) {
		if (boxid == 1) {
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesHeight2boxes(boxValArray, 1, 2);
		}
		if (boxid == 2) {
			$(boxValArray['box' + 1]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesHeight2boxes(boxValArray, 2, 1);
		}
	}

	//For template 3
	if (templateid == 3) {
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 2]['id']).width("0%");
			$(boxValArray['box' + 3]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			alignBoxesHeight3boxes(boxValArray, 2,1,3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.add('hidden');
                thisBox2.classList.add('visuallyhidden');
                thisBox3.classList.add('hidden');
                thisBox3.classList.add('visuallyhidden');
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 3]['id']).width("100%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight3boxes(boxValArray, 2, 1, 3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 3) {  
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight3boxes(boxValArray, 2, 1, 3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
		}
	}

	//For template 4
	if (templateid == 4) {
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 2]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight2boxes(boxValArray, 1, 3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight2boxes(boxValArray, 2, 3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 3) {
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 2]['id']).width("50%");

			$(boxValArray['box' + 1]['id']).height("0%");
			$(boxValArray['box' + 1]['id']).width("50%");

			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesHeight2boxes(boxValArray, 3, 1);
		}
	}

	//For template 5
	if (templateid == 5) {
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 2]['id']).width("0%");
			$(boxValArray['box' + 2]['id']).height("100%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight4boxes(boxValArray, 1, 2);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight4boxes(boxValArray, 1, 2);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 3) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("100%");
			$(boxValArray['box' + 4]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 3, 4);
			alignBoxesHeight4boxes(boxValArray, 1, 2);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 4) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper')
			$(boxValArray['box' + 1]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).height("100%");
			$(boxValArray['box' + 3]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 3, 4);
			alignBoxesHeight4boxes(boxValArray, 1, 2);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
	}

	//For template 6
	if (templateid == 6) {
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 2]['id']).width("0%");
			$(boxValArray['box' + 3]['id']).width("0%");
			$(boxValArray['box' + 4]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.add('hidden');
                thisBox2.classList.add('visuallyhidden');
                thisBox3.classList.add('hidden');
                thisBox3.classList.add('visuallyhidden');
                thisBox4.classList.add('hidden');
                thisBox4.classList.add('visuallyhidden');
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 3]['id']).width("100%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesWidth(boxValArray, 1, 2);
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 3) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesWidth(boxValArray, 1, 2);
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
           	thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 4) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesWidth(boxValArray, 1, 2);
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
		}
	}

	//For template 7
	if (templateid == 7) {
        template7maximizebuttonpressed = true;
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 2]['id']).width("0%");
			$(boxValArray['box' + 3]['id']).width("0%");
			$(boxValArray['box' + 4]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.add('hidden');
                thisBox2.classList.add('visuallyhidden');
                thisBox3.classList.add('hidden');
                thisBox3.classList.add('visuallyhidden');
                thisBox4.classList.add('hidden');
                thisBox4.classList.add('visuallyhidden');
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
            $(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 3]['id']).width("100%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesWidth(boxValArray, 1, 2);
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 3) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesWidth(boxValArray, 1, 2);
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
           	thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 4) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignBoxesWidth(boxValArray, 1, 2);
            alignBoxesHeight3stack(boxValArray, 2, 3, 4);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
		}
        template7maximizebuttonpressed = false;
	}

	//for template 8
    if (templateid == 8) {
        template7maximizebuttonpressed = true;
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 2]['id']).width("0%");
			$(boxValArray['box' + 3]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			alignBoxesHeight3boxes(boxValArray, 2,1,3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.add('hidden');
                thisBox2.classList.add('visuallyhidden');
                thisBox3.classList.add('hidden');
                thisBox3.classList.add('visuallyhidden');
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 3]['id']).width("100%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight3boxes(boxValArray, 2, 1, 3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
		}
		if (boxid == 3) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
			alignBoxesHeight3boxes(boxValArray, 2, 1, 3);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
		}
        template7maximizebuttonpressed = true;
	}
    
    //for template 9
	if (templateid == 9) {
		if (boxid == 1) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
            thisBox5 = document.querySelector('#box' + 5 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 2]['id']).width("0%");
			$(boxValArray['box' + 3]['id']).width("0%");
			$(boxValArray['box' + 4]['id']).width("0%");
            $(boxValArray['box' + 5]['id']).width("0%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
            alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.add('hidden');
                thisBox2.classList.add('visuallyhidden');
                thisBox3.classList.add('hidden');
                thisBox3.classList.add('visuallyhidden');
                thisBox4.classList.add('hidden');
                thisBox4.classList.add('visuallyhidden');
                thisBox5.classList.add('hidden');
                thisBox5.classList.add('visuallyhidden');
                thisBox.classList.remove('visuallyhidden');
            }, 20);
		}
        if (boxid == 2) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
            thisBox4 = document.querySelector('#box' + 5 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 3]['id']).width("100%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).width("100%");
            $(boxValArray['box' + 5]['id']).height("0%");
			$(boxValArray['box' + 5]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
            alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
            thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox4.classList.remove('visuallyhidden');
            }, 20);
		}
        if (boxid == 3) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
            thisBox4 = document.querySelector('#box' + 5 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).height("0%");
			$(boxValArray['box' + 4]['id']).width("100%");
            $(boxValArray['box' + 5]['id']).height("0%");
			$(boxValArray['box' + 5]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
            alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
            thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox4.classList.remove('visuallyhidden');
            }, 20);
		}
        if (boxid == 4) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox4 = document.querySelector('#box' + 5 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
            $(boxValArray['box' + 1]['id']).height("100%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).width("100%");
            $(boxValArray['box' + 5]['id']).height("0%");
            $(boxValArray['box' + 5]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
            alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
            thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox4.classList.remove('visuallyhidden');
            }, 20);
		}
        if (boxid == 5) {
            thisBox = document.querySelector('#box' + boxid + 'wrapper #boxtitlewrapper');
            thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
            thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
            thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
			$(boxValArray['box' + 1]['id']).width("0%");
			$(boxValArray['box' + 2]['id']).width("100%");
			$(boxValArray['box' + 2]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).height("0%");
			$(boxValArray['box' + 3]['id']).width("100%");
            $(boxValArray['box' + 4]['id']).height("0%");
            $(boxValArray['box' + 4]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).width("100%");
			$(boxValArray['box' + boxid]['id']).height("100%");
			alignBoxesWidth(boxValArray, 1, 2);
            alignTemplate9Height3Stack(boxValArray, 2,3,4,5);
            thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
            thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
            thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
            thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox4.classList.remove('visuallyhidden');
            }, 20);
		}
	}
}

//hide maximizeButton, resetButton and minimizeButton
function hideMaximizeAndResetButton() {
	var templateid = retData['templateid'];
	if (templateid > 9) {
		$('.maximizebtn').hide();
		$('.resetbtn').hide();
		$('.minimizebtn').hide();
	}
}

//reset boxes
function resetBoxes() 
{
	var parentDiv = document.getElementById("div2");
	var boxValArray = initResizableBoxValues(parentDiv);
	var templateid = retData['templateid'];
    var boxid = boxid;

	showCopyButtons(templateid);

	if (templateid == 1) {

        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";

         thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
	}
	
	if (templateid == 2) {

		thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";

		thisBox.classList.remove('hidden');
		setTimeout(function () {
			thisBox.classList.remove('visuallyhidden');
		}, 20);
		thisBox2.classList.remove('hidden');
		setTimeout(function () {
			thisBox2.classList.remove('visuallyhidden');
		}, 20);
	}

	if (templateid == 3) {

        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
		thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');

		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.bottom = "";

        thisBox.classList.remove('hidden');
            setTimeout(function () {
                thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
                thisBox2.classList.remove('visuallyhidden');
            }, 20);
        thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
	}

	if (templateid == 4) {

        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
        thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');

		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.bottom = "";

        thisBox.classList.remove('hidden');
            setTimeout(function () {
        thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
        thisBox2.classList.remove('visuallyhidden');
            }, 20);
        thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
	}

	if (templateid == 5) {
		
        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
        thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
		thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');

		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.bottom = "";

        thisBox.classList.remove('hidden');
            setTimeout(function () {
        thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
        thisBox2.classList.remove('visuallyhidden');
            }, 20);
        thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
        thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox4.classList.remove('visuallyhidden');
            }, 20);
	}

	if (templateid == 6 || templateid == 7) {
        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
        thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
		thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
		
		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.bottom = "";

        thisBox.classList.remove('hidden');
            setTimeout(function () {
        thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
        thisBox2.classList.remove('visuallyhidden');
            }, 20);
        thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
        thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox4.classList.remove('visuallyhidden');
            }, 20);
	}

	if (templateid == 7) {
        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
        thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
		thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
		
        thisBox.classList.remove('hidden');
            setTimeout(function () {
        thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
        thisBox2.classList.remove('visuallyhidden');
            }, 20);
        thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
        thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox4.classList.remove('visuallyhidden');
            }, 20);
	}

	if (templateid == 8) {
        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
		thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
		
		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.bottom = "";

        thisBox.classList.remove('hidden');
            setTimeout(function () {
        thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
        thisBox2.classList.remove('visuallyhidden');
            }, 20);
        thisBox3.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
	}
	if (templateid == 9) {
        thisBox = document.querySelector('#box' + 1 + 'wrapper #boxtitlewrapper');
        thisBox2 = document.querySelector('#box' + 2 + 'wrapper #boxtitlewrapper');
        thisBox3 = document.querySelector('#box' + 3 + 'wrapper #boxtitlewrapper');
        thisBox4 = document.querySelector('#box' + 4 + 'wrapper #boxtitlewrapper');
		thisBox5 = document.querySelector('#box' + 5 + 'wrapper #boxtitlewrapper');
		
		//Reset css attributes to default. Surely there has to be an easier way to do this.
		//Width
		document.querySelector(boxValArray['box' + 1]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.width = "";
		document.querySelector(boxValArray['box' + 5]['id']).style.width = "";
		//Height
		document.querySelector(boxValArray['box' + 1]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.height = "";
		document.querySelector(boxValArray['box' + 5]['id']).style.height = "";
		//Position
		document.querySelector(boxValArray['box' + 1]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.position = "";
		document.querySelector(boxValArray['box' + 5]['id']).style.position = "";
		//Top
		document.querySelector(boxValArray['box' + 1]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.top = "";
		document.querySelector(boxValArray['box' + 5]['id']).style.top = "";
		//Right
		document.querySelector(boxValArray['box' + 1]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.right = "";
		document.querySelector(boxValArray['box' + 5]['id']).style.right = "";
		//Left
		document.querySelector(boxValArray['box' + 1]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.left = "";
		document.querySelector(boxValArray['box' + 5]['id']).style.left = "";
		//Bottom
		document.querySelector(boxValArray['box' + 1]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 2]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 3]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 4]['id']).style.bottom = "";
		document.querySelector(boxValArray['box' + 5]['id']).style.bottom = "";

     	thisBox.classList.remove('hidden');
            setTimeout(function () {
        thisBox.classList.remove('visuallyhidden');
            }, 20);
        thisBox2.classList.remove('hidden');
            setTimeout(function () {
        thisBox2.classList.remove('visuallyhidden');
            }, 20);
        thisBox3.classList.remove('hidden');
            setTimeout(function () {
        thisBox4.classList.remove('visuallyhidden');
            }, 20);
                thisBox4.classList.remove('hidden');
            setTimeout(function () {
                thisBox3.classList.remove('visuallyhidden');
            }, 20);
        thisBox5.classList.remove('hidden');
            setTimeout(function () {
                thisBox5.classList.remove('visuallyhidden');
            }, 20);
	}
}

//-----------------------------------------------------------------------------
// resizeBoxes: Adding resize functionality for the boxes
//					Is called by setup() in codeviewer.js
//-----------------------------------------------------------------------------
function resizeBoxes(parent, templateId) 
{
	var remaining;
	if(templateId == 1)
	{
		$('#box1wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).width()) - $('#box1wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					//hide box 2 title
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
	
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
				}
				//box wrapper 2 and 3 widht = widht of screen - box wrapper 1 widht. ( this means the screen is always filled.) (box1wrapper + box2wrapper = screen widht.)
				document.querySelector('#box2wrapper').style.width = remaining + "px";
						
			},		
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			handles: "e",
			containment: parent
		});
		$('#box2wrapper').resizable({
			disabled: true
		});
	}
	if(templateId == 2){
		$('#box1wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).height()) - $('#box1wrapper').height();
				document.querySelector('#box2wrapper').style.height = remaining + "px";		
				console.log($('#box1wrapper').height());
			},		
			maxHeight: ($(parent).height()*0.85),
			minHeight: ($(parent).height()*0.15),
			handles: "s",
			containment: parent	
		});
		$('#box2wrapper').resizable({
			disabled: true
		});	
	}
	if(templateId == 3){
		$('#box1wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).width()) - $('#box1wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					//hide box 2 and 3 title
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
				}
				//box wrapper 2 and 3 widht = widht of screen - box wrapper 1 widht. ( this means the screen is always filled.) (box1wrapper + box2wrapper = screen widht.)
				document.querySelector('#box2wrapper').style.width = remaining + "px";
				document.querySelector('#box3wrapper').style.width = remaining + "px";
					
			},		
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			handles: "e",
			containment: parent

		});
		$('#box2wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).height()) - $('#box2wrapper').height();
				document.querySelector('#box3wrapper').style.height = remaining + "px";
			},
		handles: "s",
		containment: parent,
		maxHeight: ($(parent).height()*0.85),
		minHeight: ($(parent).height()*0.16)
		});
		$('#box3wrapper').resizable({
			disabled: true
		});
	}
	if(templateId == 4){
		$('#box1wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).width()) - $('#box1wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					//hide box 2 and 3 title
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
	
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
				}
				//box wrapper 2 and 3 widht = widht of screen - box wrapper 1 widht. ( this means the screen is always filled.) (box1wrapper + box2wrapper = screen widht.)
				document.querySelector('#box2wrapper').style.width = remaining + "px";
						
			},		
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			handles: "e",
			containment: parent
	
		});
		$('#box2wrapper').resizable({
			//This one currently doens't work
			disabled:true,
			handles: "n"
		});
		$('#box3wrapper').resizable({
			//This one currently doens't work
			disabled: true,
			handles: "s"

		});
	}
	if(templateId == 5){
		$('#box1wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).width()) - $('#box1wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					//hide box 2 and 3 title
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
	
					boxToHide = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
				}
				//box wrapper 2 and 4 widht = widht of screen - box wrapper 1 widht. ( this means the screen is always filled.) (box1wrapper + box2wrapper = screen widht.)
				document.querySelector('#box2wrapper').style.width = remaining + "px";
				remaining = ($(parent).height()) - $('#box1wrapper').height();
				document.querySelector('#box4wrapper').style.height = remaining + "px";
				document.querySelector('#box3wrapper').style.height = remaining + "px";
				
						
			},		
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			maxHeight: ($(parent).height()*0.85),
			minHeight: ($(parent).height()*0.16),
			handles: "e, s",
			containment: parent
		});
		$('#box2wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).height()) - $('#box1wrapper').height();
				document.querySelector('#box4wrapper').style.height = remaining + "px";
				document.querySelector('#box3wrapper').style.height = remaining + "px";


			},

			handles: "s",
			containment: parent,
			maxHeight: ($(parent).height()*0.85),
			minHeight: ($(parent).height()*0.16),
			maxHeight: ($(parent).height()*0.85),
			minHeight: ($(parent).height()*0.16)	
			
		});
		$('#box3wrapper').resizable({
			disabled: true
		
				
			
		});
		$('#box4wrapper').resizable({
			disabled: true
			
			
		});
	}

	if(templateId == 6){
		$('#box1wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).width()) - $('#box1wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
	
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
				}
				$('#box2wrapper').css('width', remaining + "px");
				$('#box3wrapper').css('width', remaining + "px");
				$('#box4wrapper').css('width', remaining + "px");						
			},		
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			handles: "e" ,
			containment: parent
	
		});
		$('#box2wrapper').resizable({
			resize: function( event, ui ) {
				resizeAmount = $(parent).height() - $('#box2wrapper').height() - $('#box3wrapper').height() - $('#box4wrapper').height();

				if($('#box3wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + resizeAmount) + "px");
				}
				else if($('#box4wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box3wrapper').css('height', ($('#box3wrapper').height() + resizeAmount) + "px");
				}
				else{
					$('#box3wrapper').css('height', ($('#box3wrapper').height() + (resizeAmount)/2) + "px");
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + (resizeAmount)/2) + "px");
				}
				
			},
			//Since there are 3 boxes in this columm the maxheight will be 70% of the screen instead of 85%
			maxHeight: ($(parent).height()*0.70),
			minHeight: ($(parent).height()*0.15),
			containment: parent,
			handles:"s"
		});
		$('#box3wrapper').resizable({
			resize: function( event, ui ) {
				resizeAmount = $(parent).height() - $('#box2wrapper').height() - $('#box3wrapper').height() - $('#box4wrapper').height();

				if($('#box2wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + resizeAmount) + "px");
				}
				else if($('#box4wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box2wrapper').css('height', ($('#box2wrapper').height() + resizeAmount) + "px");
				}
				else{
					$('#box2wrapper').css('height', ($('#box2wrapper').height() + (resizeAmount)/2) + "px");
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + (resizeAmount)/2) + "px");
				}
			},			
			maxHeight: ($(parent).height()*0.70),
			minHeight: ($(parent).height()*0.15),
			containment: parent,
			handles: "s"
		});
	}
	if(templateId == 7){
		$('#box2wrapper').resizable({
			resize: function( event, ui ) {
				//Handles east resizing START.
				remaining = ($(parent).width()) - $('#box2wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');	
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
				}		
				$('#box1wrapper').css('width', remaining + "px");

				$('#box3wrapper').css('width', $('#box2wrapper').width() + "px");
				$('#box4wrapper').css('width', $('#box2wrapper').width() + "px");
				//Handles east resizing END.
				//Handles south resizing START.
				resizeAmount = $(parent).height() - $('#box2wrapper').height() - $('#box3wrapper').height() - $('#box4wrapper').height();

				if($('#box3wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + resizeAmount) + "px");
					console.log('4');
				}
				else if($('#box4wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box3wrapper').css('height', ($('#box3wrapper').height() + resizeAmount) + "px");
					console.log('3')
				}
				else{
					$('#box3wrapper').css('height', ($('#box3wrapper').height() + (resizeAmount)/2) + "px");
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + (resizeAmount)/2) + "px");
				}
				//Handles south resizing END.
			},
			handles:"s, e",
			maxHeight: ($(parent).height()*0.70),
			minHeight: ($(parent).height()*0.15),
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			containment: parent
		});
		$('#box3wrapper').resizable({
			resize: function( event, ui ) {
				//Handles east resizing START.
				remaining = ($(parent).width()) - $('#box3wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');	
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
				}
				$('#box1wrapper').css('width', remaining + "px");

				$('#box2wrapper').css('width', $('#box3wrapper').width() + "px");
				$('#box4wrapper').css('width', $('#box3wrapper').width() + "px");
				//Handles east resizing END.
				//Handles south resizing START.
				resizeAmount = $(parent).height() - $('#box2wrapper').height() - $('#box3wrapper').height() - $('#box4wrapper').height();

				if($('#box2wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + resizeAmount) + "px");
					console.log('4');
				}
				else if($('#box4wrapper').height() <= $(parent).height()*0.15 && resizeAmount < 0){
					$('#box2wrapper').css('height', ($('#box2wrapper').height() + resizeAmount) + "px");
					console.log('3')
				}
				else{
					$('#box2wrapper').css('height', ($('#box2wrapper').height() + (resizeAmount)/2) + "px");
					$('#box4wrapper').css('height', ($('#box4wrapper').height() + (resizeAmount)/2) + "px");
				}
				//Handles south resizing END.
			},
			handles: "s, e",
			maxHeight: ($(parent).height()*0.70),
			minHeight: ($(parent).height()*0.15),
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			containment: parent

		});
		$('#box4wrapper').resizable({
			resize: function( event, ui ) {
				//Handles east resizing START.
				remaining = ($(parent).width()) - $('#box4wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');	
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');

					boxToHide = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
				}
				$('#box1wrapper').css('width', remaining + "px");

				$('#box2wrapper').css('width', $('#box4wrapper').width() + "px");
				$('#box3wrapper').css('width', $('#box4wrapper').width() + "px");
				//Handles east resizing END.
			},
			handles: "e",
			maxHeight: ($(parent).width()*0.85),
			minHeight: ($(parent).width()*0.15),
			containment: parent
		});
	}
	if(templateId == 8){
		$('#box2wrapper').resizable({
			//This one currently doens't work
			resize: function( event, ui ) {
				remaining = ($(parent).width()) - $('#box2wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
			
					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
				}
				document.querySelector('#box1wrapper').style.width = remaining + "px";
			},
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			handles:"e",
			containment: parent
		});
		//This one currently doens't work
		$('#box3wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).height()) - $('#box3wrapper').height();
				document.querySelector('#box2wrapper').style.height = remaining + "px";
			},
			handles: "n",

		});
	}
	if(templateId == 9){
		$('#box1wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).width()) - $('#box1wrapper').width();
				if((remaining/$(parent).width())*100 < 16){
					boxToHide = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
					boxToHide = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
					boxToHide = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
					boxToHide = document.querySelector('#box5wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else if((remaining/$(parent).width())*100 > 84){
					boxToHide = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToHide.classList.add('hidden');
					boxToHide.classList.add('visuallyhidden');
				}
				else{
					boxToShow = document.querySelector('#box1wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
					boxToShow = document.querySelector('#box2wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box3wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box4wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');

					boxToShow = document.querySelector('#box5wrapper #boxtitlewrapper');
					boxToShow.classList.remove('hidden');
					boxToShow.classList.remove('visuallyhidden');
	
				}
				document.querySelector('#box2wrapper').style.width = remaining + "px";
				document.querySelector('#box3wrapper').style.width = remaining + "px";
				document.querySelector('#box4wrapper').style.width = remaining + "px";
				document.querySelector('#box5wrapper').style.width = remaining + "px";
			},
			maxWidth: ($(parent).width()*0.85),
			minWidth: ($(parent).width()*0.15),
			handles:"e",
			containment: parent
		});
		$('#box2wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).height()) - $('#box2wrapper').height();
				document.querySelector('#box3wrapper').style.height = remaining/3 + "px";
				document.querySelector('#box4wrapper').style.height = remaining/3 + "px";
				document.querySelector('#box5wrapper').style.height = remaining/3 + "px";
				
			},
			maxHeight: ($(parent).height()*0.65),
			minHeight: ($(parent).height()*0.15),
			handles:"s",
			containment: parent
		});
		$('#box3wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).height()) - $('#box3wrapper').height();
				 document.querySelector('#box2wrapper').style.height = remaining/3 + "px";
				 document.querySelector('#box4wrapper').style.height = remaining/3 + "px";
				 document.querySelector('#box5wrapper').style.height = remaining/3 + "px";
				
			},
			maxHeight: ($(parent).height()*0.65),
			minHeight: ($(parent).height()*0.15),
			handles:"s",
			containment: parent
		});
		$('#box4wrapper').resizable({
			resize: function( event, ui ) {
				remaining = ($(parent).height()) - $('#box4wrapper').height();
				 document.querySelector('#box2wrapper').style.height = remaining/3 + "px";
				 document.querySelector('#box3wrapper').style.height = remaining/3 + "px";
				 document.querySelector('#box5wrapper').style.height = remaining/3 + "px";
				
			},
			maxHeight: ($(parent).height()*0.65),
			minHeight: ($(parent).height()*0.15),
			handles:"s",
			containment: parent
		});
	}
}	
//------------------------------------------------------------------------------------------------------------------------------
// Hide or show scrollbars on a box depending on if the content of the box takes more or less space than the box itself.
//------------------------------------------------------------------------------------------------------------------------------

// The function does not do anything, but MUST NOT be removed because other functions in other files still refers to it.
function hideShowScrollbars(boxValArray, box){
	if(document.querySelector('#box' + box).className == 'box codebox'){
	}else if(document.querySelector('#box' + box).className == 'box descbox'){
	}
}

//----------------------------------------------------------------------------------
//Creates an array with all the properties needed for resize function.
//                Is called by resizeBoxes in codeviewer.js
//----------------------------------------------------------------------------------

function saveInitialBoxValues() {
	var templateId = retData["templateid"];
	var parent = "#div2";
	var boxValArray = initResizableBoxValues(parent);

	setLocalStorageProperties(templateId, boxValArray);
}

function initResizableBoxValues(parent) {
	var parentWidth = $(parent).width();
	var parentHeight = $(parent).height();
	var boxWidth;
	var boxHeight;
	var boxId;
	var numBoxes = $("[id ^=box][id $=wrapper]").length;
	var boxValueArray = new Array();
	boxValueArray["parent"] = {
		"id": parent,
		"width": parentWidth,
		"height": parentHeight
	};

	for (var i = 1; i <= numBoxes; i++) {
		boxWidth = $("#box" + i + "wrapper").width();
		boxHeight = $("#box" + i + "wrapper").height();
		boxId = "#box" + i + "wrapper";
		boxValueArray["box" + i] = {
			"id": boxId,
			"width": boxWidth,
			"height": boxHeight
		};
	}

	$(window).resize(function (event) {
		if (!$(event.target).hasClass('ui-resizable')) {
			boxValueArray['parent']['height'] = $(parent).height();
			boxValueArray['parent']['width'] = $(parent).width();
		}
	});

	return boxValueArray;
}


//----------------------------------------------------------------------------------
//	LOADER:	Makes the page content hidden until it is loaded completely and displays a
//  loading gif until page has loaded fully
//----------------------------------------------------------------------------------

document.onreadystatechange = function () {
	var state = document.readyState
	if (state == 'interactive') {
		document.getElementById('content').style.visibility = "hidden";
	} else if (state == 'complete') {
		document.getElementById('loader').style.visibility = "hidden";
		document.getElementById('content').style.visibility = "visible";
	}
}


//----------------------------------------------------------------------------------
// addHtmlLineBreak: This function will replace all '\n' line breaks in a string
//					 with <br> tags.
//                Is called by returned in codeviewer.js
//----------------------------------------------------------------------------------

function addHtmlLineBreak(inString) {
	return inString.replace(/\n/g, '<br>');
}

//----------------------------------------------------------------------------------
// copyCodeToClipboard: Selects and copies the code within the selected code view
//----------------------------------------------------------------------------------

function copyCodeToClipboard(boxid) {
	var box = document.getElementById("box" + boxid);
	var code = box.getElementsByClassName("normtextwrapper")[0];

	var impo = code.getElementsByClassName("impo"); // Add code to just copy impo code

	// Select the code
	var selection = window.getSelection();
	
	// Add Code to just copy impo code
	for(i = 0; i<impo.length;i++){
		var range = document.createRange();
		range.selectNode(impo[i]);
		selection.addRange(range);
	}
	
	document.execCommand("Copy");
	selection.removeAllRanges();

	// Notification animation
	$("#notificationbox" + boxid).css("display", "flex").css("overflow", "hidden").hide().fadeIn("fast", function () {
		setTimeout(function () {
			$("#notificationbox" + boxid).fadeOut("fast");
		}, 500);
	});
}


// Detects clicks
$(document).mousedown(function (e) {
	var box = $(e.target);
	if (box[0].classList.contains("loginBox")) { // is the clicked element a loginbox?
		isClickedElementBox = true;
	} else if ((findAncestor(box[0], "loginBox") != null) // or is it inside a loginbox?
		&&
		(findAncestor(box[0], "loginBox").classList.contains("loginBox"))) {
		isClickedElementBox = true;
	} else {
		isClickedElementBox = false;
	}
	if (!box[0].classList.contains("burgerOption")) {
		closeBurgerMenu();
	}
});

// Close the loginbox when clicking outside it.
$(document).mouseup(function (e) {
	// Click outside the loginBox
	if ($('.loginBox').is(':visible') && !$('.loginBox').is(e.target) // if the target of the click isn't the container...
		&&
		$('.loginBox').has(e.target).length === 0 // ... nor a descendant of the container
		&&
		(!isClickedElementBox)) // or if we have clicked inside box and dragged it outside and released it
	{
		closeWindows();
	}
});
var bool;
function showBurgerMenu() {
    if(bool==true){
        showBurgerDropdown();
        bool=false;
    }else{
        closeBurgerMenu();
        bool=true;
    }
}

function showBurgerDropdown(){
 	var menu = document.querySelector('#burgerMenu');
	var burgerPos = document.querySelector('#codeBurger').getBoundingClientRect();
	menu.style.display = 'block';
	menu.style.top = burgerPos.top + 50 + 'px';
	menu.style.left = burgerPos.left+'px';
}

function closeBurgerMenu() {
	document.querySelector('#burgerMenu').style.display = 'none';
}



function showAllViews(){
	var boxes = retData['box'];
 	boxes.forEach(box => {
    	showAllBox(box[0]);
 	});
	for(i = 1; i <= retData['numbox']; i++){
		$("#box" + i +"wrapper").css('grid-column','');
		$("#box" + i +"wrapper").css('grid-row','');
	}
}

function setShowPane(id) {
	closeBurgerMenu();
	for(i = 1; i <= retData['numbox']; i++){
		if(i == id){
			$("#box" + i +"wrapper").css("display", "inline");
			//Setting the box to cover the entire grid of #div2
			$("#box" + i +"wrapper").css('grid-column',"a/b");
			$("#box" + i +"wrapper").css('grid-row',"a/l");
		}
		else{
			$("#box" + i +"wrapper").css("display", "none");
		}
		
	}
}

function showAllBox(id) {
   closeBurgerMenu();
   var container = document.querySelector('#div2');
   var boxes = [...container.childNodes];
   boxes.forEach(box => {
    if (box.id === 'box'+id+'wrapper') {
        box.style.display = 'block';
        box.style.width = '100%';
        box.style.maxWidth = '100%';
        box.style.height = '100%';
    } 
   });
}

function showBox(id) {
 	var container = document.querySelector('#div2');
	var boxes = [...container.childNodes];
	
	boxes.forEach(box => {
		if (box.id === 'box'+id+'wrapper') {
			box.style.display = 'block';
			box.style.width = '100%';
			box.style.maxWidth = '100%';
			box.style.height = '100%';
		} else {
			box.style.display = 'none';
		}
	});
}

// Iframe used for editing file 
function showIframe(boxid,kind) {
	    var fileName = retData['box'][boxid - 1][5]+'';
		var filePath = 'fileed.php?courseid='+courseid+'&coursevers='+cvers+'&kind='+kind+'&filename=';
		document.querySelector(".previewWindow").style.display = "block";
		document.querySelector(".previewWindowContainer").style.display = "block";
		$("#iframeFileed").attr('src', filePath+fileName);
}

// Iframe used for drag and drop
function showHiddenIframe() {
    var filePath = 'fileed.php?courseid=' + courseid + '&coursevers=' + cvers;
    document.querySelector(".previewWindow").style.display = "block";
    document.querySelector(".previewWindowContainer").style.display = "block";
    $("#iframeFileed").attr('src', filePath);
}

function hideIframe()
{
	document.querySelector(".previewWindow").style.display = "none";
	document.querySelector(".previewWindowContainer").style.display = "none";
	location.reload();
}

function hideDescription() {
	console.log("hideDescription");
}

//Toggles the animation of buttomenu2 items/td when resizing
//This function is called by alignBoxesWidth()

function toggleTitleWrapper(targetBox, boxNum, boxW){
	var box = targetBox;
  	if (boxW > 15 && boxW < 84 || boxW < 15 && boxNum == 2 && (retData['templateid']) == !8 || boxW > 84 && boxNum == 1 && (retData['templateid']) == !6 && !3 && !9) {
    	box.classList.remove('hidden');
    	setTimeout(function () {
      		box.classList.remove('visuallyhidden');
		}, 20);

  	}else if(box.classList.contains('visuallyhidden') == false && boxW < 15 && boxNum == 1){
		box.classList.add('visuallyhidden');
    	box.addEventListener('transitionend', function(e) {
      		box.classList.add('hidden');
    	}, {
      		capture: false,
      		once: true,
      		passive: false
    	});
  	}else if(box.classList.contains('visuallyhidden') == false && boxW > 84 && boxNum == 2 && boxW < 98){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW < 15 && boxNum == 2 && (retData['templateid']) == !1 || box.classList.contains('visuallyhidden') == false && boxW < 15 && boxNum == 3){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW > 84 && boxW < 98 && boxNum == 3 && (retData['templateid']) != 5){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW > 84 && boxW < 98 && boxNum == 4 && boxW < 98){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW > 84  && boxW < 98 && boxNum == 1 && (retData['templateid']) == 6){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW > 84  && boxW < 98 && boxNum == 1 && (retData['templateid']) == 3){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW > 84  && boxW < 98 && boxNum == 1 && (retData['templateid']) == 9){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW < 15 && boxNum == 2 && (retData['templateid']) == 7 && template7maximizebuttonpressed == false || box.classList.contains('visuallyhidden') == false && boxW < 15 && boxNum == 4 && (retData['templateid']) == 7 && template7maximizebuttonpressed == false ){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}else if(box.classList.contains('visuallyhidden') == false && boxW < 15 && boxNum == 2 && (retData['templateid']) == 8 && template7maximizebuttonpressed == false ){
	  box.classList.add('visuallyhidden');
	  box.addEventListener('transitionend', function(e) {
			box.classList.add('hidden');
	  }, {
			capture: false,
			once: true,
			passive: false
	  });
	}

}