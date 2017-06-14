'use strict';
//https://spbmvd2.carto.com/viz/61374122-a143-11e6-83b6-0e3ff518bd15/public_map
$(function() {
    $('#btn-ank').on('click', function() { regions() })
    var useLocal = true, rand = Math.round(Math.random() * 100000);
    var otdUrl = useLocal  ? '../data/otdeleniya.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1LO75T1j0I2aCpgKYr_4BeGggcA7Ju4YRHp7RTjzvMjs/pub?output=csv';
    var depUrl = useLocal  ? '../data/departments.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1DtMId9BgjVerPKLW1edJedVB9CVUTl1tP3ZwCQ48jMY/pub?output=csv';
    var ank1Url = useLocal  ? '../data/anketa1.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1BfDEwci1YAcbQa-uSk8-ejSE6aTPgWRlIGnZ9Mm_cPc/pub?output=csv';
    var ank2Url = useLocal  ? '../data/anketa2.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1veV_YBTtjxK575FHg_u9sy_pOjCy9pPMXzon4NY1Vc4/pub?output=csv';
    
    //regions()
   

    function regions(success) {
        $.when($.getJSON("../data/poligoni_rayonov.geojson"),
                $.getJSON("../data/tochki_otdelov.geojson"),
                $.getJSON("../data/otdeleniya.geojson"),
                $.get(otdUrl),
                $.get(ank1Url),
                $.get(ank2Url),
                $.get(depUrl)
            )
            .done(function(a, b, c, c1, c2, c3, d) {
                var regions = [],
                    region_points = [],
                    sectors = [],
                    areas = [];
                var mo = a[0].features;
                var potds = b[0].features;
                var otds = c[0].features;
                var oinfo = csv(c1[0]);
                var ank1 = c2[0];
                var ank2 = c3[0];
                var deps = csv(d[0])
                var _regions = {}

                var getVal = function(val) {
                    if (!val) return;
                    return val.toLowerCase().trim()
                }
                var getv = function(val) {
                    return val ? val.trim() : null;
                }

                for (var i = 1; i < oinfo.length; i++) {
                    var o = oinfo[i],
                        name = getv(o[1]),
                        num = getv(o[3]);
                    if (!num) {
                        console.warn('нет номера', o);
                        continue;
                    }
                    var reg = _regions[num];
                    if (reg) {
                        console.warn('дубликат отделения', num)
                        continue;
                    } else {
                        reg = { name: name, number: num, coords: [] }
                        regions.push(reg)
                        _regions[num] = reg;
                    }
                    reg.name = name;
                    reg.area = getVal(o[0]);
                    reg.dep = getVal(o[1]);
                    reg.addr = getv(o[4])
                    reg.tel = [getv(o[5]), getv(o[6]), getv(o[7])].filter(function(o) {
                        return !!o
                    })
                    reg.personRank = getv(o[8]);
                    reg.personName = getv(o[9]);
                    reg.personTel = getv(o[10]);
                    reg.personTime = getv(o[11]);
                    reg.lastInspect = getv(o[12])
                    reg.hotLine = getv(o[14])
                    if (o[15]) {
                        var press = o[15].split(/\s*([0-9]+\))\s*/).filter(function(s) {
                            return s.length > 3
                        })
                        reg.press = press.map(function(p) {
                            var spl = p.split('http');
                            return [spl[0], spl[1] ? 'http' + spl[1].replace(';', '') : '']
                        })
                    }
                    reg.photo = getv(o[16]);
                    reg.report = getv(o[17]);
                    reg.comm = getv(o[18]);
                    reg.icon = getv(o[21]);
                    //console.log(reg);
                }
                for (var i = 0; i < otds.length; i++) {
                    var o = otds[i];
                    console.log(o.properties)
                    
                    var name = getv(o.properties.podrazdelenie);
                    var num = o.properties._1number;
                    if (!num && name) num = parseInt(name);
                    var rn = _regions[num];

                    if (!num || !rn) {
                        console.warn('нет соответствия в карто', o.properties)
                        continue;
                    }
                    var coords = convertCoords(o.geometry.coordinates[0][0]);
                    rn.coords = rn.coords ? rn.coords.concat(coords) : coords;
                }
                for (var i = 0; i < potds.length; i++) {
                    var po = potds[i];

                    //console.log(po)
                    var num = po.properties.number;
                    var name = o.properties.name;
                    if (!num && name) num = parseInt(name);
                    var r = _regions[num];
                    if (!r) {
                        console.warn('кривая точка отделения', po.properties)
                        continue;
                    }
                    r.point = { coords: convertCoords([po.geometry.coordinates])[0] }
                }


                console.log('_regions', _regions)
                var anfields = [],
                    anvalues = {};

                function parseAnk(ank, category) {
                    if (category == 'открытость') {
                        var questions = ank[2].slice(2);
                        var starts = ank[1].slice(2);
                        starts.forEach(function(a, i) {
                            if (!a) starts[i] = starts[i - 1] || '';
                        })
                        //console.log(starts)
                        questions.forEach(function(q, i) {
                            if (!q || !starts[i]) return
                            questions[i] = (starts[i].replace(/\./g,' ').trim() + ' ' + questions[i].replace(/\./g,' ').trim() )
                        })
                        ank.splice(1, 1);
                    } else {
                        var questions = ank[1].slice(2);
                    }
                    ank.slice(5).forEach(function(v) {
                        var name = getVal(v[0]);
                        var number = getv(v[1]),
                            vals = anvalues[number];
                        if (!vals) vals = []
                        var r = _regions[number]; //regions.filter(function(r) { return r.name.indexOf(number) == 0})[0]
                        if (!r)
                            console.warn('нет соответствия в отделениях:', name, number);
                        else {
                            vals = vals.concat(v.slice(2).map(function(o) {
                                o = o.toLowerCase()
                                return o == 'да' ? true : o == 'нет' ? false : null;
                            }))
                            anvalues[number] = vals;
                        }
                    })
                    var cats = ank[4].slice(2);
                    var weights = ank[2].slice(2);
                    var fields = questions.map(function(f, i) {
                        var cat = cats[i] || cats[i - 1] || category
                        return { title: f, category: getv(cat), weight: parseInt(weights[i]) }
                    });
                    anfields = anfields.concat(fields)
                }
                console.log('Парсим первую анкету')
                parseAnk(csv(ank1), 'доступность')
                console.log('Парсим вторую анкету')
                parseAnk(csv(ank2), 'открытость')
               
                console.log('Вопросы', anfields)
                console.log('Ответы', anvalues)
                
                for (var i = 0; i < mo.length; i++) {
                    var o = mo[i];
                    //console.log(o)
                    if (o.geometry)
                        var coords = convertCoords(o.geometry.coordinates[0][0]);
                    areas.push({
                        name: o.properties._1name,
                        coords: coords
                    })
                }
                var departments = []
                deps = deps.splice(1)
                for (var i = 0; i < deps.length; i++) {
                    var d = deps[i],
                        num = getv(d[1]),
                        name = getv(d[0]);
                    //console.log(d)

                    if (!num || !name) continue;
                    //console.log(d[3].split(','))
                    var dregs = d[4].split(',').map(function(o) {
                        var rnum = parseInt(o)
                        if (rnum >= 0) {
                            if (_regions[rnum]) {
                                _regions[rnum].departmentNumber = num;
                            } else {
                                console.warn('Нет номера ', rnum)
                            }
                        }
                        return rnum;
                    }).filter(function(o) {
                        return !!o
                    })
                    var dep = {
                        addr: getv(d[2]),
                        number: num,
                        name: name,
                        regions: dregs,
                        email: getv(d[5]),
                        url : getv(d[6]),
                        personRank: getv(d[7]),
                        personName: getv(d[8]),
                        personTel: getv(d[9]),
                        tel: getv(d[10]).split(','),
                        priemnaya : getv(d[11]),
                        photo : getv(d[12]),
                        reports : getv(d[13]),
                        prokuratura : getv(d[14]),
                        sovet : getv(d[15]),
                        usb : getv(d[16]),
                        onk : getv(d[16]),
                    }
                    departments.push(dep)
                    //    console.log(dep)
                }
                console.log('departments', departments)
               // return;
                save('regions', 'spb', regions)
                //save('areas', areas)
                //save('anfields', { fields: anfields })
                //save('anvalues', anvalues)
                //save('departments', departments)
            })
    }
    $('#btn-resolve-dep').on('click', function() {
        $.getJSON("data/resolved/departments.json".format(), function(data) {
            resolveSectors(data, function() {
                save('departments', data)
            })
        })
    })

    function save(key, city, data) {
        if (!city) city = 'spb';
        API.save(key, city, data, function(res) {
            console.info('Cохранилось', key, data)
        })
    }
    $('#btn-resolve-spb').on('click', function() { prepareSectors('spb') })
    $('#btn-resolve-msc').on('click', function() { prepareSectors('msc') })
    $('#btn-resolve-vo').on('click', function() { prepareSectors('vo') })
        //prepareSectors(7800000000000, 'spb') 
    function prepareSectors(city) {
        function parseOptions(data) {
            var arr = []
            $(data.list).each(function() {
                var $this = $(this);
                //var str = { val : $this.attr('value'), name : $this.text().trim() };
                arr.push($this.text().trim())
            })
            return arr;
        }
        $.getJSON("../data/sectors-parsed/ment-{0}.json".format(city), function(pots) {
            console.warn(pots);
            pots.forEach(function(p) {
                var street, pstr = p.streets;
                p.streets.forEach(function(s, i) {
                    var ind = 2;
                    if (s[2]) {
                        var m = s[2].match(/ *\([^)]*\) */g, "")
                        if (m) ind = 3;
                    }
                    var numbers = s.slice(ind)
                    var name = s[ind - 1]
                    var subcity = s[ind - 3] ? s[ind - 2] : null;
                    var str = { numbers: numbers, name: name, subcity: subcity }
                    p.streets[i] = str;
                    //console.log(str)
                })
            })
            console.log(city, 'ресловим сектора', pots)
            resolveSectors(pots, function() {
                save('sectors', city, pots)
            })
        })
    }

    function validateSectors() {
        $.getJSON("../data/resolved/spb/sectors.json", function(rsectors) {
            var map = {};
            rsectors.forEach(function(s) {
                var key = s.coords[0] + ' ' +  s.coords[1];
                var rs = map[]
                if (!rs)  
            })
            $.getJSON("../data/ment-spb-main-checked.json", function(sectors) {
                var sects = []
                sectors.forEach(function(s, i) {
                    console.log(rsectors[i].name, sectors[i].name )
                    var sec = {
                        addr : s.addr,
                        raddr : s.raddr,
                        name : s.name,
                        rank : s.rank,
                        photo : s.photo,
                        time : s.time,
                        tel : []
                    }
                    if (s['ncoords/0']) {
                        sec.coords = [s['ncoords/0'], s['ncoords/1']]
                    } else {
                        sec.coords = [s['coords/0'], s['coords/1']]
                    }
                    if (s['tel/0']) sec.tel.push(s['tel/0'])
                    if (s['tel/1']) sec.tel.push(s['tel/1'])
                    if (s['tel/2']) sec.tel.push(s['tel/2'])
                    //console.log(sec)
                })
                //save('sectors', sectors)
            })
        })
    }
    validateSectors()
  
    function resolveSectors(pots, success) {
        var ind = 0;
        //pots = pots.slice(0,3)
        var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0}&format=json';
        var resolve = function() {
            var p = pots[ind]
            if (!p) {
                console.log('resolve complete');
                success()
                return;
            }
            $.getJSON(url.format(p.addr), function(data) {
                var res = data.response.GeoObjectCollection.featureMember[0]
                if (res) {
                    p.raddr = res.GeoObject.name
                    p.rdescription = res.GeoObject.description;
                    var coords = res.GeoObject.Point;
                    if (coords)
                        p.coords = coords.pos.split(' ').map(function(x) {
                            return Number(x)
                        }).reverse()
                    console.log(ind, p.addr, p.raddr,  p.coords, p.rdescription)
                } else {
                    console.warn(ind, p.addr, 'Not resolved')
                }
                ind++;
                setTimeout(resolve, 2000);
            }).error(function() {
                ind++;
                setTimeout(resolve, 2000);
            })
        }
        resolve()
    }

    function convertCoords(coords) {
        if (coords) {
            for (var j = 0; j < coords.length; j++) {
                var cc = coords[j];
                coords[j] = [cc[1], cc[0]]
            }
        }
        return coords;
    }
    $('#btn-sectors-spb').on('click', function() { parseSectors(7800000000000, 'spb') })
    $('#btn-sectors-msc').on('click', function() { parseSectors(7700000000000, 'msc') })
    $('#btn-sectors-vo').on('click', function() { parseSectors(3600000000000, 'vo') })


        //parseSectors(7800000000000, 'spb')
    function parseSectors(sub, city) {
        console.log('начинаем ддосить ' + city)
        var offset = 0,
            size = 10;
        var url = 'https://xn--b1aew.xn--p1ai/district/search';
        var res = [];
        var form = 'subject={1}&subzone=&city=&street=&offset={0}&address=';
        var parse = function() {
            $.post(url, form.format(offset * size, sub), function(data) {
                var $list = $(JSON.parse(data).list).filter(function(i) {
                    return $(this).hasClass('sl-holder')
                });
                if (!$list.length) {
                    console.log('complete')
                        //download('ment{0}).json'.format(sub), res)
                    save('sectors-parsed-' + city, res)
                    return
                }
                $list.each(function() {
                    var $this = $(this)
                    var $photo = $this.find('img');
                    if ($photo[0]) {
                        var name = $this.find('.sl-item-title b').eq(0).text().trim()
                        var rank = $this.find('.sl-item-subtitle').text().trim()
                        var $b = $this.find('.open-map').prevAll('b');
                        var tel = [],
                            addr;
                        $b.each(function(i) {
                            var txt = $b.eq(i).text().trim();
                            if (i == 0)
                                addr = txt //.split(',').filter(function(o, i) { return i > 0 && o.trim()}) ;
                            else
                                tel.push(txt);
                        })
                        var time = $this.find('.sl-list').eq(0).find('p').text().trim();
                        var streets = []
                        $this.find('.sl-list-column .map-child').each(function() {
                            var spl = $(this).text().split(',');
                            spl.forEach(function(s, i) { spl[i] = s.trim() })
                            streets.push(spl);
                        })
                        var o = { photo: $photo.attr('src'), name: name, rank: rank, tel: tel, addr: addr, streets: streets, time: time }
                        console.log(o.name, o.addr, o.tel)
                        res.push(o)
                    }
                })
                console.log('offset', offset, res.length)
                offset++;
                setTimeout(parse, 3000)
            })
        }
        parse()
    }

    function download(name, data, nojson) {
        var pom = document.createElement('a');
        if (!nojson)
            data = JSON.stringify(data);
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
        var d = new Date().format()
            //pom.setAttribute('download', '{1}_{0}.json'.format(d, name));
        pom.setAttribute('download', name);
        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    }

    function parseCSV(str) {
        var x = str.split('\n');
        for (var i = 0; i < x.length; i++) {
            x[i] = x[i].split('\t');
        }
        return x;
    }

    function csv(csv, reviver) {
        reviver = reviver || function(r, c, v) {
            return v;
        };
        var chars = csv.split(''),
            c = 0,
            cc = chars.length,
            start, end, table = [],
            row;
        while (c < cc) {
            table.push(row = []);
            while (c < cc && '\r' !== chars[c] && '\n' !== chars[c]) {
                start = end = c;
                if ('"' === chars[c]) {
                    start = end = ++c;
                    while (c < cc) {
                        if ('"' === chars[c]) {
                            if ('"' !== chars[c + 1]) {
                                break;
                            } else { chars[++c] = ''; } // unescape ""
                        }
                        end = ++c;
                    }
                    if ('"' === chars[c]) {++c; }
                    while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) {++c; }
                } else {
                    while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) { end = ++c; }
                }
                row.push(reviver(table.length - 1, row.length, chars.slice(start, end).join('')));
                if (',' === chars[c]) {++c; }
            }
            if ('\r' === chars[c]) {++c; }
            if ('\n' === chars[c]) {++c; }
        }
        return table;
    }
})
