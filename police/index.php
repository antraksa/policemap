<!DOCTYPE html>
<html lang="ru">
<head>
  <?php
    require_once("php/head.php");
   ?>
<title>Карта полиции</title>
</head>
  <body id="home" class="pages static all">
    <div class="container">
      <div class="home-map right">
        <div></div>
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
              <ul>
                <li><a>Волонтёры</a></li>
                <li><a>Координаторы проекта в регионах</a></li>
              </ul>
            </div>
        </div>
        <?php
        require_once("php/menu.php");
        ?>
        <div class="nav-wrap right">

          <div class="clear">&nbsp;</div>
          <a class="donate btn">Поддержать Проект</a>
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
