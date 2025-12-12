import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// Remove splash
const splash = document.getElementById('loading-splash');
if(splash) splash.style.display = 'none';
