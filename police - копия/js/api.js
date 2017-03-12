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
        
				success({regions : regions, sectors : sectors[0], areas : areas[0], ank1 : ank1[0], ank2 : ank2[0]} )
	    	})
		} 

	}
})()
