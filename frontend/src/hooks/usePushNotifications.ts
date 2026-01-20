import { useEffect } from 'react';
import { 
    PushNotifications, 
    Token, 
    RegistrationError, 
    PushNotificationSchema, 
    ActionPerformed 
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const usePushNotifications = () => {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;
        
        // Push Notifications only work on native devices (Android/iOS)
        if (!Capacitor.isNativePlatform()) {
            console.log("Push Notifications: Skipped (Not native platform)");
            return;
        }

        const registerPush = async () => {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn("Push Notifications: Permission denied");
                return;
            }

            await PushNotifications.register();
        };

        const addListeners = async () => {
            await PushNotifications.removeAllListeners();

            // Registration Success: Send token to backend
            await PushNotifications.addListener('registration', async (token: Token) => {
                console.log('Push Registration Token:', token.value);
                try {
                    const empId = (user as any).employee_id || user.id;
                    console.log(`Push Notifications: Attempting to save token for user ${empId} to ${API_URL}/save_token.php`);
                    const response = await fetch(`${API_URL}/save_token.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: empId,
                            token: token.value,
                            platform: Capacitor.getPlatform()
                        })
                    });
                    const result = await response.json();
                    console.log("Push Notifications: Save result:", JSON.stringify(result));
                } catch (error) {
                    console.error("Push Notifications: Failed to save push token", error);
                }
            });

            // Registration Error
            await PushNotifications.addListener('registrationError', (err: RegistrationError) => {
                console.error('Push Registration Error:', err.error);
            });

            // Notification Received (Foreground)
            await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
                console.log('Push Received:', notification);
                // Optionally trigger the "Ping" sound/vibration here too if you want
                // But typically the OS handles the sound if configured in the payload
            });

            // Notification Tapped (Background -> Foreground)
            await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
                console.log('Push Action:', notification.actionId, notification.inputValue);
                // Navigate to specific screen if needed
                // e.g., window.location.href = '/admin/notifications';
            });
        };

        const initPush = async () => {
            await addListeners();
            await registerPush();
        };

        initPush();

        // Cleanup
        return () => {
             if (Capacitor.isNativePlatform()) {
                 PushNotifications.removeAllListeners();
             }
        };

    }, [user]);

    return {};
};
