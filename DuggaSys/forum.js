/********************************************************************************

   Globals

*********************************************************************************/

var sessionkind=0;
var querystring = parseGet();

//----------------------------------------
// Commands:
//----------------------------------------

$(document).on('click','.replyCommentButton', function(event) {
		event.preventDefault();
		var target = "#" + this.getAttribute('data-target');
		$('html, body').animate({
			scrollTop: $('#makeCommentInputWrapper').offset().top -110
		}, 1000);
});

function initThread()
{
	console.log(querystring);
	if (querystring["threadId"])
	{
		getThread();
		$(".editorDescr").on("keyup", checkComment);
	}
	else {
		getCourses();
	}
}

function getThread()
{
	AJAXService("GETTHREAD",{threadId:querystring["threadId"]},"GETTHREAD");
	getComments();
}

function lockThread()
{
	AJAXService("LOCKTHREAD",{threadId:querystring["threadId"]},"LOCKTHREAD");
}

function deleteThread()
{
	$('#threadDeleteConfirm').css('display','inline-block');
}

function confirmDeleteThread()
{
	AJAXService("DELETETHREAD",{threadId:querystring["threadId"]},"DELETETHREAD");
}

// Vad ska hända när man deletar en tråd???
function deleteThreadSuccess(data)
{
	if (data["accessDenied"]){
		accessDenied(data);
	}else{
		window.location.replace("courseed.php");
	}
}

function getComments()
{
  AJAXService("GETCOMMENTS",{threadId:querystring["threadId"]},"GETCOMMENTS");
}

function createThread()
{
	var cid = $("#createThreadOptions .createThreadCourseList:first").val();
	var topic = $("#threadTopicInput").val();
	var description = $(".editorDescr").first().val();
	var accessList = new Array();
	if ($('input:radio[name=threadAccessRadio]:checked').val()==="public") {
		accessList = false;
	}else {
		$.each($(".threadUsersCheckbox"), function() {
			if ($(this).is(':checked') && $(this).val()!=="all") {
				accessList.push($(this).val());
			}
		});
	}

	var lockedStatus = $("input:radio[name=threadAllowCommentsRadio]:checked").val();

	console.log(accessList);
	AJAXService("CREATETHREAD",{cid:cid,topic:topic,description:description, accessList:accessList,lockedStatus:lockedStatus},"CREATETHREAD");
}

function makeComment(commentid)
{
	var commentcontent = "";
	$(document).ready(function() {
    var $myDiv = $('.repliedcomment');
		if ( $myDiv.length){
			commentcontent = $(".repliedcomment").html();
		}
	});
	var editorDescr = $("#makeCommentInputWrapper").find(".editorDescr");
	var editorPreview = $("#makeCommentInputWrapper").find(".editorPreviewText");
	var text = commentcontent + $(editorDescr).val();
	if(text)
	{
		AJAXService("MAKECOMMENT",{threadId:querystring["threadId"],text:text,commentid:commentid},"MAKECOMMENT");
	}
	else
	{

	}
	$(editorDescr).val("");
	$(editorPreview).html(" ");

	$("#commentSubmitButton").attr("onclick", "makeComment()");
}

function checkComment()
{
	var editorDescrElem = $("#makeCommentInputWrapper").find(".editorDescr");
	var text = $(editorDescrElem).val();

	if(text.length > 0)
	{
		$("#commentSubmitButton").css("background-color", "#614875");
	}
	else
	{
		$("#commentSubmitButton").css("background-color", "buttonface");
	}
}

function deleteComment(commentid)
{

	AJAXService("DELETECOMMENT",{commentid:commentid},"DELETECOMMENT");
}

function getCourses()
{
	AJAXService("GETCOURSES",{},"GETCOURSES");
}

function getUsers(cid)
{
	if (cid) {
		AJAXService("GETUSERS",{cid:cid},"GETUSERS");
	}else{
		AJAXService("GETUSERS",{cid:$(".createThreadCourseList:visible:first").val()},"GETUSERS");
	}
}

