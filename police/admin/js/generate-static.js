$(function() {
    Core.on('load', function(args) {
        var departments = args.departments;
        args.regions.forEach(function(r) { r.calcRate() })
        departments.forEach(function(d) {
            args.sortRegions(d.regions);
        })
        var scripts =  [
            '<script src="libs/jquery-2.1.3.min.js"></script>',
            '<script src="js/static/static.js"></script>',
            '<script src="js/static/static-map.js"></script>',
            '<script src="js/static/metrika.js"></script>',
            '<noscript><div><img src="https://mc.yandex.ru/watch/46355028" style="position:absolute; left:-9999px;" alt="" /></div></noscript>',
            '<script async src="https://www.googletagmanager.com/gtag/js?id=UA-108418867-1"></script>',
            '<script src="js/static/analytics.js"></script>'
        ];

        [].slice.call(document.getElementsByTagName('script')).forEach(function(scr) {
            if (scr.src.indexOf('main.js')>=0) { //dist version
               scripts = ['<script src="static-main.js"></script>',]
            }
        });

        var data = {
        	departments : departments,
        	city : args.city,
            scripts : scripts
        }
        var res = Mustache.render(args.templates.staticList, data);
        API.save('static-home', args.city.code, res, null, null, true);

    })
})
