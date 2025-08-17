<?php 

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
if (isset($_SESSION['admin']) !== true){
    echo '<meta http-equiv="refresh" content="0;URL=/admin/">';
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Swingfox | Админка</title>
    <link rel="stylesheet" href="/style.css">
    <script type="text/javascript" src="/script.js"></script>
    <script type="text/javascript" src="/admin/init.js"></script>
    <script type="text/javascript" src="/jquery-3.7.1.min.js"></script>
</head>
<body>
    <header>
        <div style="padding-left: 25px;">
            <img src="/img/logo.png" alt="logo" height="65px" width="auto">
            <img src="/img/header_menu.png" alt="menu" onclick="headerMenu_click()" width="35px" height="35px" style="margin-left: 25px;margin-bottom: 15px;">
        </div>
        <div class="header_menu">
            <a class="header_links" href='/'>Главная</a>
            <a class="header_links" href='/acquaintances.php'>Знакомства</a>
            <a class="header_links" href='/my.php'>Профиль</a>
            <a class="header_links" href='/assists.php'>Чаты</a>
            <a class="header_links" href='/ads.php'>Объявления</a>
            <a class="header_links" href='/events.php'>Мероприятия</a>
            <a class="header_links" onclick='leave()'>Выйти</a>
        </div>
    </header>

    <br>

    <section class='adsPage_first'>
        <h4 style='font-size: 18px;'>Заявки на становление клубом</h4>        
        <?php 
            $applics = mysqli_query($link, "SELECT * FROM `a_t_c_club` WHERE `resp`= 0");
            if (mysqli_num_rows($applics) > 0){
                $elem = "";
                while ($appl = mysqli_fetch_array($applics)){
                    list($id, $date, $info, $resp) = $appl;
                    $info = explode("&&", $info);
                    $elem .= " <a href='#' class='profile_data' style='color: rgb(220, 53, 34)' onclick='applicOpen({$id})'>#{$id}</a>
                            <div id='{$id}' class='couple_widgets_column' style='display:none;'>";

                    for ($i = 0; $i < count($info); $i++){
                        $elem .= "<p class='profile_data'>{$info[$i]}</p>";
                    }
                    $elem .= "<div class='couple_widgets'>
                    <a href='#' class='standart_button' onclick='applicConfirm({$id})' style='width:130px;margin:5px'>Одобрить</a>
                    <a href='#' class='standart_button gray_button' onclick='applicDispute({$id})' style='width:130px;margin:5px'>Отклонить</a>
                    </div>";
                    $elem .= "</div>";
                }
                echo $elem;
            } else {
                echo "<p class='pseudo_info' style='margin-left: auto;margin-right:auto'>Нет результатов</p>";
            }
        ?>

    </section>

    
    <div class="couple_widgets" id="error_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='error_popup'><img src="/img/error.png" class="error-success_img"><p id="error_text"></p></div>
    </div>
    <div class="couple_widgets" id="success_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='success_popup'><img src="/img/success.png" class="error-success_img"><p id="success_text">Успешно</p></div>
    </div>

    <script type="text/javascript"> startEvents();</script> 
</body>
</html>