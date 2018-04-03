<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>Поддержать проект</title>
<meta name="description" content="Поддержите Карту полиции, сделав пожертвование" />
<link rel="canonical" href="https://policemap.ru/support" />
</head>
  <body id="support" class="pages static all inner">
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
          $html = file_get_contents('html/info/support.html');
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
