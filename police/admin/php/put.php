<?php 

$key = $_POST['key']; 
$city = $_POST['city'];
if ($key == 'anfields') {
	$datafile = '../../data/resolved/anfields.json';
} else if ($key == 'anvalues') {
	$datafile = '../../data/resolved/'.$city.'/anvalues.json';
} else if ($key == 'areas') {
	$datafile = '../../data/resolved/'.$city.'/areas.json';
} else if ($key == 'regions') {
	$datafile = '../../data/resolved/'.$city.'/regions.json';
}else if ($key == 'sectors') {
	$datafile = '../../data/resolved/'.$city.'/sectors.json';
}else if ($key == 'departments') {
	$datafile = '../../data/resolved/'.$city.'/departments.json';
}else if ($key == 'sectors-parsed') {
	$datafile = '../../data/sectors-parsed/'.$city.'/ment.json';
}else if ($key == 'meta') {
	$datafile = '../../data/resolved/'.$city.'/meta.json';
}else if ($key == 'static-home') {
	$datafile = '../../static-'.$city.'.html';
}
if (isset($datafile)) {
	$data = $_POST['data'];
	file_put_contents($datafile, $data);
}
?> 