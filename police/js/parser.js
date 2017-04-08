'use strict'
$(function() {
    loading(true)
    API.all(function(args) {
        console.warn(args)
        var types = API.types,
            datas = args,
            $history = $('#history-list'),
            $th, renderSaveButtons;
        var typearr = [];
        var templates = Common.getTemplates();
        var state = State.getState()

        var ti = 0;
        for (var key in types) {
            types[key].index  = ti++;
            typearr.push(types[key])
        }
        var $ttoggles = $('#types-toggle').html(Mustache.render(templates.types, typearr))
        $ttoggles.find('a').on('click', function(e, args) {
            render(types[$(this).attr('data-type')]);
            $(this).addClass('selected').siblings().removeClass('selected')
            if (!args)
                State.pushState({ type : type.name})
            else {
                if (state && Number(state.rowId) >= 0) {
                    var $item = $('#values-editor').find('[data-item-ind="{0}"]'.format(state.rowId));
                    console.log($item)
                    $item.addClass('current').siblings().removeClass('current');
                    $item.scrollTo()
                }
            }
        }).eq( state ? types[state.type].index :  0).trigger('click', {});

        $('#values-editor').on('scroll', function() {
            var top = $(this).scrollTop()
            $th.css('top', top + 'px')
        })
        var type, sortField, target, items, fields;


        function render(_type) {
            if (_type) {
                type = _type;
                fields = type.fields.filter(function(f) {
                    return f.edit;
                })
                Core.trigger('history.render', { actions: [], $history: $history, templates: templates })
                sortField = { name: fields[0].name, desc: false };
                target = datas[type.ds];
            }
            items = mapTarget(target, fields);
            $ttoggles.removeClass('locked');
            //console.log('render', sortField.name, items)
            items.sort(function(_a, _b) {
                var a = (sortField.desc ? _a : _b).item[sortField.name] || '',
                    b = (sortField.desc ? _b : _a).item[sortField.name] || '';
                return a < b ? -1 : a > b ? 1 : 0;
            })
            var $res = $('#values-editor').html(Mustache.render(templates.values, { fields: fields, items: items })),
                $dspopup;
            $th = $res.find('.table-header');
            $res.find('.table-cell').on('click', function() {
                    if ($dspopup) {
                        $dspopup.parent().removeClass('edited')
                        $dspopup.remove()
                    }
                    var $this = $(this),
                        $item = $this.parent(),
                        ind = Number($this.attr('data-field-ind')),
                        field = fields[ind],
                        rowind = $item.index(),
                        cell = items[rowind].cells[ind];
                    $item.addClass('current').siblings().removeClass('current');
                    State.addState({ rowId : items[rowind].itemInd, type : type.name})
                    if (field.popup) {
                        $this.addClass('edited');
                        var popup = datas[field.popup];
                        $dspopup = $(Mustache.render(templates.popup, popup)).appendTo($this)
                        $dspopup.find('.popup-item').on('click', function(e) {
                            var num = popup[$(this).index()].number;
                            if (cell.val != num) changeCell(cell, num)
                            $dspopup.remove();
                            e.stopPropagation()
                        })
                    }
                })
                .on('focus', function() {
                    var $this = $(this).addClass('edited')
                    $this.data('oldtext', $this.text().trim())
                })
                .on('blur', function() {
                    var $this = $(this).removeClass('edited'),
                        ind = Number($this.attr('data-field-ind')),
                        itemind = $this.parent().index(),
                        cell = items[itemind].cells[ind],
                        field = fields[ind],
                        text = $(this).text().trim(),
                        oldtext = $this.data('oldtext'),
                        val = (field.convert) ? field.convert(text) : text;
                    //console.warn(text, oldtext)
                    if (text != oldtext) {
                        changeCell(cell, val)
                    }
                    $this.html(cell.text)
                })
            $res.find('.btn-delete').on('dblclick', function() {
                var $row = $(this).parents('.item'),
                    itemind = Number($row.attr('data-item-ind')),
                    item = target[itemind];
                target.splice(itemind, 1)
                console.log('delete', item)
                $row.slideUp(300, function() { render() });
                var action = { type: type.name, old: item, ds: target, name: item.name, val: null, title: 'Удален' };
                Core.trigger('history.push', action)
            })
            $('#btn-add').on('click', function() {
                
                var obj =  { name : type.name };
                target.push( obj )
                var action = { type: type.name, old: null, ds: target, name: obj.name, val: obj, title: 'Добавлен' };
                Core.trigger('history.push', action)
                render()
            })
            $res.find('.header-cell').on('click', function() {
                var fname = fields[$(this).index()].name;
                if (sortField.name == fname)
                    sortField.desc = !sortField.desc;
                else {
                    sortField.name = fname;
                    sortField.desc = false;
                }
                render()
            })

            function changeCell(cell, val) {
                var action = { type: type.name, cell: cell, old: cell.val, name: cell.item.name, val: val, title: '"{0}" изменено'.format(cell.field.title) };
                cell.setVal(val, true);
                Core.trigger('history.push', action)
                $ttoggles.addClass('locked');
            }
            renderSaveButtons = function() {
                $('#btn-cancel').on('click', update)
                $('#btn-save').on('click', function() {
                    API.save(type.ds, datas[type.ds], function() {
                        Core.trigger('mess', { mess: '"{0}" сохранены'.format(type.title) })
                        update()
                    }, function() {
                        Core.trigger('mess', { error: true, mess: 'Ошибка! "{0}" НЕ сохранены'.format(type.title) })
                    })
                })
            }

            function update() {
                loading(true)
                API.requests[type.ds]().success(function(data) {
                    datas[type.ds] = data;
                    console.log('update ', type.name, data)
                    render(type)
                })
            }
            loading(false)
        }

        function mapTarget(target, fields) {
            return target.map(function(o, i) {
                var cells = fields.map(function(f, j) {
                    var setVal = function(val, updateHtml) {
                        if (val && val.trim) val = val.trim()
                        this.val = val;
                        this.item[this.field.name] = val;
                        this.text = (val) ? (f.template) ? Mustache.render(f.template, val) : val : '';
                        if (updateHtml) {
                            $('#tb-cell-{0}-{1}'.format(i, j)).html(this.text)
                        }
                    }
                    var cell = { ind: j, field: f, width: f.width, setVal: setVal, item: o }
                    cell.setVal(o[f.name]);
                    return cell;
                })
                return { item: o, itemInd: i, cells: cells }
            })
        }

        function getValues(type) {
            loading(true)
            API.requests[type.ds]().success(function(data) {
                datas[type.ds] = data;
                render(type)
            })
        }
        Core.on('history.rendered', function() {
            if (renderSaveButtons) renderSaveButtons()
        })
        Core.on('history.setAction', function(args) {
            console.log('set action', args);
            var a = args.action,
                val = args.val;
            if (a.cell) {
                a.cell.setVal(args.val, true)
            } else if (a.ds) {
                if (val) {
                    a.ds.push(val);
                } else {
                    a.ds.splice(a.ds.indexOf(a.old), 1);
                }
                render()
            }
        })
    })
    $('#btn-operations').on('click', function() {
        $(this).toggleClass('selected');
    })

    Core.on('popstate', function(args) {
        var stoneId = Number(args.state.stoneId);
        if (!curStone || curStone.id == stoneId) return
        renderStone(stones[stoneId], null, true)
    })

    function loading(val) {
        $('.all').toggleClass('loading', val)
    }
    var mtimeout, $mess = $('#mess');
    Core.on('mess', function(args) {
        $mess.html(args.mess).addClass('shown').toggleClass('warn', !!args.warn).toggleClass('error', !!args.error);
        clearTimeout(mtimeout)
        mtimeout = setTimeout(function() { $mess.removeClass('shown') }, 3000)
    })
    window.onerror = function() {
        Core.trigger('mess', { mess: 'Все совсем плохо. Ошибка в скриптах', error: true })
    }
})
