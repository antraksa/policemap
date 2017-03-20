'use strict';
(function() {
    $(function() { 
        Core.init({completed :ready }) 
    })
    function ready() {
    	var map, city = 'Санкт-Петербург'; 
        var cities = [ 
            {name : 'Санкт-Петербург', coords : [59.939440, 30.302135] }, 
            {name : 'Москва', coords : [55.725045, 37.646961] }, 
            {name : 'Воронеж', coords : [51.694273 , 39.335955] }, 
        ];
        var regions, sectors, areas, templates = Common.getTemplates(), initArgs, streets, departments, regionsDict; 
        var mapobjects = {}
        var getMapObjects  = function() { return mapobjects[this.id]} 
    	var layers = [
            {id : 'areas',  name : 'Муниципальные округа',  map :  getMapObjects, checked : false}, 
    		{id : 'departments',  name : 'ОУМВД',  map :  getMapObjects, checked : true}, 
            {id : 'regions',  name : 'ОП',  map :  getMapObjects, checked : true}, 
    		// {id : 'regionPoints',  name : 'Адреса отделений',  map :  getMapObjects, checked : true}, 
    		{id : 'sectors', name : 'Участковые ', map : getMapObjects, checked : false} 
    	] 
       	$('#layers').html(Mustache.render(templates.layers, layers)).find('li').on('click', function() {
       		var index = $(this).toggleClass('checked').index();
    		var layer = layers[index]; 
    		layer.checked =  $(this).hasClass('checked')
    		var m = layer.map();
    		if (m) m.forEach(function(o) { o.show (layer.checked) }) 
    	})
        $('#city-popup').html(Mustache.render(templates.cities, cities)).find('li').on('click', function() {
            var c = cities[$(this).index()]
            $('#btn-city-toggle').html(c.name)
            if (map) map.setCenter(c.coords)
        }).eq(0).trigger('click')
        $('#btn-city-toggle').popup({hideOnClick : true})

        var $dashPanels = $('.dash-content').children();
        $('.dash-toggle a').on('click', function() {
            $(this).addClass('selected').siblings().removeClass('selected');
            $dashPanels.eq($(this).index()).addClass('shown').siblings().removeClass('shown')
        })
       

        loading(true)

        API.all(function(args) {
            args.templates = templates;
            Core.trigger('init', args)

            sectors = args.sectors;
            areas = args.areas;
            regions = args.regions;
            streets = args.streets;
            departments = args.departments;
            regionsDict = args.regionsDict;

            regions.forEach(function(r) {r.calcRate() })
            
            if (window.ymaps) 
                ymaps.ready(createMap);
            else {
                console.warn('Yandex !!')
                renderRegions();
                loading(false)
            }
            initArgs = args;

        })
        function createMap (state) {
            map = new ymaps.Map('map', { controls :  ["zoomControl"], zoom : 12, center : [59.948814, 30.309640] });
            Core.trigger('map-init', {map : map, mapobjects : mapobjects})
            
            addObjects('areas');
            addObjects('regions');
            addObjects('sectors');
            addObjects('departments');
            
            console.log(mapobjects)
            prepare()
            renderRegions();

            validateLayers()
            loading(false)
        }
        var $deps = $('#departments-list');
        function renderRegions() {
            var $rate;
            $deps.html(Mustache.render(templates.departmensList, departments));
            $deps.find('.head-item').on('click', function() {
                var d = departments[$(this).attr('data-id')];
                d.select()
                console.log('dep', d)
            })
            $deps.find('.item').on('click', function() {
                var r = regionsDict[$(this).attr('data-id')];
                r.select()
                if ($rate) {
                    Core.trigger('region-anketa.select', {region : r})
                }
                $rate = null;
            }).find('b').on('click', function() {$rate = $(this); }) 
        }
        Core.on('region.select', function(args) {
            var $sel = $deps.find('[data-id="{0}"]'.format(args.region.number()))
            $sel.addClass('selected').siblings().removeClass('selected')
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
            updateRegion(args.region) 
            renderRegions()
        })
        Core.on('history.changed', function(args) {
            console.log('history changed', args)
            regions.forEach(function(r) {
                r.calcRate() 
                r.draw()
            })
            renderRegions() 
        })
        function updateRegion(reg) {
            if (!reg) reg = selected;
            if (reg) {
                reg.calcRate()
                reg.render()
                reg.draw()
                console.log('draw reg', reg)
            }
            renderRegions() 
        }
        setTimeout(function() { regions[0].draw() },3000)
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
                m.forEach(function(o) { if (!l.checked) o.show(false)  })
       		})
       	}
        Core.on('map.click', function(args) {
            resolvePoint(args.coords) 
        })

        var $txtSearch = $('#txt-search')
        .on('focus', function() { this.select() })
        .on('change', function(e, args) {
            if (args) {
                var $row = args.$row,dsind = Number($row.attr('data-dsindex')),  ds = args.data[dsind] ;
                var ind = $row.index(), o = ds.data[ind].item;
                if (dsind == 0) { //streets
                    console.log('autocomplete street',  o)
                    o.sector.select()
                } else if (dsind == 1) {//region
                    console.log('autocomplete region',  o)
                    o.select()
                } else if (dsind == 2) {//sector
                    console.log('autocomplete sector',  o)
                    o.select()
                }
               // searchPoint(args.item.coords);
            } 
        })
        function searchPoint(pos) {
            console.log('searchPoint', pos)
            if (!map) return;
            for (var i=0; i < regions.length; i++) {
                var r = regions[i];
                if (r.pol.geometry.contains(pos)) {
                    r.render()
                    return;
                }
            }
            map.setCenter(pos, 15)
        }

        //Core.on('map-init', function() {
            $('#btn-locate').on('click', function() {
                loading(true)
                navigator.geolocation.getCurrentPosition(function(location) {
                    var p = [location.coords.latitude , location.coords.longitude ];
                    searchPoint(p)
                    resolvePoint(p)          
                    loading(false)
                }, function() {   
                    loading(false)
                })
            })
        //})
        var cp;
        function resolvePoint(p) {
            //console.log('cp', cp)
            if (cp) map.geoObjects.remove(cp);
            cp = new ymaps.GeoObject({
                geometry: {
                    type: "Circle",
                    coordinates: p,
                    radius: 70
                }
            },{fillColor :'#fff', strokeColor : '#f00'});
            map.geoObjects.add(cp);

            API.resolvePoint(city, p, function(addr) {
                if (!addr[0]) return;
                var pq = parseQuery(addr[0].name);
                //console.log(pq)
                var strres = search(streets,pq, function(o) { if (o) return o.name})
               // console.log(addr[0].name, strres[0])
                if (strres[0])
                    strres[0].item.sector.render()
            })

        }

        function search(arr, ws, fname) {
            var res = []
            arr.forEach(function(o) {
                var matches = [], rate = 0;
                var s = fname(o);
                if (!s) return; 
                ws.forEach(function(w) {
                    var ind = s.indexOf(w);
                    if (ind >= 0) matches.push({w : w,  ind : ind})
                    if (ind == 0) rate++;
                })
                if (matches.length > 0) {
                    rate+=matches.length;
                    res.push({ name : s, matches : matches, rate : rate, item : o }) 
                }
            })

            res.sort(function(a, b) { return b.rate - a.rate})
            return res.slice(0, 5);
        }
        $txtSearch.autocomplete($('#search-popup'), templates.autocomplete, function(q, success) {
            if (!q) return;
            var pq = parseQuery(q);
            var regres = search(regions, pq, function(o) { return o.region.name.toLowerCase()})
            var secres = search(sectors, pq, function(o) { return o.name})
            var strres = search(streets, pq, function(o) { if (o) return o.name})
         
            success( [{ title : 'Адреса', dsindex : 0,  data :strres}, { title : 'Отделения', dsindex : 1, data :regres}, { title : 'Участковые', dsindex : 2, data :secres} ])
        })
        function parseQuery(q) {
            var pq = q.toLowerCase().split(/[\s,]+/);
            var numbers = pq.map(function(s) {return parseInt(s) })//.filter(function(s) { return !!s})
            pq.forEach(function(p, i) { 
                if (numbers[i]) pq[i]  = (numbers[i]);
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
            mtimeout = setTimeout(function() { $mess.removeClass('shown')}, 3000)
        })

        window.onerror = function() {
            Core.trigger('mess', {mess : 'Все совсем плохо. Ошибка в скриптах', error : true})    
        }
        
        //console.log(getcolors())
    };

})()





   