function editThread(data)
{
	console.log(data);
	var array = data.split(',');
	//console.log(array);

	var topic = "<input type='text' name='topic' id='threadTopicInput'>";
	$(".threadTopic").html(topic);

	$("#threadTopicInput").val(array[3]);

	$("#threadDescr").load("forumEditor.php", function() {
		$("#threadDescr .editorDescr").val(array[7]);

		var button = "<input class='new-item-button editThreadBtn' type='button' value='Submit' onclick='submitEditThread()'>";
		button += "<input class='new-item-button editThreadBtn' type='button' value='Cancel' onclick='getThread()'>";
		$("#threadDescr").append(button);
	});
}

function submitEditThread()
{
	var editorDescr = $("#threadDescr").find(".editorDescr").first();
	if(!$("#threadTopicInput").val()){
		//Better error message pls
		console.log("Topic cannot be empty!");
	}else if(!$(editorDescr).val()){
		console.log("Description cannot be empty!");
	}else{
		var topic = $("#threadTopicInput").val();
		var description = $(editorDescr).val();
		console.log(topic+description);

		AJAXService("EDITTHREAD",{threadId:querystring["threadId"],topic:topic,description:description},"EDITTHREAD");

	}
}

//----------------------------------------
// Renderer
//----------------------------------------

function accessDenied(data)
{
	var str = "<div class='err'>";
			str +=	"<span style='font-weight:bold'>";
			str +=		"Access denied! ";
			str	+=	"</span>";
			str +=	data["accessDenied"];
			str +="</div>";
	$("#content").html(str);
}

function returnedThread(data)
{
	if (data["accessDenied"]){
		accessDenied(data);
	}else {
		if($('div.threadDeleteAndEdit').length){
			var buttons = "<input class='new-item-button' id='deleteThreadButton' type='button' value='Delete' onclick='deleteThread()'>";
			if(data['thread']['locked']==1){
				buttons += "<input class='new-item-button' id='lockThreadButton'type='button' value='Unlock' onclick='unlockThread()'>";
			}else{
				buttons += "<input class='new-item-button' id='lockThreadButton'type='button' value='Lock' onclick='lockThread()'>";
			}
			$(".threadDeleteAndEdit").html(buttons);
		}

		if(data['threadAccess']==="op" || data['threadAccess']==="super"){
			var arr = $.map(data['thread'], function(el) { return el });
			//console.log(arr);
			var button = "<input class='new-item-button' id='editThreadButton'type='button' value='Edit' onclick='editThread(\""+arr+"\");'>";
			$(".opEditThread").html(button);
		}

		$(".threadTopic").html(data["thread"]["topic"]);
		$("#threadDescr").html(parseMarkdown(data["thread"]["description"]));
		var str = "";
		if(!(data["thread"]["datecreated"]===data["thread"]["lastedited"])){
			str +=
			"<span id='threadEditedDetail'>" +
				"Edited <span id='threadEditedDate'>"+data["thread"]["lastedited"].substring(0, 16) +
				"</span>" +
			"</span>";
		}

		str +=
		"<span id='threadCreatedDetail'>" +
			"Created <span id='threadDate'>" +
			data["thread"]["datecreated"].substring(0, 16) +
			"</span> by <span id='threadCreator'>"+getUsername(data['thread']['uid']) +
			"</span>" +
		"</span>";

		$("#threadDetails").html(str);

		if(data['thread']['locked'] === "1"){
			//var str = "<p style='margin-left:20px;'>This thread has been locked and can not be commented on.</p>";
			//$(".threadMakeComment").html(str);
			var str = "<span style='padding-right:30px;'><i class='fa fa-lock fa-lg fa-spin' style='color:#ff4d4d' aria-hidden='true'></i></span>";
			$(".threadLockedIcon").html(str);
			$("#threadMakeComment").slideUp();
		}else{
			$("#threadMakeComment").slideDown();
		}

		if(data['thread']['hidden'] === "1"){
			AJAXService("GETPRIVATETHREADMEMBERS",{threadId:querystring["threadId"]},"GETPRIVATETHREADMEMBERS");
		}

	}
}

