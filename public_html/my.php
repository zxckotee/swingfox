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

if (isset($_SESSION['user'])){
    $user_data = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$_SESSION['user']}'");
    if (mysqli_num_rows($user_data) > 0){
        while ($user = mysqli_fetch_array($user_data)){
            list($id, $login, $email, $password, $ava, $status,$country ,$city, $geo, $registration, $info, $online, $viptype, $images, $search_status, $search_age, $location, $mobile, $height, $weight, $smoking, $alko, $date, $balance,$locked_images,$images_password) = $user;
        }
        $_SESSION['last_slide'] = $login;
        $geo = explode("&&", $geo);
    } else {
        echo '<meta http-equiv="refresh" content="0;URL=/index.php">';
    }
} else {
    echo '<meta http-equiv="refresh" content="0;URL=/index.php">';
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
        <input type="file" name="userfile"  accept='.png, .jpg, .jpeg' id="ava_upload" onchange="lk_avaUpload()">
        <div class="couple_widgets" style="margin-top:10px;margin-left:15px">
            <img src="/uploads/<?php echo $ava; ?>" onclick="$('#ava_upload').click()" class="profile_ava">
            <h4 style="margin-left:15px;margin-top: 15px;"><?php echo $login; ?></h3>
        </div><br>
        <?php 
        
        $img = explode("&&",$images);
        $img = array_reverse($img, false);
        $images = implode("&&", $img); 
        
        ?>
        <div class='profilePage_slider' style='height:460px; display:none;' name='pP_slider1'>
            <div class='profilePage_slider_imgBlock' >
                <img src='/uploads/<?php echo $img[0]; ?>' onclick='imageReveal(this)' class='profilePage_slider_img' id='pP_sliderImg'>
            </div>
            <div class='profilePage_slider_footer' style='height:110px;flex-direction: column;justify-content: flex-start;'>
                <div class='couple_widgets' style='height:50px; justify-content: space-around;align-items: center;'>
                    <i class='profilePage_slider_controller' onclick="pP_slider('pP_sliderImg', 'pP_sliderNum', -1, '<?php echo $images; ?>')"><</i>
                    <i class='standart_i' id='pP_sliderNum'>1 из <?php echo(count($img));  ?></i>
                    <i class='profilePage_slider_controller' onclick="pP_slider('pP_sliderImg', 'pP_sliderNum', 1, '<?php echo $images; ?>')">></i>
                </div> 
                <input type='file' id='pP_addImg_images' name='userfile[]' accept='.png, .jpg, .jpeg' onchange='pP_myC_add(`images`)' multiple >  
                <div class='couple_widgets' style='height:60px; justify-content: space-around;align-items: center'>
                    <label class="pP_myC pP_myC_add" for='pP_addImg_images'></label>    
                    <a class="pP_myC pP_myC_del" onclick="pP_myC_del('pP_sliderNum', 'images')"></a>
                </div>
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
        } else {
            echo "<script type='text/javascript'>document.getElementsByName('pP_slider1')[0].innerHTML = '';</script>

            <input type='file' id='pP_addImg_images' accept='.png, .jpg, .jpeg' name='userfile[]' onchange='pP_myC_add(`images`)' multiple >         
            <label for='pP_addImg_images' class='standart_button'>Загрузите фото</label>";
        }
        ?>
        
        <?php
        
        $notifs = mysqli_query($link, "SELECT * FROM `notifs` WHERE `to`='{$login}' ");
        if (mysqli_num_rows($notifs) > 0){
            $elem = "<section class='notifsSection couple_widgets_column'>
            <h4>Уведомления</h4><br>
            <div class='notifsBox couple_widgets_column'>";
            if (mysqli_num_rows($notifs) > 0){
                while ($res = mysqli_fetch_array($notifs)){
                    $elem .= "<div class='notifsBoxElm'>";
                    list($usid, $by, $to, $type, $mess) = $res;

                    if ($type == 'like'){
                        $elem .= "<p class='profile_data'><a href='/profiles.php?us={$by}' style='color: rgb(220, 53, 34)'>{$by}</a> лайкнул вашу анкету!</p>";
                    }
                    if ($type == 'superlike'){
                        $elem .= "<p class='profile_data'><a href='/profiles.php?us={$by}' style='color: rgb(220, 53, 34)'>{$by}</a> отправил вам суперлайк: <i>«{$mess}»</i></p>";
                    }
                    if ($type == 'gift'){
                        $elem .= "<p class='profile_data'><a href='/profiles.php?us={$by}' style='color: rgb(220, 53, 34)'>{$by}</a> отправил вам подарок:</p>
                        <img src='/img/{$mess}.png' class='gift_img red_border'>";
                    }

                    $elem .= "</div>";
                }
            } else {
                $elem .= "<p class='pseudo_info' style='text-align: center'>Пока что тут пусто..</p>";
            }
            $elem .= "</div></section>";
            echo $elem;
        }

        ?><br>

        <?php
        // ГОСТИ
        $visitors = mysqli_query($link, "SELECT * FROM `visits` WHERE `whom`='{$login}' ");
        if (mysqli_num_rows($notifs) > 0){
            $elem = "<section class='notifsSection couple_widgets_column'>
            <h4>Мои гости</h4><br>
            <div class='notifsBox couple_widgets_column'>";
            if ($viptype != 'FREE'){
                if (mysqli_num_rows($visitors) > 0){
                    while ($res = mysqli_fetch_array($visitors)){
                        $elem .= "<div class='notifsBoxElm'>";
                        list($usid, $who, $whom, $vis_date) = $res;

                        $visor = "<a href='/profiles.php?us={$who}' style='color: rgb(220, 53, 34)'>{$who}</a>"; 

                        $elem .= "<p class='profile_data'>{$vis_date} {$visor} смотрел ваш профиль</p>";

                        $elem .= "</div>";
                    }
                } else {
                    $elem .= "<p class='pseudo_info' style='text-align: center'>Пока что тут пусто..</p>";
                }
            } else {
                $elem = "<div class='notifsBoxElm'><p class='profile_data' style><a href='#' style='color: rgb(220, 53, 34)'>Приобретите подписку</a> чтобы получить доступ к списку гостей</p></div>";
            }
            $elem .= "</div></section>";
            echo $elem;
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

        ?>
        <h2>О себе</h2>
        <a href="/fillout_settings.php" class='profile_data' style='color: rgb(220, 53, 34)'>Изменить анкету</a>
        <a href="#" onclick="subFormOpen()" class='profile_data' style='color: rgb(220, 53, 34)'>Приобрести подписку</a>
        <a href="#" onclick="geoReload()" class='profile_data' style='color: rgb(220, 53, 34)'>Обновить мое местоположение</a>
        <div style='width:300px;padding:10px;padding-left:20px;padding-top:5px'>
            <div name='total'>
                <p class='profile_data'>Страна: <i><?php echo $country; ?></i></p>
                <p class='profile_data'>Город: <i><?php echo $city; ?></i></p>
                <p class='profile_data'>На сайте с: <i><?php echo $registration; ?></i></p>
                <p class='profile_data'>Статус: <i><?php echo $status; ?></i></p>
                <p class='profile_data'>Рейтинг: <i><?php echo $total_rate; ?></i></p>
        
            
                <?php 
                $roles = mysqli_query($link, "SELECT * FROM `clubs` WHERE `admins` LIKE '%{$login}%' OR `owner`='{$login}'");
                if (mysqli_num_rows($roles) > 0){
                    $p = "<p class='profile_data'>Роль: <i>";
                    while ($res = mysqli_fetch_assoc($roles)){
                        $name = $res['name']; $club_id = $res['id'];
                        if ($res['owner'] == $login){
                            $p .= "Организатор клуба <a href='/club.php?id={$club_id}' style='color: rgb(220, 53, 34)'>{$name}</a>";
                        } else {
                            $p .= "Админимтратор клуба <a href='/club.php?id={$club_id}' style='color: rgb(220, 53, 34)'>{$name}</a>";
                        }
                    }
                    $p .= "</i></p>";
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

            if ($viptype != 'FREE'){
                $locked_img = explode("&&",$locked_images);
                $locked_img = array_reverse($locked_img, false);
                $locked_images = implode("&&",$locked_img);
                if (strlen($locked_images) > 0){
                    $count = count($locked_img);
                    $elem = "<br><h2>Скрытые фото</h2>
                    <div class='profilePage_slider' style='height:460px; display:flex;'>
                        <div class='profilePage_slider_imgBlock' >
                            <img src='/uploads/{$locked_img[0]}' onclick='imageReveal(this)' class='profilePage_slider_img' id='Plocked_sliderImg'>
                        </div>
                        <div class='profilePage_slider_footer' style='height:110px;flex-direction: column;justify-content: flex-start;'>
                            <div class='couple_widgets' style='height:50px; justify-content: space-around;align-items: center'>
                                <i class='profilePage_slider_controller' onclick='pP_slider(`Plocked_sliderImg`, `Plocked_sliderNum`, -1, `{$locked_images}`)'><</i>
                                <i class='standart_i' id='Plocked_sliderNum'>1 из {$count}</i>
                                <i class='profilePage_slider_controller' onclick='pP_slider(`Plocked_sliderImg`, `Plocked_sliderNum`, 1, `{$locked_images}`)'>></i>
                            </div>
                            <input type='file' id='pP_addImg_locked_images' accept='.png, .jpg, .jpeg' name='userfile[]' onchange='pP_myC_add(`locked_images`)' multiple >  
                            <div class='couple_widgets' style='height:60px; justify-content: space-around;align-items: center'>
                                <label class='pP_myC pP_myC_add' for='pP_addImg_locked_images'></label>    
                                <a class='pP_myC pP_myC_del' onclick='pP_myC_del(`pP_sliderNum`, `locked_images`)'></a>
                            </div>
                        </div>
                    </div><br>";

                } else {
                    if ($images_password == ''){
                        $elem = "<br>
                            <h2>Скрытые фото</h2>
                            <div class='profilePage_slider' style='align-items: center;justify-content: flex-start;height:auto' id='locked_images'>
                                <input type='password' oninput='this.value = this.value.replaceAll(` `, ``)' id='lockedImages_pass' placeholder='Придумайте пароль' class='auth_input'>
                                <input type='password' oninput='this.value = this.value.replaceAll(` `, ``)' id='lockedImages_pass_repeat' placeholder='Повторите пароль' class='auth_input'>
                                <a onclick='lockedImages_passCreate()' class='standart_button' href='#'>Подтвердить</a><br>
                            </div>
                            <br>" ;
                            
                    }  else {
                        $elem = "<br>
                        <h2>Скрытые фото</h2>
                        <input type='file' id='pP_addImg_locked_images' accept='.png, .jpg, .jpeg' name='userfile[]' onchange='pP_myC_add(`locked_images`)' multiple >  
                        <label for='pP_addImg_locked_images' class='standart_button'>Загрузите первые</label>
                        <br>";
                    }    
                }
                echo $elem;
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

    </main><br>

    <style>
        @media (max-width: 635px){
            .avaSelectBox{
                width: 450px;
                height: 500px
            }
            .avaSelectMain{
                max-width: 420px;
                max-height: 420px;
            }
            #ava_complete{
                transform: scale(1) !important;
            }
            #h2{
                font-size: 26.5px;
            }
            .avaSelect_area{
                min-width: 120px;
                max-width: 420px;
                min-height: 120px;
                max-height: 420px;
            }

        }
        @media (max-width: 490px){
            .avaSelectBox{
                width: 360px;
                height: 450px;
            }
            .avaSelectMain{
                max-width: 340px;
                max-height: 340px;
            }
            .avaSelect_area{
                min-width: 75px;
                max-width: 340px;
                min-height: 75px;
                max-height: 340px;
            }
            
        }
        @media (max-width: 380px){
            .avaSelectBox{
                width: 300px;
                height: 420px;
            }
            .avaSelectMain{
                max-width: 280px;
                max-height: 280px;
            }
            .avaSelect_area{
                min-width: 75px;
                max-width: 340px;
                min-height: 75px;
                max-height: 340px;
            }
            
        }
    </style>
    <main class="popup_main">
        <div id="confirmModal" style="display:none;">
            <p class='profile_data' name='confData'>Вы уверены, что хотите продолжить?</p>
            <div class='couple_widgets'>
                <a class='confButton' id="yesBtn">Да</a>
                <a class='confButton_red' id="noBtn">Нет</a>
            </div>
        </div>
        <section class="avaSelectBox">
            <div class="couple_widgets" style="justify-content:flex-end;height:35px;margin-top:-30px">
                <a class='popup_close' onclick="lk_avaSelect_close()"></a>
            </div>
            <h2 style="text-align:center;margin:0px;width:300px;margin-bottom:15px;">Выберете область</h2>
            <div class="avaSelectMain">
                <div class="avaSelect_area">
                    <div class="couple_widgets" style="justify-content: flex-start;">
                        <div class="aS_area_handler" id="ava_handler0" style="transform: translate(-6px,-6px)"></div>
                    </div>
                    <div id="touch_pad"></div>
                    <div class="couple_widgets" style="justify-content: flex-end;">
                        <div class="aS_area_handler" id="ava_handler1" style="transform: translate(6px,6px)"></div>
                    </div>
                </div>
            </div><br>
            <a class="standart_button blue_button" id="ava_complete" onclick="lk_avaComplete()">Применить</a>
        </section>

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
    <script type='text/javascript'>startEvents();</script>
    <script type="text/javascript">

        /* ---> AREA CHOOSE <--- */

        var mov = 1;
        document.getElementsByClassName("avaSelect_area")[0].style["transform"] = "translate(0px,0px)";

        let box1 = false;

        var area1 = document.getElementsByClassName("avaSelect_area")[0];

        document.addEventListener("mousedown", event => box1 = event.target.closest("#ava_handler0"));
        document.addEventListener("mouseup", event => box1 = false);

        document.addEventListener("touchstart", event => box1 = event.target.closest("#ava_handler0"));
        document.addEventListener("touchend", event => box1 = false);

        document.addEventListener("mousemove", event => {
        if (!box1) return;
            if (event.movementX >= event.movementY){
                mov = event.movementX;
            } else {
                mov = event.movementY;
            }
            var root = 1;
            if (mov < 0 && ($(".avaSelect_area").offset().left <= $(".avaSelectMain").offset().left || $(".avaSelect_area").offset().top <= $(".avaSelectMain").offset().top || $(".avaSelect_area").offset().left + $(".avaSelect_area").width() >= $(".avaSelectMain").offset().left + $(".avaSelectMain").width() || $(".avaSelect_area").offset().top + $(".avaSelect_area").height() >= $(".avaSelectMain").offset().top + $(".avaSelectMain").height())){
                root = 0;
            }
            if (root == 1){
                area1.style.width = parseInt(getComputedStyle(area1).width) - mov + "px";
                area1.style.height = parseInt(getComputedStyle(area1).height) - mov + "px";
            }
        });

        document.addEventListener("touchmove", event => {
        if (!box1) return;
            var touch = event.touches[0] || event.changedTouches[0];
            var elm = $("#ava_handler0").offset();
            var x = touch.pageX - elm.left;
            var y = touch.pageY - elm.top;

            if (x >= y){
                mov = x;
            } else {
                mov = y;
            }
            var root = 1;
            if (mov < 0 && ($(".avaSelect_area").offset().left <= $(".avaSelectMain").offset().left || $(".avaSelect_area").offset().top <= $(".avaSelectMain").offset().top || $(".avaSelect_area").offset().left + $(".avaSelect_area").width() >= $(".avaSelectMain").offset().left + $(".avaSelectMain").width() || $(".avaSelect_area").offset().top + $(".avaSelect_area").height() >= $(".avaSelectMain").offset().top + $(".avaSelectMain").height())){
                root = 0;
            }
            if (root == 1){
                area1.style.width = parseInt(getComputedStyle(area1).width) - mov + "px";
                area1.style.height = parseInt(getComputedStyle(area1).height) - mov + "px";
            }
        });


        /*   ---> HANDLER 2 <---   */

        let box2 = false;

        var area2 = document.getElementsByClassName("avaSelect_area")[0];

        document.addEventListener("mousedown", event => box2 = event.target.closest("#ava_handler1"));
        document.addEventListener("mouseup", event => box2 = false);

        
        document.addEventListener("touchstart", event => box2 = event.target.closest("#ava_handler1"));
        document.addEventListener("touchend", event => box2 = false);

        document.addEventListener("mousemove", event => {
        if (!box2) return;
            if (event.movementX >= event.movementY){
                mov = event.movementX;
            } else {
                mov = event.movementY;
            }
            var root = 1;
            var area_elm = $(".avaSelect_area").offset();
            var main_elm = $(".avaSelectMain").offset(); 
            if (mov > 0 && ($(".avaSelect_area").offset().left <= $(".avaSelectMain").offset().left || $(".avaSelect_area").offset().top <= $(".avaSelectMain").offset().top || $(".avaSelect_area").offset().left + $(".avaSelect_area").width() >= $(".avaSelectMain").offset().left + $(".avaSelectMain").width() || $(".avaSelect_area").offset().top + $(".avaSelect_area").height() >= $(".avaSelectMain").offset().top + $(".avaSelectMain").height())){
                root = 0;
            }
            if (root == 1){
                area2.style.width = parseInt(getComputedStyle(area2).width) + mov + "px";
                area2.style.height = parseInt(getComputedStyle(area2).height) + mov + "px";
            }
        });



        document.addEventListener("touchmove", event => {
        if (!box2) return;
            var touch = event.touches[0] || event.changedTouches[0];
            var elm = $("#ava_handler1").offset();
            var x = touch.pageX - elm.left;
            var y = touch.pageY - elm.top; 

            if (x >= y){
                mov = x;
            } else {
                mov = y;
            }

            var root = 1;
            var area_elm = $(".avaSelect_area").offset();
            var main_elm = $(".avaSelectMain").offset(); 
            if (mov > 0 && ($(".avaSelect_area").offset().left <= $(".avaSelectMain").offset().left || $(".avaSelect_area").offset().top <= $(".avaSelectMain").offset().top || $(".avaSelect_area").offset().left + $(".avaSelect_area").width() >= $(".avaSelectMain").offset().left + $(".avaSelectMain").width() || $(".avaSelect_area").offset().top + $(".avaSelect_area").height() >= $(".avaSelectMain").offset().top + $(".avaSelectMain").height())){
                root = 0;
            }
            if (root == 1){
                area2.style.width = parseInt(getComputedStyle(area2).width) + mov + "px";
                area2.style.height = parseInt(getComputedStyle(area2).height) + mov + "px";
            }
        });

        // перетаскивание

        let box = false;
        var area = document.getElementsByClassName("avaSelect_area")[0];

        document.addEventListener("mousedown", event => box = event.target.closest("#touch_pad"));
        document.addEventListener("mouseup", event => box = false);


        document.addEventListener("touchstart", event => box = event.target.closest("#touch_pad"));
        document.addEventListener("touchend", event => box = false);

        var before_x; var before_y;
        var b_x; var b_y;
        var touch_pad = document.getElementById("touch_pad");
        touch_pad.addEventListener("touchstart", function(e){
            b_x = e.touches[0].pageX;
            b_y = e.touches[0].pageY;
            var elm = $("#touch_pad").offset();
            before_x = b_x - elm.left;
            before_y = b_y - elm.top;
        })

        document.addEventListener("mousemove", event => {
        if (!box) return;
            var x = event.movementX;
            var y = event.movementY;

            var area_elm = $(".avaSelect_area").offset();
            var main_elm = $(".avaSelectMain").offset();  
            var root = 1;

            if (x < 0 && area_elm.left + x <= main_elm.left){
                root = 0;
            }
            if (x > 0 && (area_elm.left + $(".avaSelect_area").width() + x) >= (main_elm.left + $(".avaSelectMain").width())){
                root = 0;
            }
            if (y < 0 && area_elm.top + y <= main_elm.top){
                root = 0;
            }
            if (y > 0 && (area_elm.top + $(".avaSelect_area").height() + y) >= (main_elm.top + $(".avaSelectMain").height())){
                root = 0;
            }

            var before_trans = area.style['transform'].slice(10).slice(0, -1).split(',');
            var translate = `${parseInt(before_trans[0]) + x}px,${parseInt(before_trans[1]) + y}px`;
        
            if (root == 1){
                area.style['transform'] = `translate(${translate})`;
            } 
            
        });

        document.addEventListener("touchmove", event => {
        if (!box) return;
            var touch = event.touches[0] || event.changedTouches[0];
            var elm = $("#touch_pad").offset();
            var x = touch.pageX - (elm.left + before_x);
            var y = touch.pageY - (elm.top + before_y);

            var area_elm = $(".avaSelect_area").offset();
            var main_elm = $(".avaSelectMain").offset();  
            var root = 1;
            
            if (x < 0 && area_elm.left + x <= main_elm.left){
                root = 0;
            }
            if (x > 0 && (area_elm.left + $(".avaSelect_area").width() + x) >= (main_elm.left + $(".avaSelectMain").width())){
                root = 0;
            }
            if (y < 0 && area_elm.top + y <= main_elm.top){
                root = 0;
            }
            if (y > 0 && (area_elm.top + $(".avaSelect_area").height() + y) >= (main_elm.top + $(".avaSelectMain").height())){
                root = 0;
            }

            var before_trans = area.style['transform'].slice(10).slice(0, -1).split(',');
            var translate = `${parseInt(before_trans[0]) + x}px,${parseInt(before_trans[1]) + y}px`;

            if (root == 1){
                area.style['transform'] = `translate(${translate})`;
            }
        });

    </script>
</body>
</html> 