'use strict';
var API = (function() {
    var rand = function() { return Math.round(Math.random() * 10000000) };
    var pref = ''
    if (location.href.indexOf('admin') > 0) {
        pref = '../'
    }
    var requests = {
        departments: function(city) { return $.getJSON(pref + "data/resolved/{0}/departments.json?".format(city) + rand()) },
        regions: function(city) { return $.getJSON(pref + "data/resolved/{0}/regions.json?".format(city) + rand()) },
        areas: function(city) { return $.getJSON(pref + "data/resolved/{0}/areas.json?".format(city) + rand()) },
        sectors: function(city) { return $.getJSON(pref + "data/resolved/{0}/sectors.json?".format(city) + rand()) },
        anfields: function(city) { return $.getJSON(pref + "data/resolved/anfields.json?".format(city) + rand()) },
        anvalues: function(city) { return $.getJSON(pref + "data/resolved/{0}/anvalues.json?".format(city) + rand()) },
        meta: function(city) { return $.getJSON(pref + "data/resolved/{0}/meta.json?".format(city) + rand()) }
    }

    function getAll(city) {
        return $.when(
            requests.departments(city),
            requests.regions(city),
            requests.areas(city),
            requests.sectors(city),
            requests.anfields(city),
            requests.anvalues(city),
            requests.meta(city)
        )
    }
    return {
        requests: requests,
        all: function(city, success) {
            return getAll(city).done(function(deps, regions, areas, sectors, anfields, anvalues, meta) {
                success({
                    regions: regions[0],
                    sectors: sectors[0],
                    departments: deps[0],
                    areas: areas[0],
                    anfields: anfields[0],
                    anvalues: anvalues[0],
                    meta: meta[0]
                })
            })
        },
        getAndWrapAll: function(city, success) {
            var req = getAll(city);
            req.done(function(deps, regions, areas, sectors, anfields, anvalues, meta) {
                var oregions = regions[0],
                    osectors = sectors[0],
                    oareas = areas[0];
                var anvals = anvalues[0];
                regions[0].sort(function(a, b) {
                    return a.number - b.number
                })
                var _regs = {},
                    persons = {}
                var regions = regions[0].map(function(r, i) {
                    var reg = ObjectWrapper.wrapRegion(r);
                    if (r.photo)
                        reg.photoLink = pref + 'data/photo/{0}/{1}'.format(city, r.photo);
                    reg.ind = i;
                    if (r.personName) {
                        persons[r.personName.toLowerCase()] = { location: reg, locationName: r.name };

                    } //reg.ank = anvals[r.number]
                    _regs[r.number] = reg;
                    return reg;
                })
                //deps[0].sort(function(a, b) { return a.number - b.number })
                var deps = deps[0].map(function(d, i) {
                    var dep = ObjectWrapper.wrapDepartment(d);
                    if (d.photo)
                        dep.photoLink = pref + 'data/photo/{0}/{1}'.format(city, d.photo);
                    dep.regions = d.regions.map(function(rnum) {
                        return _regs[rnum]
                    }).filter(function(o) {
                        return !!o
                    })
                    dep.regions.forEach(function(r) { r.department = dep })
                    dep.regions.sort(function(a, b) {
                        return a.number - b.number
                    })
                    dep.department.number = dep.ind = i;
                    persons[d.personName.toLowerCase()] = { location: dep, locationName: d.name };
                    return dep;
                    //console.log(d)
                })

                var areas = areas[0].map(function(a, i) {
                    return ObjectWrapper.wrapArea(a)
                })
                var streets = {};
                var sectors = sectors[0].map(function(sec, i) {
                    sec.number = i;
                    sec.name = sec.name.toLowerCase();
                    sec.tel = sec.tel ? sec.tel.filter(function(t) { return !!t }) : [];
                    var s = ObjectWrapper.wrapSector(sec)
                    // console.log('sec', sec)
                    //console.log(sec.coords)
                    sec.streets.forEach(function(st) {
                        var name = st.name //.replace(/ *\([^)]*\) */g, "");;
                        var snum = streets[name];
                        if (!snum) streets[name] = snum = { name: name, numbers: [] };
                        st.numbers.forEach(function(n) {
                            snum.numbers.push({ number: n, sector: s })
                        })
                    })
                    if (sec.regionId) {
                        s.region = _regs[sec.regionId];
                    }
                    return s;
                })
                var sort = function(a, b) {
                    return a.number - b.number
                };
                var strarr = []
                for (var key in streets) {
                    var str = streets[key];
                    //str.numbers.sort(sort)
                    str.numbers.forEach(function(n) {
                        strarr.push({ name: str.name.toLowerCase() + ' ' + n.number, sector: n.sector })
                    })
                }
                var personsArr = [];
                for (var name in persons) {
                    persons[name].name = name;
                    personsArr.push(persons[name])
                }
                success({
                    regions: regions,
                    sectors: sectors,
                    departments: deps,
                    regionsDict: _regs,
                    areas: areas,
                    anfields: anfields[0],
                    anvalues: anvalues[0],
                    streets: strarr,
                    persons: personsArr,
                    oregions: oregions,
                    oareas: oareas,
                    osectors: osectors,
                    meta: meta[0]
                })
            }).fail(function() {
                success({
                    regions: [],
                    sectors: [],
                    departments: [],
                    regionsDict: {},
                    areas: [],
                    anfields: [],
                    anvalues: [],
                    streets: [],
                    persons: [],
                    oregions: [],
                    oareas: [],
                    osectors: [],
                    meta: {}
                })
            })
            return req;
        },
        save: function(key, city, data, success, fail, noJSon) {
            $.post("php/put.php", { key: key, city: city, data: noJSon ? data : JSON.stringify(data) }, function(res) {
                if (!res.trim()) {
                    if (success) success()
                    console.log('put success ', key, res)
                } else {
                    console.warn('put fail ', key, data, res)
                    if (fail) fail()
                }
            })
        },
        resolveAddr: function(city, addr, success, error) {
            var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0}&ll={1},{2}&spn=0.5,0.5&format=json&results=5&rspn=1'
            return $.getJSON(url.format(addr, city.coords[1], city.coords[0]), function(data) {
                var res = data.response.GeoObjectCollection.featureMember;
                var output = res.map(function(o) {
                    return { name: o.GeoObject.name, coords: o.GeoObject.Point.pos.split(' ').reverse() }
                })
                success(output)
            })
        },
        resolvePoint: function(city, p, success, error) {
            var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0},{1}&kind=street&format=json&results=5';
            return $.getJSON(url.format(p[1], p[0]), function(data) {
                //console.log(data)
                var res = data.response.GeoObjectCollection.featureMember;
                var output = res.map(function(o) {
                    return { name: o.GeoObject.name, coords: o.GeoObject.Point.pos.split(' ').reverse() }
                })
                success(output)
            })
        },
        getCities: function() {
            return [
                { name: 'Санкт-Петербург', coords: [59.939440, 30.302135], code: 'spb', ind : 0, z : 10 },
                { name: 'Москва', coords: [55.725045, 37.646961], code: 'msc', ind : 1, z : 10 },
                { name: 'Воронеж', coords: [51.661535, 39.200287], code: 'vo', ind : 2, z : 10 },
            ];
        }
    }
})()
