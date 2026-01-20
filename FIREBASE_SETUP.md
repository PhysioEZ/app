# Firebase Cloud Messaging (FCM) Setup Guide

To enable notifications even when the app is closed, you must set up Firebase.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the steps (name it `ProSpine Mobile`).
3. Disable Google Analytics (optional, for simplicity).

## Step 2: Add Android App

1. In the Firebase Project Overview, click the **Android** icon.
2. Enter the Package Name:
   - Open `/srv/http/admin/app/frontend/android/app/build.gradle` to find your `applicationId`.
   - It is likely `com.prospine.app` or similar.
3. Click **Register App**.
4. Download `google-services.json`.
5. **IMPORTANT**: Place this file in:
   `/srv/http/admin/app/frontend/android/app/google-services.json`

## Step 3: Get Server Key (for PHP Backend)

1. In Firebase Console, go to **Project Settings** (Gear icon) > **Service accounts**.
2. Click **Generate new private key**.
3. Save the JSON file. Rename it to `firebase_service_account.json`.
4. Upload this file to your server (e.g., `/srv/http/admin/app/server/config/firebase_service_account.json`).

## Step 4: Add Capacitor Plugin

Run these commands in your terminal (inside `app/frontend`):

```bash
npm install @capacitor/push-notifications
npx cap update
```

## Step 5: Database Update

You need a table to store user device tokens. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS user_device_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) DEFAULT 'android',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token (token)
);
```
