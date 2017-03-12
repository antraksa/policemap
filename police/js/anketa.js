$(function() {
	var templates, ank1, ank2;
	Core.on('init', function(args) {
		templates = args.templates;
		ank1 = args.ank1;
		ank2 = args.ank2;
		console.log('init', args)
	})
 	var $ankPanels = $('.ank-panel');
    $('.ank-toggle a').on('click', function() {
        $(this).addClass('selected').siblings().removeClass('selected');
        $ankPanels.eq($(this).index()).addClass('shown').siblings().removeClass('shown')
    })
	Core.on('region-anketa.select', function(args) {
		renderAnketa(args.region)
	})
	var  $anketa = $('#anketa');
	function renderAnketa(r) {
		$anketa.addClass('shown')
		var render  = function(ankId, ank) {
			var $ank = $('#' + ankId);
			var num = r.region.number;
   			var vals = ank.values[num];
   			var ankData = ank.fields.map(function(fi, i) { 
	   			var state = vals ? (vals[i] ? 'checked' : '') : 'empty';
				return {title : fi.title, weight : fi.weight, state : state}
			})
			//console.log(ank, ankData)
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
				Core.trigger('history.push', {type : ankId, id : num, name : r.region.name,  old : oldVals, val :  Common.clone(vals), title : '{0} изменена'.format(ankId)})
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
	
})