'use strict';
(function() {
    $(function() {
        Core.init({ completed: ready })
    })

    function ready() {
        var cities = [
            { name: 'Санкт-Петербург', coords: [59.939440, 30.302135], code: 'spb' },
            { name: 'Москва', coords: [55.725045, 37.646961], code: 'msc' },
            { name: 'Воронеж', coords: [51.694273, 39.335955], code: 'vo' },
        ];
        var map, city = cities[0];
        var regions, sectors, areas, persons, templates = Common.getTemplates(),
            initArgs, streets, departments, regionsDict;
        var state = State.getState()
        var mapobjects = {}
        var getMapObjects = function() {
            return mapobjects[this.id]
        }
        var layers = [
            { id: 'areas', name: 'Муниципальные округа', map: getMapObjects, checked: false },
            { id: 'departments', name: 'ОУМВД', map: getMapObjects, checked: true },
            { id: 'regions', name: 'ОП', map: getMapObjects, checked: true },
            { id: 'sectors', name: 'Участковые ', map: getMapObjects, checked: false }
        ]
        $('#layers').html(Mustache.render(templates.layers, layers)).find('li').on('click', function() {
            var index = $(this).toggleClass('checked').index();
            var layer = layers[index];
            layer.checked = $(this).hasClass('checked')
            var m = layer.map();
            if (m) m.forEach(function(o) { o.show(layer.checked) })
        })
        var $cities = $('#city-popup').html(Mustache.render(templates.cities, cities)).find('li').on('click', function() {
            var c = cities[$(this).index()]
            $('#btn-city-toggle').html(c.name)
            city = c;
            if (window.ymaps) {
                map.setCenter(c.coords)
            } else {
                renderStaticHome(c.coords)
            }
        })
        $('#btn-city-toggle').popup({ hideOnClick: true })
        var $dashPanels = $('.dash-panel');
        var $dashToggles = $('.dash-toggle a').on('click', function() {
            $(this).addClass('selected').siblings().removeClass('selected');
            $dashPanels.eq($dashToggles.index(this)).addClass('shown').siblings().removeClass('shown')
        })
        loading(true)
        API.getAndWrapAll(city.code, function(args) {
            args.templates = templates;
            args.getCurrentCity = function() {
                return city
            }
            Core.trigger('init', args)
            sectors = args.sectors;
            areas = args.areas;
            regions = args.regions;
            streets = args.streets;
            departments = args.departments;
            regionsDict = args.regionsDict;
            persons = args.persons;
            initArgs = args;
            if (window.ymaps) {
                ymaps.ready(createMap);
            } else {
                map = createStatic();
                initArgs.map = map;
                Core.trigger('map-init', initArgs)
                Core.trigger('map-ready', initArgs)
                renderMainList();
                loading(false)
            }
        })

        function createMap(state) {
            map = new ymaps.Map('map', { controls: ["zoomControl"], zoom: 12, center: [59.948814, 30.309640] }, { suppressMapOpenBlock: true });
            initArgs.map = map;
            Core.trigger('map-init', initArgs)
            renderMainList();
            addObjects('areas');
            addObjects('regions');
            addObjects('sectors');
            addObjects('departments');
            validateLayers()
            loading(false)
            map.events.add('click', function(e) {
                Core.trigger('map.click', { coords: e.get('coords') })
            });
            Core.trigger('map-ready', initArgs)
        }
        var $mlist = $('#main-list'),
            isViewDepartments = true,
            isRateSort = false;
        $('#opt-toggle-view').on('click', function() {
            isViewDepartments = !isViewDepartments;
            renderMainList();
        })
        $('#opt-toggle-sort').on('click', function() {
            isRateSort = !isRateSort;
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
                var ar = a.rate ? a.rate.val : null,
                    br = b.rate ? b.rate.val : null;
                if (isRateSort) {
                    if (ar && br && ar != br) return br - ar;
                    if (ar && !br) return -1;
                    if (br && !ar) return 1;
                }
                var a = a.region.number,
                    b = b.region.number;
                if (a == b) return 0;
                var an = Number(a),
                    bn = Number(b);
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
        Core.on('department.select', function(args) {
            if (args.nofocus) return;
            var $sel = $mlist.find('[data-dep-id="{0}"]'.format(args.department.number()))
            $sel.addClass('selected').siblings().removeClass('selected')
            if ($sel[0]) $sel.scrollTo()
        })
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
        Core.on('map-ready', function() {
            location(function(p) {
                var nearest;
                cities.forEach(function(c) {
                    var cp = c.coords;
                    c.d = Math.sqrt((cp[0] - p[0]) * (cp[0] - p[0]) + (cp[1] - p[1]) * (cp[1] - p[1]))
                    if (!nearest || (nearest.d > c.d)) {
                        nearest = c;
                    }
                })
                var ci = cities.indexOf(nearest);
                $cities.eq(ci).trigger('click')
            }, function() {
                $cities.eq(0).trigger('click')
            })
        })

        function location(success, error) {
            loading(true)
            navigator.geolocation.getCurrentPosition(function(location) {
                var p = [location.coords.latitude, location.coords.longitude];
                success(p);
                loading(false)
            }, function() {
                loading(false);
                Core.trigger('mess', { mess: 'Не удалось определить координаты.', warn: true })
                if (error) error()
            })
        }
        Core.on('map.set-center', function() {})

        function markCurrent(addr) {
            Core.trigger('map-click.resolved', { addr: addr });
        }

        function checkState() {
            if (state && state.rowId >= 0 && state.type) {
                console.warn('restore', state)
                if (state.type == 'department') {
                    departments[state.rowId].select(true, true)
                } else if (state.type == 'region') {
                    regions[state.rowId].select(true, true)
                }
            }
        }
        Core.on('map-ready', function() {
            setTimeout(function() { checkState() }, 1000)
        })
        Core.on('popstate', function(args) {
            state = args.state;
            checkState()
        })

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
// if (window.ymaps) {
//     if (cp) map.geoObjects.remove(cp);
//     if (!p) return;
//     map.setCenter(p)
//     cp = new ymaps.Placemark(p, {
//         iconCaption: addr || '...',
//         hintContent: addr || '...'
//     }, {
//         preset: 'islands#redCircleDotIconWithCaption',
//         iconColor: '#f00'
//     });
//     clearTimeout(curTimeout)
//     curTimeout = setTimeout(function() {
//         if (cp) map.geoObjects.remove(cp);
//     }, 3000)
//     map.geoObjects.add(cp);
// } else if (p) {
//     map.markPoint({ coords: p, preset: 'flag' })
// }
