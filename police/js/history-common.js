$(function() {
    var $history = $('#history-list'),
        uindex, actions;
    Core.on('history.render', function(args) {
        actions = args.actions;
        $history = args.$history;
        templates = args.templates;
        render()
    })

    function render() {
        var ractions = actions.map(function(a) {
                return {
                    name: a.name,
                    fdate: (new Date(a.date)).fineFormat(),
                    title: a.title
                }
            })
            //console.warn(actions)
        var $items = $history.html(Mustache.render(templates.history, ractions)).find('.item'),
            len = $items.length;
        $items.each(function(ind) {
            var $item = $(this);
            $item.find('.undo').on('click', function() {
                var changed;
                for (var i = len - 1; i >= ind; i--) {
                    changed = true;
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
                for (var i = uindex; i <= ind; i++) {
                    changed = true;
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
        $('#history-btns').toggleClass('shown', actions.length > 0)
    }
    Core.on('history.push', function(action) {
        if (uindex >= 0) {
            actions = actions.slice(0, uindex)
            uindex = null;
        }
        action.date = +new Date();
        actions.push(action)
        console.log('add history', action)
        render()
        Core.trigger('history.actionAdded', { action: action })
    })
    Core.on('history.restore', function(args) {
        console.log('restore history', actions)
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
