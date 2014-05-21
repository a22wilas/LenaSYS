<?php 
session_start(); 
include_once(dirname(__file__)."/../../Shared/sessions.php");

if (checklogin()) {

	if (hasAccess($_SESSION["uid"], $_POST["cid"], "w")) {

		include_once(dirname(__file__)."/../../../coursesyspw.php");
		include_once(dirname(__file__)."/../../Shared/database.php");
		pdoConnect();

		$varCheck = "";
		if ($_POST["action"]=="edit") {

			if (isset($_POST["quizname"]) && $_POST["quizname"] !="") {
				$quizname = $_POST["quizname"];
			} else {
				$varCheck .= "quizname/";
			}
			if (isset($_POST["gradesys"]) && $_POST["gradesys"] !="") {
				$gradesys = $_POST["gradesys"];
			} else {
				$varCheck .= "gradesys/";
			}

			if ($varCheck=="") {
				
				//check if course info exists in DB
				$stmt = $pdo -> prepare('SELECT count(name) as count FROM quiz WHERE name=:1');
				$stmt -> bindParam(':1', $quizname);
				$stmt -> execute();	
				$quizNameCheck = $stmt->fetch();

				if ($quizNameCheck["count"]>0) {
					echo json_encode("quizname_exists");
				} else {

					if (isset($_POST["answer"]) && $_POST["answer"] !="") {
						$answer = $_POST["answer"];
					} else {
						$answer = "";
					}
					$autograde = "0";
					if (isset($_POST["autograde"]) && $_POST["autograde"] =="true") {
						$autograde = "1";
					} elseif (isset($_POST["autograde"]) && $_POST["autograde"] =="false") {
						$autograde = "0";
					}

					if (isset($_POST["activateonsubmit"]) && $_POST["activateonsubmit"] =="true") {
						date_default_timezone_set('Europe/Stockholm');
 						$now= date('Y-m-d H:i:s');
						$releasedate = $now;
					} else {
						if (isset($_POST["releasedate"]) && $_POST["releasedate"] !="") {
							$releasedate = $_POST["releasedate"];
						} else {
							$releasedate = "0000-00-00 00:00:00";
						}
					}
					if (isset($_POST["deadline"]) && $_POST["deadline"] !="") {
						$deadline = $_POST["deadline"];
					} else {
						$deadline = "0000-00-00 00:00:00";
					}
					
					$stmt = $pdo -> prepare('INSERT INTO `quiz`(`cid`, `autograde`, `gradesystem`, `answer`, `name`, `release`, `deadline`) VALUES (:1, :2, :3, :4, :5, :6, :7)');
					$stmt -> bindParam(':1', $_POST["cid"]);
					$stmt -> bindParam(':2', $autograde);
					$stmt -> bindParam(':3', $gradesys);
					$stmt -> bindParam(':4', $answer);
					$stmt -> bindParam(':5', $quizname);
					$stmt -> bindParam(':6', $releasedate);
					$stmt -> bindParam(':7', $deadline);
					
					if ($stmt -> execute()) {
						$id = $pdo->lastInsertId();

						$stmt = $pdo -> prepare('SELECT `id`, `cid`, `autograde`, `gradesystem`, `answer`, `name`, `release`, `deadline` FROM quiz WHERE id=:1');
						$stmt -> bindParam(':1', $id);
						$stmt -> execute();	
						$data = $stmt->fetch();

						echo json_encode($data);

					} else {
						//print_r($releasedate);
						print_r($stmt -> errorInfo());						
					}
				}
			} else {
				echo json_encode($varCheck);
			}
			

			

		} elseif($_POST["action"]=="create") {

			if (isset($_POST["cid"]) && $_POST["cid"] !="") {
				$cid = $_POST["cid"];
			} else {
				$varCheck .= "cid/";
			}
			if (isset($_POST["access"]) && $_POST["access"] !="") {
				$access = $_POST["access"];
			} else {
				$varCheck .= "access/";
			}
			if (isset($_POST["quizname"]) && $_POST["quizname"] !="") {
				$quizname = $_POST["quizname"];
			} else {
				$varCheck .= "quizname/";
			}
			if (isset($_POST["parameters"]) && $_POST["parameters"] !="") {
				$parameters = $_POST["parameters"];
			} else {
				$varCheck .= "parameters/";
			}
			if (isset($_POST["answer"]) && $_POST["answer"] !="") {
				$answer = $_POST["answer"];
			} else {
				$varCheck .= "answer/";
			}
			if (isset($_POST["autograde"]) && $_POST["autograde"] !="") {
				$autograde = $_POST["autograde"];
			} else {
				$varCheck .= "autograde/";
			}
			if (isset($_POST["gradesys"]) && $_POST["gradesys"] !="") {
				$gradesys = $_POST["gradesys"];
			} else {
				$varCheck .= "gradesys/";
			}
			if (isset($_POST["releasedate"]) && $_POST["releasedate"] !="") {
				$releasedate = $_POST["releasedate"];
			} else {
				$varCheck .= "releasedate/";
			}
			if (isset($_POST["deadline"]) && $_POST["deadline"] !="") {
				$deadline = $_POST["deadline"];
			} else {
				$varCheck .= "deadline/";
			}
			if (isset($_POST["activateonsubmit"]) && $_POST["activateonsubmit"] !="") {
				$activateonsubmit = $_POST["activateonsubmit"];
			} else {
				$varCheck .= "activateonsubmit/";
			}
		} else {
			echo json_encode("no action submitted");
		}
		
		
		

		

		if ($varCheck!="") {

			//echo json_encode($varCheck);	
		} else {
			//echo json_encode("all data present");		
		}
		
		
	} else {
		echo json_encode("no write access");
	}
} else {
	echo json_encode("no access");
}

?>