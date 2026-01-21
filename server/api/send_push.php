<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// --- Configuration (Matches push_broadcast.php) ---
$DB_HOST = 'srv2050.hstgr.io';
$DB_NAME = 'u861850327_prospine';
$DB_USER = 'u861850327_root';
$DB_PASS = 'Spine33#';

// Firebase credentials path
$possibleFirebasePaths = [
    __DIR__ . '/../config/firebase_service_account.json',
    __DIR__ . '/../../config/firebase_service_account.json',
    '/srv/http/admin/app/server/config/firebase_service_account.json',
    '/home/u861850327/domains/prospine.in/public_html/admin/mobile/config/firebase_service_account.json'
];

$FIREBASE_JSON = null;
foreach ($possibleFirebasePaths as $path) {
    if (file_exists($path)) {
        $FIREBASE_JSON = $path;
        break;
    }
}

if (!$FIREBASE_JSON) {
    echo json_encode(['status' => 'error', 'message' => 'Firebase Service Account JSON not found']);
    exit;
}

// --- Functions ---
function getDb() {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    $dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";
    try {
        return new PDO($dsn, $DB_USER, $DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (Exception $e) {
        // Return JSON error instead of die()
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => "Database Connection failed: " . $e->getMessage()]);
        exit;
    }
}

function getAccessToken($jsonPath) {
    if (!file_exists($jsonPath)) {
        error_log("Credential file missing at: $jsonPath");
        return null;
    }
    $credentials = json_decode(file_get_contents($jsonPath), true);
    if (!$credentials) return null;

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
    openssl_sign($base64UrlHeader . "." . $base64UrlPayload, $signature, $credentials['private_key'], 'SHA256');
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $jwt]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}

// CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

// Handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read JSON Input
    $input = json_decode(file_get_contents('php://input'), true);
    $title = $input['title'] ?? 'PhysioEZ';
    $message = $input['message'] ?? '';
    $isBroadcast = $input['broadcast'] ?? false;
    $targetUserId = $input['user_id'] ?? null;

    if (empty($message)) {
        echo json_encode(['status' => 'error', 'message' => 'Message is required']);
        exit;
    }

    try {
        $pdo = getDb();
        $accessToken = getAccessToken($FIREBASE_JSON);

        if (!$accessToken) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to generate Firebase Access Token']);
            exit;
        }

        $credentials = json_decode(file_get_contents($FIREBASE_JSON), true);
        $projectId = $credentials['project_id'];
        $url = "https://fcm.googleapis.com/v1/projects/$projectId/messages:send";

        // Select Targets
        if ($isBroadcast) {
            $stmt = $pdo->query("SELECT DISTINCT token, employee_id FROM user_device_tokens");
            $targets = $stmt->fetchAll();
        } elseif ($targetUserId) {
            // App sends user_id which is now employee_id
            $stmt = $pdo->prepare("SELECT token, employee_id FROM user_device_tokens WHERE employee_id = ? ORDER BY last_updated DESC LIMIT 1");
            $stmt->execute([$targetUserId]);
            $targets = $stmt->fetchAll();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid target (Specify broadcast:true or user_id)']);
            exit;
        }

        if (empty($targets)) {
            echo json_encode([
                'status' => 'success',
                'message' => 'No registered devices found. Nothing to send.',
                'count' => 0,
                'debug_errors' => []
            ]);
            exit;
        }

        $successCount = 0;
        $errors = [];

        foreach ($targets as $target) {
            $token = $target['token'];
            
            // Exact payload structure from push_broadcast.php (Working)
            $payload = [
                'message' => [
                    'token' => $token,
                    'notification' => ['title' => $title, 'body' => $message],
                    'android' => ['priority' => 'high', 'notification' => ['channel_id' => 'default', 'sound' => 'default']]
                ]
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken, 'Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode < 400) {
                $successCount++;
            } else {
                $responseObj = json_decode($response, true);
                $errorCode = $responseObj['error']['details'][0]['errorCode'] ?? null;
                
                if ($errorCode === 'UNREGISTERED') {
                    // Token is stale/invalid, delete it
                    $delStmt = $pdo->prepare("DELETE FROM user_device_tokens WHERE token = ?");
                    $delStmt->execute([$token]);
                    $errors[] = "Employee " . ($target['employee_id'] ?? 'Unknown') . ": Token invalid (UNREGISTERED). Device token has been removed from database.";
                } else {
                    $errors[] = "Employee " . ($target['employee_id'] ?? 'Unknown') . ": HTTP $httpCode - $response";
                }
            }
        }

        echo json_encode([
            'status' => 'success',
            'message' => "Process complete. Success: $successCount, Failed: " . count($errors),
            'count' => count($targets),
            'debug_errors' => $errors
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>
