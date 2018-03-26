'use strict';
$(function() {
    Core.on('init', function(initArgs) {
        var regions, sectors, map, areas;
        var templates = initArgs.templates;
        Core.on('load', function(args) {
            areas = args.areas;
            sectors = args.sectors;
            map = args.map;
        })
        var $details = $('#details'),
            $ddetails = $('#department-details'),
            $rdetails = $('#region-details'),
            $sdetails = $('#sector-details');

        if (location.href.indexOf('admin') > 0) {
            var isAdmin = true;
            $('[local-url]').each(function() {
                this.href = '../' + $(this).attr('href')
            })
        }

        Core.on('department.select', function(args) {
            args.department.markPointOpacity(true);
            renderDepartment(args.department)
            toggleType('department')
            $('body').addClass('mobile-details-view')
        })
        var curDepartment, curRegion, curSector;

        function renderDepartment(department) {
            curDepartment = department;
            $ddetails.html(Mustache.render(templates.department, department))
                .find('.dep-regions').on('click', function() {
                    var r = department.regions[$(this).index()]
                    r.select(true)
                })
            if (!department) return;
            if (department.department.photo) initFoto($ddetails)
            initPanels($ddetails)
            console.log('select department', department)
        }
        Core.on('details.clear', function(args) {
            renderRegion();
            renderSector();
            renderDepartment();
            toggleType()
        })

        Core.on('region.select', function(args) {
            renderRegion(args.region);
            renderSector({});
            toggleType('region')
            $('body').addClass('mobile-details-view')
        })

        $('#main-info-list').find('[data-link]').on('click', function() {
            var link = $(this).attr('data-link');
            if (isAdmin) link = '../' + link;
            $('#info-holder-iframe').attr('src', link)
            $('#info-holder').addClass('expanded')
        })

        function renderRegion(region) {
            $rdetails.html(Mustache.render(templates.region, region))
            curRegion = region;
            if (!region) return;
            console.log('select region', region)
            var rdata = region.region;
            $rdetails.find('.btn-edit').on('click', function() {
                edit(region, true)
            })

            // $rdetails.find('.btn-save').on('click', function() {
            //     edit(region, false)
            //     Core.trigger('mess', { mess: 'Отделение сохранено' })
            // })
            // $rdetails.find('.btn-cancel').on('click', function() {
            //     edit(region, false)
            // })
            $rdetails.find('.btn-ank').on('click', function() {
                Core.trigger('region-anketa.select', { region: region })
            })
            if (region.department && curDepartment != region.department) {
                Core.trigger('department.select', { department: region.department, nofocus: true })
            }
            $('#details-rate-toggle').on('click', function() {
                $('#details-rate').toggleClass('expanded')
            })
            Core.trigger('details.rendered', { region: region, $rdetails: $rdetails })
            if (rdata.photo) initFoto($rdetails)
            initPanels($rdetails)
        }

        function initPanels($cont) {
            $cont.find('.more').on('click', function() {
                $(this).toggleClass('expanded')
                $('.pane.details').animate({
                    scrollTop: $(this).offset().top + 1000
                }, 500);
            })
        }

        function initFoto($cont) {
            $cont.find('.photo').on('click', function() {
                $('#photo-large').addClass('expanded').find('#photo-large-img').css('background-image', $(this).css('background-image'))
            })
        }
        $('#photo-large .btn-close, #info-holder .btn-close').on('click', function() {
            $('#photo-large').removeClass('expanded')
            $('#info-holder').removeClass('expanded')
        })

        Core.on('sector.select', function(args) {
            renderSector(args.sector, args.focus);
            $('body').addClass('mobile-details-view');
        })

        function renderSector(sector, focus) {
            $sdetails.html(Mustache.render(templates.sector, sector))
            if (!sector) return;
            if (focus) {
                toggleType('sector')
            }
            $('#sector-reg-link').on('click', function() {
                if (sector.region)
                    sector.region.select(true)
            })
            $('#sector-dep-link').on('click', function() {
                console.log(sector.departments)
                if (sector.region && sector.region.department)
                    sector.region.department.select(true)
            })
            initPanels($sdetails)
        }

        function edit(region, val) {
            $rdetails.toggleClass('edit-mode', val)
            var pol = region.pol;
            if (!pol) return;
            if (val) {
                pol.editor.startEditing();
                $rdetails.find('.editable').attr('contentEditable', true)
            } else {
                var coords = pol.geometry.getBounds();
                pol.editor.stopEditing();
                region.draw();
            }
        }
        
        function toggleType(type) {
            if (type) {
                $('#{0}-details'.format(type)).addClass('shown').siblings().removeClass('shown')
                $('#pane-details').removeClass('collapsed')
            } else  {
                //$('#details').children().removeClass('shown')
                //$('#pane-details').addClass('collapsed')
            }
        }

        // $('#btn-main-menu').on('click', function() {
        //     $(this).toggleClass('selected');
        //     $('#main-nav').toggleClass('expanded');
        // })
        //$('#btn-main-menu').popup({ popup: $('#main-nav') })

        $('#back-to-map').on('click', function() {
            $('body').removeClass('mobile-details-view')
        })
        $('#btn-details-hide').on('click', function() {
            $('#pane-details').addClass('collapsed')
        })

        Core.on('map-click.resolved', function(args) {
            //console.log('map-click.resolved', args)
            $('.cur-address').html(Mustache.render(templates.curAddress, args))
        })

        function dataHandler(data, handler) {
            return function(e) {
                console.log(this, $(this).index())
                var o = data[$(this).index()];
                handler.call(this, e, o)
            }
        }
    })
})