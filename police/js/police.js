'use strict';
$(function() {
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
		if (m) {
			m.forEach(function(o) { o.options.set('visible', layer.checked) }) 
		}   	
	})
 //    $('.search-toggle .toggle-btn').on('click', function() {
	// 	$(this).parent().toggleClass('collapsed');
	// })
	// $('.pane-toggle .toggle-btn').on('click', function() {
	// 	$(this).parent().parent().toggleClass('collapsed');
	// 	setTimeout(function() { if (map) map.container.fitToViewport() }, 500) 
	// })

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
    //$.getJSON('https://search-maps.yandex.ru/v1/?apikey=eb3157f9-eeac-40d6-82c7-8623511be6e4&rspn=1&spn=0.552069,0.400552&results=1000&ll=30.371486%2C59.920140&text=%D0%BE%D1%82%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%BF%D0%BE%D0%BB%D0%B8%D1%86%D0%B8%D0%B8&lang=ru', function(data) {
    
    function createMap (state) {
        map = new ymaps.Map('map', { controls :  ["zoomControl"], zoom : 12, center : [59.948814, 30.309640] });
        Core.trigger('map-init', {map : map, mapobjects : mapobjects})
        addAreas();
        
        addObjects('regions');
        addObjects('sectors');
        addObjects('departments');
        
        console.log(mapobjects)
        prepare()
        renderRegions();

        validateLayers()
        loading(false)
    }
    function renderRegions() {
        var $rate;
        var $deps = $('#departments-list').html(Mustache.render(templates.departmensList, departments));
        $deps.find('.head-item').on('click', function() {
            var d = departments[$(this).index()];
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
        renderRegions()
    }) 


    function updateRegion(reg) {
        regions.forEach(function(r) {r.calcRate() })
        if (!reg) reg = selected;
        if (reg) reg.render()
        renderRegions() 
    }


    function addAreas() {
    	mapobjects.areas = [];
    	var colors = Common.getColors(areas.length);
    	areas.forEach(function(a, i) {
    		var pol = new ymaps.Polygon([a.coords, []], { hintContent : a.name}, { zIndex: 0,  strokeOpacity:0.7, fillOpacity:0, strokeColor : '#592167', strokeWidth : 2});
    		map.geoObjects.add(pol);
            a.pol = pol;
			mapobjects.areas.push(pol)
		})
    }
    function addObjects(oname) {
        mapobjects[oname] = []
        initArgs[oname].forEach(function(o, i) {
            var mos = o.draw();
            if (!mos) return
            mos.forEach(function(mo) {
                if (!mo) return
                map.geoObjects.add(mo);
                mapobjects[oname].push(mo)
            })
        })  
    }

   	function validateLayers() {
   		layers.forEach(function(l) {
   			var m = l.map();
   			if (!l.checked && m) 
				m.forEach(function(o) { o.options.set('visible', false) }) 
		})
   	}
    Core.on('map.click', function(args) {resolvePoint(args.coords) })

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
        if (cp) {
            map.geoObjects.remove(cp);
        }
        cp = new ymaps.Placemark(p, {  preset: 'islands#circleIcon', iconColor: 'black'});
        map.geoObjects.add(cp);
        console.log('cp', p)

        API.resolvePoint(city, p, function(addr) {
            if (!addr[0]) return;
            var pq = parseQuery(addr[0].name);
            //console.log(pq)
            var strres = search(streets,pq, function(o) { if (o) return o.name})
            console.log(addr[0].name, strres[0])
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
    
    //console.log(getcolors())
});





   