<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "Current Directory: " . __DIR__ . "\n";

$targetPaths = [
    '/srv/http/admin/common/send_push.php',
    __DIR__ . '/../../../../common/send_push.php',
    $_SERVER['DOCUMENT_ROOT'] . '/admin/common/send_push.php'
];

foreach ($targetPaths as $path) {
    echo "Checking path: $path ... ";
    if (file_exists($path)) {
        echo "FOUND.\n";
        include_once $path;
        if (function_exists('sendDetailsNotification')) {
            echo "SUCCESS: Function 'sendDetailsNotification' loaded.\n";
            // Check credentials path from included file context
            if (defined('FIREBASE_CREDENTIALS_PATH')) {
                echo "Credentials Path constant: " . FIREBASE_CREDENTIALS_PATH . "\n";
                if (file_exists(FIREBASE_CREDENTIALS_PATH)) {
                    echo "Credentials File: FOUND\n";
                } else {
                    echo "Credentials File: NOT FOUND\n";
                }
            } else {
                echo "Credentials Path constant: NOT DEFINED\n";
            }
            exit(0);
        } else {
            echo "FAILED: File included but function not found??\n";
        }
    } else {
        echo "NOT FOUND.\n";
    }
}

echo "CRITICAL FAILURE: Could not load send_push.php from any known location.\n";
