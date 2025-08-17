
// start events -->

function startEvents(){
    document.getElementsByClassName('header_menu')[0].style['height']='0px';
}

function getGeo(datalist, inp_id, the_id){
    var country = document.getElementById(inp_id).value.trim();
    $.ajax({
        url: '/geo.php',
        method: 'post',
        dataType: 'json',
        async: false, 
        data: {getGeo: country, id: the_id},
        success: function(response){
            if (response != 'error'){
                if (country == ''){
                    datalist.innerHTML = response;
                } else {
                    datalist.innerHTML = response;

                }
            }
        }
    });
}

function conf(desc, func){
    var confirmModal = document.getElementById('confirmModal');
    var yesBtn = document.getElementById('yesBtn');
    var noBtn = document.getElementById('noBtn');
    
    document.getElementsByName('confData')[0].innerHTML= desc;
    document.getElementsByClassName("popup_main")[0].style['display'] = 'flex';
    confirmModal.style['display'] = 'flex';
    yesBtn.addEventListener("click", func);
    noBtn.addEventListener("click", function(){
        confirmModal.style['display'] = 'none';
        document.getElementsByClassName("popup_main")[0].style['display'] = 'none';
    });
}
// start events <--

function headerMenu_click(){
    var menu = document.getElementsByClassName('header_menu')[0];
    if (menu.style['height'] == '0px'){
        menu.style['height'] = 'auto';
    } else {
        menu.style['height'] = '0px';
    }

}

function errorPopup(mess){
    document.getElementById('error_box').style.display='flex';
    document.getElementsByClassName('error_popup')[0].style.transform = 'translateY(50px)';
    document.getElementById('error_text').innerHTML = mess;

    function errorPopupClose(){
        document.getElementsByClassName('error_popup')[0].style.transform = 'translateY(-250px)';
    }
    setTimeout(errorPopupClose, 1700);
}
function successPopup(mess){
    document.getElementById('success_box').style.display='flex';
    document.getElementsByClassName('success_popup')[0].style.transform = 'translateY(50px)';
    document.getElementById('success_text').innerHTML = mess;

    function errorPopupClose(){
        document.getElementsByClassName('success_popup')[0].style.transform = 'translateY(-250px)';
    }
    setTimeout(errorPopupClose, 1700);
}

/* ===> SUBSCRIBE <=== */
function subFormOpen(){
    document.getElementsByClassName("popup_main")[0].style['display'] = 'flex';
    document.getElementsByClassName("sub_form")[0].style['display'] = 'flex';
}
function subFormClose(){
    document.getElementsByClassName("popup_main")[0].style['display'] = 'none';
    document.getElementsByClassName("sub_form")[0].style['display'] = 'none';
}
function selectSub(elem){
    var selected_sub = elem.innerHTML;
    localStorage.setItem('selected_sub', selected_sub);

    function get_vip_type(viptype){
        var subBuyVipTitle, subBuyPremiumTitle;
        if (viptype == 'FREE'){
            subBuyVipTitle = "<i>Купить за 350</i><img class='foksiks' src='/img/foksik.png'>"; 
            subBuyPremiumTitle = "<i>Купить за 500</i><img class='foksiks' src='/img/foksik.png'>";
        } else { 
            subBuyVipTitle = "<i>Продлить за 350</i><img class='foksiks' src='/img/foksik.png'>"; 
            subBuyPremiumTitle = "<i>Продлить за 500</i><img class='foksiks' src='/img/foksik.png'>";
        }
        if (viptype == 'error'){
            errorPopup('Произошла неизвестная ошибка..');
        }

        // ===> VIEW
        if (elem.innerHTML == "VIP"){
            document.querySelector('#subBuy').innerHTML = subBuyVipTitle;
        }
        if (elem.innerHTML == "PREMIUM"){
            document.querySelector('#subBuy').innerHTML = subBuyPremiumTitle;
        }  
    }

    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        async: false,
        data: {getVipType: '1'},
        success: function(viptype){
            get_vip_type(viptype);
        }
    });

    var all = document.querySelectorAll(`.${elem.className}`);
    for (var i = 0; i < all.length; i++) {
        //console.log(i);
        all[i].style['border'] = '.05rem solid rgb(40, 40, 40)';
    }
    elem.style['border'] = '.05rem solid rgb(220, 53, 34)';  
}
function subBuy(){
    var type = localStorage.getItem("selected_sub");
    var auto;
    if (document.getElementById("auto_sub").checked === true){
        auto = 1;
    } else {
        auto = 0;
    } 
    var jsonData = `${type}&&${auto}`;
    if (type !== null){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {subBuy: jsonData},
            success: function(response){
                if (response == 'no_session'){
                    errorPopup('Ошибка сессии. Попробуйте авторизоваться');
                }
                if (response == 'success'){
                    successPopup("Успешно!");
                } 
                if (response == 'low_balance'){
                    errorPopup("На вашем балансе недостаточно средств! Попробуйте пополнить его в личном кабинете");
                }
                if (response == 'null'){
                    errorPopup('Необходимо выбрать тариф!');
                }

                subFormClose();
            }
        });
    } else {
        errorPopup('Необходимо выбрать тариф!'); 
    }

}
/* ===> SUB END <=== */

