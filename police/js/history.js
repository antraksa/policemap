'use strict';
$(function() {
	//Storage.set('police.history', null)
	var regions, _regions = {}, ank1, ank2, templates, targets;

	Core.on('init', function(args) {

		regions = args.regions;
		regions.forEach(function(r) {
			_regions[r.region.number] = r;
		})
		ank1 = args.ank1;
		ank2 = args.ank2;
		templates = args.templates;
		targets = {ank1 : ank1.values, ank2 : ank2.values }
		render()
		restore();
		//console.log(_regions)
	})
	var actions = Storage.get('police.history') || [];
	var $history = $('#history-list'), uindex;
	function render() {
		var ractios = actions.map(format)
		console.log(ractios)
		$history.html(Mustache.render(templates.history, ractios)).find('.undo').on('click', function() {
			var $item = $(this).parent();

			uindex = $item.index();
			$item.nextAll().addClass('undone').each(function() {
				setAction(actions[$item.index()])
			})
			var a = actions[uindex];

			Core.trigger('region.updated', setAction(a))
		})
	}
	function restore() {
		actions.forEach(function(a) {setAction(a) }) 
	}
	function setAction(a) {
		var tar = targets[a.type];
		tar[a.id] = a.val;
		// console.log('set action', a)
		return { tar : tar, region : _regions[a.id], ank : a.type  };
	}
	Core.on('history.push', function(action) {
		action.date = +new Date();
		actions.push(action)
		Storage.set('police.history', actions)
		console.log('history', action)
		render()
	})
	function format(a) {
		
		return {
			name : a.name,
			fdate : (new Date(a.date)).fineFormat(),
			title : a.title
		}
	}
})