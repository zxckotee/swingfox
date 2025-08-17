<?php

function id(){
    $id = time();
    for ($i = 0; $i < 3; $i++){
        $id .= rand(0,9);
    }
    return $id;
}

$input_name = 'file';

$allow = array();
 

$deny = array(
	'phtml', 'php', 'php3', 'php4', 'php5', 'php6', 'php7', 'phps', 'cgi', 'pl', 'asp', 
	'aspx', 'shtml', 'shtm', 'htaccess', 'htpasswd', 'ini', 'log', 'sh', 'js', 'html', 
	'htm', 'css', 'sql', 'spl', 'scgi', 'fcgi', 'exe'
);
 

$path = __DIR__ . '/uploads/';
 
$data = "";
 
if (!isset($_FILES[$input_name])) {
	$error = 'Файлы не загружены.';
} else {

	$files = array();
	$diff = count($_FILES[$input_name]) - count($_FILES[$input_name], COUNT_RECURSIVE);
	if ($diff == 0) {
		$files = array($_FILES[$input_name]);
	} else {
		foreach($_FILES[$input_name] as $k => $l) {
			foreach($l as $i => $v) {
				$files[$i][$k] = $v;
			}
		}		
	}	
 
	foreach ($files as $file) {
		$error = $success = '';
 

		if (!empty($file['error']) || empty($file['tmp_name'])) {
			$error = 'Не удалось загрузить файл.';
		} elseif ($file['tmp_name'] == 'none' || !is_uploaded_file($file['tmp_name'])) {
			$error = 'Не удалось загрузить файл.';
		} else {

			$pattern = "[^a-zа-яё0-9,~!@#%^-_\$\?\(\)\{\}\[\]\.]";
			$name = mb_eregi_replace($pattern, '-', $file['name']);
			$name = mb_ereg_replace('[-]+', '-', $name);
			$parts = pathinfo($name);

			$maks_size = 26214400;
			$ms_desc = "Максимальный объем файла должен быть не больше 25МБ";
			if (end(explode(".", $name)) == 'png' || end(explode(".", $name)) == 'jpeg' || end(explode(".", $name)) == 'jpg'){
				$maks_size = 5242880;
				$ms_desc = "Максимальный объем фотографии должен быть не больше 5МБ";
			}
			if (end(explode(".", $name)) == 'mov' || end(explode(".", $name)) == 'mp4'){
				$maks_size = 52428800;
				$ms_desc = "Максимальный объем видеофайла должен быть не больше 50МБ";
			}
			if ($file['size'] <= $maks_size){			
				if (empty($name) || empty($parts['extension'])) {
					$error = 'Недопустимый тип файла';
				} elseif (!empty($allow) && !in_array(strtolower($parts['extension']), $allow)) {
					$error = 'Недопустимый тип файла';
				} elseif (!empty($deny) && in_array(strtolower($parts['extension']), $deny)) {
					$error = 'Недопустимый тип файла';
				} elseif (end(explode(".", $name)) == 'php') {
					$error = 'Недопустимый тип файла';
				} else {
					$file_end_val = end(explode(".", $name));
					$uniname = id()."."."{$file_end_val}";
					if (move_uploaded_file($file['tmp_name'], $path . $uniname)) {
						$success = 'Файл «' . $name . '» успешно загружен.';
					} else {
						$error = 'Не удалось загрузить файл.';
					}
				}
			} else {
				$error = $ms_desc; 
			}
		}
		
		if (empty($error)) {
			$data .= "{$uniname}&&";  
		} else {
			$data = "error&&".$error;
		}

	}
}
$data = mb_substr($data, 0, -2); 
header('Content-Type: application/json');
echo json_encode($data, JSON_UNESCAPED_UNICODE);
exit();