'use strict'
$(function() {
	Core.on('init', function(args) {
		var templates, curRegion, oldFields;
		templates = args.templates;
		var anvalues = args.anvalues,		anfields = args.anfields;
		console.log('init', args)
    // $('.ank-toggle a').on('click', function() {
    //     $(this).addClass('selected').siblings().removeClass('selected');
    //    	$curAnk = $ankPanels.eq($(this).index()).addClass('shown')
    //    	$curAnk.siblings().removeClass('shown')
    // })
		Core.on('region-anketa.select', function(args) {
			renderAnketa(args.region)
		})
		var  $anketa = $('#anketa'), $anktempl = $('#ank-temp');
		$('#btn-anketa-edit').on('click', function() {
			$anketa.addClass('edit-mode')
			$anktempl.find('.editable').attr('contentEditable', true)
			oldFields = Common.clone(anfields);
		})
		$('#btn-anketa-cancel').on('click', function() {
			$anketa.removeClass('edit-mode').removeClass('changed')
			anfields = oldFields;
			renderAnketa(curRegion)
		})
		var categories;
		var $qt = $('#new-question-title').on('keyup', function(e) {
			if (e.keyCode == 13) $('#btn-anketa-add').trigger('click');
		})
		$('#btn-anketa-add').on('click', function() {
			var q = {} 
			$('#new-question').find('[name]').each(function() {
				q[this.name] = this.value.trim();
			})
			if (!q.title) {
				Core.trigger('mess', { mess : 'Введите текст вопроса', warn : true})
				$qt.focus();
				return;
			}
			$qt.val('');
			if (!q.category) q.category = categories[0]
			q.category = q.category.toLowerCase()
			if (!q.weight) q.weight = 1;
			q.date = +new Date();
			console.log('add', q)
			//anketa.fields.splice(0, 0, q)
			anfields.push(q)
			renderAnketa(curRegion)
			$anktempl.find('.editable').attr('contentEditable', true)
		})
		
		$('#btn-anketa-save').on('click', function() {
			if (!$anketa.hasClass('edit-mode')) {
				var num = curRegion.region.number;

				var vals = anvalues[num];
				if (!vals) anvalues[num] = vals = []; 
				var oldVals = (vals)? Common.clone(vals) : null;
				//console.log(vals[0])
				$anktempl.find('.item').each(function() {
					vals[$(this).attr('data-index')] = $(this).hasClass('checked')
				})
				console.log('vals', vals)
				Core.trigger('mess', {mess : 'Данные для  <b>{0}</b> сохранены'.format(num)})
				Core.trigger('history.push', {type : 'anvalues', id : num, name : curRegion.region.name,  old : oldVals, val :  Common.clone(vals), title : 'Анкета изменена'.format(num)})
			} else {
				$anktempl.find('.item').each(function() {
					var $this = $(this), dindex = $this.attr('data-index'), q = anfields[dindex];
					q.weight = $this.find('.weight').html();
					q.title = $this.find('.title').html();
				})
				Core.trigger('mess', {mess : 'Формат анкеты изменен'.format(num)})
				Core.trigger('history.push', {type : 'anfields', old : oldFields, val :  Common.clone(anfields), title : 'Формат анкеты изменен'.format(num)})
			}
			Core.trigger('region.updated', {region : curRegion})
			$anketa.removeClass('changed').removeClass('edit-mode')
			renderAnketa()			
			//$anketa.removeClass('shown')
		})
		Core.on('history.changed', function(args) {
	        renderAnketa()
	    }) 
		$('#new-question-cat').autocomplete($('#cat-autocomplete'), templates.anketaCategories, function(q, success) {
			success(categories);
		}, {position : true}).on('change', function(e, args) {
			console.log(e, args)
		})
		function renderAnketa(r) {
			if (!r) 
				r = curRegion;
			else 
				curRegion = r;
			if (!r) return;
			$anketa.addClass('shown')
			var num = r.region.number;
			var vals = anvalues[num];
		

			var ankData = {};
			anfields.forEach(function(fi, i) { 
				//if (fi.hidden) return;
				var cat = ankData[fi.category] || [];
				ankData[fi.category] = cat;
	   			var state = vals ? (vals[i] ? 'checked' : '') : 'empty';
				cat.push({title : fi.title, weight : fi.weight, checked : !!vals[i], state : state, date : fi.date || 0, index : i, hidden : fi.hidden});
			})
			var catData = [];
			categories = [];
			for (var key in ankData) {
				if (categories.indexOf(key) < 0) categories.push(key)
				var dat = ankData[key];
				dat.sort(function(b, a)  { 
					//console.log(a.date || b.date, a.title, b.title, a.title - b.title)
					return (a.date || b.date) ? a.date - b.date : (a.title < b.title ? -1 : a.title > b.title ? 1 : 0 ) ; 
				})
				var checked = dat.filter(function(d) { return d.checked})
				catData.push({ category : key,  data : dat, checked : checked })
			}
			//console.log(catData)
			$anktempl.html(Mustache.render(templates.anketa, { subject : r, categories : catData})).find('b').on('click', function() {
				var $item = $(this).parent();
				$item.removeClass('empty').toggleClass('checked');
				$anketa.addClass('changed')
			})
			$anktempl.find('.btn-remove').on('click', function() {
				var $item = $(this).parent(), ind = $item.index(), dindex = $item.attr('data-index');
				var q = anfields[dindex] 
				q.hidden = !q.hidden;
				//console.log('mark hidden', q)
				$item.toggleClass('hidden')
				//$item.fadeOut(function() { $item.remove()  })
			})
			initWeightControl($anktempl.find('.weight'))
			$anktempl.find('.category').on('click', function() {
				$(this).toggleClass('collapsed')
			})
			console.log('render anketa', r)
	   	}
	   	initWeightControl($('#new-question .weight'))
	   	function initWeightControl($w) {
	   		$w.on('blur', function() {
				var $this = $(this);
				var val = Number($this.html().trim()[0]);
				val = val ? (val > 5) ? 5 : (val < 1) ? 1  : val : 1
				$this.removeClass('rated1 rated2 rated3 rated4 rated5')
				.html(val).val(val).addClass('rated' + val)
			})
	   	}
		$('#btn-anketa-close').on('click', function() {
			$anketa.removeClass('shown').removeClass('edit-mode')
		})
	
	})
})