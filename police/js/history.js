'use strict';
Core.on('ready', function() {
    //Storage.set('police.history', null)
    var regions, _regions = {},
        templates, anvalues, anfields, targets;
    var actions = Storage.get('police.history') || [];
    Core.on('init', function(args) {
        regions = args.regions;
        regions.forEach(function(r) {
            _regions[r.region.number] = r;
        })
        anvalues = args.anvalues;
        anfields = args.anfields;
        templates = args.templates;
        targets = {
            anvalues: { tar: anvalues, setVal: function(id, val) { anvalues[id] = val; } },
            anfields: { tar: anfields, setVal: function(id, val) { anfields.fields = val.fields } }
        }
        render()
            //console.log(_regions)
    })
    Core.on('map-ready', function() {
        Core.trigger('history.restore', { actions: actions })
    })
    var $history = $('#history-list');

    function render() {
        Core.trigger('history.render', { actions: actions, $history: $history, templates: templates })
    }
    Core.on('history.setAction', function(args) {
        var tar = targets[args.action.type];
        tar.setVal(args.action.id, args.val);
    })
    Core.on('history.actionAdded', function(args) {
    	Storage.set('police.history', actions)
    	console.log('sets', actions)
    	// window.onbeforeunload = function(evt) {
     //        var message = 'Изменения не сохранены на сервере! Продолжить?';
     //        if (typeof evt == "undefined") {
     //            evt = window.event;
     //        }
     //        if (evt) {
     //            evt.returnValue = message;
     //        }
     //        return message
     //    }
    })

    $('#btn-clear-changes').on('click', function() {
        actions = [];
        Storage.set('police.history', actions)
        render()
        Core.trigger('history.changed', {})
    })


    var $btnsave = $('#btn-save-server').on('click', function() {
        console.log('upload changes', actions)
        var calls = 0;
        for (var key in targets) {
            var t = targets[key]
                //if (t.changed) {
            calls++;
            API.save(key, t.tar, function() {
                    calls--;
                    if (calls == 0) {
                        actions = []
                        Storage.set('police.history', actions)
                        render()
                        Core.trigger('mess', { mess: 'Изменения сохранены на сервере' })
                        window.onbeforeunload = null;
                    }
                }, function() { Core.trigger('mess', { mess: 'Что-то сломалось! Изменения не сохранены на сервере', error: true }) })
                //}
        }
    })
})
