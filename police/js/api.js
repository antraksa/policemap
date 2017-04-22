'use strict';
var API = (function() {
    var requests = {
        departments : function() { return $.getJSON("data/resolved/departments.json") },
        regions : function() { return $.getJSON("data/resolved/regions.json") },
        areas : function() { return $.getJSON("data/resolved/areas.json") },
        sectors : function() { return $.getJSON("data/resolved/sectors.json") },
        anfields : function() { return $.getJSON("data/resolved/anfields.json?1234") },
        anvalues : function() { return $.getJSON("data/resolved/anvalues.json") }
    }
    function getAll() {
        return $.when(
            requests.departments(),
            requests.regions(),
            requests.areas(),
            requests.sectors(),
            requests.anfields(),
            requests.anvalues()
        )
    }
    return {
        requests : requests,
    	all : function(success) {
    		getAll().done(function(deps, regions, areas, sectors, anfields, anvalues, types) {
    			 success({
                    regions: regions[0],
                    sectors: sectors[0],
                    departments: deps[0],
                    areas: areas[0],
                    anfields: anfields[0],
                    anvalues: anvalues[0],
                })
    		})
    	},
        getAndWrapAll: function(success) {
            getAll().done(function(deps, regions, areas, sectors, anfields, anvalues) {
                var anvals = anvalues[0];
                regions[0].sort(function(a, b) {
                    return a.number - b.number })
                var _regs = {}
                var regions = regions[0].map(function(r, i) {
                    var reg = ObjectWrapper.wrapRegion(r);
                    reg.ind = i;
                    //reg.ank = anvals[r.number]
                    _regs[r.number] = reg;
                    return reg;
                })
                //deps[0].sort(function(a, b) { return a.number - b.number })
                var deps = deps[0].map(function(d, i) {
                    var dep = ObjectWrapper.wrapDepartment(d);
                    dep.regions = d.regions.map(function(rnum) {
                        return _regs[rnum] }).filter(function(o) {
                        return !!o })
                    dep.regions.forEach(function(r) { r.department = dep })
                    dep.regions.sort(function(a, b) {
                        return a.number - b.number })
                    dep.department.number = dep.ind = i;
                    return dep;
                    //console.log(d)
                })

                var areas = areas[0].map(function(a, i) {
                    return ObjectWrapper.wrapArea(a) })
                var streets = {};
                var sectors = sectors[0].map(function(sec) {
                    sec.name = sec.name.toLowerCase();
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
                    return s;
                })
                var sort = function(a, b) {
                    return a.number - b.number };
                var strarr = []
                for (var key in streets) {
                    var str = streets[key];
                    //str.numbers.sort(sort)
                    str.numbers.forEach(function(n) {
                        strarr.push({ name: str.name.toLowerCase() + ' ' + n.number, sector: n.sector })
                    })
                }
                success({
                    regions: regions,
                    sectors: sectors,
                    departments: deps,
                    regionsDict: _regs,
                    areas: areas,
                    anfields: anfields[0],
                    anvalues: anvalues[0],
                    streets: strarr
                })
            })
        },
        save: function(key, data, success, fail) {
            $.post("php/put.php", { key: key, data: JSON.stringify(data) }, function(res) {
                if (!res.trim()) {
                    success()
                    console.log('put success ', key, data, res)
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
                    return { name: o.GeoObject.name, coords: o.GeoObject.Point.pos.split(' ').reverse() } })
                success(output)
            })
        },
        resolvePoint: function(city, p, success, error) {
            var url = 'https://geocode-maps.yandex.ru/1.x/?geocode={0},{1}&kind=street&format=json&results=5';
            return $.getJSON(url.format(p[1], p[0]), function(data) {
                //console.log(data)
                var res = data.response.GeoObjectCollection.featureMember;
                var output = res.map(function(o) {
                    return { name: o.GeoObject.name, coords: o.GeoObject.Point.pos.split(' ').reverse() } })
                success(output)
            })
        }
    }
})()

$(function() {
    return
    var headers = { 'x-apikey': '58da976b9b7aa194660910e5', 'Content-Type': 'application/json', 'Accept': 'application/json' }

    function call(args, success) {
        return $.ajax({
            url: 'https://police-7230.restdb.io/rest/{0}'.format(args.url || 'regions'),
            headers: headers,
            method: args.method || 'GET',
            data: args.data ? JSON.stringify(args.data) : null,
            success: function(data) {
                console.log('call success', args, data)
                if (success) success(data)
            },
        })
    }

    function getRegions() {
        call({})
    }

    function postRegions(regions) {
        call({ method: 'POST', data: regions })
    }

    function deleteRegions() {
        call({ method: 'DELETE', url: 'regions/*', data: [0] })
    }

    return;
    $.get('data/resolved/regions.json', function(regions) {
            postRegions(regions)
        })
        //get()
    function getGSheet() {
        $.get('https://docs.google.com/spreadsheets/d/1qManYIJ67hWEVP0xPcG0ry4xusZja8aTjAxTOS0GIwc/pub?output=tsv', function(data) {
            console.log(parseCSV(data))
        })
    }
    //getGSheet()
})
