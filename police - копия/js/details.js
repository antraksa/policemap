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
	var $details = $('#details'), $anketa = $('#anketa');
	Core.on('region.select', function(args) {
		$('#lb-details').text('Отделение милиции')
		var region = args.region;
		if (!region.sectors && region.pol) {
			region.sectors = []
			sectors.forEach(function(s) {
				if (!s.coords) return
				var contains = region.pol.geometry.contains(s.coords)
				if (contains) region.sectors.push(s);
				s.region = region;
			})
		}
		$details.html(Mustache.render(templates.region, region))
		.find('.sub-item').on('click', dataHandler(region.sectors, function(e, sector) {
			//console.log('navigate sector', sector)
			sector.place.balloon.open();
			sector.select()
			
		}))
		$details.find('.edit').on('click', function() {
			if (region.pol) {
				region.pol.editor.startDrawing();
			}
			$details.addClass('edit-mode')
			.find('.editable').attr('contentEditable', true)
		})
		$details.find('.save').on('click', function() {
			var pol = region.pol;
			if (pol) {
				var coords = pol.geometry.getBounds();
				//console.log(coords, sector.coords)
				pol.editor.stopDrawing();
			}
			$details.removeClass('edit-mode')
			Core.trigger('mess', {mess : 'Отделение сохранено'})
		})
		$details.find('.cancel').on('click', function() {
			if (region.pol) {
				region.pol.editor.stopDrawing();
			}
			$details.removeClass('edit-mode')
		})
		$details.find('.ank').on('click', function() {renderAnketa(region) }) 

		console.log('select region', region, args.ank)
		if (args.ank) {
			renderAnketa(region)
		} else {
			$anketa.removeClass('shown')
		}
   	})

   	function renderAnketa(r) {
		$anketa.addClass('shown')
		console.log($anketa.hasClass('shown'))
		var render  = function(ankId, ank) {
			var $ank = $('#' + ankId);
			var num = r.region.number;
   			var vals = ank.values[num];
   			var ankData = ank.fields.map(function(fi, i) { 
	   			var state = vals ? (vals[i] ? 'checked' : '') : 'empty';
				return {title : fi, state : state}
			})
			$ank.html(Mustache.render(templates.anketa, ankData)).find('b').on('click', function() {
				var $item = $(this).parent();
				$item.removeClass('empty').toggleClass('checked');
				$ank.addClass('changed')
			})
			$ank.find('.save').on('click', function() {
				var oldVals = (vals)? Common.clone(vals) : null;
   				if (!vals) ank.values[num] = vals = []; 
				//console.log(vals[0])
				$ank.find('.item').each(function() {
					vals[$(this).index()] = $(this).hasClass('checked')
				})
				Core.trigger('region.updated', {region : r})
				Core.trigger('mess', {mess : 'Анкета сохранена'})
				Core.trigger('history.push', {type : ankId, id : num, name : r.region.name,  old : oldVals, val :  vals, title : '{0} изменена'.format(ankId)})
				$ank.removeClass('changed')
				//$anketa.removeClass('shown')
			})
		}
		render('ank1', ank1)
		render('ank2', ank2)
		console.log('render anketa', r)
   	}
	$anketa.find('.cancel').on('click', function() {
		$anketa.removeClass('shown')
	})
   	Core.on('sector.select', function(args) {
		$('#lb-details').text('Участковый')
    	var sector = args.sector;
   		console.log('sector', sector)
		$details.html(Mustache.render(templates.sector, sector))
		$details.find('.back').on('click', function() {
			console.log('sector back', sector)
			sector.region.select();
		})
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