function loadPrivateThreadMembers(data)
{
	console.log(data);
	var str = "<select>";

	for(var i = 0; i<data['privateMembers'].length; i++){
		str += "<option>"+data['privateMembers'][i]['username']+"</option>";
		console.log(data['privateMembers'][i]['username']);
	}
	str += "</select>";
	$(".privateMembersContainer").html(str);
}

function getUsername(threadUID)
{
	AJAXService("GETTHREADCREATOR",{threadId:querystring["threadId"],threadUID:threadUID},"GETTHREADCREATOR");
}

function showThreadCreator(data)
{
	//console.log(data);
	var str = data['courses'][0]['username'];
	$("#threadCreator").html(str);
}

function returnedComments(data)
{
	if (data["accessDenied"]){
		accessDenied(data);
	}else {


		// Adds the comment header with the amount of comments.
		var commentLength = data["comments"].length;
		var threadCommentStr = "<div id='threadCommentsHeader'>Comments ("  +  commentLength  + ")</div>";

		threadCommentStr += "<div class=\"allComments\">";

		// Iterates through all the comments
		$.each(data["comments"], function(index, value){

			var text= parseMarkdown(value['text']);

			threadCommentStr +=
			"<div class=\"threadComment\">" +
				"<div class=\"commentDetails\"><span class=\"commentUser\">" + value["username"]  +   "</span> - <span class='commentCreated'>" + (value["datecreated"]).substring(0,16) + "</span></div>" +
				"<div class=\"commentContent\"><div class=\"commentContentText descbox\">" +  text  +"</div></div>" +
				"<div class=\"commentFooter\">" +
						getCommentOptions(index, value['uid'], data['threadAccess'], data['uid'], data['comments'][index]['commentid']) +
				"</div>" +
			"</div>";
		});

		threadCommentStr += "</div>";

		// Appends the comments
		$("#threadComments").html(threadCommentStr);
	}
}

function getCommentOptions (index, commentuid, threadAccess, uid, commentid){
	var threadOptions = "";
	if (threadAccess !== "public"){
		threadOptions = "<a href='#' onclick='getCommentReply(event,"+commentid+");return false;' class='commentAction replyCommentButton'>Reply</a>";

		if (uid === commentuid || threadAccess === "super"){
			threadOptions += "<a href='#' onclick='editUI();return false;' class='commentAction'>Edit</a>";
		}
		if (threadAccess === "op" || threadAccess === "super" || uid === commentuid){
			threadOptions += "<a href='#' onclick='deleteComment("+commentid+");return false;' class='commentAction'>Delete</a>";
		}
	}
	return threadOptions;
}
function createThreadSuccess(data)
{
	if (data["accessDenied"]){
		accessDenied(data);
	}else {
		var url = "thread.php?threadId=" + data['thread']['threadid'];
		$(location).attr("href", url);
	}
}

function getCommentReply(event, commentid)
{
	var target = event.target;
	var text = $(target).parent().prev().children().first().clone().children().remove().end().text();
	text = text.replace(/(\r\n|\n|\r)/g,"");
	text = "^ " + text + " ^" + "\r\n";
	console.log(text);
	$("#threadMakeComment").find('.editorDescr').first().val(text);
	$("#commentSubmitButton").attr("onclick", "makeComment("+commentid+")");
}

function makeCommentSuccess()
{
	getComments();
}

function deleteCommentSuccess(data)
{

	if (data["accessDenied"]){
		accessDenied(data);
	}else{
		getComments();
	}
}

function lockThreadSuccess(data)
{
	if (data["accessDenied"]){
		accessDenied(data);
	}else{
		var str = "<span style='padding-right:30px;'><i class='fa fa-lock fa-lg fa-spin' style='color:#ff4d4d' aria-hidden='true'></i></span>";
		$(".threadLockedIcon").html(str);
		getThread();
	}
}

function unlockThread()
{
	AJAXService("UNLOCKTHREAD",{threadId:querystring["threadId"]},"UNLOCKTHREAD");
}

