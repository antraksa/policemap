$(function() {

	var regions, sectors, templates, map, ank1, ank2;
	Core.on('init', function(args) {
		templates = args.templates;
		sectors = args.sectors;
		map = args.map;
		ank1 = args.ank1;
		ank2 = args.ank2;
		console.log('init', args)
	})
	var $details = $('#details')
	Core.on('region.select', function(args) {
		var region = args.region;
		if (!region.sectors && args.pol) {
			region.sectors = []
			sectors.forEach(function(s) {
				var contains = args.pol.geometry.contains(s.coords)
				if (contains) region.sectors.push(s);
			})
		}
		$details.html(Mustache.render(templates.region, region))
		.find('.sub-item').on('click', dataHandler(region.sectors, function(e, sector) {
			//console.log('navigate sector', sector)
			sector.place.balloon.open();
			sector.select()
			
		}))

		renderAnketa(ank1,region)

		console.log('select region', region)
   	})
   	function renderAnketa(ank, r) {
   		var vals = ank.values[r.number]
   		var anketa = ank.fields.map(function(fi, i) { 
			return {
				title : fi,
				state : vals ? (vals[i] ? 'checked' : '') : 'empty'
			}
		})
		$('#anketa').html(Mustache.render(templates.anketa, anketa)).find('b').on('click', function() {
			$(this).parent().removeClass('empty').toggleClass('checked')
		})
		console.log('render anketa', anketa,$('#anketa').html())

   	}
   	Core.on('sector.select', function(args) {
    	var sector = args.sector;
   		console.log('sector', sector)
		$details.html(Mustache.render(templates.sector, sector))
		console.log('select sector', sector)
   	})
   	function dataHandler(data, handler) {
   		return function(e) {
   			console.log(this, $(this).index())
   			var o = data[$(this).index()];
   			handler.call(this, e, o)
   		}
	}
	
})