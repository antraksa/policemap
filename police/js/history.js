'use strict';
$(function() {
	//Storage.set('police.history', null)
	var regions, _regions = {}, templates, anvalues, anfields, targets;

	Core.on('init', function(args) {

		regions = args.regions;
		regions.forEach(function(r) {
			_regions[r.region.number] = r;
		})
		anvalues = args.anvalues;
		anfields = args.anfields;
		templates = args.templates;
		targets = {
			anvalues : {tar : anvalues, setVal : function(id, val) { anvalues[id] = val; }  }, 
			anfields : {tar : anfields,  setVal : function(id, val) { anfields = val; } }
		}  
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
		var ractions = actions.map(function(a) {return {
			name : a.name,
			fdate : (new Date(a.date)).fineFormat(),
			title : a.title
		}})
		console.log(actions)
		
		var $items = $history.html(Mustache.render(templates.history, ractions)).find('.item'), len = $items.length;
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
					Core.trigger('history.changed', {})
					uindex = ind;
				}
				console.log('uindex', uindex)
				
			})
			$item.find('.redo').on('click', function() {
				var changed;
				for (var i = uindex; i <= ind; i++ ) {
					changed =true;
					var a = actions[i]
					//console.log('redo', i, a)
					setAction(a, a.val)
					$items.eq(i).removeClass('undone')
				}
				if (changed) {
					Core.trigger('history.changed', {})
					uindex = ind;
				}
				console.log('uindex', uindex)
				
			})
			
		})
	}
	function restore() {
		actions.forEach(function(a) {setAction(a, a.val) }) 
	}
	function setAction(a, val) {
		var tar = targets[a.type];
		tar.setVal(a.id, val);
		return { tar : tar, region : _regions[a.id], ank : a.type  };
		
	}
	Core.on('history.push', function(action) {
		if (uindex >=0) {
			actions = actions.slice(0, uindex)	
			uindex = null;
		}
		action.date = +new Date();
		actions.push(action)
		Storage.set('police.history', actions)
		console.log('history', action)
		render()
		return
		window.onbeforeunload = function(evt) { 
			var message = 'Изменения не сохранены на сервере! Продолжить?' ;
			if (typeof evt == "undefined") {
				evt = window.event;
			}
			if (evt) {
				evt.returnValue = message;
			}
			return message
		}
	})
	$('#btn-save-server').on('click', function() {
		console.log('upload changes', actions)
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
						Core.trigger('mess', {mess : 'Изменения сохранены на сервере'})
						window.onbeforeunload = null;
					}
				}, function() { Core.trigger('mess', {mess : 'Что-то сломалось! Изменения не сохранены на сервере', error : true}) })
			//}
		}
		// API.save('anketa', anketa ,function() {
		// 	actions = [] 
		// 	Storage.set('police.history', actions)
		// 	render() 
		// 	Core.trigger('mess', {mess : 'Изменения сохранены на сервере'})
		// 	window.onbeforeunload = null;
		// }, function() { Core.trigger('mess', {mess : 'Что-то сломалось! Изменения не сохранены на сервере', error : true}) })
	
	})

})