function unlockThreadSuccess()
{
	$('.threadLockedIcon').html('');
	getThread();
}

function editThreadPoo()
{
	console.log("wdawd");
	AJAXService("EDITTHREAD",{threadId:querystring["threadId"]},"EDITTHREAD");
}

function createThreadPublicUI()
{
	$(".createThreadPrivateWrapper").slideUp(function() {
		$(".createThreadPrivateWrapper").html("");
	});
}

function createThreadPrivateUI()
{
	getUsers();

	$(".createThreadPrivateWrapper").slideDown();
}

function returnedCourses(data) {
	var str;
	$.each(data['courses'], function() {
		str += "<option value='" + this["cid"] + "'>" +
			this["coursecode"] + " - " + this["coursename"] + "</option>";
	});
	$(".createThreadCourseList:visible:first").html(str);

	getUsers();
}

function returnedUsers(data) {
	console.log(data);
	if (data['users']) {
		var str =
			"<table id='threadAccessTable'>" +
				"<tr>" +
					"<th>Access</th><th>Class</th><th>Username</th><th>" +
				"</tr>";

		$.each(data['users'], function(className, classObj) {
			$.each(classObj, function(index, student) {
				// Table of students
				str +=
					"<tr>" +
						"<td><input id='checkbox"+student['uid']+"' class='threadUsersCheckbox' type='checkbox' value='"+student['uid']+"'></td>" +
						"<td>" + className + "</td>" +
						"<td>" + student['username'] + "</td>" +
					"</tr>";
			});
		});

		str +=
				"<tr>" +
					"<td><input id='threadCheckboxAll' class='threadUsersCheckbox' type='checkbox' value='all'></td>" +
					"<td style='font-weight:bold'>All</td>" +
				"</tr>" +
			"</table>";

		$(".createThreadPrivateWrapper").html(str);

		$("#threadCheckboxAll").on("change", function() {
			if ($(this).is(":checked")) {
				$(".threadUsersCheckbox").prop("checked", true);
			}else {
				$(".threadUsersCheckbox").prop("checked", false);
			}
		});
	}else {
		var str =
			"<div class='err'>" +
				"<span style='font-weight:bold'>" +
					"Sorry! " +
				"</span>" +
				"No students found for this course." +
			"</div>";
		$(".createThreadPrivateWrapper").html(str);
	}
}

function error(xhr, status, error)
{
	console.log("ERROOR");
	console.log(error);
	console.log(status);
	console.log(xhr);
}



// Forum Editor Functions


$( document ).ready(function() {
	initThread();

  $(".editorDropdown").hover(function(e) {
  	e.stopPropagation();
      $(this).children("div.editorSubMenu").slideDown(200);
  }, function(e) {
  	e.stopPropagation();
      $(this).children("div.editorSubMenu").slideUp(200).clearQueue();
  });


  $( document ).tooltip();
});

function writeText(event)
{
	var button = event.target;
	$(button).parent().find(".editorPreviewButton").first().removeClass("editorActiveButton");
	$(button).addClass("editorActiveButton");
	$(button).parent().parent().find(".editorPreviewText").first().hide();
	$(button).parent().parent().find(".editorDescr").first().show();
}

function previewText(event)
{
	var button = event.target;
	var writeButton = $(button).parent().find(".editorWriteButton").first();
	var editorDescr = $(button).parent().parent().find(".editorDescr").first();
	var editorPreview = $(button).parent().parent().find(".editorPreviewText").first();

	$(writeButton).removeClass("editorActiveButton");
	$(button).addClass("editorActiveButton");

	// Parses text to preview
	var parseText = parseMarkdown($(editorDescr).val());
	console.log(parseText);
	if(!parseText)
	{
		$(editorPreview).html("Nothing to preview!");
	}
	else
	{
		$(editorPreview).html(parseText);
	}

	$(editorDescr).hide();
	$(editorPreview).show();
}

function error(xhr, status, error)
{
	console.log("ERROOR");
	console.log(error);
	console.log(status);
	console.log(xhr);
}
