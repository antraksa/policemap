'use strict';
$(function() {
    var $history = $('#history-list'),
        uindex, actions, templates;
    Core.on('history.render', function(args) {
    	//console.log('history.render', args.actions)	
    	uindex = -1;
        actions = args.actions;
        $history = args.$history;
        templates = args.templates;
        render()
    })
    var $items;

    function render() {
        var ractions = actions.map(function(a) {
                return {
                    name: a.name,
                    fdate: (new Date(a.date)).fineFormat(),
                    title: a.title
                }
            })
            //console.warn(actions)
        $items = $history.html(Mustache.render(templates.history, ractions)).find('.item');
        var len = $items.length;
        $items.each(function(ind) {
            var $item = $(this);
            $item.find('.undo').on('click', function() {
                var changed;
                var start = uindex < 0 ? len :  uindex ;
                for (var i = start - 1 ; i >= ind; i--) {
                    changed = true;
                    var a = actions[i]
                    console.log('undo', i, a, actions)
                    setAction(a, a.old)
                    $items.eq(i).addClass('undone')
                }
                if (changed) {
                    Core.trigger('history.changed', {})
                    uindex = ind;
                }
                //console.log('uindex', uindex, 'start' , start)
            })
            $item.find('.redo').on('click', function() {
                var changed;
                for (var i = uindex; i <= ind; i++) {
                    changed = true;
                    var a = actions[i]
                        //console.log('redo', i, a)
                    setAction(a, a.val)
                    $items.eq(i).removeClass('undone')
                }
                if (changed) {
                    Core.trigger('history.changed', {})
                    uindex = ind + 1;
                }
                //console.log('uindex', uindex)
            })
        })
        $('#history-btns').toggleClass('shown', actions.length > 0)
        Core.trigger('history.rendered', {})
    }
    Core.on('history.revert', function(args) {
        $items.eq(0).find('.undo').trigger('click')
    })
    Core.on('history.push', function(action) {
        console.log('add history', uindex, action, actions)
        if (uindex >= 0) {
            actions = actions.slice(0, uindex)
            uindex = -1;
        }
        action.date = +new Date();
        actions.push(action)
        render()
        Core.trigger('history.actionAdded', { action: action })
    })
    Core.on('history.restore', function(args) {
        //console.log('restore history', actions)
        actions = args.actions;
        if (actions.length) {
            actions.forEach(function(a) { setAction(a, a.val) })
            Core.trigger('history.changed', {})
        }
    })

    function setAction(a, val) {
        Core.trigger('history.setAction', { action: a, val: val })
    }
})
