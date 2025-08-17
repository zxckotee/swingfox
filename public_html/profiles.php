<?php

function setGeo(){
    $ch = curl_init();
  
    $res = file_get_contents("http://ip-api.com/json/".$_SERVER['REMOTE_ADDR']);
    
    $res = json_decode($res, true);
    $userGeo = $res['lat'].'&&'.$res['lon'];
    
    return $userGeo;
  }

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

if (isset($_GET['us'])){
    $us = $_GET['us'];
    $user_data = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$us}' ORDER BY `id` DESC");
    if (mysqli_num_rows($user_data) > 0){
        while ($user = mysqli_fetch_array($user_data)){
            list($id, $login, $email, $password, $ava, $status, $country ,$city, $geo, $registration, $info, $online, $viptype, $images, $search_status, $search_age, $location, $mobile, $height, $weight, $smoking, $alko, $date, $balance,$locked_images,$images_password) = $user;
        }
        $_SESSION['last_slide'] = $login;
        $geo = explode("&&", $geo);
        if (isset($_SESSION['user'])){
            $me_data = mysqli_query($link, "SELECT `geo` FROM `users` WHERE `login`='{$_SESSION['user']}'");
            while ($me = mysqli_fetch_assoc($me_data)){
                $userGeo = explode("&&", $me['geo']);
            }
            $dist = distance($geo[0],$geo[1],$userGeo[0],$userGeo[1]);
            $dist = round($dist);
        } else {
            echo '<meta http-equiv="refresh" content="0;URL=/index.php">';
        }
    } else {
        echo '<meta http-equiv="refresh" content="0;URL=/index.php">';
    }
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Swingfox | <?php echo $login; ?></title>
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


    <main class="profile_main couple_widgets_column" style='align-items: center'>
        <?php 
        if (isset($_GET['back'])){
            $back = $_GET['back'];
            echo "<div class='couple_widgets' style='padding-left: 40px'>
            <a href='/{$back}' class='profile_data' style='color: rgb(220, 53, 34)'> < Назад </a>
            </div>";
        }
        ?>
        <div class="couple_widgets" style="margin-top:10px;margin-left:15px">
            <img src="/uploads/<?php echo $ava; ?>" class="profile_ava">
            <h4 style="margin-left:15px;margin-top: 15px;"><?php echo $login; ?></h3>
        </div><br>
        <?php 
        
        $img = explode("&&",$images);
        $img = array_reverse($img, false);
        $images = implode("&&", $img); 
        
        ?>
        <div class='profilePage_slider' style="display: none">
            <div class='profilePage_slider_imgBlock' >
                <img src='/uploads/<?php echo $img[0]; ?>' onclick='imageReveal(this)' class='profilePage_slider_img' id='pP_sliderImg'>
            </div>
            <div class='profilePage_slider_footer'>
                <i class='profilePage_slider_controller' onclick="pP_slider('pP_sliderImg', 'pP_sliderNum', -1, '<?php echo $images; ?>')"><</i>
                <i class='standart_i' id='pP_sliderNum'>1 из <?php echo(count($img));  ?></i>
                <i class='profilePage_slider_controller' onclick="pP_slider('pP_sliderImg', 'pP_sliderNum', 1, '<?php echo $images; ?>')">></i>
            </div>
        </div><br>
        <?php 
        if (strlen($images) > 0){
            $style = "<style>
                .profilePage_slider{
                    display: flex !important; 
                }
            </style>"; 
            echo $style;
        } else {echo "<p class='profile_data'>Без фото</p>";}
        ?>
        <div class="couple_widgets" style="justify-content: space-around;">
            <img class="profile_decis_widget" src="/img/present.png" onclick="slideGift_popup()">
            <?php
            
            $me = $_SESSION['user'];
            $recips = mysqli_query($link, "SELECT * FROM `likes` WHERE ((`lifrom`='{$me}' AND `lito`='{$login}') OR (`lifrom`='{$login}' AND `lito`='{$me}')) AND `recip`='yes'");
            $us_chat = mysqli_query($link, "SELECT * FROM `chat` WHERE (`by`='{$me}' AND `to`='{$login}') OR (`to`='{$login}' AND `by`='{$me}') LIMIT 1");
            if (mysqli_num_rows($recips) == 0 && isset($_GET['acq']) === false && mysqli_num_rows($us_chat) == 0){
                $elem = "<img class='profile_decis_widget' src='/img/like.png' onclick='slideLike(0)'>
                <img class='profile_decis_widget' src='/img/superlike.png' onclick='slideSuperlike_popup()'>";
            } else {
                $elem = "<img class='profile_decis_widget' src='/img/chat.png' onclick='goToChat(`{$login}`)'>";
            }

            echo $elem;
            ?>
        </div><br>
        <div class='profileRating_box'>
            <?php 
                $my_rate = mysqli_query($link , "SELECT `value` FROM `rating` WHERE `from`='{$_SESSION['user']}' AND `to`='{$login}'");
                if (mysqli_num_rows($my_rate) > 0 ){
                    while ($res = mysqli_fetch_array($my_rate)){
                        $value = $res['value'];
                    }
                } else {$value = 0;}

                if ($value == -1){$my_value = array('profileRating_do_active', '');} elseif ($value == 1) {
                    $my_value = array('', 'profileRating_do_active'); # code...
                } elseif ($value == 0){
                    $my_value = array('', '');
                }
            ?>

            <?php

            $rating_week = mysqli_query($link , "SELECT `value` FROM `rating` WHERE `to`='{$login}' AND `date` > CURDATE() - INTERVAL 7 DAY");
            $rating_month = mysqli_query($link , "SELECT `value` FROM `rating` WHERE `to`='{$login}' AND `date` > CURDATE() - INTERVAL 1 MONTH");
            $rating_full = mysqli_query($link , "SELECT `value` FROM `rating` WHERE `to`='{$login}'");
            $dislikes = mysqli_query($link , "SELECT `id` FROM `rating` WHERE `to`='{$login}' AND `value`='-1' ");

            $messages = mysqli_query($link, "SELECT `id` FROM `chat` WHERE `by`='{$login}'");
            $messages = mysqli_num_rows($messages);

            $rating = array($rating_full, $rating_month, $rating_week);

            for ($i = 0; $i < count($rating); $i++){
                if (mysqli_num_rows($rating[$i]) != 0){
                    $sum = 0;
                    while ($res = mysqli_fetch_array($rating[$i])){
                        $sum += $res['value']; 
                    } $rating[$i] = $sum;
                } else {
                    $rating[$i] = 0;
                }
            } 
            list($rating_full, $rating_month, $rating_week) = $rating;

            $rang = 'Загадка'; $rating_full += $messages;
            if ($dislikes <= 200){
                if ($dislikes <= 100){
                    $rangs = array(
                        'Местный' => 100,
                        'Гуру' => 1000,
                        'Звезда' => 10000,
                        'Легенда' => 100000
                    );
                    foreach ($rangs as $key => $value) {
                        if ($rating_full >= $value && $messages >= $value){
                            $rang = $key;
                        }
                    }
                } else {
                    $rang = 'Загадка';
                }
            } else {
                $rang = 'Сомнительный';
            }

            $total_rate = "<a href='#' style='color: rgb(220, 53, 34);font-weight: 600'>{$rang}</a> ( ".implode(" / ", $rating)." )";

            $ratingSet_widget = "<img class='profileRating_do {$my_value[0]}' src='/img/minus.png' onclick='ratingSet(`{$login}` ,`minus`)'>
            <h4 style='width:150px;text-align: center;margin-top: 0px;'>{$rating_full}</h4>
            <img class='profileRating_do {$my_value[1]}' src='/img/plus.png' onclick='ratingSet(`{$login}` ,`plus`)'>";

            if ($login != $_SESSION['user']){
                echo $ratingSet_widget;}
            ?>

        </div><br>
        <h2>О себе</h2>
        <div style='width:300px;padding:10px;padding-left:20px;padding-top:5px'>
            <div name='total'>

                <p class='profile_data'>Страна: <i><?php echo $country; ?></i></p>
                <p class='profile_data'>Город: <i><?php echo $city; ?></i></p>
                <p class='profile_data'>Расcтояние от вас: <i><?php echo $dist; ?></i> км</p>
                <p class='profile_data'>Статус: <i><?php echo $status; ?></i></p>
                <p class='profile_data'>Рейтинг: <i><?php echo $total_rate; ?></i></p>

                <?php 
                $roles = mysqli_query($link, "SELECT * FROM `clubs` WHERE `admins` LIKE '%{$login}%' OR `owner`='{$login}'");
                if (mysqli_num_rows($roles) > 0){
                    $p = '';
                    while ($res = mysqli_fetch_assoc($roles)){
                        $name = $res['name']; $club_id = $res['id'];
                        if ($res['owner'] == $login){
                            $p = "<p class='profile_data'>Роль: <i>Организатор клуба <a href='/club.php?id={$club_id}' style='color: rgb(220, 53, 34)'>{$name}</a></i></p>";
                        } else { if (in_array($login, explode("&&", $res['admins'])) === true) {
                            $p = "<p class='profile_data'>Роль: <i>Админимтратор клуба <a href='/club.php?id={$club_id}' style='color: rgb(220, 53, 34)'>{$name}</a></i></p>";
                        }}
                    }
                    echo $p;
                }
                ?>

                <?php 
                
                function returnChecked($label, $data){
                    $elem = "<div class='couple_widgets_column' style='justify-content: center;'>
                    <label class='profile_data'>{$label}</label>";
                    $arr = explode("&&", $data);
                    foreach ($arr as $object){
                        $elem .= "<li class='widget_advantage_obj'>{$object}</li>";
                    }
                    $elem .= "</div>";

                    echo $elem;
                }
 
                ?>


                <?php returnChecked('Хочу познакомится с:', $search_status); ?>
                <p class='profile_data'>Возраст тех, с кем хочу познакомиться: <i><?php echo $search_age ?></i> </p>
                <?php returnChecked('Предподчтительное место для встречи:', $location); ?>
                <p class='profile_data'>Степень мобильности: <i><?php echo $mobile; ?></i></p>
                <div class='profile_data'>О себе: <i><?php $info = nl2br($info); echo $info; ?></i></div>
            </div>
            <?php 
            
            if($status == 'Мужчина' || $status == 'Женщина'){
                $h2 = mb_strtolower($status);
                $h2 = mb_substr($h2, 0, -1);
                $h2 .= "ы";
                $elem = "<div name='total'>
                <h2>Внешность и предпочтения {$h2}</h2>
                <p class='profile_data'>Дата рождения: <i>{$date}</i></p>
                <p class='profile_data'>Рост: <i>{$height}см</i></p>
                <p class='profile_data'>Вес: <i>{$weight}кг</i></p>
                <p class='profile_data'>Отношение к курению во время встречи: <i>{$smoking}</i></p>
                <p class='profile_data'>Отношение к спиртному во время встречи: <i>{$alko}</i></p>
                </div>";
                echo $elem;
            } else {
                $data = "{$date}_{$height}_{$weight}_{$smoking}_{$alko}";
                $data = explode("_", $data);
                list($man_date, $woman_date, $man_height, $woman_height, $man_weight, $woman_weight, $man_smoking, $woman_smoking, $man_alko, $woman_alko) = $data;
                
                $man = "<div name='man'>
                <h2>Внешность и предпочтения мужчины</h2>
                <p class='profile_data'>Дата рождения: <i>{$man_date}</i></p>
                <p class='profile_data'>Рост: <i>{$man_height}см</i></p>
                <p class='profile_data'>Вес: <i>{$man_weight}кг</i></p>
                <p class='profile_data'>Отношение к курению во время встречи: <i>{$man_smoking}</i></p>
                <p class='profile_data'>Отношение к спиртному во время встречи: <i>{$man_alko}</i></p>
                </div>";

                $woman = "<div name='woman'>
                <h2>Внешность и предпочтения женщины</h2>
                <p class='profile_data'>Дата рождения: <i>{$woman_date}</i></p>
                <p class='profile_data'>Рост: <i>{$woman_height}см</i></p>
                <p class='profile_data'>Вес: <i>{$woman_weight}кг</i></p>
                <p class='profile_data'>Отношение к курению во время встречи: <i>{$woman_smoking}</i></p>
                <p class='profile_data'>Отношение к спиртному во время встречи: <i>{$woman_alko}</i></p>
                </div>";

                $total = $man.$woman;
                echo $total;
            }

            ?>

        </div>

        <?php 
        
        $my_profile = mysqli_query($link, "SELECT `viptype` FROM `users` WHERE `login` = '{$_SESSION['user']}'");
        while ($me = mysqli_fetch_assoc($my_profile)){
            $viptype = $me['viptype'];
        }
        if ($viptype != 'FREE'){
            if (isset($_SESSION['lockedImages'])){
                $locked = explode('***', $_SESSION['lockedImages']);
                $locked = array_reverse($locked);
                foreach ($locked as $lock_item){
                    $lock_item = explode('&&',$lock_item);
                    if ($lock_item[0] == $login && $lock_item[1] == $images_password){
                        $locked_img = explode("&&",$locked_images);
                        $locked_img = array_reverse($locked_img, false);
                        $locked_images = implode("&&",$locked_img);
                        if (strlen($locked_images) > 0){
                            $count = count($locked_img);
                            $elem = "<br><h2>Скрытые фото</h2>
                            <div class='profilePage_slider'>
                                <div class='profilePage_slider_imgBlock' >
                                    <img src='/uploads/{$locked_img[0]}' onclick='imageReveal(this)' class='profilePage_slider_img' id='Plocked_sliderImg'>
                                </div>
                                <div class='profilePage_slider_footer'>
                                    <i class='profilePage_slider_controller' onclick='pP_slider(`Plocked_sliderImg`, `Plocked_sliderNum`, -1, `{$locked_images}`)'><</i>
                                    <i class='standart_i' id='Plocked_sliderNum'>1 из {$count}</i>
                                    <i class='profilePage_slider_controller' onclick='pP_slider(`Plocked_sliderImg`, `Plocked_sliderNum`, 1, `{$locked_images}`)'>></i>
                                </div>
                            </div><br>";
                        } else {
                            $elem = "";
                        }
                        echo $elem;
                    } else {
                        $elem = "<br>
                        <h2>Скрытые фото</h2>
                        <div class='profilePage_slider' style='align-items: center;justify-content: flex-start;height:auto' id='locked_images'>
                            <h2>Скрытые фото</h2>
                            <input type='password' oninput='this.value = this.value.replaceAll(` `, ``)'' id='lockedImages_pass' placeholder='Введите пароль' class='auth_input'>
                            <a onclick='lockedImages_open()' class='standart_button' href='#'>Подтвердить</a><br>
                        </div>
                        <br>" ;

                        echo $elem;
                    }
                } 
            } else {
                if ($locked_images != ''){
                    $elem = "<br>
                        <h2>Скрытые фото</h2>
                        <div class='profilePage_slider' style='align-items: center;justify-content: flex-start;height:auto' id='locked_images'>
                            
                            <input type='password' oninput='this.value = this.value.replaceAll(` `, ``)'' id='lockedImages_pass' placeholder='Введите пароль' class='auth_input'>
                            <a onclick='lockedImages_open()' class='standart_button' href='#'>Подтвердить</a><br>
                        </div>
                        <br>" ;

                    echo $elem;
                }
            }
        } else {
            $elem = "<p class='profile_data' style='width: 95%; text-align: center'><a href='#' style='color: rgb(220, 53, 34);' onclick='subFormOpen()'>Приобретите подписку</a>, чтобы создавать свои и просматривать чужие скрытые фото, если вам сообщили пароль</p>";
            echo $elem;
        }
        
        ?>

        <?php 

        $giftsData = mysqli_query($link, "SELECT * FROM `gifts` WHERE `owner` = '{$login}' AND `valide`= 1 ORDER BY `id` DESC");
        if (mysqli_num_rows($giftsData) > 0){
            $elem = "<h2>Подарки {$login}</h2>
            <div class='couple_widgets' style='flex-wrap:wrap; justify-content: space-around'>";

            while ($gift = mysqli_fetch_array($giftsData)){
                $type = $gift['gifttype'];
                $elem .= "
                    <div class='gift_box' >
                        <img src='/img/{$type}.png' class='gift_img'>
                    </div>
                ";
            }
            $elem .= "</div>";

            echo $elem;
        }
        
        ?>

        <script type='text/javascript'>
            profileVisit('<?php echo $login; ?>');
        </script>

    </main><br>

    
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
            <a class="standart_button" onclick="slideSuperlike_send(0)">Отправить</a><br>
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

        <div class='imageReveal_box'>
            <div class="couple_widgets" style="justify-content: flex-end;">
                <a class="close_button" onclick="imageReveal_close()"></a>
            </div>
            <img class="imageReveal_img" src=''>
            <div class='imageLike' onclick='imageLike()'>118</div>
        </div>
    </main>
    <div class="couple_widgets" id="error_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='error_popup'><img src="/img/error.png" class="error-success_img"><p id="error_text"></p></div>
    </div>
    <div class="couple_widgets" id="success_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='success_popup'><img src="/img/success.png" class="error-success_img"><p id="success_text">Успешно</p></div>
    </div>
    <div class="couple_widgets" id="visit_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='visit_popup'><img src="/img/look.png" class="error-success_img"><p id="visit_text">Прямо сейчас кто-то смотрит ваш профиль!</p></div>
    </div>
    <div class='notif_fixedBox'></div>
    <script type='text/javascript'>startEvents();</script>
</body>
</html> 