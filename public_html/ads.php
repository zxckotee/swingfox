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
    <title>Swingfox | Объявления</title>
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
    <h2>Объявления</h2>
    <section class='adsPage_first'>
        <?php 
        if (isset($_GET['back'])){
            $back = $_GET['back'];
            echo "<div class='couple_widgets' style='padding-left: 40px'>
            <a href='/{$back}' class='profile_data' style='color: rgb(220, 53, 34)'> < Назад </a>
            </div>";
        }
        ?>
        <select id='adsType' onchange="adsTypeSelect()" class='auth_input' style="width: 285px;padding: 3px;padding-left: 10px;height: 50px;font-size: 16px;font-weight: 400;">
            <option value="Все">Все</option>
            <option value="Мои">Мои</option>
            <option value="Встречи">Встречи</option>
        </select>
        <label for="country" style="margin-right: auto;margin-left: 10px;">Страна</label>
        <div style = "
                display: flex;
                justify-content: flex-start;
                flex-direction: row;
                width: 325px;
            " >
            <input type="text" id="country" onchange="adsTypeSelect()" class="auth_input" style="width: 270px;padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;margin-left: 20px;" list="country_datalist" onfocus="getGeo(this.list, this.id, this.id)" placeholder="Страна">
            <datalist id="country_datalist">
            </datalist>
        </div>

        <label for="searchCity" style="margin-right: auto;margin-left: 10px;">Город</label>
        <select id='searchCity' onchange="adsTypeSelect()" class='auth_input' style="width: 285px;padding: 3px;padding-left: 10px;height: 50px;font-size: 16px;font-weight: 400;">
            <option value="Любой">Любой</option>
            <option value="Мой">В моем городе</option>
        </select>
        <a class='standart_button' onclick='adsCreate_popup()'>Хочу сюда!</a>
    </section><br>
    <?php 
        $now = date('Y-m-d H:i');
        $sql = "SELECT * FROM `ads` WHERE 1=1 ";
        if (isset($_GET['type'])){
            $type = $_GET['type'];
            if ($type == 'Мои'){
                $sql .= " AND `login` = '{$login}'";
            }

            if ($type == 'Встречи'){
                $sql .= " AND `type` = '{$type}' ";
            }
            echo "<script type='text/javascript'>document.querySelector('#adsType').value='{$type}'</script>";
        } 
        $me = mysqli_query($link ,"SELECT `country`,`city` FROM `users` WHERE `login`='{$login}'");
        while ($us = mysqli_fetch_assoc($me)){$city = $us['city']; $my_country = $us['country'];}
        // $sql .= " AND `country` = '{$country}'"; - теперь страна выборочный параметр
        if (isset($_GET['country'])){ 
            $country = $_GET['country'];
            $sql .= " AND (`country` = '{$country}' OR `country` LIKE '%{$country}%') ";
            echo "<script type='text/javascript'>document.querySelector('#country').value='{$_GET['country']}'</script>";
        }

        if (isset($_GET['city'])){
            if ($_GET['city'] == 'Мой'){
                $sql .= " AND `city` = '{$city}'";
            }
            echo "<script type='text/javascript'>document.querySelector('#searchCity').value='{$_GET['city']}'</script>";
        }
        $sql .= " ORDER BY `id` DESC LIMIT 15";
        $data = mysqli_query($link, $sql);
        if (mysqli_num_rows($data) > 0){
            $elem = "";
            while($result = mysqli_fetch_array($data)){
                list($id, $name, $adType, $desc, $country, $city) = $result;
                $desc = nl2br($desc);
                $user = mysqli_query($link, "SELECT `ava`, `status`, `city` FROM `users` WHERE `login`='{$name}'");
                while ($us = mysqli_fetch_array($user)){list($ava, $status, $city) = $us;}
                
                $elem .= "<div class='adsBlock'>
                <div class='couple_widgets' style='margin-top:10px;margin-left:15px'>
                    <img src='/uploads/{$ava}' class='profile_ava'>
                    <a class='owner_link' href='/profiles.php?us={$name}&back=ads.php'>{$name}</a>
                </div>
                <h6>{$country}, {$city}, {$status}</h6>

                <h6>{$desc}</h6>
                <div class='couple_widgets' >";
                if ($name != $login){
                    $elem .= "<a href='/chat.php?assist={$name}&back=ads.php'  class='profile_data' style='color: rgb(220, 53, 34)'>Написать</a>";
                } else {
                    $elem .= "<a class='standart_button' style='margin-top:10px' onclick='adsMyDel({$id})'>Удалить</a>";
                }
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

        <form class='adsCreate_box'>
            <div class="couple_widgets" style="justify-content: flex-end;padding-right: 20px;padding-top: 15px;margin-bottom: -30px;">
                <a class="close_button" onclick="adsCreate_close()"></a>
            </div>
            <p class='popup_desc'>Создайте обьявление</p>
            <textarea id="adsDesc" class="auth_textarea" placeholder='Описание'></textarea>
            <select id='adsTypeCreate' class='auth_input' style="width: 285px;padding: 3px;padding-left: 10px;height: 50px;font-size: 16px;font-weight: 400;">
                <option value="Все">Все</option>
                <option value="Встречи">Встречи</option>
            </select>
            <a class='standart_button' onclick='adsCreate()'>Готово</a>
        </form>
    </main>
    <div class="couple_widgets" id="error_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='error_popup'><img src="/img/error.png" class="error-success_img"><p id="error_text"></p></div>
    </div>
    <div class='notif_fixedBox'></div>
    <div class="couple_widgets" id="success_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='success_popup'><img src="/img/success.png" class="error-success_img"><p id="success_text">Успешно</p></div>
    </div>
    <div class="couple_widgets" id="visit_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='visit_popup'><img src="/img/look.png" class="error-success_img"><p id="visit_text">Прямо сейчас кто-то смотрит ваш профиль!</p></div>
    </div>
    <script type="text/javascript"> startEvents();</script> 
</body>
</html>