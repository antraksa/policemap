var ObjectWrapper = (function() {
    var anfields, anvalues, map, mapobjects;
    Core.on('init', function(args) {
        anfields = args.anfields;
        anvalues = args.anvalues;
    })
    Core.on('map-init', function(args) {map = args.map; mapobjects = args.mapobjects }) 

    var selected;
    function pregion (r) {this.region = r; } 
    function getRate(rate) {
        return (rate) ? {val : rate, formatted : Math.round(rate*5) } : {val : 0, formatted : '?' }
    }
    function calcRate(vals) {
        if (vals) {
            var count = 0, all = 0;
            anfields.forEach(function(fi, i) {
                if (fi.hidden) return;
                if (vals[i]) count++;
                all++;
            }) 
            var rate = (count/all);
        }
        return getRate(rate)
    }
    function getRateColor(r) {
        var h, s = 1, l = 0.5;
        var tr = r.rate.val;
        h = (100 * tr)/360;
        //console.log(tr, h , s ,l)
       if (isNaN(tr)) return '#fff'
       var rgb = Common.hslToRgb(h,s,l);
       return 'rgb({0},{1}, {2})'.format(rgb[0], rgb[1], rgb[2]) ;

    }
    function  getCenter(p) {
       var pb = p.geometry.getPixelGeometry().getBounds();
       var pixelCenter = [pb[0][0] + (pb[1][0] - pb[0][0]) / 2, (pb[1][1] - pb[0][1]) / 2 + pb[0][1]];
       var geoCenter = map.options.get('projection').fromGlobalPixels(pixelCenter, map.getZoom());
       return geoCenter;
    }
    function hover(r, val) {
        if (selected != r) {
            r.pol.options.set('strokeWidth',  val ? 2 : 1); 
            r.pol.options.set('zIndex',  val ? 11 : 10); 
        }
    }
    pregion.prototype = {
        draw : function() {
            var r = this;
            var reg = r.region;
            // if (r.pol) {
            //     mapobjects.regions.splice(mapobjects.regions.indexOf(r.pol), 1)
            //     map.geoObjects.remove(r.pol);
            // }
            // if (r.place) {
            //     mapobjects.regionPoints.splice(mapobjects.regionPoints.indexOf(r.pol), 1)
            //     map.geoObjects.remove(r.place);
            // }
            var pol = new ymaps.Polygon([reg.coords, []], { hintContent : reg.name}, {   zIndex: 10,  fillOpacity:0.3, strokeWidth:1, strokeColor :  '#777', fillColor : r.color });
            map.geoObjects.add(pol);
            pol.events.add('mouseenter', function (e) {hover(r, true)}) 
            pol.events.add('mouseleave', function (e) {hover(r, false)}) 
            pol.events.add('click', function(e) { r.select();  
                selected = r; 
                Core.trigger('map.click', {coords : e.get('coords')})
            }) 
            r.pol = pol;
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
                place.events.add('click', function() {r.select(); selected = r; }) 
            }
            return [pol, place]
        },
        calcRate : function() {
            var r = this;
            r.rate =  calcRate(anvalues[r.region.number]);
            r.color = getRateColor(r)
        },
        select : function(ank) {
             Core.trigger('region.select', {region : this, ank : ank})
             //if (this.place)  this.place.balloon.open();
             if (map) map.setCenter(getCenter(this.pol))
             if (selected) {
                selected.markSelected(false)
             }
             selected = this.markSelected(true);
        },
        markSelected : function(val) {
            if (this.pol)
                this.pol.options.set('strokeWidth', val ? 4 : 1).set('zIndex', val ? 11 : 10).set('strokeColor',  val ? '#444' : '#777'); 
            return this
        },
        render : function(ank) {
            Core.trigger('region.select', {region : this, ank : ank})
        }   
    }

    function pdepartment (d) {this.department = d; } 
    pdepartment.prototype = {
        draw : function() {
            var d  = this;
            var dep = this.department;
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
            place.events.add('click', function() {d.select(); }) 
            return [place];
        }, select : function() {
             Core.trigger('department.select', {department : this})
             //if (this.place)  this.place.balloon.open();
             if (map) map.setCenter(getCenter(this.place))
            this.regions.forEach(function(r) {
                r.markSelected(true)
            })  

        },
        render : function() {
            Core.trigger('department.select', {department : this})
        }   
    }
    function psector (s) {this.sector = s; } 
    psector.prototype = {
        draw : function() {
            var s = this.sector;
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
            return [place]
        }, select : function() {
            var s = this;
            if (s.place)  s.place.balloon.open();
            if (map) map.setCenter(s.sector.coords)
            Core.trigger('sector.select', {sector : s})
        },
        render : function() {
            Core.trigger('sector.select', {sector : this})
        }   
    }

    return {
        wrapRegion : function(r) {  return new pregion(r)  },
        wrapSector : function(r) {  return new psector(r)  },
        wrapDepartment : function(r) {  return new pdepartment(r)  }
    }

})()