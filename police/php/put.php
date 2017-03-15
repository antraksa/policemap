<?php 

$key = $_POST['key'];
if ($key == 'anketa') {
	$datafile = '../data/resolved/anketa.json';
}  else if ($key == 'areas') {
	$datafile = '../data/resolved/areas.json';
} else if ($key == 'regions') {
	$datafile = '../data/resolved/regions.json';
}else if ($key == 'sectors') {
	$datafile = '../data/resolved/sectors.json';
}else if ($key == 'departments') {
	$datafile = '../data/resolved/departments.json';
}else if ($key == 'sectors-parsed-spb') {
	$datafile = '../data/sectors-parsed/ment-spb.json';
}else if ($key == 'sectors-parsed-msc') {
	$datafile = '../data/sectors-parsed/ment-msc.json';
}else if ($key == 'sectors-parsed-vo') {
	$datafile = '../data/sectors-parsed/ment-vo.json';
}
if (isset($datafile)) {
	$data = $_POST['data'];
	file_put_contents($datafile, $data);
}
?> 