'use strict'
$(function() {
	
	//regions()
	function regions(success) {
		$.when($.getJSON("data/poligoni_rayonov.geojson"), 
			$.getJSON( "data/tochki_otdelov.geojson"), 
			$.getJSON("data/otdeleniya.geojson" ), 
			$.get("data/anketa1.tsv" ), 
			$.get("data/anketa2.tsv" ), 
			$.getJSON('data/ypoints.json' ), 
			$.getJSON('data/ment-resolved.json') )
	    	.done(function(a, b, c, c1,c2, d, d1) {
	    		var regions = [], region_points = [], sectors = [], areas = [];
	    		var mo = a[0].features;
	    		var potds = b[0].features;
	    		var otds =  c[0].features;
	    		var ank1 =  c1[0];
	    		var ank2 =  c2[0];
	    		var ypots =  d[0].features;
	    		var pots =  d1[0];
	    		var _regions = {}
	    		

	    		for (var i = 0; i < otds.length; i++) {
	    			var o = otds[i];
	    			if (!o.geometry || !o.properties._2name)  {
    					console.warn('кривые отделения в карто', o)
	    				continue;
	    			}
    				var coords = convertCoords(o.geometry.coordinates[0][0]);
    				//console.log(o.properties)
    				var _otd = { 
	    				number : parseInt(o.properties._1number), 
	    				name : o.properties._2name.trim().toLowerCase(),
	    				desc : o.properties._3description,
	    				coords :   coords,
	    				addr : 'Вставить адрес!??! '
	    			}
	    			if (!_otd.number) 
	    				_otd.number = parseInt(_otd.name)
    				if (_otd.number) {
    					regions.push(_otd)
    					_regions[_otd.number] = _otd;
    				}
	    		}

	    		//console.log(_regions)
	    		function parseAnk(ank) {

	    			var ank = parseCSV(ank);
	    			//console.log(ank)
	    			var values =  {};
	    			ank.slice(1).forEach(function(v) {
	    				var name = v[0].trim().toLowerCase();
	    				var number = parseInt(name);
	    				var r = _regions[number] //regions.filter(function(r) { return r.name.indexOf(number) == 0})[0]
	    				if (!r)  
	    					console.warn('нет соответствия в карто',  name, number) ;
	    				else {
	    					values[number] =  v.slice(2).map(function(o) { return o.toLowerCase()=='да'})
	    					r.addr = v[1];
	    				}
	    				//v[0] = r.name 
	    			})
	    			return {
	    				fields : ank[0].slice(2),
	    				values : values  
	    			}

	    		}
	    		console.log('Парсим первую анкету')
	    		var ank1 =  parseAnk(ank1)
	    		console.log(ank1)
	    		console.log('Парсим вторую анкету')
	    		var ank2 =  parseAnk(ank2)
	    		console.log(ank2)
	    		


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
	    			var r = _regions[number];
	    			if (!r) {
	    				console.warn('кривая точка отделения', po.properties)
	    				continue;
	    			}
	    			if (!name && r) {
		    			name = _regions[number].name;
		    		}
		    		r.point = { coords :  convertCoords([po.geometry.coordinates])[0] }
	    		}

	    		console.log('areas', areas)
	    		console.log('regions', regions)


	    		// ypots = ypots//.slice(0, 10)
	    		// 	.map(function(d) {
	    		// 	var c = d.geometry.coordinates;
		    	// 	var p = d.properties;
		    	// 	var m = p.CompanyMetaData;
		    	// 	//console.log(p)
		    	// 	var sector =  { coords : [c[1], c[0]],  title : p.name, name : p.name,  addr : p.description, tel : (m.Phones ? m.Phones.map(function(f) { return f.formatted}).join(',') : '')}
		    	// 	if (p.name.toLowerCase().indexOf('участковый') >= 0 ) {
		    	// 		//console.log(p, m)
		    	// 		return sector;
    			// 		sectors.push(sector) 
		    	// 	}
    			// })
	    		//resolveY(pots)
	    		pots.forEach(function(p) {
	    			//console.log(p.addr.join(','))
	    			//var addr = p.addr.toLowerCase();
	    			//pots.streets = 
	    			if (p.coords) {
	    				p.coords = p.coords.pos.split(' ').map(function(x) { return Number(x) }).reverse()
	    			}

	    			//console.log(p.coords)
	    		})
	    		return;
	    		download('sectors.json', pots)
	    		download('ank1.json', ank1)
	    		download('ank2.json', ank2)
	    		download('areas.json', areas)
	    		download('regions.json', regions)


	    	})
	}
	function convertCoords(coords) {
		if (coords) {
			for (var j = 0; j < coords.length; j++) {
				var cc = coords[j]; coords[j] = [cc[1], cc[0]]
			}
		}
		return coords;
	}

	function download (name, data, nojson) {
		var pom = document.createElement('a');
		if (!nojson)
			data= JSON.stringify(data);
		pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
		var d = new Date().format()
		//pom.setAttribute('download', '{1}_{0}.json'.format(d, name));
		pom.setAttribute('download', name);

		if (document.createEvent) {
			var event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
		}
		else {
			pom.click();
		}
		
	}

	function parseCSV(str) {
		var x = str.split('\n');
		for (var i=0; i<x.length; i++) {
		    x[i] = x[i].split('\t');
		}
		return  x;

	}
	function resolveY(pots) {
		var ind = 0;
		//pots = pots.slice(0,3)
		var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0}&format=json'
		var resolve = function() {
			var p = pots[ind]
			if (!p) {
				console.log('resolve complete');
				download('sectors.json', pots)
				return;
			} 

			$.getJSON(url.format(p.addr), function(data) {
				var res = data.response.GeoObjectCollection.featureMember[0]
				if (res) {
					p.raddr = res.GeoObject.name
					p.coords = res.GeoObject.Point;
					console.log(ind, p.addr, p.raddr, p.coords)
				} else {
					console.warn(ind, p.addr, 'Not resolved')
				}
				ind++;
				setTimeout(resolve, 2000);

			})
		}
		resolve()
	}
 	//parseSectors()
	function parseSectors() {

		var offset = 0, size = 19;
		var url = 'https://xn--b1aew.xn--p1ai/district/search';
		//var sub  = 7800000000000//SPb
		var sub  = 3600000000000//Vor
		//var sub  = 7700000000000//Msc

		var form  = 'subject={1}&subzone=&city=&street=&type=undefined&offset={0}&address=';
		var res = [];
		var parse = function() {
			$.post(url, form.format(offset * size, sub), function(data) {
		        var $list = $(JSON.parse (data).list).filter(function(i) { return $(this).hasClass('sl-holder') });
		       	if (!$list.length) {
		        //if (offset > 1) {
		        	console.log('complete')
		        	//download('ment{0}).json'.format(sub), res)
		        	window.res  = res;
		        	console.clear();
		        	console.log(JSON.stringify(res))
		        	return
		        }
		        $list.each(function() {
		        	var $this = $(this)
		        	var $photo = $this.find('img');
		        	if ($photo[0]) {
		        		var name = $this.find('.sl-item-title b').eq(0).text().trim()
		        		var rank = $this.find('.sl-item-subtitle').text().trim()
		        		var $b = $this.find('.open-map').prevAll('b');
		        		var tel  = [], addr;
		        		$b.each(function(i) {
		        			var txt = $b.eq(i).text().trim();
		        			if (i == 0)
		        				addr  = txt//.split(',').filter(function(o, i) { return i > 0 && o.trim()}) ;
		        			else 
		        		 		tel.push(txt);
		        		})
		        		var time = $this.find('.sl-list').eq(0).find('p').text().trim();
		        		var streets = []
		        		$this.find('.sl-list-column .map-child').each(function() {
		        			var spl = $(this).text().split(',');
		        			//console.log(this)
		        			var sni =  spl[1].trim() ? 1 : 2;
		        			var str = { name : spl[sni].trim() , numbers : []} 
		        			spl.forEach(function(s, i) {
		        				if (i > sni) {
		        					str.numbers.push(s.trim()) 
		        				}
		        			})
		        			streets.push(str)
		        		})

		        		var o = { photo : $photo.attr('src'), name : name, rank : rank, tel : tel, addr : addr, streets : streets, time : time}
		        		console.log(o.addr, o.tel)
		        		res.push(o)
		        	}
		        })
		        //console.log($list)
		        console.log(offset, res.length)
				offset++;
		        setTimeout(parse, 5000)
		       // $('body').append($list)
		    })
		}
		parse()
	}

})

