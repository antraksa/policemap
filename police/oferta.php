<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>Договор-оферта</title>
<meta name="description" content="Договор-оферта" />
<link rel="canonical" href="https://policemap.ru/oferta" />
</head>
  <body id="about" class="pages static all inner">
    <div class="container">

      <?php
      require_once("php/header.php");
      ?>


        <div class="pad-inner content right">
          <?php
          $html = file_get_contents('html/info/oferta.html');
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
