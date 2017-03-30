(function() {
    API.types = {
        "region": {
            'name' : 'region',
            'ds' : 'regions',
            "title": "ОП",
            "fields": [{
                name: 'id',
                key: true,
                edit: true,
            }, {
                "name": "number",
                "edit": true,
                "key": true,
                "ewidth": "60px"
            }, {
                'title': 'Название',
                "name": "name",
                "edit": true,
                "ewidth": "150px"
            }, {
                "name": "coords",
                "edit": false
            }, {
                'title': 'Регион',
                "name": "area",
                "edit": true,
                "ewidth": "100px"
            }, {
                'title': 'Адрес',
                "name": "addr",
                "edit": true,
                "ewidth": "200px"
            }, {
                'title': 'Телефон',
                "name": "tel",
                "edit": true,
                "ewidth": "150px"
            }, {
                'title': 'Имя начальника',
                "name": "personName",
                "edit": true,
                "ewidth": "200px"
            }, {
                'title': 'Должность начальника',
                "name": "personRank",
                "edit": true,
                "ewidth": "150px"
            }, {
                'title': 'Телефон начальника',
                "name": "personTel",
                "edit": true,
                "ewidth": "200px"
            }, {
                'title': 'Время приема нач. ',
                "name": "personTime",
                "edit": true,
                "ewidth": "200px"
            }, {
                'title': 'Последняя инспекция ',
                "name": "lastInspect",
                "edit": true,
                "ewidth": "100px"
            }, {
                'title': 'Новости ',
                "name": "press",
                "edit": true,
                "ewidth": "400px",
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
            "fields": [{
                "name": "addr",
                "edit": true
            }, {
                "name": "number",
                "edit": true
            }, {
                "name": "name",
                "edit": true
            }, {
                "name": "regions",
                "edit": true
            }, {
                "name": "email",
                "edit": true
            }, {
                "name": "personName",
                "edit": true
            }, {
                "name": "personTel",
                "edit": true
            }, {
                "name": "tel",
                "edit": true
            }, {
                "name": "raddr",
                "edit": true
            }, {
                "name": "coords",
                "edit": true
            }]
        },
        "sector": {
            "title": "Участковый",
            "fields": [{
                "name": "photo",
                "edit": true
            }, {
                "name": "name",
                "edit": true
            }, {
                "name": "rank",
                "edit": true
            }, {
                "name": "tel",
                "edit": true
            }, {
                "name": "addr",
                "edit": true
            }, {
                "name": "streets",
                "edit": true
            }, {
                "name": "time",
                "edit": true
            }, {
                "name": "raddr",
                "edit": true
            }, {
                "name": "coords",
                "edit": true
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
