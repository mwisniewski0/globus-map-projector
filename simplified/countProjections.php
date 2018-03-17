<?php
$counter = fopen("counter", "r");
$timesUsed = intval(fread($counter,filesize("counter")));
$timesUsed++;
fclose($counter);
$counter = fopen("counter", "w");
fwrite($counter, $timesUsed);
fclose($counter);
?>