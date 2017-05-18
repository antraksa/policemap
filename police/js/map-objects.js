'use strict'
var ObjectWrapper = (function() {
    var anfields, anvalues, map;
    Core.on('init', function(args) {
        anfields = args.anfields;
        anvalues = args.anvalues;
    })
    Core.on('map-init', function(args) {
        map = args.map;
        //console.warn('map-init',args)
    })

    function pregion(r) { this.region = r; }

    function getRate(rate) {
        return (rate) ? { val: rate, formatted: Math.round(rate * 5) } : { val: 0, formatted: '?' }
    }

    function calcRate(vals) {
        if (vals && vals.length > 0) {
            var count = 0,
                all = 0;
            anfields.fields.forEach(function(fi, i) {
                var w = fi.weight || 1;
                if (fi.hidden) return;
                if (vals[i]) count+=w;
                all+=w;
            })
            return getRate(count / all);
        }
    }

    function getRateColor(r) {
        var h, s = 1,
            l = 0.5;
        if (!r.rate) return '#fff'
        var tr = r.rate.val;
        h = (100 * tr) / 360;
        //console.log(tr, h , s ,l)
        var rgb = Common.hslToRgb(h, s, l);
        return 'rgb({0},{1}, {2})'.format(rgb[0], rgb[1], rgb[2]);
    }

    function getCenter(p) {
        if (!p) return;
        var pb = p.geometry.getPixelGeometry().getBounds();
        var pixelCenter = [pb[0][0] + (pb[1][0] - pb[0][0]) / 2, (pb[1][1] - pb[0][1]) / 2 + pb[0][1]];
        var geoCenter = map.options.get('projection').fromGlobalPixels(pixelCenter, map.getZoom());
        return geoCenter;
    }
    var rselected, dselected, sselected;

    function clearSelections() {
        if (dselected) dselected.markSelected(false)
        if (rselected) rselected.markSelected(false)
        if (sselected) sselected.markSelected(false)
    }
    Core.on('map.click', function() { clearSelections() })
    pregion.prototype = {
        hover: function(val) {
            if (rselected != this) {
                this.pol.options.set('fillOpacity', val ? 0.5 : 0.3);
                this.pol.options.set('zIndex', val ? 11 : 10);
            }
        },
        draw: function() {
            if (!map) return;
            var r = this;
            if (r.pol) map.geoObjects.remove(r.pol);
            var reg = r.region;
            if (!reg.coords || !reg.coords.length ) return;
            var pol = new ymaps.Polygon([reg.coords, []], { hintContent: reg.name }, { zIndex: 10, fillOpacity: 0.3, fillColor: r.color });
            map.geoObjects.add(pol);
            pol.events.add('mouseenter', function(e) { r.hover(true) })
            pol.events.add('mouseleave', function(e) { r.hover(false) })
            pol.events.add('click', function(e) {
                Core.trigger('map.click', { coords: e.get('coords') })
                setTimeout(function() { r.select(); }, 1)
            })
            map.geoObjects.add(pol);
            r.pol = pol;
            r.clearStyle()
            if (reg.point) {
                if (r.place) map.geoObjects.remove(r.place);
                var place = new ymaps.Placemark(reg.point.coords, {
                    balloonContentHeader: reg.name,
                    balloonContentBody: reg.addr,
                    balloonContentFooter: reg.tel,
                    hintContent: reg.name,
                    iconContent: reg.number
                }, { //preset: 'islands#circleIcon',
                    preset: 'islands#circleIcon',
                    iconColor: '#00f'
                });
                r.place = place;
                map.geoObjects.add(place);
                place.events.add('click', function() { r.select(true); })
            }
        },
        clearStyle: function() {
            if (this.pol)
                this.pol.options.set('strokeWidth', 1).set('zIndex', 0).set('strokeColor', '#777');
        },
        calcRate: function() {
            var r = this;
            r.rate = calcRate(anvalues[r.region.number]);
            r.color = getRateColor(r)
        },
        select: function(focus, nostate) {
            var r = this;
            if (dselected) dselected.markSelected(false)
            if (rselected) rselected.markSelected(false)
            Core.trigger('region.select', { region: r})
            if (focus) {
                if (r.place) r.place.balloon.open();
                //clearSelections()
                if (map && r.pol) map.setCenter(getCenter(r.pol))
                if (!nostate) State.pushState({ type : 'region', rowId : r.ind})
            }
            rselected = r.markSelected(true);
        },
        number: function() {
            return this.region.number
        },
        markSelected: function(val) {
            if (this.place && !val) this.place.balloon.close();
            if (val && this.pol) {
                this.pol.options.set('strokeWidth', 4).set('zIndex', 11).set('strokeColor', '#444');
            } else {
                this.clearStyle()
            }
            return this
        },
        markGroouped: function(val) {
            if (val && this.pol) {
                this.pol.options.set('strokeWidth', 4).set('zIndex', 11).set('strokeColor', '#444');
            } else {
                this.clearStyle()
            }
            return this
        },
        show: function(val) {
            if (this.pol) this.pol.options.set('visible', val)
        },
        render: function(ank) {
            Core.trigger('region.select', { region: this, ank: ank })
        }
    }

    function pdepartment(d) { this.department = d; }
    pdepartment.prototype = {
        draw: function() {
            var d = this;
            var dep = this.department;
            if (d.place) map.geoObjects.remove(d.place);
            if (!dep.coords) return;
            var place = new ymaps.Placemark(dep.coords, {
                balloonContentHeader: dep.name,
                balloonContentBody: dep.addr,
                balloonContentFooter: dep.tel,
                hintContent: dep.name,
            }, { //preset: 'islands#circleIcon',
                preset: 'islands#circleDotIcon',
                iconColor: '#00f'
            });
            d.place = place;
            map.geoObjects.add(place);
            place.events.add('click', function() { d.select(); })
        },
        select: function(focus, nostate) {
            var d = this;
            Core.trigger('department.select', { department: d })
            if (focus) {
                if (map && d.place) map.setCenter(getCenter(d.place))
                clearSelections()
                if (d.place) d.place.balloon.open();

                if (!nostate) State.pushState({ type : 'department', rowId : d.ind})
            }
            if (dselected) dselected.markSelected(false)
            dselected = d.markSelected(true);
        },
        markSelected: function(val) {
            if (this.place) {
                this.regions.forEach(function(r) { r.markSelected(val) })
                this.place.options.set('visible', val)
                if (!val) this.place.balloon.close();
            }
            return this;
        },
        render: function() {
            Core.trigger('department.select', { department: this })
        },
        show: function(val) {
            if (this.place) this.place.options.set('visible', val)
        },
        number: function() {
            return this.department.number
        },
    }

    function psector(s) { this.sector = s; }
    psector.prototype = {
        draw: function() {
            var that = this;
            var s = this.sector;
            if (s.place) map.geoObjects.remove(s.place);
            if (!s.coords) return
            var place = new ymaps.Placemark(s.coords, {
                balloonContentHeader: s.name,
                balloonContentBody: s.raddr,
                balloonContentFooter: s.tel,
                hintContent: s.name,
                iconContent: 'У'
            }, { preset: 'islands#circleIcon', iconColor: 'black' });
            this.place = place;
            place.events.add('click', function() { that.select(true) })
            map.geoObjects.add(place);
        },
        select: function(focus) {
            var s = this;
            if (focus) {
                if (map) map.setCenter(s.sector.coords)
                    //if (s.place)  s.place.balloon.open();
            }
            if (sselected) sselected.markSelected(false);
            sselected = this.markSelected(true);
            if (s.region) s.region.render();
            s.render(focus)
        },
        render: function(focus) {
            Core.trigger('sector.select', { sector: this, focus: focus })
        },
        show: function(val) {
            if (this.place) this.place.options.set('visible', val)
        },
        markSelected: function(val) {
            if (this.place) {
                if (!val) this.place.balloon.close();
                this.place.options.set('visible', val)
            }
            return this;
        }
    }

    function parea(a) { this.area = a }
    parea.prototype = {
        draw: function() {
            var a = this.area;
            if (a.pol) map.geoObjects.remove(a.pol);
            var pol = new ymaps.Polygon([a.coords, []], { hintContent: a.name }, { zIndex: 0, strokeOpacity: 0.7, fillOpacity: 0, strokeColor: '#592167', strokeWidth: 2 });
            this.pol = pol;
            map.geoObjects.add(pol);
        },
        show: function(val) {
            this.pol.options.set('visible', val)
        }
    }
    return {
        wrapRegion: function(r) {
            return new pregion(r)
        },
        wrapArea: function(r) {
            return new parea(r)
        },
        wrapSector: function(r) {
            return new psector(r)
        },
        wrapDepartment: function(r) {
            return new pdepartment(r)
        }
    }
})()
