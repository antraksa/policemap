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
		targets = {ank1 : {tar : ank1, vals :  ank1.values}, ank2 : {tar : ank2, vals : ank2.values } }
		render()
		restore();
		//console.log(_regions)
	})
	var actions = Storage.get('police.history') || [];
	// if (!actions) {
	// 	actions = [{default : true, title : 'Исходные данные', date : +new Date()}]
	// }
	var $history = $('#history-list'), uindex;
	function render() {
		var ractios = actions.map(function(a) {return {
			name : a.name,
			fdate : (new Date(a.date)).fineFormat(),
			title : a.title
		}})
		console.log(actions)
		
		var $items = $history.html(Mustache.render(templates.history, ractios)).find('.item'), len = $items.length;
		$items.each(function(ind) {
			var $item = $(this);

			$item.find('.undo').on('click', function() {
				var changed;
				for (var i = len - 1; i >= ind; i-- ) {
					changed =true;
					var a = actions[i]
					console.log('undo', i, a)
					setAction(a, a.old)
					$items.eq(i).addClass('undone')
				}
				if (changed) {
					Core.trigger('region.updated', {})
					uindex = ind;
				}
				
			})
			$item.find('.redo').on('click', function() {
				var changed;
				for (var i = uindex; i <= ind; i++ ) {
					changed =true;
					var a = actions[i]
					console.log('redo', i, a)
					setAction(a, a.val)
					$items.eq(i).removeClass('undone')
				}
				if (changed) {
					Core.trigger('region.updated', {})
					uindex = ind;
				}
				
			})
			
		})
	}
	function restore() {
		actions.forEach(function(a) {setAction(a, a.val) }) 
	}
	function setAction(a, val) {
		var tar = targets[a.type];
		tar.vals[a.id] = val;
		return { tar : tar, region : _regions[a.id], ank : a.type  };
	}
	Core.on('history.push', function(action) {
		action.date = +new Date();
		actions.push(action)
		Storage.set('police.history', actions)
		console.log('history', action)
		render()
	})
	$('#btn-save-server').on('click', function() {
		var calls = 0;
		for (var key in targets) {

			var t = targets[key]
			//if (t.changed) {
				calls++;
				API.save(key, t.tar ,function() {
					calls--;
					if (calls==0) {
						actions = [] 
						Storage.set('police.history', actions)
						render() 
						Core.trigger('mess', {mess : 'Анкета сохранена'})
					}
				})
			//}
		}
	
	})

})