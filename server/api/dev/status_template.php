<?php
// Beautiful System Status Page
function show_status_page($title, $message, $type = 'maintenance') {
    $icon = ($type === 'maintenance') ? 'fa-screwdriver-wrench' : 'fa-user-slash';
    $color = ($type === 'maintenance') ? '#0ea5e9' : '#f43f5e';
    $bg = ($type === 'maintenance') ? 'rgba(14, 165, 233, 0.1)' : 'rgba(244, 63, 94, 0.1)';
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?php echo $title; ?> | ProSpine</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: <?php echo $color; ?>;
                --bg-accent: <?php echo $bg; ?>;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: #0f172a;
                color: #f8fafc;
                font-family: 'Outfit', sans-serif;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .container {
                position: relative;
                width: 100%;
                max-width: 500px;
                padding: 40px;
                text-align: center;
                z-index: 10;
            }
            .glass-card {
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 40px;
                padding: 60px 40px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .icon-box {
                width: 100px;
                height: 100px;
                background: var(--bg-accent);
                color: var(--primary);
                border-radius: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                margin: 0 auto 30px;
                position: relative;
            }
            .icon-box::after {
                content: '';
                position: absolute;
                inset: -10px;
                border: 2px solid var(--primary);
                border-radius: 35px;
                opacity: 0.2;
                animation: pulse 2s infinite;
            }
            h1 {
                font-size: 28px;
                font-weight: 800;
                margin-bottom: 16px;
                letter-spacing: -0.5px;
            }
            p {
                color: #94a3b8;
                line-height: 1.6;
                font-size: 16px;
                margin-bottom: 40px;
            }
            .btn-group {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                background: var(--primary);
                color: white;
                text-decoration: none;
                padding: 18px 32px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 15px;
                transition: all 0.3s;
                border: none;
                cursor: pointer;
                box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
                font-family: inherit;
            }
            .btn-secondary {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: none;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px -10px var(--primary);
                filter: brightness(1.1);
            }
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            .bg-glow {
                position: absolute;
                width: 400px;
                height: 400px;
                background: var(--primary);
                filter: blur(150px);
                opacity: 0.15;
                z-index: 1;
                border-radius: 50%;
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(40px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.2; }
                50% { transform: scale(1.1); opacity: 0.1; }
                100% { transform: scale(1); opacity: 0.2; }
            }
        </style>
    </head>
    <body>
        <div class="bg-glow"></div>
        <div class="container">
            <div class="glass-card">
                <div class="icon-box">
                    <i class="fa-solid <?php echo $icon; ?>"></i>
                </div>
                <h1><?php echo $title; ?></h1>
                <p><?php echo $message; ?></p>
                <div class="btn-group">
                    <a href="/admin/index.php" class="btn">
                        <i class="fa-solid fa-house"></i>
                        Go to Homepage
                    </a>
                    <button class="btn btn-secondary" onClick="window.location.reload()">
                        <i class="fa-solid fa-rotate-right"></i>
                        Refresh Page
                    </button>
                </div>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}
