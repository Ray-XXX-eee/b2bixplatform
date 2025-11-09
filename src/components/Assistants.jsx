import React, { useState, useMemo } from 'react';
import './Assistants.css';

const Assistants = ({ assistants = [], onSelect, selectedAssistant }) => {
  const [query, setQuery] = useState('');

  const filteredAssistants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assistants;
    return assistants.filter((a) => (a.name || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q) || (a.owner || '').toLowerCase().includes(q) || (a.model || '').toLowerCase().includes(q) || (a.version || '').toLowerCase().includes(q));
  }, [assistants, query]);

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className='assistants-panel'>
      <div className='assistants-header'>
        <div className='search-container'>
          <input type='text' className='assistants-search' placeholder='Search assistants...' aria-label='Search assistants' value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button className='clear-button' onClick={clearSearch} aria-label='Clear search' type='button'>
              ×
            </button>
          )}
        </div>
      </div>
      {filteredAssistants.length === 0 ? (
        <div className='assistants-empty'>No assistants found</div>
      ) : (
        <div className='assistants-list'>
          {filteredAssistants.map((assistant, index) => {
            const isSelected = selectedAssistant && selectedAssistant.name === assistant.name;
            return (
              <div key={index} className={`assistant-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelect && onSelect(assistant)}>
                <div className='assistant-content'>
                  <div className='assistant-name'>{assistant.name}</div>
                  <div className='assistant-description'>{assistant.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assistants;
