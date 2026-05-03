import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';

export const connectWebSocket = (user, addNotification, onConnected) => {
    if (!user || (!user.token && !user.accessToken)) return null;

    const token = user.token || user.accessToken;

    // Nu mai folosim adrese absolute. Nginx face proxy de la /ws la portul 8082.
    // Asta rezolvă problema "Mixed Content" (HTTPS -> HTTP).
    const wsUrl = `${window.location.protocol}//${window.location.host}/ws/`;

    console.log('Attempting WebSocket connection to:', wsUrl);
    console.log('Current User Roles:', user?.roles);

    const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        debug: function (str) {
            console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
    });

    client.onConnect = function (frame) {
        console.log('Connected to WebSockets', frame);

        // Check if user is expert/admin
        const isAdminOrExpert = user?.roles?.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'ROLE_EXPERT' || role === 'EXPERT');

        // Toate persoanele se abonează la admin, dar afișăm doar dacă au rol
        client.subscribe('/topic/admin', (message) => {
            if (message.body && isAdminOrExpert) {
                let displayMessage = message.body;

                // Verificăm dacă mesajul are un destinatar specific
                if (message.body.startsWith('TARGET:')) {
                    const parts = message.body.split('|MSG:');
                    if (parts.length === 2) {
                        const target = parts[0].replace('TARGET:', '');
                        const actualMsg = parts[1];

                        // Dacă e pentru un singur om și nu suntem noi, ignorăm
                        if (target !== 'ALL' && target !== user.username) {
                            return;
                        }
                        displayMessage = actualMsg;
                    }
                }

                toast.info(`🔔 Notificare Admin: ${displayMessage}`, { toastId: displayMessage });
                if (addNotification) addNotification(displayMessage, 'admin');
            }
        });

        client.subscribe('/topic/users', (message) => {
            if (message.body) {
                let displayMessage = message.body;

                // Verificăm dacă mesajul are un destinatar specific
                if (message.body.startsWith('TARGET:')) {
                    const parts = message.body.split('|MSG:');
                    if (parts.length === 2) {
                        const target = parts[0].replace('TARGET:', '');
                        const actualMsg = parts[1];

                        // Dacă e pentru un singur om și nu suntem noi, ignorăm
                        if (target !== 'ALL' && target !== user.username) {
                            return;
                        }
                        displayMessage = actualMsg;
                    }
                }

                toast.success(`🏔️ Notificare: ${displayMessage}`, { toastId: displayMessage });
                if (addNotification) addNotification(displayMessage, 'public');
            }
        });

        if (onConnected) onConnected(client);
    };

    client.onStompError = function (frame) {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        toast.error(`❌ Eroare Conexiune Notificări: ${frame.headers['message']}`, { autoClose: false });
    };

    client.onWebSocketError = function (event) {
        console.error('WebSocket Error:', event);
        toast.error('❌ Serverul de notificări (8082) nu poate fi accesat!', { autoClose: false });
    };

    client.activate();
    return client;
};
