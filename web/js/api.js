'use strict';

var API = (function(){
	return {
		all : function(success) {

			 $.when($.getJSON("data/poligoni_rayonov.geojson"), $.getJSON( "data/tochki_otdelov.geojson"), $.getJSON("data/otdeleniya.geojson" ),$.getJSON('data/police.json' ) )
	    	.done(function(a, b, c, d) {
	    		var regions = [], region_points = [], sectors = [], areas = [];
	    		var mo = a[0].features;
	    		var potds = b[0].features;
	    		var otds =  c[0].features;
	    		var ypots =  d[0].features;
	    		var _regions = {}
	    		var convertCoords = function(coords) {
	    			if (coords) {
		    			for (var j = 0; j < coords.length; j++) {
							var cc = coords[j]; coords[j] = [cc[1], cc[0]]
						}
					}
					return coords;
	    		}
	    		for (var i = 0; i < otds.length; i++) {
	    			var o = otds[i];
	    			//console.log(o)
	    			if (o.geometry)
	    				var coords = convertCoords(o.geometry.coordinates[0][0]);
	    				var _otd = { 
		    				number : o.properties._1number, 
		    				name : o.properties._2name,
		    				coords :   coords
		    			}
	    				_regions[_otd.number] = _otd;
		    			regions.push(_otd)
	    		}
	    		for (var i = 0; i < mo.length; i++) {
	    			var o = mo[i];
	    			//console.log(o)
	    			if (o.geometry)
	    				var coords = convertCoords(o.geometry.coordinates[0][0]);
	    				areas.push({ 
		    				name : o.properties._1name,
		    				coords :   coords
		    			})
	    		}

	    		for (var i = 0; i < potds.length; i++) {
	    			var po = potds[i];
	    			//console.log(po)
	    			var number =  po.properties.number;
	    			var name = o.properties.name;
	    			if (!name && _regions[number]) {
		    			name = _regions[number].name;
		    		}	    			
	    			region_points.push({ number : number, name : name, coords :  convertCoords([po.geometry.coordinates])[0] })
	    		}
	    		ypots//.slice(0, 10)
	    			.forEach(function(d) {
	    			var c = d.geometry.coordinates;
		    		var p = d.properties;
		    		var m = p.CompanyMetaData;
		    		if (p.name.toLowerCase().indexOf('участковый') < 0 ) return;
    				sectors.push( { coords : [c[1], c[0]],  name : p.name,  desc : p.description, phones : (m.Phones ? m.Phones.map(function(f) { return f.formatted}).join(',') : '')})
    			})
	    		//console.log('poligoni_rayonov', regions)
	    		//console.log('otdeleniya', otdels) 
	    		//console.log('yandex points', ypots) 
				success({regions : regions, region_points : region_points, sectors : sectors, areas : areas} )
	    	})
		} 

	}
})()