function sliderShow(type){
    var section = document.getElementsByClassName("profile_blocks")[0];
    section.style['opacity'] = 0;
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {sliderShow: type},
        success: function(response){
            //console.log(response);
            if (response != "no_login"){
                if (response != "no_last"){
                    if (response != "permiss_error"){
                        section.style['opacity'] = '0';
                        [id,login,ava,age,stat,city,dist,reg,info,online] = response.split('&&');

                        var elem = `<div class="profile_widget">
                            <img src="/uploads/${ava}" class="profile_widget_photo">
                            <div class="profile_widget_info">
                                <h4>@${login}</h4>
                                <h6>${city}, ${dist}км</h6>
                                <h6>${stat}</h6>
                                <h6>${age}</h6>
                                <h6>Последний онлайн: ${online}</h6>
                            </div>
                        </div>`;

                        section.innerHTML = elem;
     
                        document.getElementById('user_more_inf').href=`/profiles.php?us=${login}&back=index.php`;
                     
                        section.style['opacity'] = 1;
           
                    } else {
                        subFormOpen();
                    }
                } else {
                    errorPopup("Это первый загруженный слайд или сессия закончилась");
                }
            } else {
                window.location.href = "/lk/login.html";
            }
        }
    });
}

function slideLike(general){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {slideLike: '1'},
        success: function(response){
            if (response == 'no_session'){
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');
            } 
            if (response == 'like_limit'){
                errorPopup("Вы превысили ежедневный лимит лайков для бесплатного пользователя в 50 анкет. Необходим вип или премиум статус для снятия данных ограничений");
            }
            if (response == 'success'){
                successPopup('Успешно');
                if (general == 1){
                    sliderShow('forward');
                }
            }
            if (response == "recip_like"){
                /// Ответ на лайк лайком ---> Успешно
                successPopup('Есть взаимная симпатия! Заходите в личный кабинет, чтобы посмотреть кто это!');
                if (general == 1){
                    sliderShow('forward');
                } else {
                    location.reload();
                }
            }
        }
    });
}

function slideDislike(){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {slideDislike: '1'},
        success: function(response){
            if (response == 'no_session'){
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');
            } 
            if (response == 'forward'){
                sliderShow('forward')
            }
            if (response == "recip_dis"){
                /// Ответ на лайк дизлайком ---> Успешно
                sliderShow('forward');
            }
        }
    }); 
}
function slideSuperlike_popup(){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {superlikeCount_get: '1'},
        success: function(response){
            if (response == 'no_session'){
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');
            } 
            if (response == 'no_root'){
                subFormOpen();
            }
            if (response.split('&&')[0] == 'success'){
                document.getElementsByClassName("popup_main")[0].style['display'] = 'flex';
                document.getElementsByClassName("superlike_form")[0].style['display'] = 'flex';
                document.getElementById("super_count").innerHTML = `У вас осталось: ${response.split('&&')[1]}`;
            }
        }
    });

}
function slideSuperlike_close(){
    document.getElementsByClassName("popup_main")[0].style['display'] = 'none';
    document.getElementsByClassName("superlike_form")[0].style['display'] = 'none';
}

function slideSuperlike_send(general){
    var mess = document.getElementsByClassName('superlike_input')[0].value;
    if (mess.length > 0){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {slideSuperlike: mess},
            success: function(response){
                if (response == 'no_session'){
                    errorPopup('Ошибка сессии. Попробуйте авторизоваться');
                } 
                if (response == 'end_up'){
                    errorPopup('Ваши суперлайки на сегодня закончились');
                }
                if (response == 'no_root'){
                    subFormOpen();
                }
                if (response == 'success'){
                    successPopup('Успешно')
                    if (general == 1){
                        sliderShow('forward');
                    }
                }
                document.getElementsByClassName('superlike_input')[0].value = '';
                slideSuperlike_close();
                //console.log(response);
            }
        });
    } else {
        errorPopup('Напишите сообщение!');
    }
}



function logIn(){
    var login = document.getElementById("login").value;
    var password = document.getElementById("password").value;

    var jsonData = `${login}&&${password}`;

    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {logIn: jsonData},
        success: function(response){
            if (response == 'success'){
                window.location.href="/index.php";
            } else {
                errorPopup("Неверный логин или пароль");
            }
        }
    });
}
function mailCode(){
    var email = document.getElementById("email").value;
    if (email.length > 0){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {mailCode: email},
            success: function(response){
                if (response == 'success'){
                    successPopup("Код успешно отправлен");
                } else {
                    if (response != 'edentic'){
                        var error = `Код уже был отправлен.. Попробуйте снова через ${response} секунд`;
                        errorPopup(error);
                    } else {
                        errorPopup("Этот email уже используется!");
                    }
                }
            }
        });
    } else {
        errorPopup("Пожалуйста, введите почту");
    }
}
function passRecovery(){
    var email = document.getElementById("email").value;
    var mail_code = document.getElementById("mail_code").value;

    var password = document.getElementById("password").value;
    var password_repeat = document.getElementById("password_repeat");

    if (email.length > 0 && mail_code.length > 0){
        if (password.length > 8){
            if (password == password_repeat){
                var jsonData = [email, mail_code, password].join("&&");
                $.ajax({
                    url: '/main.php',
                    method: 'post',
                    dataType: 'json',
                    data: {passRecovery: jsonData},
                    success: function(response){
                        if (response == 'success'){
                            window.location.href = 'login.html';
                        }
                        if (response == 'code_error'){
                            errorPopup("Неверный код!");
                        }
                    }
                });
            } else {
                errorPopup('Пароли должны совпадать!')
            }
        } else {
            errorPopup('Пароль должен содержать не менее 8 симовлов!');
        }
    } else {
        errorPopup("Все поля необходимы для заполнения!");
    }
}

