
/********************************************************************************
	 Globals
*********************************************************************************/

var sessionkind = 0;
var querystring = parseGet();
var filez;
var mmx = 0, mmy = 0;
var msx = 0, msy = 0;
var rProbe = null;
var needMarking=0;

AJAXService("GET", { cid : querystring['cid'] }, "RESULT");

$(function() 
{
	$("#release").datepicker({ dateFormat : "yy-mm-dd" });
	$("#deadline").datepicker({ dateFormat : "yy-mm-dd" });
});

//----------------------------------------
// Commands:
//----------------------------------------

function makeSelect(gradesys, cid, vers, moment, uid, mark, ukind) 
{
	var str = "";
	// Irrespective of marking system we allways print - and U
	if (mark === null || mark === 0){
		str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-none\" value = \"0\" checked = \"checked\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-none\">-</label>";
	}
	else{
		str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-none\" value = \"0\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-none\">-</label>";
	}
	if (mark === 1){
		str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-u\" value = \"1\" checked = \"checked\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-u\">U</label>";
	}
	else{
		str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-u\" value = \"1\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-u\">U</label>";
	}

	// Gradesystem: 1== UGVG 2== UG 3== U345
	if (gradesys === 1) {
		if (mark === 2){
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\" value = \"2\" checked = \"checked\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\">G</label>";
		}
		else{
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\" value = \"2\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\">G</label>";
		}
		if (mark === 3){
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-vg\" value = \"3\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-vg\">VG</label>";
		}
		else{
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-vg\" value = \"3\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-vg\">VG</label>";
		}
	} else if (gradesys === 2) {
		if (mark === 2){
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\" value = \"2\" checked = \"checked\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\">G</label>";
		}
		else{
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\" value = \"2\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-g\">G</label>";
		}
	} else if (gradesys === 3) {
		if (mark === 4){
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-3\" value = \"4\" checked = \"checked\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-3\">3</label>";
		}
		else{
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-3\" value = \"4\"  onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-3\">3</label>";
		}
		if (mark === 5){
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-4\" value = \"5\" checked = \"checked\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-4\">4</label>";
		}
		else{
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-4\" value = \"5\"  onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-4\">4</label>";
		}
		if (mark === 6){
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-5\" value = \"6\" checked = \"checked\" onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-5\">5</label>";
		}
		else{
			str += "<input class=\"gradeInput\" type = \"radio\" name = \"grade-"+moment+"-"+ukind+"-"+uid+"\" id = \"grade-"+moment+"-"+ukind+"-"+uid+"-5\" value = \"6\"  onclick='changeGrade(this,\"" + gradesys + "\",\"" + cid + "\",\"" + vers + "\",\"" + moment + "\",\"" + uid + "\",\"" + mark + "\",\"" + ukind + "\");'> <label for = \"grade-"+moment+"-"+ukind+"-"+uid+"-5\">5</label>";
		}
	} else {
		//alert("Unknown Grade System: "+gradesys);
	}

	return str;
}

function hoverResult(cid, vers, moment, firstname, lastname, uid, submitted, marked) 
{
	$("#Nameof").html(firstname + " " + lastname + " - Submitted: " + submitted + " Marked: " + marked);
	
	// Start counting pixels
	msx = -1;
	msy = -1;

	AJAXService("DUGGA", { cid : cid, vers : vers, moment : moment, luid : uid }, "RESULT");
}

function changeGrade(elem, gradesys, cid, vers, moment, uid, mark, ukind) 
{
	mark = elem.value;
	AJAXService("CHGR", { cid : cid, vers : vers, moment : moment, luid : uid, mark : mark, ukind : ukind }, "RESULT");
}

function moveDist(e) 
{
	mmx = e.clientX;
	mmy = e.clientY;

	if (msx == -1 && msy == -1) {
		msx = mmx;
		msy = mmy;
	} else {
		// Count pixels and act accordingly
		if ((Math.abs(mmx - msx) + Math.abs(mmy - msy)) > 16) {
			$("#resultpopover").css("display", "none");
			closeFacit();
			document.getElementById('MarkCont').innerHTML="";
		}
	}
}

