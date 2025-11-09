import React, { useMemo, useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header.jsx';
import MainContent from './components/MainContent.jsx';
import Assistants from './components/Assistants.jsx';
import AssistantDetails from './components/AssistantDetails.jsx';
import { assistants as assistantsData } from './data/assistants';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

function App() {
  const initialAssistant = assistantsData[0] || null;
  const initialKey = initialAssistant ? initialAssistant.name : null;

  const [tabs, setTabs] = useState(() => {
    try {
      const savedTabs = localStorage.getItem('ixhello_tabs');
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        return parsedTabs.length > 0 ? parsedTabs : initialAssistant ? [{ key: initialKey, title: initialAssistant.name }] : [];
      }
    } catch (error) {
      console.error('Error loading tabs from localStorage:', error);
    }
    return initialAssistant ? [{ key: initialKey, title: initialAssistant.name }] : [];
  });

  const [activeTabKey, setActiveTabKey] = useState(() => {
    try {
      const savedActiveTab = localStorage.getItem('ixhello_activeTab');
      return savedActiveTab || initialKey;
    } catch (error) {
      console.error('Error loading activeTab from localStorage:', error);
      return initialKey;
    }
  });

  const [selectedAssistant, setSelectedAssistant] = useState(() => {
    try {
      const savedAssistantName = localStorage.getItem('ixhello_selectedAssistant');
      if (savedAssistantName) {
        const assistant = assistantsData.find((a) => a.name === savedAssistantName);
        return assistant || initialAssistant;
      }
    } catch (error) {
      console.error('Error loading selectedAssistant from localStorage:', error);
    }
    return initialAssistant;
  });

  const [clearTrigger, setClearTrigger] = useState(0);

  const assistantsByName = useMemo(() => {
    const map = new Map();
    assistantsData.forEach((a) => map.set(a.name, a));
    return map;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ixhello_tabs', JSON.stringify(tabs));
    } catch (error) {
      console.error('Error saving tabs to localStorage:', error);
    }
  }, [tabs]);

  useEffect(() => {
    try {
      localStorage.setItem('ixhello_activeTab', activeTabKey);
    } catch (error) {
      console.error('Error saving activeTab to localStorage:', error);
    }
  }, [activeTabKey]);

  useEffect(() => {
    try {
      localStorage.setItem('ixhello_selectedAssistant', selectedAssistant?.name || '');
    } catch (error) {
      console.error('Error saving selectedAssistant to localStorage:', error);
    }
  }, [selectedAssistant]);

  const ensureTabExists = (key, title) => {
    setTabs((prev) => {
      if (prev.some((t) => t.key === key)) return prev;
      return [...prev, { key, title }];
    });
  };

  const handleSelectAssistant = (assistant) => {
    if (!assistant) return;
    const key = assistant.name;
    ensureTabExists(key, assistant.name);
    setActiveTabKey(key);
    setSelectedAssistant(assistant);
  };

  const handleTabClick = (tabKey) => {
    setActiveTabKey(tabKey);
    const assistant = assistantsByName.get(tabKey) || null;
    setSelectedAssistant(assistant);
  };

  const handleClearAll = () => {
    setClearTrigger((prev) => prev + 1);
  };

  const handleCloseTab = (tabKey) => {
    if (tabs.length <= 1) return;

    const currentIndex = tabs.findIndex((t) => t.key === tabKey);

    setTabs((prev) => {
      const filtered = prev.filter((t) => t.key !== tabKey);

      if (activeTabKey === tabKey && filtered.length > 0) {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        const newActiveKey = filtered[newIndex].key;
        setActiveTabKey(newActiveKey);
        const assistant = assistantsByName.get(newActiveKey) || null;
        setSelectedAssistant(assistant);
      }

      return filtered;
    });
  };

  return (
    <ThemeProvider>
      <div className='app'>
        <Header selectedAssistant={selectedAssistant} onClearAll={handleClearAll} activeTabKey={activeTabKey} />
        <div className='app-body'>
          <Assistants assistants={assistantsData} onSelect={handleSelectAssistant} selectedAssistant={selectedAssistant} />
          <MainContent activeTab={activeTabKey} setActiveTab={handleTabClick} tabs={tabs.map((t) => t.title)} allTabs={tabs} selectedAssistant={selectedAssistant} clearTrigger={clearTrigger} onCloseTab={handleCloseTab} />
          <AssistantDetails assistant={selectedAssistant} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
