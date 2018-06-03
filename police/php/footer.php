<footer class="static">
  <div class="left">© 2017-2018  «Карта Полиции»</div>
  <div class="clear">
</footer>
<script>
$('body').find('[data-link]').on('click', function() {
    var link = $(this).attr('data-link');
    var link = link.replace('html/info/','').replace('.html', '.php')
    window.location.replace(link)
})
$( document ).ready(function() {
    $('#main-menu a').each(function() {
      var href = $(this).attr('href');
      href = href.replace('.php','')
      if (($('body').attr('id') == href) || (($('body').attr('id') == 'index') && href == '.')) {
        $(this).addClass('active');
      }
    })
});
$('.social_share').on('click', function(){
  console.log('cshare');
  Share.go(this);
});

</script>
<script src="js/static/metrika.js"></script>
<noscript><div><img src="https://mc.yandex.ru/watch/46355028" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-108418867-1"></script>
<script src="js/static/analytics.js"></script>
