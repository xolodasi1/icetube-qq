import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';

import { SafeStorage } from './lib/storage';

// Initialize theme
const savedTheme = SafeStorage.get<'dark' | 'light'>('theme', 'dark');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
);
