<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>Как вычисляется рейтинг отделов полиции</title>
<meta name="description" content="Параметры оценки работы отделов полиции, сформированные на основе мониторинга и отзывов о полиции" />
<link rel="canonical" href="https://policemap.ru/how-to-rate" />
</head>
  <body id="how-to-rate" class="pages static all inner">
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
          $html = file_get_contents('html/info/how-to-rate.html');
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
