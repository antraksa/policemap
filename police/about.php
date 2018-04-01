<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>О проекте</title>
</head>
  <body id="about" class="pages static all inner">
    <div class="container">

      <header class="header-inner">
        <div class="pad-inner logo-wrap">
          <a class="" href="/" title="На главную">
            <img class="logo" src="css/img/logo-man-small.png" alt="Карта полиции">
            <span class="logo-title">Карта полиции</span>
          </a>
        </div>
        <div class="pad-inner menu-wrap right">
          <a class="donate btn right">Поддержать Проект</a>
          <?php
          require_once("php/menu.php");
          ?>
        </div>
      </header>

        <div class="pad-inner sidebar left">
          <?php
          require_once("php/leftsidebar.php");
          ?>
        </div>
        <div class="pad-inner content right">
          <?php


          $html = file_get_contents('html/info/about-2.html');

//$html = substr($html,stripos($html,'<body>')+6);
//$html = substr($html,0,strripos($html,'</body>'));
echo $html;
          ?>
        </div>
        </div>


    </div>
    <?php
      require_once("php/footer.php");
     ?>
  </body>
</html>
