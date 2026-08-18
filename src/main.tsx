import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './auth/AuthContext.tsx';
import { LanguageProvider } from './language/LanguageContext.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';

import { SafeStorage } from './lib/storage';

// Initialize theme (pre-render, prevents flash of wrong theme)
const savedTheme = SafeStorage.get<'dark' | 'light'>('theme', 'dark');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
