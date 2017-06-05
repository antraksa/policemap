'use strict'
Core.on('ready', function() {
    Core.on('init', function(args) {
        var curRegion, categories, oldFields, vals, regionsDict = args.regionsDict,
            templates = args.templates;
        var anvalues = args.anvalues,
            anfields = args.anfields;
        Core.on('region.select', function(args) {
            if ($anketa.hasClass('shown'))
                renderAnketa(args.region)
        })
        Core.on('region-anketa.select', function(args) {
            if (!curRegion || curRegion != args.region) {
                renderAnketa(args.region)
            }
            $anketa.addClass('shown');
        })
        var $anketa = $('#anketa').appendTo('#pane-results'),
            $anktempl = $('#ank-temp');
        $('#btn-anketa-edit').on('click', function() {
            $anketa.addClass('edit-mode')
            $anktempl.find('.editable').attr('contentEditable', true)
            oldFields = Common.clone(anfields);
        })
        $('#btn-anketa-cancel').on('click', function() {
            $anketa.removeClass('edit-mode').removeClass('changed')
            if (oldFields) anfields.fields = oldFields.fields;
            var num = curRegion.region.number;
            if (curRegion.oldVals) {
                console.log(curRegion.oldVals)
                anvalues[num] = vals = curRegion.oldVals;
                curRegion.oldVals = null;
            }
            renderAnketa()
            Core.trigger('region.updated', {})
        })
        var $qt = $('#new-question-title').on('keyup', function(e) {
            if (e.keyCode == 13) $('#btn-anketa-add').trigger('click');
        })
        $('#btn-anketa-add').on('click', function() {
            var q = {}
            $('#new-question').find('[name]').each(function() {
                q[this.name] = this.value.trim();
            })
            if (!q.title) {
                Core.trigger('mess', { mess: 'Введите текст вопроса', warn: true })
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
            anfields.fields.push(q)
            renderAnketa()
            $anktempl.find('.editable').attr('contentEditable', true)
        })
        $('#btn-anketa-save').on('click', function() {
            if (!$anketa.hasClass('edit-mode')) {
                var num = curRegion.region.number;
                Core.trigger('history.push', { type: 'anvalues', id: num, name: curRegion.region.name, old: curRegion.oldVals, val: Common.clone(vals), title: 'Анкета изменена'.format(num) })
                Core.trigger('mess', { mess: 'Данные для  <b>{0}</b> сохранены'.format(curRegion.region.name) })
                curRegion.oldVals = null;
            } else {
                $anktempl.find('.item').each(function() {
                    var $this = $(this),
                        dindex = $this.attr('data-index'),
                        q = anfields.fields[dindex];
                    q.weight = parseInt($this.find('.weight').html());
                    q.title = $this.find('.title').html();
                })
                Core.trigger('mess', { mess: 'Формат анкеты изменен'.format(num) })
                Core.trigger('history.push', { type: 'anfields', old: oldFields, val: Common.clone(anfields), title: 'Формат анкеты изменен'.format(num) })
            }
            Core.trigger('region.updated', { region: curRegion })
            $anketa.removeClass('changed').removeClass('edit-mode')
                //$anketa.removeClass('shown')
        })
        Core.on('history.changed', function(args) {
            if ($anketa.hasClass('shown')) renderAnketa(curRegion)
        })
        $('#new-question-cat').autocomplete($('#cat-autocomplete'), templates.anketaCategories, function(q, success) {
            success(categories);
        }).on('change', function(e, args) {
            console.log(e, args)
        })

        function renderHeader() {
            $('#ank-header').html(Mustache.render(templates.ankHeader, curRegion))
        }

        function renderAnketa(r) {
            if (!r)
                r = curRegion
            else {
                var num = r.region.number;
                vals = anvalues[num];
                if (!vals) anvalues[num] = vals = []
                $anketa.addClass('shown')
                curRegion = r;
                renderHeader(r)
            }
            if (!r) return;
            r.vals = vals;
            $anketa.toggleClass('changed', !!curRegion.oldVals)
            var ankData = {};
            anfields.fields.forEach(function(fi, i) {
                var cat = ankData[fi.category] || [];
                ankData[fi.category] = cat;
                var state = vals[i]==false ? '' : (vals[i] == true ? 'checked' : 'empty') ;
                cat.push({ field: fi, checkes: calcSummary(fi, i), checked: vals[i], state: state, date: fi.date || 0, index: i });
            })
            console.log('render anketa', vals)
            var catData = [];
            categories = [];
            for (var key in ankData) {
                if (categories.indexOf(key) < 0) categories.push(key)
                var dat = ankData[key];
                dat.sort(function(b, a) {
                    return (a.date || b.date) ? a.date - b.date : (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
                })
                var checked = dat.filter(function(d) {
                    return d.checked })
                var catRate = r.rates ? r.rates[key] : null;
                catData.push({ category: key, categoryRate : catRate, data: dat, checked: checked })
            }
            $anktempl.html(Mustache.render(templates.anketa, { subject: r, categories: catData })).find('b').on('click', function() {
                var $item = $(this).parent();
                var checked = $item.removeClass('empty').toggleClass('checked').hasClass('checked');
                if (!curRegion.oldVals) {
                    curRegion.oldVals = (vals) ? Common.clone(vals) : null;
                    Core.trigger('region.updated', {})
                }
                vals[$item.attr('data-index')] = checked;
                curRegion.calcRate();
                renderRates()
                $anketa.addClass('changed')
            })
            $anktempl.find('.item').on('click', function() {})
            $anktempl.find('.btn-remove').on('click', function() {
                var $item = $(this).parent(),
                    ind = $item.index(),
                    dindex = $item.attr('data-index');
                var q = anfields.fields[dindex]
                q.hidden = !q.hidden;
                //console.log('mark hidden', q)
                $item.toggleClass('hidden')
                    //$item.fadeOut(function() { $item.remove()  })
            })
            initWeightControl($anktempl.find('.weight'))
            $anktempl.find('.category').on('click', function() {
                $(this).toggleClass('collapsed')
            })
            renderRates()
        }
        initWeightControl($('#new-question .weight'))

        function renderRates() {
            renderHeader()
            $anketa.find('[data-category]').each(function() {
                var cat = $(this).attr('data-category');
                var rates = curRegion.rates ? curRegion.rates[cat] : null;
                $(this).html(Mustache.render(templates.regRate, rates))
            })
        }

        function initWeightControl($w) {
            $w.on('blur', function() {
                var $this = $(this);
                var val = parseInt($this.val().trim()[0] || $this.text().trim()[0]);
                val = val ? (val > 5) ? 5 : (val < 1) ? 1 : val : 1
                $this.removeClass('weight1 weight2 weight3 weight4 weight5')
                    .html(val).val(val).addClass('weight' + val)
            })
        }
        $('#btn-anketa-close').on('click', function() {
            $anketa.removeClass('shown').removeClass('edit-mode')
        })

        function calcSummary(fi, i) {
            var checkes = []
            for (var key in anvalues) {
                var vals = anvalues[key];
                if (vals[i]) checkes.push(regionsDict[key])
            }
            return checkes;
        }
    })
})
