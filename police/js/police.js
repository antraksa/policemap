'use strict';
$(function() {
	var map;
    var regions, region_points, sectors, areas; 
    var mapobjects = {}
    var getMapObjects  = function() { return mapobjects[this.id]} 
	var layers = [
		{id : 'areas',  name : 'Муниципальные округа',  map :  getMapObjects, checked : true}, 
		{id : 'regions',  name : 'Районы',  map :  getMapObjects, checked : true}, 
		{id : 'region_points',  name : 'Районные отделения',  map : getMapObjects, checked : true }, 
		{id : 'sectors', name : 'Участковые отделения', map : getMapObjects, checked : false} 
	] 
   	$('#layers').render(layers).find('li').on('click', function() {
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
		region_points = args.region_points;
		sectors = args.sectors;
		areas = args.areas;
		console.log('areas', areas)
	    		
		console.log('regions', regions) 
		console.log('region_points', region_points)
		if (window.ymaps) 
			ymaps.ready(createMap);
		else 
			console.warn('Yandex !!')
	})
	//$.getJSON('https://search-maps.yandex.ru/v1/?apikey=eb3157f9-eeac-40d6-82c7-8623511be6e4&rspn=1&spn=0.552069,0.400552&results=1000&ll=30.371486%2C59.920140&text=%D0%BE%D1%82%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%BF%D0%BE%D0%BB%D0%B8%D1%86%D0%B8%D0%B8&lang=ru', function(data) {
	
    function createMap (state) {
    	map = new ymaps.Map('map', { controls :  ["zoomControl", "fullscreenControl"], zoom : 12, center : [59.948814, 30.309640] });
    	addAreas();
    	addRegions();
    	addRegionsPoints();
    	addSectors();
    	validateLayers()
    }
    function addRegions() {
    	var colors = Common.getColors(regions.length);
    	mapobjects.regions = [];
    	regions.forEach(function(o, i) {
    		var pol = new ymaps.Polygon([o.coords, []], { hintContent : o.name}, {fillOpacity:0.3, strokeWidth:0, fillColor : colors[i]});
    		map.geoObjects.add(pol);
    		pol.events.add('mouseenter', function (e) {pol.options.set('fillOpacity',  0.5); }) 
    		pol.events.add('mouseleave', function (e) {pol.options.set('fillOpacity',  0.3); })
    		pol.events.add('click', function (e) {
				console.log('select region', o)
			})
			mapobjects.regions.push(pol)
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
    function addRegionsPoints() {
    	mapobjects.region_points = [];
    	region_points.forEach(function(o, i) {
    		var place = new ymaps.Placemark(o.coords, {
    			balloonContentHeader: o.name,
			},{
	            preset: 'islands#circleIcon',
	            iconColor: '#f00'
	        });
			o.place = place;
			map.geoObjects.add(place);
    		place.events.add('click', function (e) {
				console.log('select region point', o)
			})
			mapobjects.region_points.push(place)
   		})
    }
    function addSectors() {
		mapobjects.sectors = []
		sectors.forEach(function(s) {
    		var place = new ymaps.Placemark(s.coords, {
    			balloonContentHeader: s.name,
			    balloonContentBody: s.desc,
			    balloonContentFooter: s.phones,
			    hintContent: s.name
    		}, {  preset: 'islands#circleDotIcon',
            	iconColor: 'black'});
    		s.place = place;
			
    		place.events.add('click', function (e) {
    			console.log('sector', s)
			})
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
    $txtSearch.autocomplete($('#search-popup'), function(q, success) {
    	if (regions)
			success(region_points.filter( function(r) {  return r.name && r.name.indexOf(q) >= 0 }))
	})

   	//console.log(getcolors())
})
