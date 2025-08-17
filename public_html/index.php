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
    echo '<meta http-equiv="refresh" content="0;URL=/lk/login.html">';
} else {
    $login = $_SESSION['user'];
}
 
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <script type="text/javascript" src="/script.js"></script>
    <script type="text/javascript" src="/jquery-3.7.1.min.js"></script>
    <title>SwingFox | Главная</title>
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

    <main class="profiles_slider"> 
        <section class="profile_blocks">
            <div class="profile_widget">
                <img src="/uploads/no_photo.jpg" class="profile_widget_photo">
                <div class="profile_widget_info">
                    <h4>@User</h4>
                    <h6>Севастополь, 2км</h6>
                    <h6>Семейная пара (м+ж)</h6>
                    <h6>М: 32 года / Ж: 29 лет</h6>
                    <h6>Последний онлайн: сейчас</h6>
                </div>
            </div>
        </section>
        <form class="profile_decis">
            <div class="couple_widgets" style="justify-content: space-around;">
                <img class="profile_decis_widget" src="/img/like.png" onclick="slideLike(1)">
                <img class="profile_decis_widget" src="/img/dislike.png" onclick="slideDislike()">
            </div>
            <div class="couple_widgets" style="justify-content: space-around;">
                <img class="profile_decis_widget" src="/img/goback.png" onclick="sliderShow('back')">
                <img class="profile_decis_widget" src="/img/superlike.png" onclick="slideSuperlike_popup()">
                <img class="profile_decis_widget" src="/img/present.png" onclick="slideGift_popup()">
            </div>
        </form>
        <a id="user_more_inf" href="">Подробнее</a>
    </main>
    <h2>🔥Лучшие вечеринки</h2>
    <div class="maxBox">
    <?php 
        $me = mysqli_query($link, "SELECT `country`,`city` FROM `users` WHERE `login`='{$login}'");
        while ($us = mysqli_fetch_array($me)){
            list($country, $city) = $us;
        }

        $now = date('Y-m-d');

        $sql = "SELECT * FROM `events` WHERE `date` > '{$now}' AND `country`='{$country}'";

        $sql .= " ORDER BY `id` DESC LIMIT 8";
        
        $data = mysqli_query($link, $sql);
        if (mysqli_num_rows($data) > 0){
            $elem = "";
            while ($result = mysqli_fetch_array($data)){
                list($id, $owner, $name, $desc, $date,$country ,$city ,$applics, $img) = $result;
                $desc = nl2br($desc);
                $club = mysqli_query($link, "SELECT * FROM `clubs` WHERE `id`='{$owner}'");
                while ($cl = mysqli_fetch_array($club)){list($club_id, $club_name, $club_country, $club_city, $club_address, $owner, $club_admins, $club_links, $club_desc, $club_ava, $club_date) = $cl;}
                
                $elem .= "<div class='miniEvent' onclick='window.location.href=`/the_event.php?id={$id}`' style='background-image: url(/uploads/{$img});'>
                            <h4 style='color: white;'>{$name}</h4>";

                $elem .= "</div>
                </div>";
            }
            echo $elem;
        } else {
            echo "<p class='pseudo_info' style='margin-left: auto;margin-right:auto'>Нет результатов</p>";
        }
    ?>

    </div>

    <h2>🔥Горячие обьявления</h2>

    <?php 
        $sql = "SELECT * FROM `ads` ";
           
        $sql .= " WHERE `type` = 'Встречи' ";
    
        /*$sql .= " AND `country` = '{$country}'";
        $sql .= " AND `city` = '{$city}'";*/

        $sql .= " ORDER BY `id` DESC LIMIT 8";

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
                    <a class='owner_link' href='/profiles.php?us={$name}'>{$name}</a>
                </div>
                <h6>{$city}, {$status}</h6>

                <h6>{$desc}</h6>
                <div class='couple_widgets' >";
                if ($name != $login){
                    $elem .= "<a href='/chat.php?assist={$name}'  class='profile_data' style='color: rgb(220, 53, 34)'>Написать</a>";
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
        <form class="superlike_form">
            <div class="couple_widgets" style="justify-content: flex-end;padding-right: 20px;padding-top: 15px;margin-bottom: -30px;">
                <a class="close_button" onclick="slideSuperlike_close()"></a>
            </div>
            <p class="popup_desc">Отправьте суперлайк</p>
            <textarea class="superlike_input" placeholder="Напишите сообщение" id="supelike_mess"></textarea><br>
            <a class="standart_button" onclick="slideSuperlike_send(1)">Отправить</a><br>
            <p class="pseudo_info" id="super_count">У вас осталось: 5</p>
        </form>
        <form class="gift_form">
            <div class="couple_widgets" style="justify-content: flex-end;padding-right: 20px;padding-top: 15px;margin-bottom: -30px;">
                <a class="close_button" onclick="slideGift_close()"></a>
            </div>
            <p class="popup_desc">Отправьте подарок</p>
            <section class="gift_select">
                <div class="couple_widgets" style="justify-content: space-around;">
                    <div class="gift_box" id="gift_1" onclick="selectGift(this)" name="1">
                        <img src="/img/1.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">1</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                    <div class="gift_box" id="gift_2" onclick="selectGift(this)" name="2">
                        <img src="/img/2.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">2</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                </div>


                <div class="couple_widgets" style="justify-content: space-around;">
                    <div class="gift_box" id="gift_3" onclick="selectGift(this)" name="3">
                        <img src="/img/3.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">3</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                    <div class="gift_box" id="gift_4" onclick="selectGift(this)" name="4">
                        <img src="/img/4.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">4</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                </div>

                <div class="couple_widgets" style="justify-content: space-around;">
                    <div class="gift_box" id="gift_5" onclick="selectGift(this)" name="5">
                        <img src="/img/5.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">5</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                    <div class="gift_box" id="gift_6" onclick="selectGift(this)" name="6">
                        <img src="/img/6.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">6</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                </div>

                <div class="couple_widgets" style="justify-content: space-around;">
                    <div class="gift_box" id="gift_7" onclick="selectGift(this)" name="7">
                        <img src="/img/7.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">7</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                    <div class="gift_box" id="gift_8" onclick="selectGift(this)" name="8">
                        <img src="/img/8.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">8</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                </div>
                
                <div class="couple_widgets" style="justify-content: space-around;">
                    <div class="gift_box" id="gift_9" onclick="selectGift(this)" name="9">
                        <img src="/img/9.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">9</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                    <div class="gift_box" id="gift_10" onclick="selectGift(this)" name="10">
                        <img src="/img/10.png" class="gift_img">
                        <div class="couple_widgets" style="justify-content: center;">
                            <i class="standart_i">10</i>
                            <img src="/img/foksik.png" class="foksiks">
                        </div>
                    </div>
                </div>
                
            </section> <br>
            <a href="#" onclick="sendGift()" id="sendGift" class="standart_button couple_widgets" style="justify-content: center;"><i>Выберете</i></a><br>
        </form>
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
</body>
    <script type="text/javascript"> startEvents(); sliderShow('forward'); </script>
</html>