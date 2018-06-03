$(function() {
    API.types = {
        "region": {
            'name': 'region',
            'ds': 'regions',
            "title": "ОП",
            "fields": [{
              'title': 'ID',
                "name": "number",
                "edit": false,
                "key": true,
                "width": "60px"
            }, {
              'title': 'Фото',
                "name": "photo",
                "edit": true,
                "width": "60px"
            }, {
                'title': 'Название',
                "name": "name",
                "edit": true,
                "width": "150px"
            }, {
                'title': 'Подчиняется',
                "name": "departmentNumber",
                "edit": false,
                "width": "60px",
                'popup' : 'departments'
            },{
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
                "edit": false,
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
                "edit": false,
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
                "template": "{{#.}} <div>{{0}} ,<i>{{1}}</i>;</div>{{/.}}",
                editTemplate : 'edit-news-template'
            }, {
                "name": "comm",
                "edit": true,
                "width": "150px",
                'title': 'Комментарий'
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
                "edit": false,
                "width": "80px",
                "key": true,
                'title': 'Номер'
            }, {
                "name": "name",
                "edit": true,
                "width": "200px",
                'title': 'Название'
            }, {
                "name": "addr",
                "edit": true,
                "width": "200px",
                'title': 'Адрес'
            }, {
                "name": "regions",
                "edit": false,

            }, {
                "name": "email",
                "edit": true,
                "width": "150px",
                'title': 'email'
            }, {
                "name": "personName",
                "edit": true,
                "width": "200px",
                'title': 'Начальник'
            }, {
                "name": "personTel",
                "edit": true,
                "width": "150px",
                'title': 'Телефон начальника'
            }, {
                "name": "tel",
                "edit": true,
                "width": "150px",
                'title': 'Телефон'
            }, {
              "title": "Адрес Яндекс",
                "name": "raddr",
                "edit": false,
            },{
                "name": "photo",
                "edit": true,
                "width": "150px",
                'title': 'Фото'
            }, {
                "name": "rukReports",
                "edit": true,
                "width": "150px",
                'title': 'Отчеты руководителей'
            },{
                "name": "uchReports",
                "edit": true,
                "width": "150px",
                'title': 'Отчеты участковых'
            }, {
                "name": "comm",
                "edit": true,
                "width": "150px",
                'title': 'Комментарий'
            },{
                "name": "coords",
                "edit": false,
            }]
        },
        "sector": {
            "title": "Участковый",
            'ds': 'sectors',
            'name': 'sector',
            "fields": [{
                "title": "ФИО",
                "name": "name",
                "edit": true,
                "width": "150px"
            }, {
              "title": "Звание",
                "name": "rank",
                "edit": true,
                "width": "150px"
            }, {
              "title": "Телефон",
                "name": "tel",
                "edit": true,
                "width": "200px"
            }, {
              "title": "Время работы",
                "name": "time",
                "edit": true,
                "width": "200px"
            }, {
              "title": "Адреса",
                "name": "streets",
                "edit": false,
                "width": "150px"
            }, {
              "title": "Адрес с мвд.рф",
                "name": "addr",
                "edit": false,
                "width": "200px"
            }, {
              "title": "Адрес Яндекс",
                "name": "raddr",
                "width": "200px",
                "edit": true
            }, {
              "title": "Координаты",
                "name": "coords",
                "width": "200px",
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
});