function enterCell(thisObj)
{
		rProbe=$(thisObj).css('backgroundColor');
		if(rProbe!="transparent"){
				if(rProbe=="rgb(248, 232, 248)"){
						cliffton="rgb(208,192,208)";
				}else if(rProbe=="rgb(221, 255, 238)"){
						cliffton="rgb(181,215,168)";		
				}else if(rProbe=="rgb(255, 255, 221)"){
						cliffton="rgb(215,215,181)";		
				}else if(rProbe=="rgb(255, 238, 221)"){
						cliffton="rgb(215,198,181)";		
				}else if(rProbe=="rgb(255, 255, 255)"){
						cliffton="rgb(215,215,215)";		
				}else{
						cliffton="#FFF";
				}
		
				$(thisObj).css('backgroundColor',cliffton);
		}
}

function leaveCell(thisObj)
{
		if(rProbe!==null&&rProbe!=="transparent") $(thisObj).css('backgroundColor',rProbe);		
}


//----------------------------------------
// Sort results
//----------------------------------------
function orderResults(moments)
{
	var arr = [];
	var currentMomentIndex=0;
	arr[currentMomentIndex] = [];
	var currentMoment=null;
	for(var i=0; i < moments.length;i++){
		if(moments[i].kind === 3 && moments[i].moment === null){
			// Standalone dugga
			arr[currentMomentIndex] = moments[i];
			currentMomentIndex++;
			alert("Added standalone");
		} else if (moments[i].kind === 4 && moments[i].moment !== null){
			if (currentMoment === null){
				// Moment : first or same as previous
				arr[currentMomentIndex].push(moments[i]);
				currentMoment = moments[i].moment;
			} else if (currentMoment === moments[i].moment) {
				arr[currentMomentIndex].push(moments[i]);
			}else {
				// Moment : new
				currentMomentIndex++;
				currentMoment = moments[i].moment;
				arr[currentMomentIndex] = [];
				arr[currentMomentIndex].push(moments[i]);
			}
		} else if (moments[i].kind === 3 && moments[i].moment !== null){
				arr[currentMomentIndex].push(moments[i]);
		}
	}
	return arr;
}

//----------------------------------------
// Render Result Table Header
//----------------------------------------
function renderResultTableHeader(data)
{
	var str = "<thead>"
	str += "<tr><th id='needMarking' style='text-align:right;'></th>";
	for (var i = 0; i < data.length; i++) {
		if ((data[i][0].kind === 3 && data[i][0].moment === null) || (data[i][0].kind === 4)) {
			str += "<th style='border-left:2px solid white;'>";
			str += data[i][0].entryname;
			str += "</th>";
		}
	}
	str += "</tr></thead>";
	return str;
}

//----------------------------------------
// Render Moment
//----------------------------------------
function renderMoment(data, userResults, userId, fname, lname)
{
	var str = "";
	// Each of the section entries (i.e. moments)
	for ( var j = 0; j < data.length; j++) {
		str += "<td style='padding:0px;'>";
		
		// There are results to display.
		str += "<table width='100%' class='markinginnertable' >";
		str += "<tr>";

		if (data[j][0].kind === 3 && data[j][0] === null){
			//str += renderStandaloneDugga(data[j][0], userResults);

		} else if (data[j][0].kind === 4 && data[j][0] !== null) {
				str += renderMomentChild(data[j][0], userResults, userId, fname, lname, 1);
				str += "</tr><tr>";
			for (var k = 1; k < data[j].length; k++){
				str += renderMomentChild(data[j][k], userResults, userId, fname, lname, 0);
				//console.log(data[j][k]);
			}			
		} else {
			alert("Malformed data!");
		}
		str += "</tr>";
		str += "</table>";
		str += "</td>";
	}
	return str;

}

