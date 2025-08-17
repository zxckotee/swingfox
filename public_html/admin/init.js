function adminAuth(){
    var login = getFormData('login');
    var password = getFormData('password');

    if (checkToEmpty([login,password]) === false){
        var jsonData = [login, password].join("&&");
        $.ajax({
            url: '/admin/admin_init.php',
            method: 'post',
            dataType: 'json',
            data: {adminAuth: jsonData},
            success: function(response){
                /* ===> MY CODE <=== */

                if (response == 'success'){
                    window.location.href = "/admin/general.php";
                }
                if (response == 'error'){
                    errorPopup("Неверный логин или пароль");
                }
                console.log(response);

            }
        });
    } else {
        errorPopup("Заполните недостающие поля");
    }
}

function applicOpen(id){
    var elem = document.getElementById(`${id}`);
    if (elem.style['display'] == 'none'){
        elem.style['display'] = 'flex';
    } else {
        elem.style['display'] = 'none';
    }
}

function applicConfirm(id){
    $.ajax({
        url: '/admin/admin_init.php',
        method: 'post',
        dataType: 'json',
        data: {applicConfirm: id},
        success: function(response){
            /* ===> MY CODE <=== */

            if (response == 'success'){
                location.reload();
            }

            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
            console.log(response);
        }
    });
}

function applicDispute(id){
    $.ajax({
        url: '/admin/admin_init.php',
        method: 'post',
        dataType: 'json',
        data: {applicDispute: id},
        success: function(response){
            /* ===> MY CODE <=== */

            if (response == 'success'){
                location.reload();
            }

            if (response == 'no_session'){
                errorPopup("Ошибка сессии пользователя. Пожалуйста, перезагрузите страницу и снова войдите учётную запись");
            }
            console.log(response);
        }
    });
}