function familyStatusReaction(){
    var val = document.getElementById("status").value;
    /* ---> IF/ELSE <--- */
    if (val == "Семейная пара(М+Ж)" || val == "Несемейная пара(М+Ж)"){
        document.getElementsByName("man")[0].style["display"] = 'block';
        document.getElementsByName("woman")[0].style["display"] = 'block';
    } else {
        if (val == "Мужчина"){
            document.getElementsByName("man")[0].style["display"] = 'block';
            document.getElementsByName("woman")[0].style["display"] = 'none';
        } if (val == "Женщина"){
            document.getElementsByName("man")[0].style["display"] = 'none';
            document.getElementsByName("woman")[0].style["display"] = 'block';
        }
    }
    console.log(val);
}
function getFormData(id){
    var data = document.getElementById(id).value;
    return data;
}

function getChecked(name) {
    var checkboxes = document.getElementsByName(name);
    var checkboxesChecked = []; // можно в массиве их хранить, если нужно использовать 
    for (var index = 0; index < checkboxes.length; index++) {
       if (checkboxes[index].checked) {
          checkboxesChecked.push(checkboxes[index].id); // положим в массив выбранный
       }
    }
    checkboxesChecked = checkboxesChecked.join("&&");
    return checkboxesChecked; // для использования в нужном месте
}

function checkToEmpty(data){
    var response = false;
    for (var i in data){
        if (data[i].length == 0){
            response = true;
            break;
        }
    }
    return response;
}

function regComplete(){
    var email = getFormData('email');
    var mail_code = getFormData('mail_code');
    var login = getFormData('login');
    var password = getFormData('password');
    var password_repeat = getFormData('password_repeat');

    /* ---> ABOUT ME <--- */

    var country = getFormData('country');
    var city = getFormData('city');
    var status = getFormData('status');
    var search_status = getChecked('search_status');
    var search_age = getFormData('search_age');
    var location = getChecked('location');
    var mobile = getFormData('mobile');
    var info = getFormData('info');

    /* ---> MAN <--- */

    var man_date = getFormData('man_date');
    var man_height = getFormData('man_height');
    var man_weight = getFormData('man_weight');
    var man_smoking = getChecked('ms');
    var man_alko = getChecked('ma');

    /* ---> WOMAN <--- */

    var woman_date = getFormData('woman_date');
    var woman_height = getFormData('woman_height');
    var woman_weight = getFormData('woman_weight');
    var woman_smoking = getChecked('ws');
    var woman_alko = getChecked('wa');
    
    /* ===> ! DATA GENERATION ! <=== */

    if (status == 'Семейная пара(М+Ж)' || status == 'Несемейная пара(М+Ж)'){
        [date, height, weight, smoking, alko] =
        [`${man_date}_${woman_date}`, `${man_height}_${woman_height}`, `${man_weight}_${woman_weight}`, `${man_smoking}_${woman_smoking}`, `${man_alko}_${woman_alko}`]; 
    } else {
        if (status == 'Мужчина'){
            [date, height, weight, smoking, alko] =
            [`${man_date}`, `${man_height}`, `${man_weight}`, `${man_smoking}`, `${man_alko}`]; 
        }
        if (status == 'Женщина'){
            [date, height, weight, smoking, alko] =
            [`${woman_date}`, `${woman_height}`, `${woman_weight}`, `${woman_smoking}`, `${woman_alko}`]; 
        }
    }

    var reg = [email, mail_code, login, password, password_repeat].join("_*_");
    var about = [country,city, status, search_status, search_age, location, mobile, info].join("_*_");
    var individe = [date, height, weight, smoking, alko].join("_*_");

    var jsonData = [reg, about, individe].join("***");
    var arr = jsonData.split("***");
    arr = arr.join("_*_");
    arr = arr.split("_*_");

    if (checkToEmpty(arr) === false){
        //console.log(arr);
        if (login.length >= 4){
            if (password.length >= 8){
                if (password == password_repeat){
                    if (mail_code.length == 6){
                        if (info.length <= 300){
                            $.ajax({
                                url: '/main.php',
                                method: 'post',
                                dataType: 'json',
                                data: {AuthReg: jsonData},
                                success: function(response){
                                    /* ===> MY CODE <=== */

                                    if (response == 'code_error'){
                                        errorPopup('Неверный код!');
                                    }
                                    if (response == 'error'){
                                        errorPopup('Произошла неизвестная ошибка..');
                                    }
                                    if (response == 'success'){
                                        window.location.href = "/my.php";
                                    }
                                    if (response == 'edentic_login'){
                                        errorPopup("Пользователь с таким логином уже существует!");
                                    }
                                    if (response == 'edentic_email'){
                                        errorPopup("Пользователь с таким email уже существует!");
                                    }
                                    console.log(response);
                                }
                            });
                        }
                    } else {
                        errorPopup("Код должен содержать 6 цифр!");
                    }
                } else {
                    errorPopup("Пароли должны совпадать!");
                }
            } else {
                errorPopup("Пароль должен содержать не менее 8 символов!");
            }
        } else {
            errorPopup("Логин должен содержать не менее 4 символов!");
        }
    } else {
        errorPopup("Все поля обязательны для заполнения!");
    }
}


