$(function() {
    Core.on('load', function(args) {
        var departments = args.departments;
        args.regions.forEach(function(r) { r.calcRate() })
        departments.forEach(function(d) {
            args.sortRegions(d.regions);
        })
        var data = {
        	departments : departments,
        	city : args.city,
            scripts : [
                '<script src="libs/jquery-2.1.3.min.js"></script>',
                '<script src="js/static.js"></script>'
            ]
        }
        var res = Mustache.render(args.templates.staticList, data);
        API.save('static-home', args.city.code, res, null, null, true);
       // console.log(res)
    })
})