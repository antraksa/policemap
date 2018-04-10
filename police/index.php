<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>Карта полиции: все поразделения полиции на карте</title>
<meta name="description" content="Карта подразделений полиции поможет найти участкового, определить границы отдела полиции и иерархию подчинения" />
<link rel="canonical" href="https://policemap.ru/" />
</head>
  <body id="index" class="pages static all">
    <div class="container">
      <div class="home-map right">
        <div class="img">
          <div class="rel">
            <a href="police.html#city=0" class="city-point spb-point"></a>
            <a  href="police.html#city=1" class="city-point msc-point"></a>
            <a  href="police.html#city=2" class="city-point vo-point"></a>
          </div>
          
        </div>
        <!--img src="css/img/home-map.png" alt="Карта полиции"-->
      </div>
      <div class="home-info">
        <div class="about left">
          <header>
            <a class="logo-wrap left" href="/" title="На главную">
              <img class="logo" src="css/img/logo-man.png" alt="Карта полиции">
              <h1>Карта полиции</h1>
            </a>

          </header>
          <div class="clear">&nbsp;</div>

            <div class="text-wrap ">
              <h2>О проекте</h2>
              <p>&laquo;Карта полиции&raquo; реализована в партнёрстве с Объединённой группой общественного наблюдения и инициативой общественного мониторинга отделов полиции &laquo;Гражданин и полиция&raquo;, поддерживаемой руководством МВД.</p>
              <p>Карта показывает актуальную справочную информацию о подразделении, обслуживающем конкретный адрес - будь то участковый, отдел или РУВД. Вычисленный по специальной методике рейтинг отделов полиции позволяет сравнивать их друг с другом по информационной открытости и доступности.</p>
            </div>
            <div class="text-wrap useful-links">
              <h2>Проекту нужны:</h2>
              <ul class="dashed">
                <li><a href="support.php">Волонтёры</a></li>
                <li><a href="support.php">Координаторы проекта в регионах</a></li>
              </ul>
            </div>
        </div>
        <?php
        require_once("php/menu.php");
        ?>
        <div class="nav-wrap right">

          <div class="clear">&nbsp;</div>
          <a href="support.php" class="donate btn">Поддержать Проект</a>
          <?php
          require_once("php/leftsidebar.php");
          ?>

        </div>


        <div class="clear">&nbsp;</div>

        </div>

    </div>
    <?php
      require_once("php/footer.php");
     ?>
  </body>
</html>
