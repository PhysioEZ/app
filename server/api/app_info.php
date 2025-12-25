<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// App Info - Version History
// Roadmap hidden as per request

$response = [
    'status' => 'success',
    'data' => [
        'releases' => [
            // LATEST RELEASE (v2.5.0)
            [
                'version' => '2.5.0',
                'date' => 'Dec 21, 2025',
                'description' => 'Major Update: Introducing a comprehensive Lab Tests module, a revamped Dashboard with Quick Actions, and premium UI enhancements.',
                'features' => [
                    ['title' => 'Dashboard Pro', 'desc' => 'Live Queues, One-Tap Actions, & Revenue Stats'],
                    ['title' => 'Lab Tests Module', 'desc' => 'Integrated Test Creation, Receipts, & Status Tracking'],
                    ['title' => 'Registration', 'desc' => 'Enhanced form with Patient Photo & Smart Validation'],
                    ['title' => 'Attendance', 'desc' => 'New Pending/Approval workflow for better control'],
                    ['title' => 'Premium UI', 'desc' => 'A stunning Glassmorphism design system in Violet & Teal'],
                ]
            ],
            // PREVIOUS RELEASE (v1.0.0 - Restored)
            [
                'version' => '1.0.0',
                'date' => 'Nov 01, 2025',
                'description' => 'A comprehensive clinic management solution designed for efficiency and ease of use.',
                'features' => [
                    ['title' => 'Dashboard', 'desc' => 'Real-time clinic overview & stats'],
                    ['title' => 'Inquiry', 'desc' => 'Lead management & follow-ups'],
                    ['title' => 'Registration', 'desc' => 'New patient onboarding'],
                    ['title' => 'Appointments', 'desc' => 'Scheduling & visit tracking'],
                    ['title' => 'Patients', 'desc' => 'Medical records & history'],
                    ['title' => 'Billing', 'desc' => 'Invoicing & payment processing'],
                    ['title' => 'Expenses', 'desc' => 'Budget tracking & expense management'],
                    ['title' => 'Support', 'desc' => 'Help center & issue reporting'],
                ]
            ]
        ]
    ]
];

echo json_encode($response);
