<?php
$file = __DIR__ . '/traffic_logger.php';
$content = file_get_contents($file);
$clean_content = str_replace(
    "error_log('TRAFFIC_LOGGER_HIT: ' . \$_SERVER['REQUEST_URI']);",
    "",
    $content
);
$clean_content = preg_replace("/\n\n+/", "\n\n", $clean_content);
file_put_contents($file, $clean_content);
echo "Cleaned up logger. Removing self...";
unlink(__FILE__);
