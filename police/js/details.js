Core.on('ready', function() {
	var regions, sectors, templates, map,  areas;
	Core.on('init', function(args) {
		templates = args.templates;
		areas = args.areas;
		sectors = args.sectors;
		map = args.map;
		console.log('init', args)
	})

	var $details = $('#details');

	var $ddetails = $('#department-details');
	Core.on('department.select', function(args) {
		renderDepartment(args.department)
		$dtoggle.eq(0).trigger('click')
	})
	function renderDepartment(department) {
		$ddetails.html(Mustache.render(templates.department, department))
		.find('.sub-item').on('click',function() {
			var r = department.regions[$(this).index()]
			r.select(true)
		})
	}

	var $rdetails = $('#region-details');
	Core.on('region.select', function(args) {
		 renderRegion(args.region);
		 $dtoggle.eq(1).trigger('click')
   	})
   	function renderRegion(region) {
   		var rdata = region.region;
		$rdetails.html(Mustache.render(templates.region, region))
		$rdetails.find('.btn-edit').on('click', function() {
			edit(region, true)
		})
		$rdetails.find('.btn-save').on('click', function() {
			edit(region, false)			
			Core.trigger('mess', {mess : 'Отделение сохранено'})
		})
		$rdetails.find('.btn-cancel').on('click', function() {
			edit(region, false)
		})
		$rdetails.find('.btn-ank').on('click', function() {
			Core.trigger('region-anketa.select', {region : region})
		}) 

		if (region.department)	Core.trigger('department.select', {department : region.department})
     	console.log('select region', region)
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

   	var $sdetails = $('#sector-details');
   	Core.on('sector.select', function(args) {
		var sector = args.sector;
   		$sdetails.html(Mustache.render(templates.sector, sector))
   		if (args.focus)
   			$dtoggle.eq(2).trigger('click')
		console.log('select sector', sector)
   	})

   	var $dtoggle = $('#details-toggle a').on('click', function() {
        $(this).addClass('selected').siblings().removeClass('selected');
        $details.children().eq($(this).index()).addClass('shown').siblings().removeClass('shown')
    })
   	function dataHandler(data, handler) {
   		return function(e) {
   			console.log(this, $(this).index())
   			var o = data[$(this).index()];
   			handler.call(this, e, o)
   		}
	}
	
})