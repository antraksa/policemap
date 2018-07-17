'use strict'
$(function() {
    loading(true);
    var state = State.getState()
    var $ttoggles = $('#types-toggle'),
        types = API.types,
        $history = $('#history-list'),
        $veditor = $('#values-editor'),
        $th,
        templates = Common.getTemplates();
    var cities = API.getCities(),
        city = cities[state.cityIndex || 0];


    function renderCities() {
        $('#cities').html(Mustache.render(templates.cities, { cities: cities, city: city })).find('.city').on('click', function() {
            city = cities[$(this).index()];
            State.addState({ cityIndex: $(this).index() })
            load()
            renderCities()
        })
        $('#city-toggle').popup({ hideOnClick: true })
    }

    renderCities()
    load();

    function load() {

        console.log('load', city)
        API.all(city.code, function(args) {

            console.warn(args)
            var datas = args, renderSaveButtons;
            var typearr = [];

            var ti = 0;
            for (var key in types) {
                types[key].index = ti++;
                typearr.push(types[key])
            }
            $ttoggles.html(Mustache.render(templates.types, typearr))
            $ttoggles.find('a').on('click', function(e, args) {
                render(types[$(this).attr('data-type')]);
                $(this).addClass('selected').siblings().removeClass('selected')
                if (!args)
                    State.addState({ type: type.name })
                else {
                    if (state && Number(state.rowId) >= 0) {
                        var $item = $veditor.find('[data-item-ind="{0}"]'.format(state.rowId));
                        $item.addClass('current').siblings().removeClass('current');
                        //$item.scrollTo()
                    }
                }
            }).eq(state && state.type ? types[state.type].index : 0).trigger('click', {});



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
                $('#cities').removeClass('locked');
                //console.log('render', sortField.name, items)
                items.sort(function(_a, _b) {
                    var a = (sortField.desc ? _a : _b).item[sortField.name] || '',
                        b = (sortField.desc ? _b : _a).item[sortField.name] || '';
                    return a < b ? -1 : a > b ? 1 : 0;
                })
                var $res = $veditor.html(Mustache.render(templates.values, { fields: fields, items: items })),
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
                        State.addState({ rowId: items[rowind].itemInd, type: type.name });

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

                        if (field.editTemplate) {
                            $('#' + field.editTemplate).data('init')(cell);
                        }
                    })
                    .on('focus', function() {
                        var $this = $(this).addClass('edited');
                        var ind = Number($this.attr('data-field-ind')),
                            field = fields[ind];
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

                    var obj = { name: type.name };
                    target.push(obj)
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
                    moveHeaders()
                })

                function changeCell(cell, val) {
                    var action = { type: type.name, cell: cell, old: cell.val, name: cell.item.name, val: val, title: '"{0}" изменено'.format(cell.field.title) };
                    cell.setVal(val, true);
                    Core.trigger('history.push', action)
                    $ttoggles.addClass('locked');
                    $('#cities').addClass('locked');
                }
                renderSaveButtons = function() {
                    console.log('render', city.code);
                    $('#btn-cancel').on('click', update)
                    $('#btn-save').on('click', function() {
                        API.save(type.ds, city.code, datas[type.ds], function() {
                            Core.trigger('mess', { mess: '"{0}" сохранены'.format(type.title) })
                            update()
                        }, function() {
                            Core.trigger('mess', { error: true, mess: 'Ошибка! "{0}" НЕ сохранены'.format(type.title) })
                        })
                    })
                }

                function update() {
                    loading(true)
                    console.log('update', city.code);
                    API.requests[type.ds](city.code).success(function(data) {
                        datas[type.ds] = data;
                        console.log('update ', type.name, data)
                        render(type)
                    })
                }


                $('#edit-news-template').data('init', function(cell) {
                    var $this = $('#edit-news-template').show();
                    var original = JSON.parse(JSON.stringify(cell.item.press));
                    function renderNews() {
                        $('#edit-news').html(Mustache.render(templates.editNews, cell.item.press)).find('li').each(function() {
                            var ind = $(this).index(), item = cell.item.press[ind];
                            var $li = $(this);

                            $li.find('input').on('change', function() {
                                var iind = $(this).index();
                                var val = $(this).val();
                                cell.item.press[ind][iind] = val;
                                $li.find('.val').eq(iind).html(val)
                                console.log('change', $(this).val(), ind, iind)
                            })

                            $li.find('.remove').on('click', function(e) {
                                cell.item.press.splice(ind, 1);
                                $li.remove();
                                e.stopPropagation();
                            });
                            $li.on('click', function( ) {
                                $li.addClass('selected').siblings().removeClass('selected');
                            })
                        })
                    }
                    renderNews()

                    $('#btn-news-save')[0].onclick = function() {
                        $this.hide();
                        changeCell(cell, cell.item.press)
                    }
                    $('#btn-news-add')[0].onclick = function() {
                        cell.item.press.splice(0, 0, ['','']);
                        renderNews();
                        $('#edit-news').scrollTop(0);
                        $('#edit-news li').first().addClass('selected')

                    }
                    $('#btn-news-cancel')[0].onclick = function() {
                        $this.hide();
                        cell.item.press = original;
                    }
                    console.log('init', cell);
                })


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
                API.requests[type.ds](city.code).success(function(data) {
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
    }

    $('#btn-operations').on('click', function() {
        $(this).toggleClass('selected');
    })

    Core.on('popstate', function(args) {
        var state = args.state;
        if (state) {
            $ttoggles.eq(state.type ? types[state.type].index : 0).trigger('click', {});
            if (Number(state.rowId) >= 0) {
                var $item = $veditor.find('[data-item-ind="{0}"]'.format(state.rowId));
                $item.addClass('current').siblings().removeClass('current');
                $item.scrollTo()
            }
        }
    })


    $veditor.on('scroll', moveHeaders)


    function moveHeaders() {
        var top = $veditor.scrollTop()
        $th.css('top', top + 'px')
    }


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
