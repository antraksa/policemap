$(function() {
	var $all = $('#all-list').find('.item');
	var oldQ;
	$('#txt-search').on('change keyup', function() {
		var q = $(this).val().trim().toLowerCase()
		console.log(q)
		if (!q || oldQ == q) {
			oldQ = null;
			$all.show();
			return;
		}
		oldQ = q;
		$all.hide();
		var $filtered = $all.filter(function() {
			var title = $(this).find('.title').text().trim().toLowerCase();
			return (title.indexOf(q) >=0);
		}).show();
	})

	var map = createStatic();
})