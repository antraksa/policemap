'use strict';
//https://spbmvd2.carto.com/viz/61374122-a143-11e6-83b6-0e3ff518bd15/public_map
$(function() {
    $('#btn-ank').on('click', function() { regions() })
    var useLocal = true,
        rand = Math.round(Math.random() * 100000);
    // var otdUrl = useLocal  ? '../data/{0}otdeleniya.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1LO75T1j0I2aCpgKYr_4BeGggcA7Ju4YRHp7RTjzvMjs/pub?output=csv';
    // var depUrl = useLocal  ? '../data/departments.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1DtMId9BgjVerPKLW1edJedVB9CVUTl1tP3ZwCQ48jMY/pub?output=csv';
    // var ank1Url = useLocal  ? '../data/anketa1.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1BfDEwci1YAcbQa-uSk8-ejSE6aTPgWRlIGnZ9Mm_cPc/pub?output=csv';
    // var ank2Url = useLocal  ? '../data/anketa2.csv?' + rand :  'https://docs.google.com/spreadsheets/d/1veV_YBTtjxK575FHg_u9sy_pOjCy9pPMXzon4NY1Vc4/pub?output=csv';

    function getSpb() {
        var city = 'spb';
        $.when($.getJSON("../data/{0}/poligoni_rayonov.geojson".format(city)),
                $.getJSON("../data/{0}/tochki_otdelov.geojson".format(city)),
                $.getJSON("../data/{0}/otdeleniya.geojson".format(city)),
                $.get('../data/{0}/regions.csv?'.format(city) + rand),
                $.get('../data/{0}/otkr.csv?'.format(city) + rand),
                $.get('../data/{0}/dost.csv?'.format(city) + rand),
                $.get('../data/{0}/departments.csv?'.format(city) + rand)
            )
            .done(function(a, b, c, c1, c2, c3, d) {
                var mo = a[0].features;
                var potds = b[0].features;
                var otds = c[0].features;
                var oinfo = csv(c1[0]);
                var ankOtkr = c2[0];
                var ankDost = c3[0];
                var deps = csv(d[0])
                regions(city, {
                    mo: mo,
                    potds: potds,
                    otds: otds,
                    oinfo: oinfo,
                    ankOtkr: ankOtkr,
                    ankDost: ankDost,
                    deps: deps
                })
            })

    }
    //getVo()
    //getSpb();

    function getVo() {
        var city = 'vo';
        $.when(
                $.getJSON("../data/{0}/otdeleniya.geojson".format(city)),
                $.get('../data/{0}/regions.csv?'.format(city) + rand),
                $.get('../data/{0}/departments.csv?'.format(city) + rand),
                $.get('../data/{0}/otkr.csv?'.format(city) + rand),
                $.get('../data/{0}/dost.csv?'.format(city) + rand),
                $.getJSON("../data/{0}/tochki_otdelov.geojson".format(city)),
            )
            .done(function(a, b, c, d1, d2, e) {
                var otds = a[0].features;
                var oinfo = csv(b[0]);
                var deps = csv(c[0]);
                var ankOtkr = d1[0];
                var ankDost = d2[0];
                var potds = e[0].features;

                regions(city, {
                    otds: otds,
                    oinfo: oinfo,
                    deps: deps,
                    ankOtkr: ankOtkr,
                    ankDost: ankDost,
                    potds : potds,

                })
            })

    }

    function regions(city, args) {
        var mo = args.mo;
        var potds = args.potds;
        var otds = args.otds;
        var oinfo = args.oinfo;
        var ankOtkr = args.ankOtkr;
        var ankDost = args.ankDost;
        var deps = args.deps;

        console.log('parse all', args)

        var regions = [],
            region_points = [],
            sectors = [],
            areas = [];

        var _regions = {}

        var getVal = function(val) {
            if (!val) return;
            val = val.toLowerCase().trim()
            if (val == '-') val = ''
            return val;
        }
        var getv = function(val) {
            var val = val ? val.trim() : '';
            if (val == '-') val = ''
                //console.log(val)
            return val || null;
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
            if (o[17])
                reg.report = getv(o[17]);
            reg.comm = getv(o[18]);
            reg.icon = getv(o[21]);
            //console.log(reg);
        }
        for (var i = 0; i < otds.length; i++) {
            var o = otds[i];
            //console.log(o.properties)

            var name = getv(o.properties.podrazdelenie);
            var num = o.properties._1number || o.properties.name_ru;
            if (!num && name) num = parseInt(name);
            var rn = _regions[num];

            if (!num || !rn) {
                console.warn('нет соответствия в карто', o.properties)
                continue;
            }
            var coords = convertCoords(o.geometry.coordinates[0][0]);
            rn.coords = rn.coords ? rn.coords.concat(coords) : coords;
        }
       
        if (mo) {
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
        } else {
            console.warn('Нет файла geojson с мунициальными округами')
        }

        var departments = [], _deps = {}
        deps = deps.splice(1)
        console.log('_regions', _regions)
        for (var i = 0; i < deps.length; i++) {
            var d = deps[i],
                num = getv(d[1]),
                name = getv(d[0]);
            if (!name) {
                console.log('нет имени у департамента', d)
                continue;
            }
            //console.log(d[3].split(','))
            var dregs = d[4].split(',').map(function(rnum) {
                rnum = rnum.trim();
                if (rnum) {
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
                url: getv(d[6]),
                personRank: getv(d[7]),
                personName: getv(d[8]),
                personTel: getv(d[9]),
                tel: getv(d[10]).split(','),
                priemnaya: getv(d[11]),
                photo: getv(d[12]),
                prokAddr: getv(d[13]),
                prokName: getv(d[14]),
                prokTel: getv(d[15]),
                prokPriemnaya: getv(d[16]),
                sovet: getv(d[17]),
                sovPriemnaya: getv(d[18]),
                bezop: getv(d[19]),
                bezPerson: getv(d[20]),
                rukReports: getv(d[21]),
                uchReports: getv(d[22]),
                comm: getv(d[23]),
                icon: getv(d[25]),
            }
            _deps[num] = dep;
            departments.push(dep)
        }

         if (potds) {
            for (var i = 0; i < potds.length; i++) {
                var po = potds[i];

                var num = po.properties.iconCaption || po.properties.number;
                if (!num) {
                    console.warn('кривая номер  ', po.properties)
                    continue;
                }
                var isDep = (num.indexOf('У') == 0 || num=='ГУ');
                var tar = isDep ? _deps[num] : _regions[num];
                if (!tar) {
                    console.warn('кривая точка ', num, po.properties)
                    continue;
                }
                if (isDep) {
                    tar.coords = convertCoords([po.geometry.coordinates])[0];
                } else {
                    tar.point = { coords: convertCoords([po.geometry.coordinates])[0] };
                }
            }
        } else {
            console.warn('Нет файла geojson с точками отделений')
        }

        console.log('departments', departments)
        console.log('regions', regions)

        // if (ankOtkr && ankDost) {
        //     parseAnketas(ankOtkr, ankDost)
        // } else {
        //     console.log('нет файлов анкет');
        //     save('anvalues', city, [])

        // }


        //save('regions', city, regions)
        //save('areas', city, areas)
        //save('departments', city, departments)

        // save('meta', city, { "data": { "published": {} } })

        function parseAnketas(ankOtkr, ankDost) {
            var anfields = [],
                anvalues = {};

            function parseAnk(ank, category) {
                console.log(category, ank);
                var questions = ank[0].slice(2);
                var weights = ank[1].slice(2);
                var values = ank.slice(2);
                values.forEach(function(v) {
                    var name = getVal(v[0]);
                    var number = getv(v[1]);
                    var row = v.slice(2);

                    var vals = anvalues[number];
                    if (!vals) vals = []
                    vals = vals.concat(row.map(function(o, i) {
                        o = o.toLowerCase()
                        return o == 'да' ? true : o == 'нет' ? false : null;
                    }))

                    console.log(name, number, vals)
                    anvalues[number] = vals;
                })
                var fields = questions.map(function(f, i) {
                    return { title: f, category: category, weight: parseInt(weights[i]) }
                });
                anfields = anfields.concat(fields)
            }
            console.log('Парсим первую анкету')
            parseAnk(csv(ankDost), 'доступность')
            console.log('Парсим вторую анкету')
            parseAnk(csv(ankOtkr), 'открытость')

            console.log('Вопросы', anfields)
            console.log('Ответы', anvalues)
            //save('anfields', city, { fields: anfields })
            //save('anvalues',city, anvalues)
            var meta = {
                data:{published:{}, rateHistory : {}}
            }
            var published = meta.data.published;
            for (var key in anvalues) {
                published[key] = true
            }
            //save('meta',city, meta)

        }
    }

    
    //resolveDepartments('vo')
    //resolveDepartments('spb')

    function resolveDepartments(city) {
        $.getJSON("../data/resolved/{0}/departments.json".format(city), function(data) {
            resolveSectors(data, function() {
                save('departments', city, data)
            })
        })
    }
    
    //prepareSectors('spb') 

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
        $.getJSON("../data/{0}/sectors.json".format(city), function(pots) {
            pots = pots.filter(function(p) {
                return p.streets.length;
            })
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

            $.getJSON("../data/ment-spb-main-checked.json", function(sectors) {
                var sects = []
                sectors.forEach(function(s, i) {
                        //console.log(rsectors[i].name, sectors[i].name )
                        var sec = {
                            addr: s.addr,
                            raddr: s.raddr,
                            name: s.name,
                            rank: s.rank,
                            photo: s.photo,
                            time: s.time,
                            tel: []
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
    //validateSectors()

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
                    console.log(ind, p.addr, p.raddr, p.coords, p.rdescription)
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

    $('#btn-resolve-dep').on('click', function() {

    })

    function save(key, city, data) {
        if (!city) city = 'spb';
        API.save(key, city, data, function(res) {
            //console.info('Cохранилось', key, data)
        })
    }
    $('#btn-resolve-spb').on('click', function() { prepareSectors('spb') })
    $('#btn-resolve-msc').on('click', function() { prepareSectors('msc') })
    $('#btn-resolve-vo').on('click', function() { prepareSectors('vo') })


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
                    save('sectors-parsed', city, res)
                    return
                }
                $list.each(function() {
                    var $this = $(this)
                    
                    var rank = $this.find('.sl-item-subtitle').text().trim()
                    if (rank) {
                        var $photo = $this.find('img');
                        var name = $this.find('.sl-item-title b').eq(0).text().trim()
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

    function convertCheckedSectors() {
        //$.getJSON('../data/ment-spb-checked-all.json', function(data) {
        $.getJSON('../data/resolved/spb/sectors.json', function(data) {
            data.forEach(function(s) {
                    var streets = []
                    // if (s.check != '1') {
                    //     if (s.check == '') {
                    //         s.fail = true;
                    //     } else {
                    //         s.coords = s.ncoords;
                    //         s.raddr = s.check;
                    //     }
                    // }
                    s.photo = s.photo.replace('//static.mvd.ru/upload/site79/document_district/', '')
                    delete s.check;
                    delete s.ncoords;
                    s.streets.forEach(function(s) {
                        if (s.name) {
                            var sn = { name: s.name, numbers: [] }
                            streets.push(sn);
                            if (!s.numbers) return;
                            s.numbers.forEach(function(n) {
                                if (n) sn.numbers.push(n)
                            })
                        }
                    })
                    s.streets = streets;


                })
                console.log(data)
            API.save('sectors', 'spb', data)
        })
    }
    convertCheckedSectors();

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