/* ===> GIFT <=== */
function slideGift_popup(){
    document.getElementsByClassName("popup_main")[0].style['display'] = 'flex';
    document.getElementsByClassName("gift_form")[0].style['display'] = 'flex';
} 
function slideGift_close(){
    document.getElementsByClassName("popup_main")[0].style['display'] = 'none';
    document.getElementsByClassName("gift_form")[0].style['display'] = 'none';
}

function selectGift(elem){
    localStorage.setItem('selected_gift', elem.getAttribute('name'));
    var all = document.querySelectorAll(`.${elem.className}`);
    for (var i = 0; i < all.length; i++) {
        //console.log(i);
        all[i].style['border'] = '.05rem solid rgb(255, 255, 255)';
    }
    elem.style['border'] = '.05rem solid rgb(220, 53, 34)';

    document.querySelector('#sendGift').innerHTML = `<i>Отправить за ${elem.getAttribute('name')}</i><img class='foksiks' src='/img/foksik.png'>`;

}
function sendGift(){
    var gifttype = localStorage.getItem('selected_gift');
    if (gifttype !== null){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {sendGift: gifttype},
            success: function(response){
                if (response == 'success'){
                    successPopup('Подарок успешно отправлен!');
                } 
                if (response == 'no_session'){
                    errorPopup('Ошибка сессии. Попробуйте авторизоваться');
                }
                if (response == 'null'){
                    errorPopup('Необходимо выбрать подарок!');
                }        
                if (response == 'low_balance'){
                    errorPopup("На вашем балансе недостаточно средств! Попробуйте пополнить его в личном кабинете");
                }
                if (response == 'no_last'){
                    errorPopup("Сессия закончилась..");
                }
                slideGift_close();
            }
        }); 
    } else {
        errorPopup('Необходимо выбрать подарок!');
    }
}

///#  SO...

function pP_slider(imgBlockId, numBlockId, vector,images){
    var imgBlock = document.getElementById(imgBlockId);
    imgBlock.style['opacity'] = 0;

    var numBlock = document.getElementById(numBlockId);
    var nB_val = numBlock.innerHTML;

    var img = images.split('&&');
    var num = nB_val.substr(0, nB_val.indexOf(' из'));

    var toNum = parseInt(num) - 1 + vector;
    if (toNum < 0){
       toNum = img.length - 1; 
    } 
    if (toNum >= img.length){
        toNum = 0;
    }

    var lastNum = nB_val.split(' из ')[1];

    imgBlock.setAttribute('src', `/uploads/${img[toNum]}`);
    numBlock.innerHTML = `${toNum + 1} из ${lastNum}`;
    
    imgBlock.style['opacity'] = 1;
}

function lockedImages_open(){
    var password = document.getElementById('lockedImages_pass').value;
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {lockedImages_open: password},
        success: function(response){
            if (response == 'success'){
                location.reload();
            } if (response == 'err_pass') {
                errorPopup('Неверный пароль..');
            } if (response == 'no_session'){
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');
            } if (response == 'no_root'){
                subFormOpen();
            }
        }
    });
}

function pP_myC_del(numBlockId, type){
    var numBlock = document.getElementById(numBlockId);
    var nB_val = numBlock.innerHTML;
    var num = nB_val.substr(0, nB_val.indexOf(' из'));
    var toNum = parseInt(num) - 1;
    var jsonData = `${toNum}&&${type}`;
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {pP_myC_del: jsonData},
        success: function(response){
            if (response == 'no_session'){
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');
            }
            if (response == 'success'){
                location.reload();
            }
        }
    })
}

