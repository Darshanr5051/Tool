import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('siqol_theme') || 'light';
  });

  useEffect(() => {
    const rm = localStorage.getItem('siqol_rm') === 'true';
    document.documentElement.setAttribute('data-reduced-motion', rm ? 'true' : 'false');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('siqol_theme', theme);
  }, [theme]);

  const themes = ['light', 'dark', 'midnight', 'cyberpunk'];

  const toggleTheme = () => {
    setTheme(prev => {
      const currentIndex = themes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % themes.length;
      return themes[nextIndex];
    });
  };

  const isDark = theme !== 'light';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export default ThemeContext;