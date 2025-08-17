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
    <title>Swingfox | Знакомства</title>
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

    <br><section class='filterBox'>
        <?php 
        if (isset($_GET['back'])){
            $back = $_GET['back'];
            echo "<div class='couple_widgets' style='padding-left: 40px'>
            <a href='/{$back}' class='profile_data' style='color: rgb(220, 53, 34)'> < Назад </a>
            </div>";
        }
        ?>
        <h4 style='text-align: center'>Поиск анкет</h4>
        <br><fieldset id="search_status">
            <legend>С кем хотите познакомиться?</legend>
            <div>
                <input type="checkbox" id="Семейная пара(М+Ж)" name="search_status" />
                <label for="Семейная пара(М Ж)">Семейная пара(М+Ж)</label>
            </div>

            <div>
              <input type="checkbox" id="Несемейная пара(М+Ж)" name="search_status" />
              <label for="Несемейная пара(М Ж)">Несемейная пара(М+Ж)</label>
            </div>
          
            <div>
                <input type="checkbox" id="Мужчина" name="search_status" />
                <label for="Мужчина">Мужчина</label>
            </div>
            <div>
                <input type="checkbox" id="Женщина" name="search_status" />
                <label for="Женщина">Женщина</label>
            </div>

        </fieldset><br>
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
        </div><br>
        
        <a class='standart_button' onclick="filterReload()">Обновить</a>
    </section><br>

    <main class="couple_widgets_column" id='filterResult' style='width: 300px'>
        <?php
        
        $sql = "SELECT * FROM `users` WHERE 1 = 1 ";
        if (isset($_GET['status'])){
            $status = explode("_", $_GET['status']);

            $sql .= " AND (";
            for ($i = 0; $i < count($status); $i++){
                if ($status[$i] == 'Семейная пара(М Ж)'){
                    $status[$i] = "Семейная пара(М+Ж)";
                }
                if ($status[$i] == 'Несемейная пара(М Ж)'){
                    $status[$i] = "Несемейная пара(М+Ж)";
                }
                if ($i != 0){
                    $sql .= " OR ";
                }
                $sql .= " `status` = '{$status[$i]}' ";
            }
            $sql .= ")";
            
        }

        
        if (isset($_GET['country'])){
            $sql .= " AND `country` = '{$_GET['country']}' ";
            if (isset($_GET['city'])){
                $sql .= " AND `city`='{$_GET['city']}' ";
                echo "<script type='text/javascript'>document.querySelector('#city').value='{$_GET['city']}'</script>";
            }
            echo "<script type='text/javascript'>document.querySelector('#country').value='{$_GET['country']}'</script>";
        }
        $sql .= " ORDER BY RAND() LIMIT 14";
        $data = mysqli_query($link, $sql);
        
        function toMetric($age){
            $last = $age % 10;
            if ($last == 1){
              $metric = 'год';
            } if ($last > 1 && $last < 5){
              $metric = 'года';
            } if ($last >= 5 || $last == 0){
              $metric = 'лет';
            }
            return $metric;
        }

        if (mysqli_num_rows($data) > 0){
            $elem = "";
            while ($result = mysqli_fetch_array($data)){
                $elem .= "<div class='other_blocks'>";
                $ava = $result['ava'];
                $elem .= "<img src='/uploads/{$ava}' class='other_ava'>";
                

                $stat = $result['status'];
                $elem .= "<div class='couple_widgets_column'>";
                $elem .= "<h6>{$stat}</h6>";
                $date = explode("_", $result['date']);
                $now = strtotime('now');
                if (count($date) == 2){
                    $time1 = $now - strtotime($date[0]);
                    $age1 = intdiv($time1, 31536000);  
                    $toMetric1 = toMetric($age1);

                    $time2 = $now - strtotime($date[1]);
                    $age2 = intdiv($time2, 31536000);
                    $toMetric2 = toMetric($age2);

                    $age = "{$age1} {$toMetric1} (М) / {$age2} {$toMetric2} (Ж)";
                } else { echo "<script type='text/javascript'>document.querySelector('#city').value='{$_GET['city']}'</script>";
                    $time = $now - strtotime($date[0]);
                    $age = intdiv($time, 31536000);
                    $toMetric = toMetric($age);
                    $age = "{$age} {$toMetric}"; 
                }

                $elem .= "<h6>{$age}</h6>";
                $login = $result['login'];

                $elem .= "<a href='/profiles.php?us={$login}&acq=1&back=acquaintances.php'  class='profile_data' style='color: rgb(220, 53, 34)'>{$login}</a>";
                $elem .= "</div>";
               
                $elem .= "</div>";
            }
            echo $elem;
        } else {
            echo "<p class='pseudo_info' style='margin-left: auto;margin-right:auto'>Нет результатов</p>";
        }
        ?>
        <style>h6{text-align: center}</style>

    </main><br>

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