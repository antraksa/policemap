'use strict';
$(function() {
    Core.on('init', function(initArgs) {
        var sectors,
            areas,
            regions,
            streets,
            departments,
            persons,
            city,
            templates = initArgs.templates,
            locate = initArgs.location;

        var isMobile = window.location.href.indexOf('mobile.html') > 0;

        Core.on('load', function(args) {
            sectors = args.sectors;
            areas = args.areas;
            regions = args.regions;
            streets = args.streets;
            departments = args.departments;
            persons = args.persons;
            templates = args.persons;
            city = args.city;
        })

        $('#search-msg').addClass('shown').on('click', function() {
            $(this).removeClass('shown')
        });
        setTimeout(function() { $('#search-msg').removeClass('shown'); }, 10000)

        var $txtSearch = $('#txt-search')
            .on('focus', function() { this.select() })
            .on('change', function(e, args) {
                if (args) {
                    markCurrent()
                    var $row = args.$row,
                        dsind = Number($row.attr('data-dsindex')),
                        ds = args.data.filter(function(d) {
                            return d.dsindex == dsind
                        })[0],
                        ind = $row.index(),
                        o = ds.data[ind].item;
                    if (dsind == 2) { //streets
                        if (o.isYandex) {
                            selectInPoint(o.coords);
                            markCurrent(o.name, o.coords)
                        } else {
                            o.sector.select(true)
                            API.resolveAddr(city, o.name, function(data) {
                                var d = data[0];
                                if (d) markCurrent(d.name, d.coords)
                            })
                        }
                    } else if (dsind == 1) { //region
                        o.select(true)
                    } else if (dsind == 3) { //sector
                        (o.location || o).select(true)
                    } 
                    State.addState({query : args.query})
                }
            })

        function markCurrent(addr, coords) {
            Core.trigger('map-click.resolved', { addr: addr, coords : coords });
        }

        function parseQuery(q) {
            var pq = q.toLowerCase().split(/[\s,]+/);
            // var numbers = pq.map(function(s) {
            //     return parseInt(s)
            // }) //.filter(function(s) { return !!s})
            // pq.forEach(function(p, i) {
            //     if (numbers[i]) pq[i] = (numbers[i]);
            // })
            //return pq.concat(numbers)
            return pq;
        }
        $('#btn-locate').on('click', function() {
            locate(function(p) {
                searchPoint(p)
            })
        })
        Core.on('map.click', function(args) {
            //resolvePoint(args.coords)
        })
        Core.on('map.search', function(args) {
            var q = args.query;
            console.log('map.search', q);
            autocomplete.search(q);
        })

        $('#btn-search').on('click', function() {
            autocomplete.search();
        }) 
        $('#btn-search-empty').on('click', function() {
            autocomplete.empty();
        })

        function searchPoint(pos) {
            console.log('searchPoint', pos)
            if (!map) return;
            for (var i = 0; i < regions.length; i++) {
                var r = regions[i];
                if (r.pol && r.contains(pos)) {
                    r.select(true)
                    resolvePoint(pos, r)
                    return;
                }
            }
        }

        function resolvePoint(p, parentRegion) {
            markCurrent()
            API.resolvePoint(city, p, function(addr) {
                if (!addr[0]) return;
                var name = addr[0].name;
                //if (cp) cp.properties.set('iconCaption', name).set('hintContent', name);
                var pq = parseQuery(name);
                markCurrent(name);
                var strres = search(streets, pq, function(o) {
                    if (o) return o.name
                })
                for (var i = 0; i < strres.length; i++) {
                    var sec = strres[i].item.sector;
                    if (parentRegion.contains(sec.coords())) {
                        sec.select(true);
                    }
                }
            })
        }

        function selectInPoint(p) {
            console.log('selectInPoint', p)
            // for (var i = 0; i < sectors.length; i++) {
            //     var sec = sectors[i];
            //     if (sec.region.contains(p)) {
            //         sec.select(true);
            //         return;
            //     }
            // }
            for (var i = 0; i < regions.length; i++) {
                var r = regions[i];
                if (r.contains(p)) {
                    r.select(true);
                    break;
                }
            }
        }

        function search(arr, ws, fname) {
            var res = []
            arr.forEach(function(o) {
                var matches = [],
                    rate = 0;
                var s = fname(o);
                if (!s) return;
                var pq = parseQuery(s.toLowerCase());

                ws.forEach(function(w) {
                    var ind = pq.indexOf(w);
                    if (ind >= 0) {
                        matches.push({ w: w, ind: ind })
                        rate+=2
                    }
                    if (ind == 0) rate+=2;
                    pq.forEach(function(q) {
                        if (q.indexOf(w)>=0) rate+=1;
                        if (w==q) rate+=1;
                    })
                })
                if (matches.length > 0) {
                    res.push({ name: s, matches: matches, rate: rate, item: o })
                }
            })
            res.sort(function(a, b) {
                return b.rate - a.rate
            })
            return res.slice(0, 5);
        }

        //for TEST search
        //var res = search([ 'река Фонтанки 134',  'река Фонтанки 33', 'река Фонтанки 15', 'река Фонтанки 155'], parseQuery('Фонтанки 15'), function(o) { return o})
        //console.log('search!', res)
        var autocomplete = $txtSearch.autocomplete($('#search-popup'), templates.autocomplete, function(q, success) {
            if (!q) return;
            var pq = parseQuery(q);


            var regres = search(regions, pq, function(o) {
                return o.region.name
            })
            var depgres = search(departments, pq, function(o) {
                return o.department.name
            })

            var otdres = regres.splice(0, 3).concat(depgres.splice(0, 3))

            var secres = search(sectors, pq, function(o) {
                return o.sector.name
            })
            var strres = search(streets, pq, function(o) {
                if (o) return o.name
            })
            var perres = search(persons, pq, function(o) {
                if (o) return o.name
            })

            var peapledres = perres.splice(0, 3).concat(secres.splice(0, 3))
            var res = [
                { title: 'Отделения', dsindex: 1, data: otdres },
                { title: 'Адрес', dsindex:  2, type: 'addrs', data: strres },
                { title: 'Люди', dsindex: 3, type: 'persons', data: peapledres },
            ]

            console.log('res', res)
            success(res)
            
            //console.log(res)
            return API.resolveAddr(city, q, function(data) {
                console.log('resolve yandex', q, data)
                var d = data[0];
                if (d) {
                    d.isYandex = true;
                    strres.push({ name: d.name, item: d})
                    success(res)
                }
            })
        }, { preventKeyPress : isMobile }).data('autocomplete')
    })
})
