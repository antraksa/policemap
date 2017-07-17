'use strict';

function createStatic() {
    var $map = $('#map'),
        dpoints = [],
        dtimeout;
    $map.on('click', function() {
        $('body').addClass('mobile-details-view')
    })
    var map = {
        setCenter: function(c, zoom) {
            if (!zoom) zoom = 10;
            this.render(c, zoom)
        },
        delayMarkPoint: function(p, zoom) {
            return; //!!!!
            dpoints.push(p)
            if (dtimeout) return;
            dtimeout = setTimeout(function() {
                var sum = [0, 0]
                dpoints.forEach(function(p) {
                    sum[0] += p.coords[0];
                    sum[1] += p.coords[1];
                })
                var c = [sum[0] / dpoints.length, sum[1] / dpoints.length];
                //console.log('ce', c)
                map.markPoints(c, dpoints, zoom)
                console.log('delayMarkPoint', dpoints)
                dpoints = [];
                dtimeout = null;
            }, 300)
        },
        markPoint: function(p, zoom) {
            console.warn('markPoint', p);
            this.render(p.coords, zoom, [p])
        },
        markPoints: function(c, points, zoom) {
            console.warn('markPoints', c, points);
            this.render(c, zoom, points)
        },
        render: function(c, zoom, points) {
            console.warn('render', c, points);
            var url = 'https://static-maps.yandex.ru/1.x/?ll={0},{1}&l=map&';
            var pt = '';
            if (points) {
                if (points.length == 1) zoom = 15;
                pt = '&pt=';
                points.forEach(function(p) {
                    var pc = p.coords;
                    pt += '{0},{1},{2}~'.format(pc[1], pc[0], p.preset);
                })
                pt = pt.substr(0, pt.length - 1)
            }
            if (zoom) {
                url += 'z={0}&'.format(zoom)
            }
            $map.css('background-image', 'url({0})'.format(url.format(c[1], c[0], zoom) + pt))
        },
        renderStaticHome : function (c) {
            return;
            var rp = regions.filter(function(r) {
                return r.region.point
            }).map(function(r) {
                return {
                    coords: r.region.point.coords,
                    preset: 'pmlbs' + r.region.number
                }
            })
            var dp = departments.filter(function(d) {
                return d.department.coords
            }).map(function(d) {
                return {
                    coords: d.department.coords,
                    preset: 'pmbls'
                }
            }) //    .slice(0,5)
            map.markPoints(c, dp.concat(rp))
        }
    };
    return map;
};