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
            '<script src="js/static/static-map.js"></script>'
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