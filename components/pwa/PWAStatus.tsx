'use client';

import { useEffect, useState } from 'react';
interface NavigatorStandalone extends Navigator {
    standalone?: boolean;
}

export default function PWAStatus() {
    const [status, setStatus] = useState({
        isOnline: true,
        isPWA: false,
        supportsServiceWorker: false,
        serviceWorkerRegistered: false,
    });

    useEffect(() => {
        const navigatorWithStandalone = window.navigator as NavigatorStandalone;
        setStatus(current => ({
            ...current,
            isOnline: navigator.onLine,
            isPWA: window.matchMedia('(display-mode: standalone)').matches ||
                navigatorWithStandalone.standalone === true,
            supportsServiceWorker: 'serviceWorker' in navigator,
        }));

        const handleOnlineStatusChange = () => {
            setStatus(current => ({ ...current, isOnline: navigator.onLine }));
        };

        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                setStatus(current => ({
                    ...current,
                    serviceWorkerRegistered: registrations.length > 0
                }));
            });
        }

        return () => {
            window.removeEventListener('online', handleOnlineStatusChange);
            window.removeEventListener('offline', handleOnlineStatusChange);
        };
    }, []);

    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <div className="fixed bottom-0 right-0 m-4 p-2 bg-white dark:bg-gray-800 rounded shadow text-xs">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{status.isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${status.isPWA ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>PWA Mode: {status.isPWA ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${status.supportsServiceWorker ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>SW Support: {status.supportsServiceWorker ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${status.serviceWorkerRegistered ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span>SW Registered: {status.serviceWorkerRegistered ? 'Yes' : 'No'}</span>
                </div>
            </div>
        </div>
    );
}