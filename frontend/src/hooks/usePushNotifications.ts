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

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

export const usePushNotifications = () => {
    const { user } = useAuthStore();

    useEffect(() => {
        console.log("PUSH_DEBUG: Hook triggered, user:", user?.email);
        if (!user) {
            console.log("PUSH_DEBUG: No user, skipping.");
            return;
        }
        
        if (!Capacitor.isNativePlatform()) {
            console.log("PUSH_DEBUG: Not a native platform, skipping.");
            return;
        }

        const registerPush = async () => {
            console.log("PUSH_DEBUG: Checking permissions...");
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                console.log("PUSH_DEBUG: Requesting permissions...");
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn("PUSH_DEBUG: Permission denied");
                return;
            }

            console.log("PUSH_DEBUG: Registering with FCM...");
            await PushNotifications.register();
        };

        const addListeners = async () => {
            console.log("PUSH_DEBUG: Adding listeners...");
            await PushNotifications.removeAllListeners();

            await PushNotifications.addListener('registration', async (token: Token) => {
                console.log('PUSH_DEBUG: Registration Success. Token:', token.value);
                try {
                    const empId = (user as any).employee_id;
                    if (!empId) {
                        console.warn("PUSH_DEBUG: No employee_id found for user.");
                        return;
                    }

                    const payload = {
                        user_id: empId,
                        token: token.value,
                        platform: Capacitor.getPlatform()
                    };
                    console.log(`PUSH_DEBUG: Sending to ${API_URL}/save_token.php`, payload);

                    const response = await fetch(`${API_URL}/save_token.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const result = await response.json();
                    console.log("PUSH_DEBUG: Server response:", JSON.stringify(result));
                } catch (error) {
                    console.error("PUSH_DEBUG: Failed to save push token", error);
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