//----------------------------------------
// Render Standalone Dugga
//----------------------------------------
function renderStandaloneDugga(data, userResults)
{
	var foundgrade = null;
	var useranswer = null;
	var submitted = null;
	var marked = null;
	var variant = null;
	var studres = result[userId];

	if (studres !== null) {
		for (var l = 0; l < studres.length; l++) {
			var resultitem = studres[l];
			if (resultitem['moment'] === data.lid) {
				// There is a result to print
				foundgrade = resultitem['grade'];
				useranswer = resultitem['useranswer'];
				submitted = resultitem['submitted'];
				marked = resultitem['marked'];
				variant = resultitem['variant'];
				
				if(submitted!==null) {
					var t = submitted.split(/[- :]/);
					submitted=new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
				}
				if(marked!==null) {
					var tt = marked.split(/[- :]/);
					marked=new Date(tt[0], tt[1]-1, tt[2], tt[3], tt[4], tt[5]);
				}
			}
		}
	}

	
	/*
	zstr = "";
	
	
	if (foundgrade === null && useranswer === null && submitted === null) {
		zstr += makeSelect(moment['gradesystem'], querystring['cid'], querystring['coursevers'], moment['lid'], user['uid'], null, "I");
	} else if (foundgrade !== null) {
		zstr += makeSelect(moment['gradesystem'], querystring['cid'], querystring['coursevers'], moment['lid'], user['uid'], foundgrade, "U");								
	}
	else {
		zstr += makeSelect(moment['gradesystem'], querystring['cid'], querystring['coursevers'], moment['lid'], user['uid'], null, "U");	
	}
	
	// Fist ... if no result is found i.e. No Fist
	if(useranswer!==null){
			zstr += "<img id='korf' style='padding-left:8px;margin-top:4px;' src='../Shared/icons/FistV.svg' onmouseover='hoverResult(\"" + querystring['cid'] + "\",\"" + querystring['coursevers'] + "\",\"" + moment['lid'] + "\",\"" + user['uid'] + "\",\"" + user['firstname'] + "\",\"" + user['lastname'] + "\");' />";
	}

	// If no submission,  white. 
	// If submitted and not marked or resubmitted U, yellow. 
	// If G or better, green. 
	// If U, pink. 
	// If visited but not saved, lilac
	if(foundgrade===1){
			yomama="background-color:#fed";							
	}else if(foundgrade>1){
			yomama="background-color:#dfe";							
	}else if(variant!==null&&useranswer===null){
			yomama="background-color:#F8E8F8";														
	}else if((useranswer!==null&&foundgrade===null)||(foundgrade!==null&&submitted>marked)){
			yomama="background-color:#ffd";		
			needMarking++;					
	}else{
			yomama="background-color:#fff";														
	}
	
	// Standalone Dugga -- we just need to make a dugga entry with the correct marking system.
	str += "<td style='"+yomama+"'>&nbsp;</td></tr><tr  style='border-top:2px solid #dbd0d8;' >";

	str += "<td style='"+yomama+"' onmouseover='enterCell(this);' onmouseout='leaveCell(this);'>"+zstr;

	str += "</td>";
	*/	
}


