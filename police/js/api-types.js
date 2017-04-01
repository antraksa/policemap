(function() {
    API.types = {
        "region": {
            'name': 'region',
            'ds': 'regions',
            "title": "ОП",
            "fields": [{
                "name": "number",
                "edit": true,
                "key": true,
                "width": "60px"
            }, {
                'title': 'Название',
                "name": "name",
                "edit": true,
                "width": "150px"
            }, {
                "name": "coords",
                "edit": false
            }, {
                'title': 'Регион',
                "name": "area",
                "edit": true,
                "width": "150px"
            }, {
                'title': 'Адрес',
                "name": "addr",
                "edit": true,
                "width": "200px"
            }, {
                'title': 'Телефон',
                "name": "tel",
                "edit": true,
                "width": "150px"
            }, {
                'title': 'Имя начальника',
                "name": "personName",
                "edit": true,
                "width": "200px"
            }, {
                'title': 'Должность начальника',
                "name": "personRank",
                "edit": true,
                "width": "200px"
            }, {
                'title': 'Телефон начальника',
                "name": "personTel",
                "edit": true,
                "width": "200px"
            }, {
                'title': 'Время приема нач. ',
                "name": "personTime",
                "edit": true,
                "width": "200px"
            }, {
                'title': 'Последняя инспекция ',
                "name": "lastInspect",
                "edit": true,
                "width": "100px"
            }, {
                'title': 'Новости ',
                "name": "press",
                "edit": true,
                "width": "400px",
                "template": "{{#.}} <div>{{0}}, <i>{{1}}</i>;</div>{{/.}}",
                'convert': function(o) {
                    return trim(o.split(';')).map(function(a) {
                        return trim(a.split(','))
                    })
                }
            }, {
                "name": "point",
                "edit": false
            }]
        },
        "department": {
            "title": "ОУМВД",
            'ds': 'departments',
            'name': 'department',
            "fields": [{
                "name": "number",
                "edit": true,
                "width": "150px"
            }, {
                "name": "name",
                "edit": true,
                "width": "150px"
            }, {
                "name": "addr",
                "edit": true,
                "width": "200px"
            }, {
                "name": "regions",
                "edit": false,
            }, {
                "name": "email",
                "edit": true,
                "width": "150px"
            }, {
                "name": "personName",
                "edit": true,
                "width": "150px"
            }, {
                "name": "personTel",
                "edit": true,
                "width": "150px"
            }, {
                "name": "tel",
                "edit": true,
                "width": "150px"
            }, {
                "name": "raddr",
                "edit": false
            }, {
                "name": "coords",
                "edit": false
            }]
        },
        "sector": {
            "title": "Участковый",
            'ds': 'sectors',
            'name': 'sector',
            "fields": [{
                "name": "photo",
                "edit": true,
                "width": "150px"
            }, {
                "name": "name",
                "edit": true,
                "width": "150px"
            }, {
                "name": "rank",
                "edit": true,
                "width": "150px"
            }, {
                "name": "tel",
                "edit": true,
                "width": "200px"
            }, {
                "name": "addr",
                "edit": true,
                "width": "200px"
            }, {
                "name": "streets",
                "edit": true,
                "width": "150px"
            }, {
                "name": "time",
                "edit": true,
                "width": "200px"
            }, {
                "name": "raddr",
                "edit": false
            }, {
                "name": "coords",
                "edit": false
            }]
        }
    }

    function trim(arr) {
        return arr.map(function(a) {
            return a.trim()
        }).filter(function(a) {
            return !!a
        })
    }
})()
