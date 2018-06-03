

// getMetaValue('description')
function getMetaValue(meta_name, doc) {
    if (!doc) {doc = document;}
    var my_arr=doc.getElementsByTagName("meta");
    for (var counter=0; counter<my_arr.length; counter++) {
        if (my_arr[counter].name.toLowerCase() == meta_name.toLowerCase()) {
          // console.log('meta ', my_arr[counter].content);
           return my_arr[counter].content;
           }
    }
    return "";

}

Share = {
    /**
     * Показать пользователю дилог шаринга в сооветствии с опциями
     * Метод для использования в inline-js в ссылках
     * При блокировке всплывающего окна подставит нужный адрес и ползволит браузеру перейти по нему
     *
     * @example <a href="" onclick="return share.go(this)">like+</a>
     *
     * @param Object _element - элемент DOM, для которого
     * @param Object _options - опции, все необязательны
     */
    go: function(_element, _options) {
        var
            self = Share,
            options = $.extend(
                {
                    type:       'vk',    // тип соцсети
                    url:        location.href,  // какую ссылку шарим
                    count_url:  location.href,  // для какой ссылки крутим счётчик
                    title:      document.title, // заголовок шаринга
                    image:        'https://policemap.ru/css/img/logo.png',             // картинка шаринга
                    text:       getMetaValue('description'),             // текст шаринга
                },
                $(_element).data(), // Если параметры заданы в data, то читаем их
                _options            // Параметры из вызова метода имеют наивысший приоритет
            );

        if (self.popup(link = self[options.type](options)) === null) {
          console.log('Если не удалось открыть попап', _element);
            // Если не удалось открыть попап
            if ( $(_element).is('a') ) {
                // Если это <a>, то подставляем адрес и просим браузер продолжить переход по ссылке
                $(_element).prop('href', link);
                // setTimeout(function(){ $(_element).click(); }, 1000);
                // $(_element).click()
                return true;
            }
            else { console.log('Если это не <a>, то пытаемся перейти по адресу');
                // Если это не <a>, то пытаемся перейти по адресу
                location.href = link;
                return false;
            }
        }
        else {
            // Попап успешно открыт, просим браузер не продолжать обработку
            return false;
        }
    },

    // ВКонтакте
    vk: function(_options) {
        var options = $.extend({
                url:    location.href,
                title:  document.title,
                image:  '',
                text:   '',
            }, _options);

        return 'http://vkontakte.ru/share.php?'
            + 'url='          + encodeURIComponent(options.url)
            + '&title='       + encodeURIComponent(options.title)
            + '&description=' + encodeURIComponent(options.text)
            + '&image='       + encodeURIComponent(options.image)
            + '&noparse=true';
    },

    // Одноклассники
    ok: function(_options) {
        var options = $.extend({
                url:    location.href,
                text:   '',
            }, _options);

        return 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=1'
            + '&st.comments=' + encodeURIComponent(options.text)
            + '&st._surl='    + encodeURIComponent(options.url);
    },

    // Facebook
    fb: function(_options) {
        var options = $.extend({
                url:    location.href,
                title:  document.title,
                image:  '',
                text:   '',
            }, _options);

        return 'http://www.facebook.com/dialog/feed'
            + '?app_id=583639228661879&display=popup'
            // + '&caption='     + encodeURIComponent(options.title)
            // + '&p[summary]='   + encodeURIComponent(options.text)
            + '&link='       + encodeURIComponent(options.url)
            + '&redirect_uri=' + encodeURIComponent(options.url);
    },

    // Живой Журнал
    lj: function(_options) {
        var options = $.extend({
                url:    location.href,
                title:  document.title,
                text:   '',
            }, _options);

        return 'http://livejournal.com/update.bml?'
            + 'subject='        + encodeURIComponent(options.title)
            + '&event='         + encodeURIComponent(options.text + '<br/><a href="' + options.url + '">' + options.title + '</a>')
            + '&transform=1';
    },

    // Твиттер
    tw: function(_options) {
        var options = $.extend({
                url:        location.href,
                count_url:  location.href,
                title:      document.title,
            }, _options);

        return 'http://twitter.com/share?'
            + 'text='      + encodeURIComponent(options.title)
            + '&url='      + encodeURIComponent(options.url)
            + '&counturl=' + encodeURIComponent(options.count_url);
    },

    // Mail.Ru
    mr: function(_options) {
        var options = $.extend({
                url:    location.href,
                title:  document.title,
                image:  '',
                text:   '',
            }, _options);

        return 'http://connect.mail.ru/share?'
            + 'url='          + encodeURIComponent(options.url)
            + '&title='       + encodeURIComponent(options.title)
            + '&description=' + encodeURIComponent(options.text)
            + '&imageurl='    + encodeURIComponent(options.image);
    },

    //Telegram https://telegram.me/share/url?url=urlOfTheWebsite&text=TextToAccompany
    tg: function(_options) {
        var options = $.extend({
                url:    location.href,
                title:  document.title,
                image:  '',
                text:   '',
            }, _options);

        return 'https://telegram.me/share/url?'
            + 'url='          + encodeURIComponent(options.url)
            + '&title='       + encodeURIComponent(options.title);
    },

    //WhatsApp whatsapp://send?text=http://webdevelopmentscripts.com
    wa: function(_options) {
        var options = $.extend({
                url:    location.href,
                title:  document.title,
                image:  '',
                text:   '',
            }, _options);

        return 'whatsapp://send?text=' + encodeURIComponent(options.url);
    },

    //Google https://plus.google.com/share?url={URL}
    gp: function(_options) {
        var options = $.extend({
                url:    location.href,
                title:  document.title,
                image:  '',
                text:   '',
            }, _options);

        return 'https://plus.google.com/share?url=' + encodeURIComponent(options.url);
    },

    // Открыть окно шаринга
    popup: function(url) {
      return window.open(url,'','toolbar=0,status=0,scrollbars=1,width=626,height=436');
    }
}

function addShareLinks(maplink) {
  realfile =  maplink.replace('html/info/','').replace('.html', '.php')
  reallink = 'http://localhost:8888/policemap/police/' + maplink.replace('html/info/','').replace('.html', '.php')
  console.log('reallink', reallink);

  $( "#share" ).load( "../../php/share.php", { link: reallink }, function(){
    // $('.social_share').bind('click', handler)
    var socs = []
    $( ".social_share" ).each(function( ind, el ) {
      socs.push($(el).data('type'));
    });

    console.log(socs);
    socs.forEach (function(el){
      var bts = $('#share').find('.social_share[data-type='+el+']');
      console.log(bts);
      var opts = {
        type: el,
        url:        reallink,  // какую ссылку шарим
        count_url:  reallink,  // для какой ссылки крутим счётчик
        title:      window.title, // заголовок шаринга
        image:        'http://localhost:8888/policemap/police/css/img/logo.png',             // картинка шаринга
        text:       getMetaValue('description')          // текст шаринга
      }
      link = Share[opts.type](opts)
      $(bts[0]).prop('href', link);
    })
  })
}
