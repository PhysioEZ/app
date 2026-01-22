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

    const syncPendingToken = async () => {
        const pending = localStorage.getItem('pending_push_token');
        if (!pending || !user) return;

        try {
            const tokenVal = pending;
            const empId = (user as any).employee_id || user.id;
            
            if (!empId) return;

            console.log(`PUSH_DEBUG: Retrying sync for ${empId}`);
            
            const payload = {
                user_id: empId,
                token: tokenVal,
                platform: Capacitor.getPlatform()
            };

            const response = await fetch(`${API_URL}/save_token.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                console.log("PUSH_DEBUG: Sync successful, clearing pending.");
                localStorage.removeItem('pending_push_token');
            } else {
                console.warn("PUSH_DEBUG: Server rejected token", result);
            }
        } catch (e) {
            console.error("PUSH_DEBUG: Retry sync failed", e);
        }
    };

    useEffect(() => {
        // Try to sync any pending token on mount
        if (user) syncPendingToken();

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
                
                // BACKUP: Save to local storage immediately
                localStorage.setItem('pending_push_token', token.value);

                try {
                    const empId = (user as any).employee_id || user.id;
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
                    
                    if (result.status === 'success') {
                        localStorage.removeItem('pending_push_token');
                    }
                } catch (error) {
                    console.error("PUSH_DEBUG: Failed to save push token", error);
                    // It remains in localStorage for the next retry (syncPendingToken)
                }
            });

            // Registration Error
            await PushNotifications.addListener('registrationError', (err: RegistrationError) => {
                console.error('Push Registration Error:', err.error);
            });

            // Notification Received (Foreground)
            await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
                console.log('Push Received:', notification);
            });

            // Notification Tapped (Background -> Foreground)
            await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
                console.log('Push Action:', notification.actionId, notification.inputValue);
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

    // Retry Interval
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(syncPendingToken, 30000); // Retry every 30s if pending
        return () => clearInterval(interval);
    }, [user]);

    return {};
};
