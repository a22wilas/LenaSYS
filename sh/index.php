<?php

date_default_timezone_set("Europe/Stockholm");

// Include basic application services
include_once "../Shared/basic.php";
include_once "../Shared/sessions.php";

//Gets the parameter from the URL. If the parameter is not availble then return UNK
$course = getOPG("c");
$assignment = getOPG("a");

// Connect to database and start session
pdoConnect();
session_start();

function GetAssigment ($hash){
	global $pdo;
	$sql ="SELECT cid, vers, quiz
	FROM useranswer 
	WHERE hash='$hash'";	
	$URL = "";
	foreach ($pdo->query($sql) as $row){
		echo $row["cid"] . " | " . $row["vers"] . " | " $row["quiz"]; 
		$URL = '../DuggaSys/showDugga.php?courseid={$row["cid"]}&coursevers={$row["vers"]}&did={$row["quiz"]}';
	}	
	return $URL
}


function courseQuery($course){
	global $pdo;
	$c = '"%' . $course . '%"';
	$sql = "SELECT cid, coursename, activeversion, coursecode 
	 FROM course 
	 WHERE cid LIKE " . $c . " OR coursename LIKE " . $c . 
	 " OR activeversion LIKE " . $c . 
	 " OR coursecode LIKE " . $c . "
	 AND visibility=1";
	$array = array();

	foreach ($pdo->query($sql) as $row) {
		$array['cid'] = $row['cid'];
		$array['coursename'] = $row['coursename'];
		$array['coursecode'] = $row['coursecode'];
		$array['courseservers'] = $row['activeversion'];
	}
	return $array;
}

echo "|".$course."|".$assignment."|";

if($assignment != "UNK"){
	// Check if it's an URL shorthand for assignments
	if($course == "UNK"){
		/*
		foreach($pdo->query( 'SELECT * FROM passwordURL;' ) as $row){
			
			if($assignment == $row["shortURL"]){
				header("Location: " + $row['URL']);
				}
		}
		*/
		$gotdata = GetAssigment($assignment);
		echo $gotdata;
	}elseif(($course == "Databaskonstruktion" || $course == "dbk")){
		if($assignment=="a1"){
			header("Location: https://dugga.iit.his.se/DuggaSys/showdoc.php?cid=4&coursevers=82452&fname=minimikrav_m1a.md");
			exit();		
		}else{
			header("Location: https://dugga.iit.his.se/DuggaSys/sectioned.php?courseid=4&coursevers=82452");
			exit();		
		}
	}
	return $array;
}

function queryToUrl($course, $assignment){
	global $pdo;
	if($course != 'UNK')
		$c = courseQuery($course);
	else echo "Unknown Course";
	if($assignment != 'UNK'){
		$a = assignmentQuery($assignment);
		$url = "/LenasSYS/DuggaSys/showdoc.php?cid=" . $a['cid'] ."&coursevers=" . $c['courseservers'] ."&fname=" . $a['filename'];
	}
	else $url = "/LenaSYS/DuggaSys/sectioned.php?courseid=" . $c['cid'] ."&coursename=" . $c['coursename'] . "&coursevers=" .  $c['courseservers'];

	return $url; 
}
if($course == "UNK" || $assignment == "UNK"){
    header("Location: ". queryToUrl($course, $assignment));
    exit();
}

$pdo = null;
?>

