'use strict';

var API = (function(){
	return {
		all : function(success) {
			 $.when(
			 	$.getJSON("data/resolved/regions.json"), 
			 	$.getJSON( "data/resolved/areas.json"), 
			 	$.getJSON("data/resolved/sectors.json" ),
			 	$.getJSON('data/resolved/ank1.json' ), 
			 	$.getJSON('data/resolved/ank2.json' ) 
			 ).done(function(regions, areas, sectors, ank1, ank2) {
			 	regions[0].sort(function(a, b) { return a.number - b.number})
			 	var regions = regions[0].map(function(r) {return createRegion(r) })

        		function genWeights(ank) {
        			ank.fields = ank.fields.map(function(f) {
        				return {title : f, weight : Math.round(Math.random() * 5)}
        			})
        		}
        		genWeights(ank1[0])
        		genWeights(ank2[0])
				success({regions : regions, sectors : sectors[0], areas : areas[0], ank1 : ank1[0], ank2 : ank2[0]} )
	    	})
		},
		resolveAddr : function(city, addr, success, error) {

			var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0} {1}&format=json'
			$.getJSON(url.format(city, addr), function(data) {
				var res = data.response.GeoObjectCollection.featureMember;
				var output = res.map(function(o) { return  {name : o.GeoObject.name, coords :  o.GeoObject.Point.pos.split(' ').reverse() }})
				success(output)
			})
		}

	}
})()
