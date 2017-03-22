'use strict';

var API = (function(){
	return {
		all : function(success) {
			 $.when(
			 	$.getJSON("data/resolved/departments.json"), 
			 	$.getJSON("data/resolved/regions.json"), 
			 	$.getJSON( "data/resolved/areas.json"), 
			 	$.getJSON("data/resolved/sectors.json" ),
			 	$.getJSON("data/resolved/anfields.json" ),
			 	$.getJSON('data/resolved/anvalues.json' )
			 ).done(function(deps, regions, areas, sectors, anfields, anvalues) {
			 	var anvals = anvalues[0];
			 	regions[0].sort(function(a, b) { return a.number - b.number})
			 	var _regs = {}
			 	var regions = regions[0].map(function(r) {
			 		var reg = ObjectWrapper.wrapRegion(r);
			 		//reg.ank = anvals[r.number]
			 		_regs[r.number] = reg;  
			 		return  reg;
			 	})
			 	var deps = deps[0].map(function(d, i) {
			 		var dep = ObjectWrapper.wrapDepartment(d);
			 		dep.regions = d.regions.map(function(rnum) { return _regs[rnum]}).filter(function(o) { return !!o})
			 		dep.regions.forEach(function(r) { r.department = dep})
			 		dep.regions.sort(function(a, b) { return a.number - b.number})
			 		dep.department.number = i;
			 		return dep;
			 		//console.log(d)
			 	})

			 	var areas = areas[0].map(function(a, i) { return  ObjectWrapper.wrapArea(a)})

		        var streets  = {};
		        var sectors = sectors[0].map(function(sec) {
		        	sec.name = sec.name.toLowerCase();
		        	var s = ObjectWrapper.wrapSector(sec)
		           // console.log('sec', sec)
		           //console.log(sec.coords)
		            sec.streets.forEach(function(st) {
		                var name = st.name//.replace(/ *\([^)]*\) */g, "");;
		                var snum = streets[name];
		                if (!snum) streets[name] = snum = { name : name,  numbers : []};
		                st.numbers.forEach(function(n) {
		                    snum.numbers.push( {number : n, sector : s } )
		                })
		            })
		            return s;
		        })
		        var sort = function(a,b) { return a.number - b.number};
		        var strarr= []
		        for (var key in streets) {
		            var str = streets[key];
		            //str.numbers.sort(sort)
		            str.numbers.forEach(function(n) {
		            	strarr.push({name : str.name.toLowerCase() + ' ' + n.number, sector : n.sector })
		            })
		        }

				success({
					regions : regions, 
					sectors : sectors, 
					departments : deps, 
					regionsDict: _regs, 
					areas : areas, 
					anfields : anfields[0], 
					anvalues : anvalues[0], 
					streets : strarr
				})
	    	})
		},
		save : function(key, data, success, fail) {
			$.post("php/put.php", { key : key, data : JSON.stringify(data)}, function(res) {
				if (!res.trim()) {
					success()
					console.log('put success ', key, data, res)
				} else {
					console.warn('put fail ', key, data, res)
					if (fail) fail()
				}
			})
		},
		resolveAddr : function(city, addr, success, error) {
			var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0} {1}&format=json&results=5'
			$.getJSON(url.format(city, addr), function(data) {
				var res = data.response.GeoObjectCollection.featureMember;
				var output = res.map(function(o) { return  {name : o.GeoObject.name, coords :  o.GeoObject.Point.pos.split(' ').reverse() }})
				success(output)
			})
		}, resolvePoint : function(city, p, success, error) {
			var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0},{1}&spn=0.552069,0.400552&format=json&results=5';
			$.getJSON(url.format(p[1], p[0]), function(data) {
				//console.log(data)
				var res = data.response.GeoObjectCollection.featureMember;
				var output = res.map(function(o) { return  {name : o.GeoObject.name, coords :  o.GeoObject.Point.pos.split(' ').reverse() }})
				success(output)
			})
		}

	}
})()
