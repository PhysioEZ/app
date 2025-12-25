import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Make status bar transparent and overlay content
if ((window as any).Capacitor?.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Light }); // Dark icons for light background
  StatusBar.setBackgroundColor({ color: '#FFFFFF' }); // Fallback
  StatusBar.setOverlaysWebView({ overlay: true });

  const setSafeArea = () => {
    const doc = document.documentElement;
    doc.style.setProperty('--safe-area-inset-top', '32px'); 
    
    // Attempt to read from Capacitor GetSafeArea in future if needed, but 32px is a safe bet for Material Design 3 / Edge-to-Edge
  };
  setSafeArea();
}

CapacitorApp.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    CapacitorApp.exitApp();
  } else {
    window.history.back();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
