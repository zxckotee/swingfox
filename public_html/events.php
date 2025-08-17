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

function distance($lat_1, $lon_1, $lat_2, $lon_2) {

	$radius_earth = 6371; 

	$lat_1 = deg2rad($lat_1);
	$lon_1 = deg2rad($lon_1);
	$lat_2 = deg2rad($lat_2);
	$lon_2 = deg2rad($lon_2);

	$d = 2 * $radius_earth * asin(sqrt(sin(($lat_2 - $lat_1) / 2) ** 2 + cos($lat_1) * cos($lat_2) * sin(($lon_2 - $lon_1) / 2) ** 2));

	return number_format($d, 3, '.', '');
}

if (!isset($_SESSION['user'])){
    echo '<meta http-equiv="refresh" content="0;URL=/index.php">';
} else {
    $login = $_SESSION['user'];
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Swingfox | Мероприятия</title>
    <link rel="stylesheet" href="/style.css">
    <script type="text/javascript" src="/script.js"></script>
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

    <h2>Мероприятия</h2>
    <section class='adsPage_first'>
        <div class="couple_widgets_column" style="margin-left: 30px;">
            <label for="country" style="font-size: 18px;font-weight: 500;">Страна</label>
            <input type="text" id="country" class="auth_input" list="country_datalist" onfocus="getGeo(this.list, this.id, this.id)" placeholder="Страна">
            <datalist id="country_datalist">
            </datalist>
        </div>

        <div class="couple_widgets_column" style="margin-left: 30px;">
            <label for="city" style="font-size: 18px;font-weight: 500;">Город</label>
            <input type="text" id="city" class="auth_input" list="city_datalist" onfocus="getGeo(this.list, 'country', this.id)" placeholder="Город">
            <datalist id="city_datalist">
            </datalist>
        </div>
        <a class='standart_button' onclick='eventSearch()'>Найти</a>
        <?php

        $i_am_owner = mysqli_query($link , "SELECT `id` FROM `clubs` WHERE `owner`= '{$login}'");

        if (mysqli_num_rows($i_am_owner) == 0){
            echo "<a href='/club_reg.html' style='font-size:18px' class='owner_link'>Создать клуб</a>";
        } else {
            while ($result = mysqli_fetch_array($i_am_owner)){$id = $result['id'];}
            echo "<a href='/club.php?id={$id}' style='font-size:18px' class='owner_link'>Создать мероприятие</a>";
        }
        ?><br>
    </section><br>
    <?php 
        $now = date('Y-m-d');

        $sql = "SELECT * FROM `events` WHERE `date` > '{$now}' ";

        if (isset($_GET['country'])){
            $sql .= " AND `country` = '{$_GET['country']}' ";
            if (isset($_GET['city'])){
                $sql .= " AND `city`='{$_GET['city']}' ";
                echo "<script type='text/javascript'>document.querySelector('#city').value='{$_GET['city']}'</script>";
            }
            echo "<script type='text/javascript'>document.querySelector('#country').value='{$_GET['country']}'</script>";
        }

        $sql .= " ORDER BY `id` DESC";

        $data = mysqli_query($link, $sql);
        if (mysqli_num_rows($data) > 0){
            $elem = "";
            while ($result = mysqli_fetch_array($data)){
                list($id, $owner, $name, $desc, $date,$country ,$city ,$applics, $img) = $result;
                $desc = nl2br($desc);
                $club = mysqli_query($link, "SELECT * FROM `clubs` WHERE `id`='{$owner}'");
                while ($cl = mysqli_fetch_array($club)){list($club_id, $club_name, $club_country, $club_city, $club_address, $owner, $club_admins, $club_links, $club_desc, $club_ava, $club_date) = $cl;}
                
                $elem .= "<div class='adsBlock'>
                
                <a class='owner_link' href='/club.php?id={$club_id}'>{$club_name}</a>
                <br><img src='/uploads/{$img}' class='profilePage_slider_img'>
                
                <h4>{$name}</h4>
                <h6>{$country}, г.{$city}</h6>

                <h6>{$desc}</h6>
                <div class='couple_widgets' >";

                $elem .= "<a class='standart_button' style='margin-top:10px; width:150px' href='/the_event.php?id={$id}'>Больше</a>";
                $elem .= "<i class='event_date' style='margin-top:25px'>{$date}</i>";

                $elem .= "</div>
                </div>";
            }
            echo $elem;
        } else {
            echo "<p class='pseudo_info' style='margin-left: auto;margin-right:auto'>Нет результатов</p>";
        }
    ?>

    <main class="popup_main">
        <div id="confirmModal" style="display:none;">
            <p class='profile_data' name='confData'>Вы уверены, что хотите продолжить?</p>
            <div class='couple_widgets'>
                <a class='confButton' id="yesBtn">Да</a>
                <a class='confButton_red' id="noBtn">Нет</a>
            </div>
        </div>
     
        <form class="sub_form">
            <div class="couple_widgets" style="justify-content: flex-end;padding-right: 20px;padding-top: 15px;margin-bottom: -30px;">
                <a class="close_button" onclick="subFormClose()"></a>
            </div>
            <p class="popup_desc">Приобретите подписку</p>
            <section class="sub_widget">
       
                <div class="sub_box">
                    <img src="img/superlike.png" class="popupItem_img">
                    <p class="popupItem_title">Суперлайки каждый день ( у VIP: 5 и у PREMIUM: 10 )</p>
                </div>
                <div class="sub_box">
                    <img src="img/attent.png" class="popupItem_img">
                    <p class="popupItem_title">40 минут внимания каждую неделю ( у VIP: 1 и у PREMIUM: 3 )</p>
                </div>
                

                <div class="sub_box">
                    <img src="img/hide.png" class="popupItem_img">
                    <p class="popupItem_title">Скрывайте статус онлайн и посещайте чужие анкеты в инкогнито</p>
                </div>
                <div class="sub_box">
                    <img src="img/camera.png" class="popupItem_img">
                    <p class="popupItem_title">Создайте свои скрытые паролем фото галереи и просматривайте скрытые фото других пользователей если вам сообщили пароль</p>
                </div>

                <div class="sub_box">
                    <img src="img/superlike.png" class="popupItem_img">
                    <p class="popupItem_title">Смотрите анкеты тех, кому вы понравились, и отвечайте взаимностью</p>
                </div>
                <div class="sub_box">
                    <img src="img/carousel.png" class="popupItem_img">
                    <p class="popupItem_title">Попадите в карусель на главной странице и привлеките к себе лайки других пользователей</p>
                </div>
                
                <div class="sub_box">
                    <img src="img/look.png" class="popupItem_img">
                    <p class="popupItem_title">Смотрите анкеты тех, кто посещал вашу</p>
                </div>
                <div class="sub_box">
                    <img src="img/like.png" class="popupItem_img">
                    <p class="popupItem_title">Проявляйте симпатию без ограничений</p>
                </div>

            </section>
            <br>
            <div class="couple_widgets" style="margin-left: 35px;">
                <input type="checkbox" id="auto_sub"/>
                <label for="auto_sub">Включить автопродление</label>
            </div>
            <div class="couple_widgets" style="justify-content: space-around;padding: 0px;padding-top: 4px;padding-bottom: 10px;width:286px;">
                <a class="sub_select" onclick="selectSub(this)" href="#">VIP</a>
                <a class="sub_select" onclick="selectSub(this)" href="#">PREMIUM</a>
            </div>
            <a href="#" onclick="subBuy()" id="subBuy" class="standart_button couple_widgets" style="justify-content: center;"><i>Выберете</i></a>
        </form>

    </main>
    <div class='notif_fixedBox'></div>
    <div class="couple_widgets" id="error_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='error_popup'><img src="/img/error.png" class="error-success_img"><p id="error_text"></p></div>
    </div>
    <div class="couple_widgets" id="success_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='success_popup'><img src="/img/success.png" class="error-success_img"><p id="success_text">Успешно</p></div>
    </div>
    <div class="couple_widgets" id="visit_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='visit_popup'><img src="/img/look.png" class="error-success_img"><p id="visit_text">Прямо сейчас кто-то смотрит ваш профиль!</p></div>
    </div>
    <script type="text/javascript"> startEvents();</script> 
</body>
</html>