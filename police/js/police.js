'use strict';
(function() {
    $(function() {
        setTimeout(function() {
            Core.init({ completed: ready })
        }, 0)
    })

    function ready() {
        var cities = API.getCities();
        var map, city;
        var regions, sectors, areas, persons, templates = Common.getTemplates(),
            initArgs, streets, departments, regionsDict;
        var state = State.getState()
        var mapobjects = {}
        var getMapObjects = function() {
            return mapobjects[this.id]
        }
        var layers = [
            { id: 'areas', name: 'Административные районы', map: getMapObjects, checked: false },
            { id: 'departments', name: 'Управления полиции', map: getMapObjects, checked: true },
            { id: 'regions', name: 'Отделения полиции', map: getMapObjects, checked: true },
            { id: 'sectors', name: 'Участковые ', map: getMapObjects, checked: false }
        ]
        function initLayers() {
            if (localStorage['checkedLayers']) {
                var lastChecked = JSON.parse(localStorage['checkedLayers']);
                if (lastChecked) {
                    layers.forEach(function(l,i) {
                        l.checked =  !!lastChecked[i];
                    })
                }
            }
            $('#layers').html(Mustache.render(templates.layers, layers)).find('li').on('click', function() {
                var index = $(this).toggleClass('checked').index();
                var layer = layers[index];
                layer.checked = $(this).hasClass('checked')
                var m = layer.map();
                if (m) m.forEach(function(o) { o.show(layer.checked) })
                localStorage['checkedLayers'] = JSON.stringify(layers.map(function(l) { return l.checked; }));
            })
        }
        initLayers()

        loading(true)

        Core.trigger('init', { templates: templates, cities: cities, location: location })

        function load() {
            $('#btn-city-toggle').html(city.name + '<i class="icon-angle-down"></i>');
            $('#pane-details').addClass('collapsed')
            Core.trigger('map.set-center', {coords : city.coords, zoom : city.z});
            API.getAndWrapAll(city.code, function(args) {
                args.city = city;
                sectors = args.sectors;
                areas = args.areas;
                regions = args.regions;
                streets = args.streets;
                departments = args.departments;
                regionsDict = args.regionsDict;
                persons = args.persons;
                initArgs = args;
                args.sortRegions = sortRegions;
                args.templates = templates;
                args.map = map;
                console.log('load', args)
                Core.trigger('load', args)
                renderMainList();
                loadMap()
            }).fail(function() {
                console.log()
            })
        }
        var $cities = $('#city-popup').html(Mustache.render(templates.cities, cities)).find('li').on('click', function() {
            changeCity($(this).index())
        })

        function changeCity(index, nostate) {
            if (city == cities[index]) return;
            city = cities[index];
            if (!nostate)
                State.addState({ city: index })
            localStorage['currentCityCode'] = index;
            load();
        }
        $('#btn-city-toggle').popup({ hideOnClick: true })
        var $dashPanels = $('.dash-panel');
        var $dashToggles = $('.dash-toggle a').on('click', function() {
            $(this).addClass('selected').siblings().removeClass('selected');
            $dashPanels.eq($dashToggles.index(this)).addClass('shown').siblings().removeClass('shown')
        })

        function loadMap() {
            Core.trigger('details.clear', {})
            if (window.ymaps) {
                map.geoObjects.removeAll()
                addObjects('areas');
                addObjects('regions');
                addObjects('sectors', true);
                addObjects('departments');
                validateLayers()
                //console.log('mapobjects', mapobjects)
            } else {
                map.renderStaticHome()
            }
            loading(false);
            Core.trigger('map-ready', initArgs);
        }

        createMap()

        function createMap() {
            if (window.ymaps) {
                ymaps.ready(function() {
                    map = new ymaps.Map('map', { controls: ["zoomControl"], zoom: 12, center: [59.948814, 30.309640] }, { suppressMapOpenBlock: true });
                    map.events.add('click', function(e) {
                        //Core.trigger('map.click', { coords: e.get('coords') })
                    });
                    map.events.add('boundschange', function(e) {
                        Core.trigger('map.boundschange', {})
                    })
                    Core.trigger('map-init', { map: map })
                });
            } else {
                map = createStatic(true);
                setTimeout(function() {
                    Core.trigger('map-init', { map: map })
                }, 0)
            }
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

        function clearSectorInline() {
            $('#sector-inline').remove();
        }

        Core.on('region.select', function(args) {
            var $sel = $mlist.find('[data-reg-id="{0}"]'.format(args.region.number()))
            $sel.addClass('selected').siblings().removeClass('selected')
            if ($sel[0]) $sel.scrollTo();
            clearSectorInline();
        })

        Core.on('region.showSector', function(args) {
            clearSectorInline();
            var $reg = $mlist.find('[data-reg-id="{0}"]'.format(args.region.number())).removeClass('selected');
            var $sec = $(Mustache.render(templates.sectorInline, args)).on('click', function(e) {
                e.stopPropagation();
                args.sector.render(true);
            });
            $reg.append($sec);


            console.log('showSector', args)
        })

        Core.on('department.select', function(args) {
            if (args.nofocus) return;
            var $sel = $mlist.find('[data-dep-id="{0}"]'.format(args.department.number()))
            $sel.addClass('selected').siblings().removeClass('selected')
            if ($sel[0]) $sel.scrollTo();
            clearSectorInline()
        })
        var selected;
        Core.on('region.updated', function(args) {
            console.log('region.updated', args)
            if (args.region) updateRegion(args.region)
            renderMainList()
        })
        Core.on('history.changed', function(args) {
            //console.log('history changed', args)
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

        function addObjects(oname, clusterize) {
            mapobjects[oname] = []
            if (clusterize) {
                var isSectorsVisible = layers[3].checked;
                var show = function(val) {
                    var sheet = document.createElement('style')
                    sheet.innerHTML = ".clusterIcon, .y-icon-sector {display:{0}}".format(val ? 'block' : 'none' );
                    document.body.appendChild(sheet);
                }
                show(isSectorsVisible);
                var cluster = ObjectWrapper.clusterize(initArgs[oname], isSectorsVisible);
                mapobjects[oname].push({
                    cluster: cluster,
                    show: function() {
                        var isSectorsVisible = layers[3].checked;
                        show(isSectorsVisible);
                        cluster.options.set('hasBalloon', isSectorsVisible)
                    }
                })

            } else {
                initArgs[oname].forEach(function(o, i) {
                    o.draw();
                    mapobjects[oname].push(o)
                })
            }
        }
        Core.on('map.boundschange', function() {
            var sectorsCluster = mapobjects['sectors'];
            if (!sectorsCluster || !sectorsCluster[0]) return;
            //sectorsCluster[0].show()
            //setTimeout(sectorsCluster[0].show, 100)
        })


        function validateLayers() {
            layers.forEach(function(l) {
                var m = l.map();
                if (m) {
                    m.forEach(function(o) {
                        if (!l.checked) o.show(false)
                    })
                }
            })
        }
        Core.on('map-init', function() {
            if (state.city !== undefined) {
                changeCity(state.city, true)
                return;
            }
            var storedCity = localStorage['currentCityCode'];
            if (storedCity) {
                changeCity(storedCity, true)
                return;
            }
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
                changeCity(ci)
            }, function() {
                changeCity(0)
            })
        })

        function location(success, error) {
            loading(true);
            Core.trigger('location.start', {})
            navigator.geolocation.getCurrentPosition(function(location) {
                var p = [location.coords.latitude, location.coords.longitude];
                // var p =  [70.942830699999995, 80.3475806];
                success(p);
                loading(false)
            }, function() {
                loading(false);
                Core.trigger('mess', { mess: 'Не удалось определить координаты.', warn: true })
                if (error) error()
            })
        }
        Core.on('map.set-center', function(args) {
            console.log('center', args)
            if (!args.coords) {
                console.log('wrong coords', args)
                return;
            }
            map.setCenter(args.coords, args.zoom);
        })

        function markCurrent(addr) {
            Core.trigger('map-click.resolved', { addr: addr });
        }

        function checkState() {
            if (!state) return;
            console.log('state check', state)
            if (state.rowId >= 0 && state.type) {
                console.warn('restore', state)
                if (state.type == 'department') {
                    var dep = departments[state.rowId];
                    if (dep) dep.select(true, true)
                } else if (state.type == 'region') {
                    var reg = regions[state.rowId];
                    if (reg) reg.select(true, true)
                }
            }
            if (state.query) {
                Core.trigger('map.search', { query : state.query });
                //delete state.query;
                //State.addState(state)

            }
        }
        Core.on('map-ready', function() {
            setTimeout(checkState, 1000)
        })
        Core.on('popstate', function(args) {
            state = args.state;
            checkState()
            $('.pane-toggle').click()
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
        $('#legend-toggle').on('click', function() {
            $('body').toggleClass('legend-collapsed');
            localStorage['legend-collapsed'] = $('body').hasClass('legend-collapsed')
            resizeMap();
        })
        if (localStorage['legend-collapsed']) {
            $('body').addClass('legend-collapsed')
        }
        $('.pane-toggle').on('click', function() {
            $(this).parents('.pane').toggleClass('collapsed')
            resizeMap();
        })

        $('#mobile-menu').on('click', function() {
            $('body').toggleClass('mobile-menu-expanded');
            $('.donate, .mail-to').toggleClass('append')
            $('#main-info-list').append($('.donate, .mail-to'));

        })

        Core.on('map.resized', resizeMap);

        function resizeMap() {
            if (map) {
                setTimeout(function() { map.container.fitToViewport() } , 700)
            }
        }
        //console.log(getcolors())
    };
})()
