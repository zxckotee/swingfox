<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

    <form method="post" enctype="multipart/form-data">
        <select name="gender" >
            <option value="male">Мужская</option>
            <option value="female">Женская</option>
            <option value="male/female">Мужская/Женская</option>
        </select>
        <input type="text" name="name" placeholder="Название">
        <input type="text" name="old_price" placeholder="Старая цена">
        <input type="text" name="new_price" placeholder="Новая цена">
        <textarea type="text" name="desc" placeholder="Описание" style="width:300px;padding:20px;"></textarea>
        <textarea type="text" name="info" placeholder="Информация" style="width:300px;padding:20px;"></textarea>
        <input type="file" name="upload[]" accept="PNG" multiple placeholder="Картинки">
        <input type="submit">
    </form>
    <?php
    if (isset($_POST['name'])){
        $host = 'localhost';
        $user = 'root';
        $password = '';
        $db = 'base';

        $link = mysqli_connect($host,$user,$password,$db);

        $gender = $_POST['gender'];
        $name = $_POST['name'];
        $old_price = intval($_POST['old_price']);
        $new_price = intval($_POST['new_price']);
        $desc = $_POST['desc'];
        $info = $_POST['info'];
        $id = time();

        $query = "INSERT INTO `products`(`id`, `gender`, `name`, `old-price`, `new-price`, `desc`, `info`, `img1`, `img2`, `img3`, `img4`,`img5`) VALUES ('$id','$gender','$name','$old_price','$new_price','$desc','$info'";

        $total = count($_FILES['upload']['name']);

        for( $i=0 ; $i < $total ; $i++ ) {
          $tmpFilePath = $_FILES['upload']['tmp_name'][$i];     
          if ($tmpFilePath != ""){
            $newFilePath = __DIR__."/assets/img/".$_FILES['upload']['name'][$i];
            $file = "assets/img/".$_FILES['upload']['name'][$i];
            if(move_uploaded_file($tmpFilePath, $newFilePath)) {
                $query .= ",'$file'";    
            }
          }
        }
        $query .= ") ";
        echo $query;
        mysqli_query($link, $query);
        echo "Готово!";
    }
    
    ?>
</body>
</html>