'use strict';
$(function() {
    Core.on('init', function(initArgs) {
        //Storage.set('police.history', null)
        var regions, _regions = {},
            anvalues, anfields, targets, meta,
            actions = Storage.get('police.history') || [],
            city,
            templates = initArgs.templates;

        Core.on('load', function(args) {
            regions = args.regions;
            regions.forEach(function(r) {
                _regions[r.region.number] = r;
            })
            anvalues = args.anvalues;
            anfields = args.anfields;
            meta = args.meta;
            city = args.city;
            targets = {
                anvalues: { tar: anvalues, setVal: function(id, val) { anvalues[id] = val; } },
                anfields: { tar: anfields, setVal: function(id, val) { anfields.fields = val.fields } },
                meta: {
                    tar: meta,
                    setVal: function(id, val) {
                        meta.data = val.data
                    }
                }
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
        Core.on('history.rendered', function() {
            $('body').toggleClass('history-has-changes', actions.length > 0)
        })
        Core.on('history.setAction', function(args) {
            var tar = targets[args.action.type];
            tar.setVal(args.action.id, args.val);

        })
        Core.on('history.actionAdded', function(args) {
            Storage.set('police.history', actions)
            //console.log('sets', actions)
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
            Core.trigger('history.revert', {})
            actions = [];
            Storage.set('police.history', actions)
            render()
            Core.trigger('history.changed', {})
        })


        var $btnsave = $('#btn-save-server').on('click', function() {
            console.log('upload changes', actions)
            var calls = 0;
            var rateChanged = false;
            actions.forEach(function(a) {
                if (a.type == 'anvalues') {
                    rateChanged = true;
                    var ratesHistory = meta.data.rateHistory[a.id];
                    if (!ratesHistory) {
                        ratesHistory = meta.data.rateHistory[a.id] = {}
                    }
                    var rates = {},
                        oldRates = ObjectWrapper.calcRate(a.old).rates;
                    for (var cat in oldRates) {
                        rates[cat] = oldRates[cat].val.toFixed(2);
                    }
                    ratesHistory[a.date] =  rates;
                }
            })
            if (rateChanged) {
                API.save('meta', city.code, meta, function() {
                    console.log('rates updated', meta.rateHistory)
                })
            }

            for (var key in targets) {
                var t = targets[key]
                //if (t.changed) {
                calls++;

                API.save(key, city.code, t.tar, function() {
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
})