Core.on('map-ready', function(args) {
	var regions = args.regions,areas = args.areas,sectors = args.sectors;

	if (window.ymaps && sectors[0].sector.regionId === undefined) {
		regions.forEach(function(r) {
	        var rdata = r.region;
	        r.sectors = []
	        sectors.forEach(function(s) {
	        	if (s.sector.regionId === undefined) s.sector.regionId = -1;
	            var coords = s.sector.coords;
	            if (!coords) return
	            if (r.pol && r.pol.geometry.contains(coords)) {
	                s.sector.regionId = r.region.number;
	                s.region = r;
	            } 	
	        })
	        // areas.forEach(function(a) {
	        //     if (rdata.point && a.pol.geometry.contains(rdata.point.coords)) {
	        //         r.area = a;
	        //         rdata.areaId = 	
	        //     }
	        // })
	    })
	    API.save('sectors', args.getCurrentCity().code, args.osectors, function() {
	    	console.warn('sectors updated')
	    })
		console.log('prepare and save', args)
	} else {
		sectors.forEach(function(s) {
			var ri = s.sector.regionId;
			s.region = args.regionsDict[ri];
		})
		console.log('prepare', args)
	}
    
})