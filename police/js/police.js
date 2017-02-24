'use strict';
$(function() {
	var map;
    var regions, sectors, areas, templates = Common.getTemplates(); 
    var mapobjects = {}
    var getMapObjects  = function() { return mapobjects[this.id]} 
	var layers = [
		{id : 'areas',  name : 'Муниципальные округа',  map :  getMapObjects, checked : true}, 
		{id : 'regions',  name : 'Районы',  map :  getMapObjects, checked : true}, 
		{id : 'sectors', name : 'Участковые отделения', map : getMapObjects, checked : false} 
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
    $('.search-toggle').on('click', function() {
		$(this).toggleClass('collapsed');
	})
	$('.pane-toggle').on('click', function() {
		$(this).parent().toggleClass('collapsed');
		setTimeout(function() { if (map) map.container.fitToViewport() }, 500) 
	})

	API.all(function(args) {
        regions = args.regions;
        sectors = args.sectors;
        areas = args.areas;
        console.log('areas', areas)
        console.log('sectors', sectors[0])
        console.log('regions', regions) 
        renderRegions();
        if (window.ymaps) 
            ymaps.ready(createMap);
        else 
            console.warn('Yandex !!')
        args.templates = templates;
        Core.trigger('init', args)
    })
    //$.getJSON('https://search-maps.yandex.ru/v1/?apikey=eb3157f9-eeac-40d6-82c7-8623511be6e4&rspn=1&spn=0.552069,0.400552&results=1000&ll=30.371486%2C59.920140&text=%D0%BE%D1%82%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%BF%D0%BE%D0%BB%D0%B8%D1%86%D0%B8%D0%B8&lang=ru', function(data) {
    
    function createMap (state) {
        map = new ymaps.Map('map', { controls :  ["zoomControl"], zoom : 12, center : [59.948814, 30.309640] });
        addAreas();
        addRegions();
        addSectors();
        validateLayers()
    }
    function renderRegions() {
        $('#regions-list').html(Mustache.render(templates.regionsList, regions))
        .find('.item').on('click', function() {
            var r = regions[$(this).index()];
            if (r.select) 
                r.select()
            else 
                Core.trigger('region.select', {region : r})
            //console.log('region item select', r)
        })
    }
    function addRegions() {
    	var colors = Common.getColors(regions.length);
    	mapobjects.regions = [];
    	regions.forEach(function(o, i) {
    		var pol = new ymaps.Polygon([o.coords, []], { hintContent : o.name}, {fillOpacity:0.3, strokeWidth:0, fillColor : colors[i]});
    		map.geoObjects.add(pol);
    		pol.events.add('mouseenter', function (e) {pol.options.set('fillOpacity',  0.5); }) 
    		pol.events.add('mouseleave', function (e) {pol.options.set('fillOpacity',  0.3); })
            pol.events.add('click', o.select)
    		pol.events.add('dblclick', function (e) {
                pol.editor.startDrawing();
                //pol.editor.stopEditing();
            })
            pol.geometry.events.add("change", function () {
                console.log('change', pol.geometry.getBounds())
            });
			mapobjects.regions.push(pol)
            if (o.point) {
                var place = new ymaps.Placemark(o.point.coords, {
                    balloonContentHeader: o.name,
                },{
                    //preset: 'islands#circleIcon',
                    iconColor: '#f00'
                });
                o.select = function() {
                     Core.trigger('region.select', {region : o})
                     place.balloon.open()
                }
                o.place = place;
                map.geoObjects.add(place);
            }
		})
    }
    function addAreas() {
    	mapobjects.areas = [];
    	var colors = Common.getColors(areas.length);
    	areas.forEach(function(o, i) {
    		var pol = new ymaps.Polyline(o.coords, { hintContent : o.name}, {strokeOpacity:0.7, strokeColor : '#592167', strokeWidth : 4});
    		map.geoObjects.add(pol);
   //  		pol.events.add('mouseenter', function (e) {pol.options.set('opacity',  0.4); }) 
   //  		pol.events.add('mouseleave', function (e) {pol.options.set('opacity',  0.2); })
   //  		pol.events.add('click', function (e) {
			// 	console.log('select region', o)
			// })
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
    	console.log(args)
    	if (args && args.item) {
    		map.setCenter(args.item.coords, 15)
    		args.item.place.balloon.open()
    	}

    })
    $txtSearch.autocomplete($('#search-popup'), templates.autocomplete, function(q, success) {
    	if (regions)
			success(regions.filter( function(r) {  return r.name && r.name.indexOf(q) >= 0 }))
	})

   	//console.log(getcolors())
})