function pP_myC_add(type){
    if (window.FormData === undefined) {
		alert('В вашем браузере FormData не поддерживается');
	} else {
		var formData = new FormData();
		$.each($(`#pP_addImg_${type}`)[0].files,function(key, input){
			formData.append('file[]', input);
		});

        if ($(`#pP_addImg_${type}`)[0].files.length > 0){
            $.ajax({
                type: "POST",
                url: '/upload_many_files.php',
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                dataType: 'json',
                success: function(response){
                    if (response.length > 0){
                        if (response.split("&&")[0] != 'error'){

                            $.ajax({
                                url: '/main.php',
                                method: 'post',
                                dataType: 'json',
                                data: {pP_myC_add: response, pma_type: type},
                                success: function(response){
                                    if (response == 'success'){
                                        location.reload();
                                    } 
                                    if (response == 'no_session'){
                                        errorPopup('Ошибка сессии. Попробуйте авторизоваться');
                                    }
                                    if (response == 'no_root'){
                                        subFormOpen();
                                    }
                                    if (response == 'error'){
                                        errorPopup('Произошла неизвестная ошибка..');
                                    }
                                }
                            });
                        } else {
                            errorPopup(response.split("&&")[1]);
                        }
                    } console.log(response);
                }
            });
        }
	}
}
function lk_avaSelect_popup(filename){
    var avaSelectMain = $('.avaSelectMain');
    var max_width = parseInt(avaSelectMain.css('max-width'));
    var max_height = parseInt(avaSelectMain.css('max-width'));

    const img = new Image();
    img.src = `/uploads/${filename}`;
    img.onload = function() {
        var main = document.getElementsByClassName('avaSelectMain')[0];
        main.style.backgroundImage = `url(${img.src})`;
        var ratio = this.width/this.height;
        if (ratio >= 1){
            avaSelectMain.width(max_width);
            avaSelectMain.height(max_height / ratio);
            main.style.backgroundSize = `${max_width}px ${max_height/ratio}px`;
        } else {
            avaSelectMain.width(max_width * ratio);
            avaSelectMain.height(max_height);
            main.style.backgroundSize = `${max_width*ratio}px ${max_height}px`;
        }
        document.getElementById("ava_complete").setAttribute( "onClick", `lk_avaComplete('${filename}')` );
        document.getElementsByClassName('popup_main')[0].style['display']='flex';
        document.getElementsByClassName('avaSelectBox')[0].style['display']='flex';
        document.getElementsByTagName("html")[0].style['overflow'] = 'hidden';
    }
}
function lk_avaSelect_close(){
    document.getElementsByClassName('popup_main')[0].style['display']='none';
    document.getElementsByClassName('avaSelectBox')[0].style['display']='none';
    document.getElementsByTagName("html")[0].style['overflow-y'] = 'scroll';
}

function lk_avaUpload(){
    if (window.FormData === undefined) {
		alert('В вашем браузере FormData не поддерживается')
	} else {
		var formData = new FormData();
		formData.append('file', document.getElementById('ava_upload').files[0]);

        $.ajax({
			type: "POST",
			url: '/upload_file.php',
			cache: false,
			contentType: false,
			processData: false,
			data: formData,
			dataType : 'json',
			success: function(response){
                if (response.split("&&")[0] != 'error'){
                    lk_avaSelect_popup(response);

                } else {
                    errorPopup(response.split("&&")[1]);
                }
            }
        }); 
    }
}
function lk_avaComplete(filename){
    var avaSelectMain = $('.avaSelectMain');
    var avaSelect_area = $('.avaSelect_area');
    const filearr = filename.split('.');
    const filetype = filearr[filearr.length - 1];
    
    var a = parseInt(avaSelectMain.width()); var b = parseInt(avaSelect_area.width()); 

    var x = parseInt(avaSelect_area.offset().left - avaSelectMain.offset().left);
    var y = parseInt(avaSelect_area.offset().top - avaSelectMain.offset().top);
    var data = `${a}&&${b}&&${x}&&${y}&&${filename}&&${filetype}`;

    $.ajax({
        method: "post",
        url: "/main.php",
        data: {avaComplete: data},
        dataType: "json",
        success: function(response){
            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
            if (response == 'error'){
                errorPopup("Произошла неизвестная ошибка..");
            }
            if (response == 'success'){
                location.reload();
            }
            console.log(response);
        }
    });
}

function fillout_settingsComplete(){
    var country = getFormData('country');
    var city = getFormData('city');
    var status = getFormData('status');
    var search_status = getChecked('search_status');
    var search_age = getFormData('search_age');
    var location = getChecked('location');
    var mobile = getFormData('mobile');
    var info = getFormData('info');

    /* ---> MAN <--- */

    var man_date = getFormData('man_date');
    var man_height = getFormData('man_height');
    var man_weight = getFormData('man_weight');
    var man_smoking = getChecked('ms');
    var man_alko = getChecked('ma');

    /* ---> WOMAN <--- */

    var woman_date = getFormData('woman_date');
    var woman_height = getFormData('woman_height');
    var woman_weight = getFormData('woman_weight');
    var woman_smoking = getChecked('ws');
    var woman_alko = getChecked('wa');
    
    /* ===> ! DATA GENERATION ! <=== */

    if (status == 'Семейная пара(М+Ж)' || status == 'Несемейная пара(М+Ж)'){
        [date, height, weight, smoking, alko] =
        [`${man_date}_${woman_date}`, `${man_height}_${woman_height}`, `${man_weight}_${woman_weight}`, `${man_smoking}_${woman_smoking}`, `${man_alko}_${woman_alko}`]; 
    } else {
        if (status == 'Мужчина'){
            [date, height, weight, smoking, alko] =
            [`${man_date}`, `${man_height}`, `${man_weight}`, `${man_smoking}`, `${man_alko}`]; 
        }
        if (status == 'Женщина'){
            [date, height, weight, smoking, alko] =
            [`${woman_date}`, `${woman_height}`, `${woman_weight}`, `${woman_smoking}`, `${woman_alko}`]; 
        }
    }

    var about = [country,city, status, search_status, search_age, location, mobile, info].join("_*_");
    var individe = [date, height, weight, smoking, alko].join("_*_");

    var jsonData = [about, individe].join("***");

    var arr = jsonData.split("***");
    arr = arr.join("_*_");
    arr = arr.split("_*_");

    if (checkToEmpty(arr) === false){
        if (info.length <= 300){
            $.ajax({
                url: '/main.php',
                method: 'post',
                dataType: 'json',
                data: {filloutSettings: jsonData},
                success: function(response){
                    /* ===> MY CODE <=== */

                    if (response == 'error'){
                        errorPopup('Произошла неизвестная ошибка..');
                    }
                    if (response == 'success'){
                        window.location.href = "/my.php";
                    }
                    if (response == 'no_session'){
                        errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
                    }

                }
            });
        }

    } else {
        errorPopup("Все поля обязательны для заполнения!");
    }
}
function leave(){
    conf('Вы точно хотите покинуть сайт?', function(){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {leave: '1'},
            success: function(response){
                /* ===> MY CODE <=== */

                if (response == 'error'){
                    errorPopup('Произошла неизвестная ошибка..');
                }
                if (response == 'success'){
                    window.location.href = "/lk/login.html";
                }
                if (response == 'no_session'){
                    errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
                }
            }
        });
    });
}

