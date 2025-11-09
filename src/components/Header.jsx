import React from 'react';
import './Header.css';
import { useTheme } from '../contexts/ThemeContext.jsx';

const Header = ({ selectedAssistant, onClearAll, activeTabKey }) => {
  const selectedName = selectedAssistant?.name || '';
  const hasActiveTab = Boolean(activeTabKey);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className='header'>
      <div className='header-left'>
        <div className='header-info'>
          <img src={isDarkMode ? '/assets/CNX_Reverse_RGB.svg' : '/assets/CNX_Full Color.svg'} alt='Concentrix' className='header-logo' />
        </div>
      </div>
      <div className='header-right'>
        <button className='theme-toggle-btn' onClick={toggleTheme} title={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}>
          {isDarkMode ? (
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <circle cx='12' cy='12' r='5' stroke='currentColor' strokeWidth='2' />
              <path d='M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' stroke='currentColor' strokeWidth='2' />
            </svg>
          ) : (
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' stroke='currentColor' strokeWidth='2' />
            </svg>
          )}
        </button>
        {hasActiveTab && (
          <button className='header-btn' onClick={onClearAll} title={`Clear ${selectedName} conversation`}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
            Clear All Chats
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
