<?php
 /* $res = file_get_contents("http://ip-api.com/json/185.151.132.71");
  $res = json_decode($res, true);
  echo $res['lat']."&&".$res['lon'];*/

  session_set_cookie_params(259200,"/");
  ini_set('session.cookie_lifetime', '259200');
  session_start();

  $host = "localhost";
  $user = "kolomigs_swing";
  $password = "44445555Mm";
  $db = "kolomigs_swing";

  /*$host = "localhost";
  $user = "root";
  $password = "";
  $db = "kolomigs_swing";*/

  $link = mysqli_connect($host,$user,$password,$db);

  function id(){
      $id = time();
      for ($i = 0; $i < 3; $i++){
          $id .= rand(0,9);
      }
      return $id;
  }


  if (isset($_POST['getGeo']) && isset($_POST['id'])){
    if ($_POST['id'] != 'country'){
      /* ===> MY CODE <=== */
      $sql = "SELECT `city` FROM `geo` WHERE `country`='{$_POST['getGeo']}'";
    } else {
      $sql = "SELECT `country` FROM `geo` GROUP BY `country`";
    }
    $data = mysqli_query($link, $sql);
    if (mysqli_num_rows($data)){
      $response = "";
      while ($result = mysqli_fetch_array($data)){
        $response .= "<option value='{$result[0]}'>{$result[0]}</option>";
      }
    } else {
      $response = 'error';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
  }
?>
