<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>Напишите нам</title>
<meta name="description" content="Обратная связь с проектом: оставить отзыв об отделе полиции, задать вопрос или стать волонтёром проекта" />
<link rel="canonical" href="https://policemap.ru/contact-us" />
</head>
  <body id="contact-us" class="pages static all inner">
    <div class="container">

      <?php
      require_once("php/header.php");
      ?>

        <div class="pad-inner sidebar left">
          <?php
          require_once("php/leftsidebar.php");
          ?>
        </div>
        <div class="pad-inner content right">
          <?php
          $html = file_get_contents('html/info/contact-us.html');
          echo $html;
          ?>
        </div>
        <div class="clear"></div>
        </div>


    </div>
    <?php
      require_once("php/footer.php");
     ?>
  </body>
</html>