function goToChat(assist){
    window.location.href=`/chat.php?assist=${assist}`;
}


function mess_addFiles(){
    if (window.FormData === undefined) {
		alert('В вашем браузере FormData не поддерживается');
	} else {
		var formData = new FormData();
		$.each($(`#messImg_input`)[0].files,function(key, input){
			formData.append('file[]', input);
		});

        if ($(`#messImg_input`)[0].files.length > 0){
            $.ajax({
                type: "POST",
                url: '/upload_many_files.php',
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                dataType: 'json',
                success: function(response){
                    if (response.split("&&")[0] != 'error'){
                        localStorage.setItem('chatFiles', response);
                        let count = response.split("&&").length;
                        let elem = `
                        <p class='pseudo_info' style='margin: 5px'>${count} фото</p>
                        <img src="/img/close.png" width='30px' height='30px'  onclick='mess_delFiles()'>`;
                        document.getElementById('messImg_pseudo').innerHTML = elem;
                    } else {
                        errorPopup(response.split("&&")[1]);
                    } 
                }
            });
        }
	}
}

function mess_delFiles(){
    localStorage.setItem('chatFiles', '0');
    document.getElementById('messImg_pseudo').innerHTML = '';
}
 
function chatReturn(){
    var assist = localStorage.getItem('chatAssist'); 

    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {chatReturn: assist},
        success: function(response){
            if (response == 'error'){
                errorPopup('Произошла неизвестная ошибка..');
            }
            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
            if (response != 'error' && response != 'no_session'){
                /* ===> MY CODE <=== */
                if (response != '0'){
                    document.getElementById('messangerBox').innerHTML = response;
                    mess_delFiles();
                } else {
                    document.getElementById('nullChat_pseudo').style['display'] = 'block';
                }
            }
        }
    });
}

function messSend(){
    /* ===> MY CODE <=== */
    var assist = localStorage.getItem('chatAssist'); 
    var mess = document.getElementById('mess_input').value;
    var files = localStorage.getItem('chatFiles');

    var jsonData = `${assist}&&${mess}&&${files}`;
    if ( (mess != ' ' && mess.length > 0) || files != '0'){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {messSend: jsonData},
            success: function(response){
                if (response == 'error'){
                    errorPopup('Произошла неизвестная ошибка..');
                }
                if (response == 'no_session'){
                    errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
                }
                if (response == 'success'){
                    chatReturn();
                    document.getElementById('mess_input').value = '';
                }
            }
        });
    } 
}

function chatChecker(assist){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {chatChecker: assist},
        success: function(response){
            if (response == 'error'){
                errorPopup('Произошла неизвестная ошибка..');
            }
            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
            if (response == 'isset'){
                chatReturn();
            }
        }
    });
}

function chatStatusSender(assist, status){
    var jsonData = `${assist}&&${status}`;
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {chatStatusSender: jsonData},
        success: function(response){
            if (response == 'error'){
                errorPopup('Произошла неизвестная ошибка..');
            }
            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
            if (response != 'error' && response != 'no_session'){
                document.getElementById('statusMark').innerHTML = response;
            }
        }
    });
}

function filterReload(){
    var link = `/acquaintances.php?a=1`;
    var status = getChecked('search_status');
    if (status != ''){
        status = status.replaceAll('&&', '_');
        link += `&status=${status}`;
    }
    var country = getFormData('country');
    var city = getFormData('city'); 

    if (country != ''){
        link += `&country=${country}`;
        if (city != ''){
            link += `&city=${city}`;
        }
    }
    window.location.href = link;
}

function adsTypeSelect(){
    var type = getFormData('adsType');
    var country = getFormData('country');
    var city = getFormData('searchCity');
    var loc = `/ads.php`;
    if (type != '' || city != '' || country != ''){
        loc += `?a=1`;
        if (type != ''){
            loc += `&type=${type}`;
        } if (country != ''){
            loc += `&country=${country}`; 
        } if (city != ''){
            loc += `&city=${city}`; 
        } 
    }
    window.location.href = loc;
}
function adsCreate_popup(){
    document.getElementsByClassName('popup_main')[0].style['display']='flex';
    document.getElementsByClassName('adsCreate_box')[0].style['display']='flex';
}
function adsCreate_close(){
    document.getElementsByClassName('popup_main')[0].style['display']='none';
    document.getElementsByClassName('adsCreate_box')[0].style['display']='none';
}

