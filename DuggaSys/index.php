<?php
	include_once("../../coursesyspw.php");	
	include_once("basic.php");
	session_start();
	dbConnect();
	
?>

<!DOCTYPE html>
<html>
<head>	
		<link type="text/css" href="../DuggaSys/css/duggasys.css" rel="stylesheet" />	
		<link type="text/css" href="../DuggaSys/css/style.css" rel="stylesheet" />
		<script type="text/javascript" src="../Shared/js/jquery-1.11.0.min.js"></script>
		<script type="text/javascript" src="js/function.js"></script>
		<script src="header/header.js"></script>
</head>
<body>

	<script type="text/javascript">
	window.onload = function() {
		changeURL("menulist");
	}
	</script>
    <header>
    	  <div class="load"></div>
    </header>
    <div id="content"></div>
</body>
</html>
