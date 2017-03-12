'use strict';
$(function() {
	var map;
    var regions, sectors, areas, templates = Common.getTemplates(), initArgs; 
    var mapobjects = {}
    var getMapObjects  = function() { return mapobjects[this.id]} 
	var layers = [
		{id : 'areas',  name : 'Муниципальные округа',  map :  getMapObjects, checked : false}, 
        {id : 'regions',  name : 'Районы',  map :  getMapObjects, checked : true}, 
		{id : 'regionPoints',  name : 'Районные отделения',  map :  getMapObjects, checked : true}, 
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
    $('.search-toggle .toggle-btn').on('click', function() {
		$(this).parent().toggleClass('collapsed');
	})
	$('.pane-toggle .toggle-btn').on('click', function() {
		$(this).parent().parent().toggleClass('collapsed');
		setTimeout(function() { if (map) map.container.fitToViewport() }, 500) 
	})
    var $dashPanels = $('.dash-panel');
    $('.dash-toggle a').on('click', function() {
        $(this).addClass('selected').siblings().removeClass('selected');
        $dashPanels.eq($(this).index()).addClass('shown').siblings().removeClass('shown')
    })

	API.all(function(args) {
        args.templates = templates;
        Core.trigger('init', args)

        sectors = args.sectors;
        areas = args.areas;
        regions = args.regions;

        regions.forEach(function(r) {r.calcRate() })
        
        if (window.ymaps) 
            ymaps.ready(createMap);
        else 
            console.warn('Yandex !!')
        initArgs = args;

        renderRegions();
    })
    //$.getJSON('https://search-maps.yandex.ru/v1/?apikey=eb3157f9-eeac-40d6-82c7-8623511be6e4&rspn=1&spn=0.552069,0.400552&results=1000&ll=30.371486%2C59.920140&text=%D0%BE%D1%82%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%BF%D0%BE%D0%BB%D0%B8%D1%86%D0%B8%D0%B8&lang=ru', function(data) {
    
    function createMap (state) {
        map = new ymaps.Map('map', { controls :  ["zoomControl"], zoom : 12, center : [59.948814, 30.309640] });

        addAreas();
        addRegions();
        addSectors();
        validateLayers()
        Core.trigger('map-init', {map : map})
    }
    function renderRegions() {
        var $rate;
        $('#regions-list').html(Mustache.render(templates.regionsList, regions))
        .find('.item').on('click', function() {
            var r = regions[$(this).index()];
            r.select(!!$rate)
            $rate = null;
        }).find('b').on('click', function() {$rate = $(this); }) 
    }

    var selected;
    Core.on('region.updated', function(args) {
        console.log('region.updated', args)
        updateRegion(args.region, !!args.ank) 
    }) 

    function updateRegion(reg, ank) {
        regions.forEach(function(r) {r.calcRate() })
        reg.render(ank)
        renderRegions() 
    }

   
    function addRegions() {
        mapobjects.regions = [];
        mapobjects.regionPoints = [];
        regions.forEach(function(r, i) {
            var reg = r.region;
            var pol = new ymaps.Polygon([reg.coords, []], { hintContent : reg.name}, {fillOpacity:0.3, strokeWidth:1, strokeColor :  r.color, fillColor : r.color });
    		map.geoObjects.add(pol);
    		pol.events.add('mouseenter', function (e) {  
                if (selected != r)
                    pol.options.set('fillOpacity',  0.5); 
            }) 
            pol.events.add('mouseleave', function (e) {   
                if (selected != r)
                    pol.options.set('fillOpacity',  0.3); 
            })
            r.pol = pol;
            pol.events.add('click', function() { 
                r.select() 
                selected = r;

            })
            mapobjects.regions.push(pol)
            if (reg.point) {
                var place = new ymaps.Placemark(reg.point.coords, {
                    balloonContentHeader: reg.name,
                },{//preset: 'islands#circleIcon',
                    iconColor: '#f00'
                });
                r.place = place;
                map.geoObjects.add(place);
                mapobjects.regionPoints.push(place)
            }
		})
    }

    function addAreas() {
    	mapobjects.areas = [];
    	var colors = Common.getColors(areas.length);
    	areas.forEach(function(o, i) {
    		var pol = new ymaps.Polyline(o.coords, { hintContent : o.name}, {strokeOpacity:0.7, strokeColor : '#592167', strokeWidth : 2});
    		map.geoObjects.add(pol);
			mapobjects.areas.push(pol)
		})
    }

    function addSectors() {
		mapobjects.sectors = []
        sectors.forEach(function(s) {
            if (!s.coords) return
    		var place = new ymaps.Placemark(s.coords, {
    			balloonContentHeader: s.name,
			    balloonContentBody: s.raddr,
			    balloonContentFooter: s.tel,
			    hintContent: s.name
    		}, {  preset: 'islands#circleDotIcon', iconColor: 'black'});

            //console.log(s)
            s.place = place;
			s.select = function() {
    	        Core.trigger('sector.select', {sector : s})
            }
            place.events.add('click', s.select) 
            map.geoObjects.add(place);
			mapobjects.sectors.push(place)
    	})
	}
   	function validateLayers() {
   		layers.forEach(function(l) {
   			var m = l.map();
   			if (!l.checked && m) 
				m.forEach(function(o) { o.options.set('visible', false) }) 
		})
   	}

    var $txtSearch = $('#txt-search')
    .on('focus', function() { this.select() })
    .on('change', function(e, args) {
        if (args && args.item) {
            map.setCenter(args.item.coords, 15)
            //args.item.place.balloon.open()
        }

    })
    $txtSearch.autocomplete($('#search-popup'), templates.autocomplete, function(q, success) {
        if (regions)
            success(regions.filter( function(r) {  return r.reg.name && r.reg.name.indexOf(q) >= 0 }))
    })
   
  

    //console.log(getcolors())
});

(function() {
    
    window.createRegion = function(r, map) {
        return new pregion(r)
    }
    var ank1, ank2, map;
    Core.on('init', function(args) {
        ank1 = args.ank1;
        ank2 = args.ank2;
    })
    Core.on('map-init', function(args) {map = args.map; }) 

    function pregion (r) {
        this.region = r;
    }
    var selected;
    function getRate(rate) {
        if (rate) {
            return  {val : rate, formatted : Math.round(rate*5) }
        } else {
            return {val : 0, formatted : '?' }
        }
    }
    function calcRate(vals) {
        if (vals) {
            var count = 0;
            vals.forEach(function(v) {
                if (v) count++
            })
            var rate = (count/vals.length);
        }
        return getRate(rate)
    }
    function getRateColor(r) {
        var h, s = 1, l = 0.5;
        var tr = r.rate.val;
        h = (100 * tr)/360;
        //console.log(tr, h , s ,l)
       if (isNaN(tr)) return '#fff'
       var rgb = Common.hslToRgb(h,s,l);
       return 'rgb({0},{1}, {2})'.format(rgb[0], rgb[1], rgb[2]) ;

    }
    function  getCenter(p) {
       var pb = p.geometry.getPixelGeometry().getBounds();
       var pixelCenter = [pb[0][0] + (pb[1][0] - pb[0][0]) / 2, (pb[1][1] - pb[0][1]) / 2 + pb[0][1]];
       var geoCenter = map.options.get('projection').fromGlobalPixels(pixelCenter, map.getZoom());
       return geoCenter;
    }
    pregion.prototype = {
        calcRate : function() {
            var r = this;
            r.rate1 =  calcRate(ank1.values[r.region.number]);
            r.rate2 = calcRate(ank2.values[r.region.number]);
            r.rate = getRate(r.rate1.val*0.5 +  r.rate2.val*0.5)
            r.color = getRateColor(r)
        },
        select : function(ank) {
             Core.trigger('region.select', {region : this, ank : ank})
             if (this.place)  this.place.balloon.open();
             if (this.pol) this.pol.options.set('fillOpacity',  0.8);
             if (map) map.setCenter(getCenter(this.pol))
             if (selected && selected.pol)
                selected.pol.options.set('fillOpacity',  0.3);
             selected = this;
        },
        render : function(ank) {
            Core.trigger('region.select', {region : this, ank : ank})
        }
    }

})()
