'use strict'
var ObjectWrapper = (function() {
    var anfields, anvalues, map, mapobjects;
    Core.on('init', function(args) {
        anfields = args.anfields;
        anvalues = args.anvalues;
    })
    Core.on('map-init', function(args) {map = args.map; mapobjects = args.mapobjects }) 

    function pregion (r) {this.region = r; } 
    function getRate(rate) {
        return (rate) ? {val : rate, formatted : Math.round(rate*5) } : {val : 0, formatted : '?' }
    }
    function calcRate(vals) {
        if (vals && vals.length > 0) {
            var count = 0, all = 0;
            anfields.forEach(function(fi, i) {
                if (fi.hidden || vals[i]==undefined) return;
                if (vals[i]) count++;
                all++;
            }) 
            return getRate(count/all);
        }
         
    }
    function getRateColor(r) {
        var h, s = 1, l = 0.5;
        if (!r.rate) return '#fff'
        var tr = r.rate.val;

        h = (100 * tr)/360;
        //console.log(tr, h , s ,l)
       var rgb = Common.hslToRgb(h,s,l);
       return 'rgb({0},{1}, {2})'.format(rgb[0], rgb[1], rgb[2]) ;

    }
    function  getCenter(p) {
       var pb = p.geometry.getPixelGeometry().getBounds();
       var pixelCenter = [pb[0][0] + (pb[1][0] - pb[0][0]) / 2, (pb[1][1] - pb[0][1]) / 2 + pb[0][1]];
       var geoCenter = map.options.get('projection').fromGlobalPixels(pixelCenter, map.getZoom());
       return geoCenter;
    }
    var rselected, dselected;
    Core.on('map.click', function() { 
        console.log(dselected, rselected)
        if (dselected) dselected.markSelected(false)
        if (rselected) rselected.markSelected(false)
    })
    
    pregion.prototype = {
        hover : function(val) {
            if (rselected != this) {
                this.pol.options.set('fillOpacity',  val ? 0.5 : 0.3); 
                this.pol.options.set('zIndex',  val ? 11 : 10); 
            }
        },
        draw : function() {
            var r = this;
            if (r.pol) map.geoObjects.remove(r.pol);
            if (r.place) map.geoObjects.remove(r.place);

            var reg = r.region;
          
            var pol = new ymaps.Polygon([reg.coords, []], { hintContent : reg.name}, {   zIndex: 10,  fillOpacity:0.3, fillColor : r.color });
            map.geoObjects.add(pol);
            pol.events.add('mouseenter', function (e) {r.hover(true)}) 
            pol.events.add('mouseleave', function (e) {r.hover(false)}) 
            pol.events.add('click', function(e) { 
                //if (dselected) 
                Core.trigger('map.click', {coords : e.get('coords')})
                setTimeout(function() {r.select(); }, 1) 
            })
            map.geoObjects.add(pol);
          
            r.pol = pol;
            r.clearStyle()
            if (reg.point) {
                var place = new ymaps.Placemark(reg.point.coords, {
                    balloonContentHeader: reg.name,
                    balloonContentBody: reg.addr,
                    balloonContentFooter: reg.tel,
                    hintContent: reg.name,
                    iconContent: reg.number
                },{//preset: 'islands#circleIcon',
                    preset: 'islands#circleIcon',
                    iconColor: '#00f'
                });
                r.place = place;
                map.geoObjects.add(place);
                place.events.add('click', function() {r.select(); }) 
            }
        },
        clearStyle : function() {
            if (this.pol)
                this.pol.options.set('strokeWidth', 1).set('zIndex', 10).set('strokeColor',  '#777'); 
        },
        calcRate : function() {
            var r = this;
            r.rate =  calcRate(anvalues[r.region.number]);
            r.av = anvalues[r.region.number];
            r.color = getRateColor(r)
        },
        select : function(ank) {
             Core.trigger('region.select', {region : this, ank : ank})
             //if (this.place)  this.place.balloon.open();
             if (map) map.setCenter(getCenter(this.pol))
             rselected = this.markSelected(true);
        },number : function() {
            return this.region.number
        },

        markSelected : function(val) {
            if (val &&  this.pol) {
                this.pol.options.set('strokeWidth', 4).set('zIndex',11).set('strokeColor', '#444'); 
            } else {
                this.clearStyle()
            }
            return this
        },markGroouped : function(val) {
            if (val &&  this.pol) {
                this.pol.options.set('strokeWidth', 4).set('zIndex',11).set('strokeColor', '#444'); 
            } else {
                this.clearStyle()
            }
            return this
        },
        show : function(val) { 
            this.pol.options.set('visible', val) 
        } ,
        render : function(ank) {
            Core.trigger('region.select', {region : this, ank : ank})
        }   
    }
    function pdepartment (d) {this.department = d; } 
    pdepartment.prototype = {
        draw : function() {
            var d  = this;
            var dep = this.department;
            if (d.place) map.geoObjects.remove(d.place);
            if (!dep.coords) return;
            var place = new ymaps.Placemark(dep.coords, {
                balloonContentHeader: dep.name,
                balloonContentBody: dep.addr,
                balloonContentFooter: dep.tel,
                hintContent: dep.name,
            },{//preset: 'islands#circleIcon',
                preset:'islands#blueHomeCircleIcon',
                iconColor: '#00f'
            });
            d.place = place;
            map.geoObjects.add(place);
            place.events.add('click', function() {d.select(); }) 
        }, select : function(val) {
            Core.trigger('department.select', {department : this})
             //if (this.place)  this.place.balloon.open();
            if (map) map.setCenter(getCenter(this.place))
            if (dselected)  dselected.markSelected(false)  
            dselected = this.markSelected(true);
            //console.warn(this)
        }, markSelected : function(val) {
            this.regions.forEach(function(r) {
                r.markSelected(val)
            }) 
            rselected = false;
            return this;
        },
        render : function() {
            Core.trigger('department.select', {department : this})
        } ,
        show : function(val) { 
            this.place.options.set('visible', val) 
        }   
    }
    function psector (s) {this.sector = s; } 
    psector.prototype = {
        draw : function() {
            var s = this.sector;
            if (s.place) map.geoObjects.remove(s.place);
            if (!s.coords) return
            var place = new ymaps.Placemark(s.coords, {
                balloonContentHeader: s.name,
                balloonContentBody: s.raddr,
                balloonContentFooter: s.tel,
                hintContent: s.name
            }, {  preset: 'islands#circleIcon', iconColor: 'black'});

            //console.log(s)
            this.place = place;
            place.events.add('click', s.select) 
            map.geoObjects.add(place);
            return [place]
        }, select : function() {
            var s = this;
            if (s.place)  s.place.balloon.open();
            if (map) map.setCenter(s.sector.coords)
            Core.trigger('sector.select', {sector : s})
        },
        render : function() {
            Core.trigger('sector.select', {sector : this})
        },
        show : function(val) { 
            if (this.place)    this.place.options.set('visible', val) 
        }    
    }

    function parea (a) { this.area = a}
    parea.prototype = {
        draw : function() {
            var a = this.area;
            if (a.pol) map.geoObjects.remove(a.pol);
            var pol = new ymaps.Polygon([a.coords, []], { hintContent : a.name}, { zIndex: 0,  strokeOpacity:0.7, fillOpacity:0, strokeColor : '#592167', strokeWidth : 2});
            this.pol = pol;
            map.geoObjects.add(pol);
        },
        show : function(val) { 
            this.pol.options.set('visible', val) 
        }   
    }

    return {
        wrapRegion : function(r) {  return new pregion(r)  },
        wrapArea : function(r) {  return new parea(r)  },
        wrapSector : function(r) {  return new psector(r)  },
        wrapDepartment : function(r) {  return new pdepartment(r)  }
    }

})()