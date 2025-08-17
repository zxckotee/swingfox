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
    <title>Swingfox | Настройки анкеты</title>
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
<br><main class="auth_main">
        <h2>О себе</h2>
        <script type='text/javascript'>
            function settings_toSelect(id, value){
                var elem = document.getElementById(id);
                var options = elem.querySelectorAll('option');
                for(var i in options){
                    if (options[i].innerHTML == value){
                        elem.selectedIndex = i;
                    }
                }
            }
        </script> 
        <div class="couple_widgets_column" style="margin-left: 30px;">
            <label for="country" style="font-size: 18px;font-weight: 500;">Страна</label>
            <input type="text" id="country" value='<?php echo $country; ?>' class="auth_input" list="country_datalist" onfocus="getGeo(this.list, this.id, this.id)" placeholder="Страна">
            <datalist id="country_datalist">
            </datalist>
        </div>

        <div class="couple_widgets_column" style="margin-left: 30px;">
            <label for="city" style="font-size: 18px;font-weight: 500;">Город</label>
            <input type="text" id="city" value='<?php echo $city; ?>' class="auth_input" list="city_datalist" onfocus="getGeo(this.list, 'country', this.id)" placeholder="Город">
            <datalist id="city_datalist">
            </datalist>
        </div>
        
        <div class="couple_widgets_column" style="margin-left: 30px;">
            <label for="status" style="font-size: 18px;font-weight: 500;">Ваш семейный статус</label>
            <select id="status" class="auth_input" onchange="familyStatusReaction()" style="padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;">
                <option value="Семейная пара(М+Ж)">Семейная пара(М+Ж)</option>
                <option value="Несемейная пара(М+Ж)">Несемейная пара(М+Ж)</option>
                <option value="Мужчина">Мужчина</option>
                <option value="Женщина">Женщина</option>
            </select>
        </div>
        <?php echo "<script type='text/javascript'>settings_toSelect('status', '{$status}')</script>"; ?>
        
        <script type='text/javascript'>
            function settings_toCheckbox(id, value){
                var elem = document.getElementById(id);
                var boxes = elem.querySelectorAll('input');
                value = value.split('&&');
                for(var i in boxes){
                    if (boxes[i].id == value){
                        boxes[i].checked = true;
                    }
                }
            }
        </script> 

        <fieldset id="search_status">
            <legend>С кем хотите познакомиться?</legend>
            <div>
                <input type="checkbox" id="Семейная пара(М+Ж)" checked name="search_status" />
                <label for="Семейная пара(М+Ж)">Семейная пара(М+Ж)</label>
            </div>

            <div>
              <input type="checkbox" id="Несемейная пара(М+Ж)" name="search_status" />
              <label for="Несемейная пара(М+Ж)">Несемейная пара(М+Ж)</label>
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
        <?php echo "<script type='text/javascript'>settings_toCheckbox('search_status', '{$search_status}')</script>"; ?>

        <div class="couple_widgets_column" style="margin-left: 10px;margin-left: 30px;">
            <label for="search_age" style="font-size: 18px;font-weight: 500;">Возраст тех, с кем хотите познакомиться</label>
            <select id="search_age" class="auth_input" style="padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;">
                <option selected value="Возраст значения не имеет">Возраст значения не имеет</option>
                <option value="С ровестниками">С ровестниками</option>
                <option value="С ровестниками или с разницей +/- 5 лет">С ровестниками или с разницей +/- 5 лет </option>
                <option value="С ровестниками или с разницей +/- 10 лет">С ровестниками или с разницей +/- 10 лет</option>
            </select>
        </div>
        <?php echo "<script type='text/javascript'>settings_toSelect('search_age', '{$search_age}')</script>"; ?>
        <fieldset id="location">
            <legend>Предподчтительное место для встречи</legend>
            <div>
                <input type="checkbox" id="У себя дома (пригласим к себе)" checked name="location" />
                <label for="У себя дома">У себя дома</label>
            </div>

            <div>
              <input type="checkbox" id="У вас дома (примем приглашение)" name="location" />
              <label for="У вас дома (примем приглашение)">У вас дома (примем приглашение)</label>
            </div>
          
            <div>
                <input type="checkbox" id="В свинг-клубе или на закрытой вечеринке" name="location"/>
                <label for="В свинг-клубе или на закрытой вечеринке">В свинг-клубе или на закрытой вечеринке</label>
            </div>
            <div>
                <input type="checkbox" id="В сауне" name="location" />
                <label for="В сауне">В сауне</label>
            </div>
            <div>
                <input type="checkbox" id="В гостинице или на съемной квартире" name="location" />
                <label for="В гостинице или на съемной квартире">В гостинице или на съемной квартире</label>
            </div>

        </fieldset><br>
        <?php echo "<script type='text/javascript'>settings_toCheckbox('location', '{$location}')</script>"; ?>

        <div class="couple_widgets_column" style="margin-left: 10px;margin-left: 30px;">
            <label for="mobile" style="font-size: 18px;font-weight: 500;">Степень вашей мобильности</label>
            <select id="mobile" class="auth_input" style="padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;">
                <option value="Не выезжаем(жаю) для встречи в другие города">Не выезжаем(жаю) для встречи в другие города</option>
                <option value="Приезд возможен, если расстояние не превышает 50км.">Приезд возможен, если расстояние не превышает 50км.</option>
                <option value="Приезд возможен, если расстояние не превышает 100км.">Приезд возможен, если расстояние не превышает 100км.</option>
                <option value="Приезд возможен, если расстояние не превышает 200км.">Приезд возможен, если расстояние не превышает 200км.</option>
                <option value="Приезд возможен, если расстояние не превышает 300км.">Приезд возможен, если расстояние не превышает 300км.</option>
                <option value="Приезд возможен, если расстояние не превышает 400км.">Приезд возможен, если расстояние не превышает 400км.</option>
                <option value="Приезд возможен, если расстояние не превышает 500км.">Приезд возможен, если расстояние не превышает 500км.</option>
                <option value="Расстояние не помеха">Расстояние не помеха</option>
            </select>
        </div>
        <?php echo "<script type='text/javascript'>settings_toSelect('mobile', '{$mobile}')</script>"; ?>
        <div class="couple_widgets_column" style="margin-left: 30px;">
            <label for="info" style="font-size: 18px;font-weight: 500;">О себе и о тех, кого ищете</label>
            <textarea type="text" id="info" maxlength="300" class="auth_textarea" ><?php $info = nl2br($info); echo $info; ?></textarea>
        </div>


        <div name="man">
            <h2>Внешность и проедпочтения мужчины(ваши)</h2>
            <div class="couple_widgets_column" style="margin-left: 15px;">
                <label for="man_date" style="font-size: 18px;font-weight: 500;">Дата рождения</label>
                <input type="date" class="auth_input" id="man_date" value='<?php $date = explode("_", $date); echo $date[0]; ?>'>
            </div>

            <div class="couple_widgets_column" style="margin-left: 10px;margin-left: 15px;">
                <label for="man_height" style="font-size: 18px;font-weight: 500;">Рост</label>
                <select id="man_height" class="auth_input" style="padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;">
                    <option value="141">141 см</option><option value="142">142 см</option><option value="143">143 см</option><option value="144">144 см</option><option value="145">145 см</option><option value="146">146 см</option><option value="147">147 см</option><option value="148">148 см</option><option value="149">149 см</option><option value="150">150 см</option><option value="151">151 см</option><option value="152">152 см</option><option value="153">153 см</option><option value="154">154 см</option><option value="155">155 см</option><option value="156">156 см</option><option value="157">157 см</option><option value="158">158 см</option><option value="159">159 см</option><option value="160">160 см</option><option value="161">161 см</option><option value="162">162 см</option><option value="163">163 см</option><option value="164">164 см</option><option value="165">165 см</option><option value="166">166 см</option><option value="167">167 см</option><option value="168">168 см</option><option value="169">169 см</option><option value="170">170 см</option><option value="171">171 см</option><option value="172">172 см</option><option value="173">173 см</option><option value="174">174 см</option><option value="175">175 см</option><option value="176">176 см</option><option value="177">177 см</option><option value="178">178 см</option><option value="179">179 см</option><option value="180">180 см</option><option value="181">181 см</option><option value="182">182 см</option><option value="183">183 см</option><option value="184">184 см</option><option value="185">185 см</option><option value="186">186 см</option><option value="187">187 см</option><option value="188">188 см</option><option value="189">189 см</option><option value="190">190 см</option><option value="191">191 см</option><option value="192">192 см</option><option value="193">193 см</option><option value="194">194 см</option><option value="195">195 см</option><option value="196">196 см</option><option value="197">197 см</option><option value="198">198 см</option><option value="199">199 см</option><option value="200">200 см</option>
                </select>
            </div>
            <?php $height = explode("_", $height); echo "<script type='text/javascript'>settings_toSelect('man_height', '{$height[0]}')</script>"; ?>
            <div class="couple_widgets_column" style="margin-left: 10px;margin-left: 15px;">
                <label for="man_weight" style="font-size: 18px;font-weight: 500;">Вес</label>
                <select id="man_weight" class="auth_input" style="padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;">
                    <option value="40">40 кг</option><option value="41">41 кг</option><option value="42">42 кг</option><option value="43">43 кг</option><option value="44">44 кг</option><option value="45">45 кг</option><option value="46">46 кг</option><option value="47">47 кг</option><option value="48">48 кг</option><option value="49">49 кг</option><option value="50">50 кг</option><option value="51">51 кг</option><option value="52">52 кг</option><option value="53">53 кг</option><option value="54">54 кг</option><option value="55">55 кг</option><option value="56">56 кг</option><option value="57">57 кг</option><option value="58">58 кг</option><option value="59">59 кг</option><option value="60">60 кг</option><option value="61">61 кг</option><option value="62">62 кг</option><option value="63">63 кг</option><option value="64">64 кг</option><option value="65">65 кг</option><option value="66">66 кг</option><option value="67">67 кг</option><option value="68">68 кг</option><option value="69">69 кг</option><option value="70">70 кг</option><option value="71">71 кг</option><option value="72">72 кг</option><option value="73">73 кг</option><option value="74">74 кг</option><option value="75">75 кг</option><option value="76">76 кг</option><option value="77">77 кг</option><option value="78">78 кг</option><option value="79">79 кг</option><option value="80">80 кг</option><option value="81">81 кг</option><option value="82">82 кг</option><option value="83">83 кг</option><option value="84">84 кг</option><option value="85">85 кг</option><option value="86">86 кг</option><option value="87">87 кг</option><option value="88">88 кг</option><option value="89">89 кг</option><option value="90">90 кг</option><option value="91">91 кг</option><option value="92">92 кг</option><option value="93">93 кг</option><option value="94">94 кг</option><option value="95">95 кг</option><option value="96">96 кг</option><option value="97">97 кг</option><option value="98">98 кг</option><option value="99">99 кг</option><option value="100">100 кг</option><option value="101">101 кг</option><option value="102">102 кг</option><option value="103">103 кг</option><option value="104">104 кг</option><option value="105">105 кг</option><option value="106">106 кг</option><option value="107">107 кг</option><option value="108">108 кг</option><option value="109">109 кг</option><option value="110">110 кг</option><option value="111">111 кг</option><option value="112">112 кг</option><option value="113">113 кг</option><option value="114">114 кг</option><option value="115">115 кг</option><option value="116">116 кг</option><option value="117">117 кг</option><option value="118">118 кг</option><option value="119">119 кг</option><option value="120">120 кг</option><option value="121">121 кг</option><option value="122">122 кг</option><option value="123">123 кг</option><option value="124">124 кг</option><option value="125">125 кг</option><option value="126">126 кг</option><option value="127">127 кг</option><option value="128">128 кг</option><option value="129">129 кг</option><option value="130">130 кг</option><option value="131">131 кг</option><option value="132">132 кг</option><option value="133">133 кг</option><option value="134">134 кг</option><option value="135">135 кг</option><option value="136">136 кг</option><option value="137">137 кг</option><option value="138">138 кг</option><option value="139">139 кг</option><option value="140">140 кг</option><option value="141">141 кг</option><option value="142">142 кг</option><option value="143">143 кг</option><option value="144">144 кг</option><option value="145">145 кг</option><option value="146">146 кг</option><option value="147">147 кг</option><option value="148">148 кг</option><option value="149">149 кг</option><option value="150">150 кг</option><option value="151">151 кг</option><option value="152">152 кг</option><option value="153">153 кг</option><option value="154">154 кг</option><option value="155">155 кг</option><option value="156">156 кг</option><option value="157">157 кг</option><option value="158">158 кг</option><option value="159">159 кг</option><option value="160">160 кг</option><option value="161">161 кг</option><option value="162">162 кг</option><option value="163">163 кг</option><option value="164">164 кг</option><option value="165">165 кг</option><option value="166">166 кг</option><option value="167">167 кг</option><option value="168">168 кг</option><option value="169">169 кг</option><option value="170">170 кг</option><option value="171">171 кг</option><option value="172">172 кг</option><option value="173">173 кг</option><option value="174">174 кг</option><option value="175">175 кг</option><option value="176">176 кг</option><option value="177">177 кг</option><option value="178">178 кг</option><option value="179">179 кг</option><option value="180">180 кг</option><option value="181">181 кг</option><option value="182">182 кг</option><option value="183">183 кг</option><option value="184">184 кг</option><option value="185">185 кг</option><option value="186">186 кг</option><option value="187">187 кг</option><option value="188">188 кг</option><option value="189">189 кг</option><option value="190">190 кг</option><option value="191">191 кг</option><option value="192">192 кг</option><option value="193">193 кг</option><option value="194">194 кг</option><option value="195">195 кг</option><option value="196">196 кг</option><option value="197">197 кг</option><option value="198">198 кг</option><option value="199">199 кг</option><option value="200">200 кг</option>
                </select>
            </div>
            <?php $weight = explode("_", $weight); echo "<script type='text/javascript'>settings_toSelect('man_weight', '{$weight[0]}')</script>"; ?>
            
            <fieldset id="man_smoking">
                <legend>Отношение к курению во время встречи</legend>
                <form>
                    <div>
                        <input type="radio" id="Не курю и не переношу табачного дыма" name="ms" checked />
                        <label for="Не курю и не переношу табачного дыма">Не курю и не переношу табачного дыма</label>
                    </div>

                    <div>
                        <input type="radio" id="Не курю, но терпимо отношусь к табачному дыму" name="ms"/>
                        <label for="Не курю, но терпимо отношусь к табачному дыму">Не курю, но терпимо отношусь к табачному дыму</label>
                    </div>
                    
                    <div>
                        <input type="radio" id="Курю, но могу обойтись какое-то время без сигарет" name="ms"/>
                        <label for="Курю, но могу обойтись какое-то время без сигарет">Курю, но могу обойтись какое-то время без сигарет</label>
                    </div>
                    <div>
                        <input type="radio" id="Не могу отказаться от курения ни при каких обстоятельствах" name="ms"/>
                        <label for="Не могу отказаться от курения ни при каких обстоятельствах">Не могу отказаться от курения ни при каких обстоятельствах</label>
                    </div>

                </form>
            </fieldset><br>
            <?php $smoking = explode("_", $smoking); echo "<script type='text/javascript'>settings_toCheckbox('man_smoking', '{$smoking[0]}')</script>"; ?>
            <fieldset id="man_alko">
                <legend>Отношение к спиртному во время встречи</legend>
                <form>
                    <div>
                        <input type="radio" id="Не употребляю вообще" name="ma" checked />
                        <label for="Не употребляю вообще">Не употребляю вообще</label>
                    </div>

                    <div>
                        <input type="radio" id="В незначительных дозах, количество выпитого не отражается на моем поведении" name="ma"/>
                        <label for="В незначительных дозах, количество выпитого не отражается на моем поведении">В незначительных дозах, количество выпитого не отражается на моем поведении</label>
                    </div>
                    
                    <div>
                        <input type="radio" id="Умеренно, до легкого опьянения, контролирую свое поведение" name="ma"/>
                        <label for="Умеренно, до легкого опьянения, контролирую свое поведение">Умеренно, до легкого опьянения, контролирую свое поведение</label>
                    </div>
                    <div>
                        <input type="radio" id="Могу напиться, потерять контроль над своим поведением" name="ma"/>
                        <label for="Могу напиться, потерять контроль над своим поведением">Могу напиться, потерять контроль над своим поведением</label>
                    </div>

                </form>
            </fieldset>
            <br>
            <?php $alko = explode("_", $alko); echo "<script type='text/javascript'>settings_toCheckbox('man_alko', '{$alko[0]}')</script>"; ?>
        </div>
        
        <div name="woman">
            <h2>Внешность и проедпочтения женщины(ваши)</h2>
            <div class="couple_widgets_column" style="margin-left: 15px;">
                <label for="woman_date" style="font-size: 18px;font-weight: 500;">Дата рождения</label>
                <input type="date" class="auth_input" id="woman_date" value='<?php if(count($date) == 1){echo $date[0];}else{echo $date[1];} ?>'>
            </div>

            <div class="couple_widgets_column" style="margin-left: 10px;margin-left: 15px;">
                <label for="woman_height" style="font-size: 18px;font-weight: 500;">Рост</label>
                <select id="woman_height" class="auth_input" style="padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;">
                    <option value="141">141 см</option><option value="142">142 см</option><option value="143">143 см</option><option value="144">144 см</option><option value="145">145 см</option><option value="146">146 см</option><option value="147">147 см</option><option value="148">148 см</option><option value="149">149 см</option><option value="150">150 см</option><option value="151">151 см</option><option value="152">152 см</option><option value="153">153 см</option><option value="154">154 см</option><option value="155">155 см</option><option value="156">156 см</option><option value="157">157 см</option><option value="158">158 см</option><option value="159">159 см</option><option value="160">160 см</option><option value="161">161 см</option><option value="162">162 см</option><option value="163">163 см</option><option value="164">164 см</option><option value="165">165 см</option><option value="166">166 см</option><option value="167">167 см</option><option value="168">168 см</option><option value="169">169 см</option><option value="170">170 см</option><option value="171">171 см</option><option value="172">172 см</option><option value="173">173 см</option><option value="174">174 см</option><option value="175">175 см</option><option value="176">176 см</option><option value="177">177 см</option><option value="178">178 см</option><option value="179">179 см</option><option value="180">180 см</option><option value="181">181 см</option><option value="182">182 см</option><option value="183">183 см</option><option value="184">184 см</option><option value="185">185 см</option><option value="186">186 см</option><option value="187">187 см</option><option value="188">188 см</option><option value="189">189 см</option><option value="190">190 см</option><option value="191">191 см</option><option value="192">192 см</option><option value="193">193 см</option><option value="194">194 см</option><option value="195">195 см</option><option value="196">196 см</option><option value="197">197 см</option><option value="198">198 см</option><option value="199">199 см</option><option value="200">200 см</option>
                </select>
            </div>
            <?php 
                if (count($height) == 1){$height = $height[0];}else {$height = $height[1];}
                echo "<script type='text/javascript'>settings_toSelect('woman_height', '{$height}')</script>";
            ?>
            <div class="couple_widgets_column" style="margin-left: 10px;margin-left: 15px;">
                <label for="woman_weight" style="font-size: 18px;font-weight: 500;">Вес</label>
                <select id="woman_weight" class="auth_input" style="padding: 3px;padding-left: 10px;height: 40px;font-size: 16px;font-weight: 400;">
                    <option value="40">40 кг</option><option value="41">41 кг</option><option value="42">42 кг</option><option value="43">43 кг</option><option value="44">44 кг</option><option value="45">45 кг</option><option value="46">46 кг</option><option value="47">47 кг</option><option value="48">48 кг</option><option value="49">49 кг</option><option value="50">50 кг</option><option value="51">51 кг</option><option value="52">52 кг</option><option value="53">53 кг</option><option value="54">54 кг</option><option value="55">55 кг</option><option value="56">56 кг</option><option value="57">57 кг</option><option value="58">58 кг</option><option value="59">59 кг</option><option value="60">60 кг</option><option value="61">61 кг</option><option value="62">62 кг</option><option value="63">63 кг</option><option value="64">64 кг</option><option value="65">65 кг</option><option value="66">66 кг</option><option value="67">67 кг</option><option value="68">68 кг</option><option value="69">69 кг</option><option value="70">70 кг</option><option value="71">71 кг</option><option value="72">72 кг</option><option value="73">73 кг</option><option value="74">74 кг</option><option value="75">75 кг</option><option value="76">76 кг</option><option value="77">77 кг</option><option value="78">78 кг</option><option value="79">79 кг</option><option value="80">80 кг</option><option value="81">81 кг</option><option value="82">82 кг</option><option value="83">83 кг</option><option value="84">84 кг</option><option value="85">85 кг</option><option value="86">86 кг</option><option value="87">87 кг</option><option value="88">88 кг</option><option value="89">89 кг</option><option value="90">90 кг</option><option value="91">91 кг</option><option value="92">92 кг</option><option value="93">93 кг</option><option value="94">94 кг</option><option value="95">95 кг</option><option value="96">96 кг</option><option value="97">97 кг</option><option value="98">98 кг</option><option value="99">99 кг</option><option value="100">100 кг</option><option value="101">101 кг</option><option value="102">102 кг</option><option value="103">103 кг</option><option value="104">104 кг</option><option value="105">105 кг</option><option value="106">106 кг</option><option value="107">107 кг</option><option value="108">108 кг</option><option value="109">109 кг</option><option value="110">110 кг</option><option value="111">111 кг</option><option value="112">112 кг</option><option value="113">113 кг</option><option value="114">114 кг</option><option value="115">115 кг</option><option value="116">116 кг</option><option value="117">117 кг</option><option value="118">118 кг</option><option value="119">119 кг</option><option value="120">120 кг</option><option value="121">121 кг</option><option value="122">122 кг</option><option value="123">123 кг</option><option value="124">124 кг</option><option value="125">125 кг</option><option value="126">126 кг</option><option value="127">127 кг</option><option value="128">128 кг</option><option value="129">129 кг</option><option value="130">130 кг</option><option value="131">131 кг</option><option value="132">132 кг</option><option value="133">133 кг</option><option value="134">134 кг</option><option value="135">135 кг</option><option value="136">136 кг</option><option value="137">137 кг</option><option value="138">138 кг</option><option value="139">139 кг</option><option value="140">140 кг</option><option value="141">141 кг</option><option value="142">142 кг</option><option value="143">143 кг</option><option value="144">144 кг</option><option value="145">145 кг</option><option value="146">146 кг</option><option value="147">147 кг</option><option value="148">148 кг</option><option value="149">149 кг</option><option value="150">150 кг</option><option value="151">151 кг</option><option value="152">152 кг</option><option value="153">153 кг</option><option value="154">154 кг</option><option value="155">155 кг</option><option value="156">156 кг</option><option value="157">157 кг</option><option value="158">158 кг</option><option value="159">159 кг</option><option value="160">160 кг</option><option value="161">161 кг</option><option value="162">162 кг</option><option value="163">163 кг</option><option value="164">164 кг</option><option value="165">165 кг</option><option value="166">166 кг</option><option value="167">167 кг</option><option value="168">168 кг</option><option value="169">169 кг</option><option value="170">170 кг</option><option value="171">171 кг</option><option value="172">172 кг</option><option value="173">173 кг</option><option value="174">174 кг</option><option value="175">175 кг</option><option value="176">176 кг</option><option value="177">177 кг</option><option value="178">178 кг</option><option value="179">179 кг</option><option value="180">180 кг</option><option value="181">181 кг</option><option value="182">182 кг</option><option value="183">183 кг</option><option value="184">184 кг</option><option value="185">185 кг</option><option value="186">186 кг</option><option value="187">187 кг</option><option value="188">188 кг</option><option value="189">189 кг</option><option value="190">190 кг</option><option value="191">191 кг</option><option value="192">192 кг</option><option value="193">193 кг</option><option value="194">194 кг</option><option value="195">195 кг</option><option value="196">196 кг</option><option value="197">197 кг</option><option value="198">198 кг</option><option value="199">199 кг</option><option value="200">200 кг</option>
                </select>
            </div>
            <?php 
                if (count($weight) == 1){$weight = $weight[0];}else {$weight = $weight[1];}
                echo "<script type='text/javascript'>settings_toSelect('woman_weight', '{$weight}')</script>";
            ?>
            
            <fieldset id="woman_smoking">
                <legend>Отношение к курению во время встречи</legend>
                <form>
                    <div>
                        <input type="radio" id="Не курю и не переношу табачного дыма" name="ws" checked />
                        <label for="Не курю и не переношу табачного дыма">Не курю и не переношу табачного дыма</label>
                    </div>

                    <div>
                        <input type="radio" id="Не курю, но терпимо отношусь к табачному дыму" name="ws"/>
                        <label for="Не курю, но терпимо отношусь к табачному дыму">Не курю, но терпимо отношусь к табачному дыму</label>
                    </div>
                    
                    <div>
                        <input type="radio" id="Курю, но могу обойтись какое-то время без сигарет" name="ws"/>
                        <label for="Курю, но могу обойтись какое-то время без сигарет">Курю, но могу обойтись какое-то время без сигарет</label>
                    </div>
                    <div>
                        <input type="radio" id="Не могу отказаться от курения ни при каких обстоятельствах" name="ws"/>
                        <label for="Не могу отказаться от курения ни при каких обстоятельствах">Не могу отказаться от курения ни при каких обстоятельствах</label>
                    </div>

                </form>
            </fieldset><br>
            <?php 
                if (count($smoking) == 1){$smoking = $smoking[0];}else {$smoking = $smoking[1];}
                echo "<script type='text/javascript'>settings_toCheckbox('woman_smoking', '{$smoking}')</script>";
            ?>
            <fieldset id="woman_alko">
                <legend>Отношение к спиртному во время встречи</legend>
                <form>
                    <div>
                        <input type="radio" id="Не употребляю вообще" name="wa" checked />
                        <label for="Не употребляю вообще">Не употребляю вообще</label>
                    </div>

                    <div>
                        <input type="radio" id="В незначительных дозах, количество выпитого не отражается на моем поведении" name="wa"/>
                        <label for="В незначительных дозах, количество выпитого не отражается на моем поведении">В незначительных дозах, количество выпитого не отражается на моем поведении</label>
                    </div>
                    
                    <div>
                        <input type="radio" id="Умеренно, до легкого опьянения, контролирую свое поведение" name="wa"/>
                        <label for="Умеренно, до легкого опьянения, контролирую свое поведение">Умеренно, до легкого опьянения, контролирую свое поведение</label>
                    </div>
                    <div>
                        <input type="radio" id="Могу напиться, потерять контроль над своим поведением" name="wa"/>
                        <label for="Могу напиться, потерять контроль над своим поведением">Могу напиться, потерять контроль над своим поведением</label>
                    </div>

                </form>
            </fieldset><br>
            <?php 
                if (count($alko) == 1){$alko = $alko[0];}else {$alko = $alko[1];}
                echo "<script type='text/javascript'>settings_toCheckbox('woman_alko', '{$alko}')</script>";
            ?>
        </div>
        
    </main><br>
    <main class='popup_main'>
        <div id="confirmModal" style="display:none;">
            <p class='profile_data' name='confData'>Вы уверены, что хотите продолжить?</p>
            <div class='couple_widgets'>
                <a class='confButton' id="yesBtn">Да</a>
                <a class='confButton_red' id="noBtn">Нет</a>
            </div>
        </div>
    </main>
    <a class="standart_button" onclick="fillout_settingsComplete()">Продолжить</a><br>

    <script type='text/javascript'>familyStatusReaction()</script>
    <div class="couple_widgets" id="error_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='error_popup'><img src="/img/error.png" class="error-success_img"><p id="error_text"></p></div>
    </div>
    <div class="couple_widgets" id="success_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='success_popup'><img src="/img/success.png" class="error-success_img"><p id="success_text">Успешно</p></div>
    </div>
    <div class="couple_widgets" id="visit_box" style="width: 100%;justify-content: center;position: fixed;top: 0px;">
        <div class='visit_popup'><img src="/img/look.png" class="error-success_img"><p id="visit_text">Прямо сейчас кто-то смотрит ваш профиль!</p></div>
    </div>
    <script type="text/javascript"> startEvents(); </script>
</body>
</html>