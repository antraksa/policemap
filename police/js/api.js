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
			 	regions[0].forEach(function(r) {
			 		r.calcRate = function() {
			 			function calc(vals) {
				 			if (vals) {
					 			var count = 0;
					 			vals.forEach(function(v) {
					 				if (v) count++
					 			})
					 			var rate = (count/vals.length);
					 			return  {val : rate, formatted : Math.round(rate*5) }
					 		}
				 		}
			 			r.rate1 =  calc(ank1[0].values[r.number]);
			 			r.rate2 = calc(ank2[0].values[r.number]);
			 		}
			 		r.calcRate()
			 	})
			 	regions[0].sort(function(a, b) { return a.number - b.number})
				success({regions : regions[0], sectors : sectors[0], areas : areas[0], ank1 : ank1[0], ank2 : ank2[0]} )
	    	})
		} 

	}
})()