function adsCreate(){
    let desc = document.querySelector('#adsDesc').value;
    let type = document.querySelector('#adsTypeCreate').value; 
    
    var jsonData = `${desc}&&${type}`;
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {adsCreate: jsonData},
        success: function(response){
            if (response == 'error'){
                errorPopup('Произошла неизвестная ошибка..');
            }
            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
            if (response == 'isset'){
                errorPopup("В бесплатной версии аккаунта возможно только 1 объявление. Попробуйте удалить предыдущее");
            }
            if (response == 'success'){
                location.reload();
            }
        }
    });
}
/* pointer-events: none; */
function adsMyDel(id){
    conf('Вы точно хотите удалить это объявление?', function(){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {adsMyDel: id},
            success: function(response){
                /* ===> MY CODE <=== */

                if (response == 'error'){
                    errorPopup('Произошла неизвестная ошибка..');
                }
                if (response == 'success'){
                    window.location.href = "/ads.php";
                }
                if (response == 'no_session'){
                    errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
                }
            }
        });
    });
}
function eventApplicSend(id, elem){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {eventApplicSend: id},
        success: function(response){
            /* ===> MY CODE <=== */

            if (response == 'error'){
                errorPopup('Произошла неизвестная ошибка..');
            }
            if (response == 'success'){
                elem.style['pointer-events'] = 'none';
                elem.classList.add('gray_button');
                successPopup('Вы успешно записались');
            }
            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
        }
    });
}
function eventSearch(){
    var loc = '/events.php';
    var country = getFormData('country');
    var city = getFormData('city'); 

    if (country != ''){
        loc += `?country=${country}`;
        if (city != ''){
            loc += `&city=${city}`;
        }
    }

    window.location.href = loc;
}

function sendApplicToCreateClub(elem){
    let name = getFormData('name');
    let country = getFormData('country');
    let city = getFormData('city');
    let address = getFormData('address');
    let owner = getFormData('owner');
    let admins = getFormData('admins');
    let links = getFormData('links');
    let desc = getFormData('desc');

    if (checkToEmpty([name,country,city,owner]) === false){
        var jsonData = [name,country,city,address,owner,admins,links,desc].join("&&");
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {applicToCreateClub: jsonData},
            success: function(response){
                /* ===> MY CODE <=== */
    
                if (response == 'error'){
                    errorPopup('Произошла неизвестная ошибка..');
                }
                if (response == 'success'){
                    /*elem.style['pointer-events'] = 'none';
                    elem.classList.add('gray_button');
                    successPopup('Заявка успешно отправлена!');*/
                    window.location.href='/';
                }
                if (response == 'no_session'){
                    errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
                }
            }
        });
    } else {
        errorPopup("Заполните недостающие поля!");
    }
    
}

function eventImgUpload(input, label_id) {
    if (window.FormData === undefined) {
		alert('В вашем браузере FormData не поддерживается');
	} else {
        var label = $(`#${label_id}`)[0];
        label.style['opacity'] = '0.5';
		var formData = new FormData();
		$.each(input.files,function(key, input){
			formData.append('file[]', input);
		});

        if (input.files.length > 0){
            $.ajax({
                type: "POST",
                url: '/upload_many_files.php',
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                dataType: 'json',
                success: function(response){
                    if (response.split('&&')[0] != 'error'){
                        let img = label.children[0]; 
                        img.src = `/uploads/${response}`;
                        img.onload = function() {
                            label.style['opacity'] = '1';
                        };
                    } else {
                        errorPopup('Произошла неизвестная ошибка..');
                    }
                }
            });
        }
    }
}

function eventCreate(club){
    let name = getFormData('event_name');
    let desc = getFormData('event_desc');
    let date = getFormData('event_date');

    let country = getFormData('country');
    let city = getFormData('city');
    let img = $('#eventImg')[0].children[0].getAttribute('src').replace('/uploads/','');

    var jsonData = [club,name,desc,date,country,city,img]; 

    if (checkToEmpty(jsonData) !== true){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            data: {eventCreate: JSON.stringify(jsonData)},
            success: function(response){
                if (response == 'no_session'){
                    errorPopup('Ошибка сессии. Попробуйте авторизоваться');
                } 
                if (response == 'no_root'){
                    errorPopup('У вас недостаточно прав!');
                }
                if (response == 'success'){
                    location.reload();
                }
            }
        });
    } else {
        errorPopup('Вы пропустили поле!');
    }
}

function profileVisit(name){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {profileVisit: name}
    });
}

function visitPopup(mess){
    document.getElementById('visit_box').style.display='flex';
    document.getElementsByClassName('visit_popup')[0].style.transform = 'translateY(50px)';
    document.getElementById('visit_text').innerHTML = mess;

    function errorPopupClose(){
        document.getElementsByClassName('visit_popup')[0].style.transform = 'translateY(-250px)';
    }
    setTimeout(errorPopupClose, 1700);
}

setInterval(60000, function (){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        data: {checkVisits: '1'},
        success: function(response){
            if (response == 'isset'){
                visitPopup('Прямо сейчас кто-то смотрит ваш профиль!');
            }
        }
    });
});

