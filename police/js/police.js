'use strict';
(function() {
    $(function() {
        Core.init({ completed: ready })
    })

    function ready() {
        var cities = [
            { name: 'Санкт-Петербург', coords: [59.939440, 30.302135] },
            { name: 'Москва', coords: [55.725045, 37.646961] },
            { name: 'Воронеж', coords: [51.694273, 39.335955] },
        ];
        var map, city = cities[0];
        var regions, sectors, areas, templates = Common.getTemplates(),
            initArgs, streets, departments, regionsDict;
        var mapobjects = {}
        var getMapObjects = function() {
            return mapobjects[this.id]
        }
        var layers = [
            { id: 'areas', name: 'Муниципальные округа', map: getMapObjects, checked: false },
            { id: 'departments', name: 'ОУМВД', map: getMapObjects, checked: true },
            { id: 'regions', name: 'ОП', map: getMapObjects, checked: true },
            // {id : 'regionPoints',  name : 'Адреса отделений',  map :  getMapObjects, checked : true}, 
            { id: 'sectors', name: 'Участковые ', map: getMapObjects, checked: false }
        ]
        $('#layers').html(Mustache.render(templates.layers, layers)).find('li').on('click', function() {
            var index = $(this).toggleClass('checked').index();
            var layer = layers[index];
            layer.checked = $(this).hasClass('checked')
            var m = layer.map();
            if (m) m.forEach(function(o) { o.show(layer.checked) })
        })
        $('#city-popup').html(Mustache.render(templates.cities, cities)).find('li').on('click', function() {
            var c = cities[$(this).index()]
            $('#btn-city-toggle').html(c.name)
            city = c;
            if (map) map.setCenter(c.coords)
        }).eq(0).trigger('click')
        $('#btn-city-toggle').popup({ hideOnClick: true })
        var $dashPanels = $('.dash-panel');
        $('.dash-toggle a').on('click', function() {
            $(this).addClass('selected').siblings().removeClass('selected');
            $dashPanels.eq($(this).index()).addClass('shown').siblings().removeClass('shown')
        })
        loading(true)
        API.getAndWrapAll(function(args) {
            args.templates = templates;
            Core.trigger('init', args)
            sectors = args.sectors;
            areas = args.areas;
            regions = args.regions;
            streets = args.streets;
            departments = args.departments;
            regionsDict = args.regionsDict;
            if (window.ymaps) {
                ymaps.ready(createMap);
            } else {
                console.warn('Yandex !!')
                Core.trigger('map-ready', {})
                renderMainList();
                loading(false)
            }
            initArgs = args;
        })

        function createMap(state) {
            map = new ymaps.Map('map', { controls: ["zoomControl"], zoom: 12, center: [59.948814, 30.309640] });
            Core.trigger('map-init', { map: map })
            renderMainList();
            addObjects('areas');
            addObjects('regions');
            addObjects('sectors');
            addObjects('departments');
            prepare()
            validateLayers()
            loading(false)
            Core.trigger('map-ready', { map: map })
            map.events.add('click', function(e) {
                Core.trigger('map.click', { coords: e.get('coords') })
            });
        }
        var $mlist = $('#main-list'), isViewDepartments = false, isRateSort = false;
        $('#opt-toggle-view').on('click', function() {
            isViewDepartments =!isViewDepartments;
            renderMainList();
        })
        $('#opt-toggle-sort').on('click', function() {
            isRateSort =!isRateSort;
            renderMainList();
        }) 
        function renderMainList() {
            regions.forEach(function(r) { r.calcRate() })
            var $rate;
            if (isViewDepartments)
                renderDepartments()
            else 
                renderRegions()
            $mlist.find('.item').on('click', function() {
                markCurrent()
                var r = regionsDict[$(this).attr('data-reg-id')];
                r.select(true)
                if ($rate) { Core.trigger('region-anketa.select', { region: r }) }
                $rate = null;
            }).find('b').on('click', function() { $rate = $(this); })
        }

        function renderRegions() {
            sortRegions(regions);   
            $mlist.html(Mustache.render(templates.regionsList, regions));
        }
        function sortRegions(_regions) {
            _regions.sort(function(a, b) { 
                var ar = a.rate ? a.rate.val : null, br = b.rate ? b.rate.val : null;
                if (isRateSort) {
                    if (ar && br && ar !=br) return br - ar;
                    if (ar && !br) return -1;
                    if (br && !ar) return 1;
                }
                var a = a.region.number, b = b.region.number;
                if (a == b) return 0;
                var an = Number(a), bn = Number(b);
                if (an && bn) return (an - bn);
                if (an) return -1;
                if (bn) return 1;
            })
        }
        function renderDepartments() {
            departments.forEach(function(d) {
                sortRegions(d.regions);   
            })
            $mlist.html(Mustache.render(templates.departmensList, departments));
            $mlist.find('.head-item').on('click', function() {
                markCurrent()
                var d = departments[$(this).attr('data-dep-id')];
                d.select(true)
            })
        }
        Core.on('region.select', function(args) {
            var $sel = $mlist.find('[data-reg-id="{0}"]'.format(args.region.number()))
            $sel.addClass('selected').siblings().removeClass('selected')
            if ($sel[0]) $sel.scrollTo()
        })

        function prepare() {
            regions.forEach(function(r) {
                var rdata = r.region;
                r.sectors = []
                sectors.forEach(function(s) {
                    if (!s.coords) return
                    var contains = r.pol.geometry.contains(s.coords)
                    if (contains) {
                        s.regionId = r.region.number;
                        s.region = r;
                    }
                })
                areas.forEach(function(a) {
                    if (rdata.point && a.pol.geometry.contains(rdata.point.coords)) {
                        r.area = a;
                    }
                })
            })
        }
        var selected;
        Core.on('region.updated', function(args) {
            console.log('region.updated', args)
            if (args.region) updateRegion(args.region)
            renderMainList()
        })
        Core.on('history.changed', function(args) {
            console.log('history changed', args)
            renderMainList()
            regions.forEach(function(r) { r.draw() })
        })

        function updateRegion(reg) {
            renderMainList()
            if (!reg) reg = selected;
            if (reg) {
                reg.render()
                reg.draw()
            }
        }

        function addObjects(oname) {
            mapobjects[oname] = []
            initArgs[oname].forEach(function(o, i) {
                o.draw();
                mapobjects[oname].push(o)
            })
        }

        function validateLayers() {
            layers.forEach(function(l) {
                var m = l.map();
                m.forEach(function(o) {
                    if (!l.checked) o.show(false)
                })
            })
        }
        Core.on('map.click', function(args) {
            resolvePoint(args.coords)
        })
        var $txtSearch = $('#txt-search')
            .on('focus', function() { this.select() })
            .on('change', function(e, args) {
                if (args) {
                    markCurrent()
                    var $row = args.$row,
                        dsind = Number($row.attr('data-dsindex')),
                        ds = args.data[dsind],
                        ind = $row.index(),
                        o = ds.data[ind].item;
                    //console.log('autocomplete', dsind, o)
                    if (dsind == 0) { //yandex addr
                        map.setCenter(o.coords)
                        markCurrent(o.coords, o.name)
                    } else if (dsind == 2) { //sector streets
                        o.sector.select(true)
                        API.resolveAddr(city, o.name, function(data) {
                            var d = data[0];
                            if (d) markCurrent(d.coords, d.name)
                        })
                    } else if (dsind == 1) { //region
                        o.select(true)
                    } else if (dsind == 3) { //sector
                        o.select(true)
                    }
                }
            })

        function searchPoint(pos) {
            console.log('searchPoint', pos)
            if (!map) return;
            for (var i = 0; i < regions.length; i++) {
                var r = regions[i];
                if (r.pol.geometry.contains(pos)) {
                    r.render()
                    return;
                }
            }
        }
        //Core.on('map-init', function() {
        $('#btn-locate').on('click', function() {
                loading(true)
                navigator.geolocation.getCurrentPosition(function(location) {
                    var p = [location.coords.latitude, location.coords.longitude];
                    searchPoint(p)
                    resolvePoint(p)
                    loading(false)
                }, function() {
                    loading(false)
                })
            })
            //})
        var cp;

        function markCurrent(p, addr) {
            if (cp) map.geoObjects.remove(cp);
            if (!p) return;
            cp = new ymaps.Placemark(p, {
                iconCaption: addr || '...',
                hintContent: addr || '...'
            }, {
                preset: 'islands#redCircleDotIconWithCaption', //'islands#stretchyIcon',
                iconColor: '#f00'
            });
            map.geoObjects.add(cp);
        }

        function resolvePoint(p) {
            markCurrent(p)
            map.setCenter(p)
            API.resolvePoint(city, p, function(addr) {
                if (!addr[0]) return;
                var name = addr[0].name;
                cp.properties.set('iconCaption', name).set('hintContent', name);
                var pq = parseQuery(name);
                var strres = search(streets, pq, function(o) {
                        if (o) return o.name
                    })
                    // console.log(addr[0].name, strres[0])
                if (strres[0])
                    strres[0].item.sector.select()
            })
        }

        function search(arr, ws, fname) {
            var res = []
            arr.forEach(function(o) {
                var matches = [],
                    rate = 0;
                var s = fname(o);
                if (!s) return;
                ws.forEach(function(w) {
                    var ind = s.indexOf(w);
                    if (ind >= 0) matches.push({ w: w, ind: ind })
                    if (ind == 0) rate++;
                })
                if (matches.length > 0) {
                    rate += matches.length;
                    res.push({ name: s, matches: matches, rate: rate, item: o })
                }
            })
            res.sort(function(a, b) {
                return b.rate - a.rate
            })
            return res.slice(0, 5);
        }
        $txtSearch.autocomplete($('#search-popup'), templates.autocomplete, function(q, success) {
            if (!q) return;
            var pq = parseQuery(q);
            var regres = search(regions, pq, function(o) {
                return o.region.name.toLowerCase()
            })
            var secres = search(sectors, pq, function(o) {
                return o.sector.name
            })
            var strres = search(streets, pq, function(o) {
                if (o) return o.name
            })
            var yres = []
            var res = [
                { title: 'Карта', type : 'map', dsindex: 0, data: yres },
                { title: 'Отделения', type : 'regions', dsindex: 1, data: regres },
                { title: 'Адрес', type : 'addrs', dsindex: 2, data: strres },
                { title: 'Участковые', type : 'sectors', dsindex: 3, data: secres },
            ]
            success(res)
            return API.resolveAddr(city, q, function(data) {
                data.forEach(function(d) { yres.push({ name: d.name, item: d }) })
                success(res)
            })
        })

        function parseQuery(q) {
            var pq = q.toLowerCase().split(/[\s,]+/);
            var numbers = pq.map(function(s) {
                    return parseInt(s)
                }) //.filter(function(s) { return !!s})
            pq.forEach(function(p, i) {
                    if (numbers[i]) pq[i] = (numbers[i]);
                })
                //return pq.concat(numbers)
            return pq;
        }

        function yresolve(q, success) {
            API.resolveAddr(city, q, function(addrs) {
                success(addrs)
            })
        }

        function loading(val) {
            $('#map').toggleClass('loading', val)
        }
        var mtimeout, $mess = $('#mess');
        Core.on('mess', function(args) {
            $mess.html(args.mess).addClass('shown').toggleClass('warn', !!args.warn).toggleClass('error', !!args.error);
            clearTimeout(mtimeout)
            mtimeout = setTimeout(function() { $mess.removeClass('shown') }, 3000)
        })
        window.onerror = function() {
                Core.trigger('mess', { mess: 'Все совсем плохо. Ошибка в скриптах', error: true })
            }
            //console.log(getcolors())
    };
})()
