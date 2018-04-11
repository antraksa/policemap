<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>Политика в отношении обработки персональных данных</title>
<meta name="description" content="Политика в отношении обработки персональных данных" />
<link rel="canonical" href="https://policemap.ru/policy" />
</head>
  <body id="about" class="pages static all inner">
    <div class="container">

      <?php
      require_once("php/header.php");
      ?>


        <div class="pad-inner content right">
          <?php
          $html = file_get_contents('html/info/policy.html');
          echo $html;
          ?>
        </div>
        <div class="pad-inner sidebar right">
          <?php
          require_once("php/leftsidebar.php");
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