//----------------------------------------
// Render Moment child
//----------------------------------------
function renderMomentChild(dugga, userResults, userId, fname, lname, moment)
{

	var str = "";
	var foundgrade = null;
	var useranswer = null;
	var submitted = null;
	var marked = null;
	var variant = null;
	if (userResults !== undefined) {
		for (var l = 0; l < userResults.length; l++) {
			var resultitem = userResults[l];

			if (resultitem.moment === dugga.lid) {
				// There is a result to print
				foundgrade = resultitem.grade;
				useranswer = resultitem.useranswer;
				submitted = resultitem.submitted;
				marked = resultitem.marked;
				variant = resultitem.variant	;

				if(submitted!==null) {
					var t = submitted.split(/[- :]/);
					submitted=new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
				}
				if(marked!==null) {
					var tt = marked.split(/[- :]/);
					marked=new Date(tt[0], tt[1]-1, tt[2], tt[3], tt[4], tt[5]);
				}
			}
		}
	}

	var zttr="";
	if (moment){
		zttr += '<div style="display:inline-block;min-width:95px">'
	} else {
		zttr += '<div style="min-width:95px">'		
	}
	// If no result is found i.e. No Fist
	if (foundgrade === null && useranswer === null && submitted === null) {
		zttr += makeSelect(dugga.gradesystem, querystring['cid'], querystring['coursevers'], dugga.lid, userId, null, "I");
	}else if (foundgrade !== null){
		zttr += makeSelect(dugga.gradesystem, querystring['cid'], querystring['coursevers'], dugga['lid'], userId, foundgrade, "U");													
	}else {
		zttr += makeSelect(dugga['gradesystem'], querystring['cid'], querystring['coursevers'], dugga['lid'], userId, null, "U");
	}
	if(useranswer!==null){
		zttr += "<img id='korf' style='padding-left:8px;margin-top:4px;' src='../Shared/icons/FistV.svg' onmouseover='hoverResult(\"" + querystring['cid'] + "\",\"" + querystring['coursevers'] + "\",\"" + dugga.lid + "\",\"" + fname + "\",\"" + lname + "\",\"" + userId + "\",\"" + submitted + "\",\"" + marked + "\");' />";
	}
	zttr += '</div>'
	// If no submission - white. If submitted and not marked or resubmitted U - yellow. If G or better, green. If U, pink. visited but not saved lilac
	if(foundgrade===1 && submitted<marked){
			yomama="background-color:#fed";							
	}else if(foundgrade>1){
			yomama="background-color:#dfe";							
	}else if(variant!==null&&useranswer===null){
			yomama="background-color:#F8E8F8";															
	}else if((useranswer!==null&&foundgrade===null)||(foundgrade===1&&submitted>marked)||(useranswer!==null&&foundgrade===0)){
			yomama="background-color:#ffd";							
			needMarking++;
	}else{
			yomama="background-color:#fff";														
	}
	if (moment){
		str += "<td style='border-left:2px solid #dbd0d8;"+yomama+"' onmouseover='enterCell(this);' onmouseout='leaveCell(this);' colspan='0'>";
	} else {
		str += "<td style='border-left:2px solid #dbd0d8;"+yomama+"' onmouseover='enterCell(this);' onmouseout='leaveCell(this);'>";
	}
	str += dugga['entryname'] + " ";
	str +=zttr;
	str += "</td>";
	return str;
}

//----------------------------------------
// Renderer
//----------------------------------------
function returnedResults(data) 
{
	var str = "";
	var zstr = "";
	var ttr = "";
	var zttr = "";
	needMarking=0;

	if (data['dugganame'] !== "") {
		$.getScript(data['dugganame'], function() {
			$("#MarkCont").html(data['duggapage']);

			//alert(data['duggaparam']+"\n"+data['useranswer'] + "\n" + data['duggaanswer']);
			showFacit(data['duggaparam'],data['useranswer'],data['duggaanswer']);
		});
		$("#resultpopover").css("display", "block");
		//alert(data['duggaanswer']);
	} else {

		results = data['results'];
		m = orderResults(data['moments']);
		str += "<table class='markinglist'>";
		str += renderResultTableHeader(m);

		if (data['entries'].length > 0) {
			for ( i = 0; i < data['entries'].length; i++) {
				var user = data['entries'][i];

				str += "<tr class='fumo'>";

				// One row for each student
				str += "<td>";
				str += user['firstname'] + " " + user['lastname'] + "<br/>" + user['username'] + "<br/>" + user['ssn'];
				str += "</td>";
				str += renderMoment(m, results[user['uid']], user['uid'], user['firstname'], user['lastname']);
				str += "</tr>";
			}
		}
		var slist = document.getElementById("content");
		slist.innerHTML = str;
		document.getElementById("needMarking").innerHTML = "Students: " + data['entries'].length + "<BR />Unmarked : " + needMarking;						
	}
	if (data['debug'] !== "NONE!") alert(data['debug']);
}