function lockedImages_passCreate(){
    var password = $('#lockedImages_pass')[0].value;
    var password_repeat = $('#lockedImages_pass_repeat')[0].value;

    if (password.length > 0){
        if (password == password_repeat){
            $.ajax({
                url: '/main.php',
                method: 'post',
                dataType: 'json',
                data: {lockedImages_passCreate: password},
                success: function(response){
                    if (response == 'success'){
                        location.reload();
                    } 
                    if (response == 'no_session'){
                        errorPopup('Ошибка сессии. Попробуйте авторизоваться');
                    }
                }
            });
        } else {
            errorPopup('Пароли должны совпадать!');
            console.log(password, ' ', password_repeat);
        }
    } else {
        errorPopup('Придумайте пароль!');
    }
}

function geoReload(){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        async: false,
        data: {geoReload: '1'},
        success: function(response){
            if (response == 'success'){
                successPopup('Местоположение успешно переустановлено!');
            } if (response == 'error') {
                errorPopup('Произошла неизвестная ошибка..');
            } if (response == 'no_session'){
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');
            } if (response == 'geoSets'){
                errorPopup('Местоположение можно менять не чаще, чем раз в сутки!');
            }
        }
    });
}
/* <form class="imageReveal_form">
                <img src="/img/like.png" width='40px' height='40px' id='imageReveal_like'>
                <h4 style='margin:0px;' id='imageReveal_total' >52</h4>
                                 <img src="/img/dislike.png" width='40px' height='40px' id='imageReveal_dislike'>
            </form> */



            /* ===> RATING <=== */

function imageGetLikes(img){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        async: false,
        data: {imageGetLikes: img},
        success: function(response){
            //console.log(response);
            if (response != 'no_session'){
                [my, total] = response.split('&&');
                if (my != '0'){
                    document.getElementsByClassName('imageLike')[0].style['background-image'] = "url('/img/postLike_active.png')";
                } else {
                    document.getElementsByClassName('imageLike')[0].style['background-image'] = "url('/img/postLike.png')";
                }
                document.getElementsByClassName('imageLike')[0].innerHTML = total;
            } else {
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');  
            }
            
        }
    });
}

function imageReveal(elem){
    let src = elem.getAttribute('src');
    // var img = src.replace('/uploads/', '');
    console.log(src);
    document.querySelector('.imageReveal_img').setAttribute('src', src);
    
    var img = src.replace('/uploads/', '');

    imageGetLikes(img);
        
    document.getElementsByClassName('popup_main')[0].style['display']='flex';
    document.getElementsByClassName('imageReveal_box')[0].style['display']='flex';
}

function imageLike(){
    let src = document.querySelector('.imageReveal_img').getAttribute('src');
    if (src != ''){
        var img = src.replace('/uploads/', '');
        var my_like = document.getElementsByClassName('imageLike')[0].style['background-image'];
        
        if (my_like == 'url("/img/postLike_active.png")'){
            my = '1';
        } else {my = '0'};
        //console.log(my_like, my_like == "url('/img/postLike_active.png')");
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            async: false,
            data: {imageLike: JSON.stringify([img, my])},
            success: function(response){
                //console.log(response);
                if (response != 'no_session'){
                    // обновление данных о лайках на фото
                    imageGetLikes(img);  
                } else {
                    errorPopup('Ошибка сессии. Попробуйте авторизоваться');  
                }
            }
        });
    }
}

function imageReveal_close(){
    document.querySelector('.imageReveal_img').setAttribute('src', '');

    document.getElementsByClassName('popup_main')[0].style['display']='none';
    document.getElementsByClassName('imageReveal_box')[0].style['display']='none';
}

function ratingSet(user, value){
    $.ajax({
        url: '/main.php',
        method: 'post',
        dataType: 'json',
        async: false,
        data: {ratingSet: JSON.stringify([user, value])},
        success: function(response){
            if (response == 'no_session'){
                errorPopup('Ошибка сессии. Попробуйте авторизоваться');
            }
            if (response == 'success'){
                location.reload();
            }
        }
    });
}

function getNew_mess(){ // уведомление о сообщении 
    if (document.querySelector('.newMess_popupBox') === null){
        $.ajax({
            url: '/main.php',
            method: 'post',
            dataType: 'json',
            async: false,
            data: {getNew_mess: '1'},
            success: function(response){
                if (response != 'no_session'){
                    if (response != ''  && document.getElementsByClassName('newMess_popupBox')[0] === undefined){
                        document.querySelector('.notif_fixedBox').innerHTML = response;
                    }
                    localStorage.setItem('newMess_notif', response);

                    if (response != ''){
                        document.querySelectorAll("a[href='/assists.php'][class='header_links']")[0].innerHTML = 'Чаты ●';
                    } else {
                        document.querySelectorAll("a[href='/assists.php'][class='header_links']")[0].innerHTML = 'Чаты';
                    }
                }
                console.log(document.getElementsByClassName('newMess_popupBox')[0] === undefined);
            }
        });
    }
} if (window.location.href != 'http://swingfox.kolomigs.beget.tech/assists.php'){
    setInterval(getNew_mess, 5000);
}


