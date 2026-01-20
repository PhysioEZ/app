<?php
// Firebase Service Account Config Path
// User stated path: /admin/mobile/config/firebase_service_account.json
// Relative to API (api/admin/...) -> ../../../config/
// Relative to API (api/...) -> ../config/

// Search for credentials in multiple possible locations
$credentialsPath = __DIR__ . '/../config/firebase_service_account.json';
$possiblePaths = [
    __DIR__ . '/../config/firebase_service_account.json',
    __DIR__ . '/../../config/firebase_service_account.json',
    '/srv/http/admin/app/server/config/firebase_service_account.json',
    '/srv/http/admin/mobile/config/firebase_service_account.json' // User's mentioned path
];

foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $credentialsPath = $path;
        break;
    }
}

define('FIREBASE_CREDENTIALS_PATH', $credentialsPath);

function getAccessToken() {
    if (!file_exists(FIREBASE_CREDENTIALS_PATH)) {
        error_log("Firebase credentials not found at: " . FIREBASE_CREDENTIALS_PATH);
        return null;
    }

    $credentials = json_decode(file_get_contents(FIREBASE_CREDENTIALS_PATH), true);
    if (!$credentials) return null;

    // Simple Google OAuth 2.0 implementation without composer
    // NOTE: For production, using google/auth library via composer is recommended
    // But since this is a PHP-only environment without composer availability guaranteed:
    
    $now = time();
    $header = ['alg' => 'RS256', 'typ' => 'JWT'];
    $payload = [
        'iss' => $credentials['client_email'],
        'sub' => $credentials['client_email'],
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
        'scope' => 'https://www.googleapis.com/auth/cloud-platform'
    ];

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($header)));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

    $signature = '';
    openssl_sign(
        $base64UrlHeader . "." . $base64UrlPayload, 
        $signature, 
        $credentials['private_key'], 
        'SHA256'
    );
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    // Exchange JWT for Access Token
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}

function sendDetailsNotification($userId, $title, $body, $data = []) {
    global $pdo;
    
    // Get Device Token
    $stmt = $pdo->prepare("SELECT token FROM user_device_tokens WHERE user_id = ? ORDER BY last_updated DESC LIMIT 1");
    $stmt->execute([$userId]);
    $token = $stmt->fetchColumn();

    if (!$token) {
        error_log("No device token found for user ID: $userId");
        return false;
    }

    $accessToken = getAccessToken();
    if (!$accessToken) {
        error_log("Failed to generate Firebase Access Token");
        return false;
    }

    // FCM V1 API URL (Project ID is in credentials)
    $credentials = json_decode(file_get_contents(FIREBASE_CREDENTIALS_PATH), true);
    $projectId = $credentials['project_id'];
    $url = "https://fcm.googleapis.com/v1/projects/$projectId/messages:send";

    $payload = [
        'message' => [
            'token' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body
            ],
            'data' => $data,
            'android' => [
                'priority' => 'high',
                'notification' => [
                    'channel_id' => 'default',
                    'sound' => 'default'
                ]
            ]
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 400) {
        error_log("FCM Error: " . $result);
        return false;
    }

    return true;
}
?>
