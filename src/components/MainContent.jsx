import React, { useState, useRef, useEffect } from 'react';
import './MainContent.css';
import chatService from '../services/chatService';
import FileUpload from './FileUpload';

const MainContent = ({ activeTab, setActiveTab, tabs, allTabs, selectedAssistant, clearTrigger, onCloseTab }) => {
  const hasActive = Boolean(activeTab);
  const hasTabs = tabs && tabs.length > 0;
  const hasApi = selectedAssistant && selectedAssistant.api && selectedAssistant.status !== 'coming_soon';

  const [conversationsByTab, setConversationsByTab] = useState(() => {
    try {
      const saved = localStorage.getItem('ixhello_conversations');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading conversations from localStorage:', error);
      return {};
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [componentValues, setComponentValues] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const tabsContainerRef = useRef(null);

  const currentConversation = conversationsByTab[activeTab] || { chatSessions: [], sessionId: '' };
  const chatSessions = currentConversation.chatSessions || [];
  const sessionId = currentConversation.sessionId;

  const handleTabClose = (e, tabKey) => {
    e.stopPropagation();
    if (allTabs && allTabs.length > 1 && onCloseTab) {
      onCloseTab(tabKey);
      setConversationsByTab((prev) => {
        const updated = { ...prev };
        delete updated[tabKey];
        return updated;
      });
    }
  };

  const [showNewInput, setShowNewInput] = useState(chatSessions.length === 0);

  useEffect(() => {
    if (clearTrigger > 0 && activeTab) {
      setConversationsByTab((prev) => {
        const updated = { ...prev };
        delete updated[activeTab];
        return updated;
      });
      setInputValue('');
      setComponentValues({});
      setIsTyping(false);
      setCopiedId(null);
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (chatSessions.length === 0) {
      setShowNewInput(true);
    } else {
      const lastSession = chatSessions[chatSessions.length - 1];
      if (lastSession && lastSession.response) {
        setShowNewInput(false);
      }
    }
  }, [activeTab, chatSessions.length]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatMessages = messagesEndRef.current.closest('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('ixhello_conversations', JSON.stringify(conversationsByTab));
    } catch (error) {
      console.error('Error saving conversations to localStorage:', error);
    }
  }, [conversationsByTab]);

  useEffect(() => {
    scrollToBottom();
  }, [chatSessions.length, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // Auto-scroll to active tab
  useEffect(() => {
    if (tabsContainerRef.current && activeTab) {
      const activeTabElement = tabsContainerRef.current.querySelector('.tab.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab]);

  const updateCurrentConversation = (updates) => {
    setConversationsByTab((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        chatSessions: prev[activeTab]?.chatSessions || [],
        sessionId: prev[activeTab]?.sessionId || '',
        ...updates,
      },
    }));
  };

  const preserveNonInputValues = () => {
    if (!selectedAssistant?.components) return {};
    const preserved = {};
    selectedAssistant.components.forEach((comp, idx) => {
      if (comp.componentType !== 'inputBox' && comp.componentType !== 'inputField' && componentValues[idx]) {
        preserved[idx] = componentValues[idx];
      }
    });
    return preserved;
  };

  const handleCopyResponse = async (text, chatId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(chatId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const processedLines = lines.map((line, lineIndex) => {
      const parts = [];
      let lastIndex = 0;
      const regex = /\*\*([^*]+)\*\*/g;
      let match;
      const isBulletPoint = line.trim().startsWith('-');
      let hasMatches = false;

      while ((match = regex.exec(line)) !== null) {
        hasMatches = true;
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }

        if (isBulletPoint) {
          parts.push(<strong key={`${lineIndex}-${match.index}`}>{match[1]}</strong>);
        } else {
          parts.push(
            <strong key={`${lineIndex}-${match.index}`} style={{ fontSize: '1.15em' }}>
              {match[1]}
            </strong>
          );
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      return hasMatches ? <>{parts}</> : line;
    });

    return (
      <>
        {processedLines.map((line, idx) => (
          <React.Fragment key={idx}>
            {line}
            {idx < processedLines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  };

  const handleFileProcessed = (text, componentIndex) => {
    setComponentValues({ ...componentValues, [componentIndex]: text });
  };

  const handleNewChat = () => {
    setInputValue('');
    setComponentValues(preserveNonInputValues());
    setShowNewInput(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      scrollToBottom();
    }, 100);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.stopPropagation();
    }
  };

  const handleSendMessage = async () => {
    const components = selectedAssistant?.components || [];
    const hasComponents = components.length > 0;

    if (hasComponents) {
      const allFilled = components.every((comp, index) => {
        const value = componentValues[index];
        return value && value.trim() !== '';
      });
      if (!allFilled || !hasApi) return;
    } else {
      if (!inputValue.trim() || !hasApi) return;
    }

    let userMessageText;
    let displayText;

    if (hasComponents) {
      const emailTrail = componentValues[0] || '';
      const additionalInstructions = [];

      components.forEach((comp, index) => {
        if (index > 0) {
          const value = componentValues[index];
          if (comp.additionalInstructions && value) {
            const instruction = comp.additionalInstructions.replace(/\{\{value\}\}/g, value);
            additionalInstructions.push(instruction);
          } else if (comp.componentType === 'radio' && value) {
            additionalInstructions.push(`Please respond in a ${value} tone.`);
          } else if (comp.componentType === 'dropDown' && comp.header.toLowerCase().includes('sender') && value) {
            additionalInstructions.push(`Sender: ${value}`);
          }
        }
      });

      userMessageText = additionalInstructions.length > 0 ? `${additionalInstructions.join(' ')}\n\n${emailTrail}` : emailTrail;
      displayText = emailTrail;
    } else {
      userMessageText = inputValue;
      displayText = inputValue;
    }

    const chatId = Date.now();

    const newChatSession = {
      id: chatId,
      inputText: displayText,
      componentData: hasComponents ? { ...componentValues } : null,
      response: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isError: false,
    };

    const updatedSessions = [...chatSessions, newChatSession];
    updateCurrentConversation({
      chatSessions: updatedSessions,
    });

    setInputValue('');
    setComponentValues(preserveNonInputValues());
    setShowNewInput(false);
    setIsTyping(true);

    try {
      const apiConfig = selectedAssistant.api;
      let response;

      if (apiConfig.type === 'meeting') {
        const { chatUrl, skillPublishingId, clientId } = apiConfig;
        response = await chatService.sendMeetingMessage(chatUrl, skillPublishingId, clientId, userMessageText, sessionId);
      } else {
        const { authUrl, chatUrl, credentials, assistantId } = apiConfig;
        response = await chatService.sendMessage(chatUrl, authUrl, credentials, assistantId, userMessageText, sessionId);
      }

      const assistantText = response.message || response.response || response.reply || response.text || response.answer || (response.data && response.data.message) || 'I received your message but could not generate a response.';

      const finalSessions = updatedSessions.map((chat) => (chat.id === chatId ? { ...chat, response: assistantText } : chat));

      updateCurrentConversation({
        chatSessions: finalSessions,
        sessionId: response.session_id || sessionId,
      });
    } catch (err) {
      console.error('Error sending message:', err);

      const finalSessions = updatedSessions.map((chat) => (chat.id === chatId ? { ...chat, response: 'Sorry, I encountered an error. Please try again.', isError: true } : chat));

      updateCurrentConversation({
        chatSessions: finalSessions,
      });
    } finally {
      setIsTyping(false);
    }
  };


  

  const renderDynamicComponent = (component, index, isEditable = true, value = '') => {
    const componentValue = isEditable ? componentValues[index] || '' : value;

    switch (component.componentType) {
      case 'inputBox':
        return (
          <div key={index} className='input-section'>
            <label className='input-label'>{component.header} :</label>
            {isEditable ? (
              <>
                {selectedAssistant?.fileUpload?.enabled && <FileUpload onFileProcessed={(text) => handleFileProcessed(text, index)} acceptedTypes={selectedAssistant.fileUpload.acceptedTypes} maxSize={selectedAssistant.fileUpload.maxSize} />}
                <div className='text-input-wrapper'>
                  <textarea
                    ref={index === 0 ? textareaRef : null}
                    className='text-input'
                    value={componentValue}
                    onChange={(e) => setComponentValues({ ...componentValues, [index]: e.target.value })}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={component.label || 'Type your input here...'}
                    rows={8}
                  />
                </div>
              </>
            ) : (
              <div className='text-input-wrapper-display'>
                <div className='text-input-display'>{componentValue}</div>
              </div>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={index} className='input-section'>
            <label className='input-label'>{component.header} :</label>
            {isEditable ? (
              <div className='radio-group'>
                {component.listOfOptions.map((option, optIndex) => (
                  <label key={optIndex} className='radio-option'>
                    <input type='radio' name={`radio-${index}`} value={option} checked={componentValue === option} onChange={(e) => setComponentValues({ ...componentValues, [index]: e.target.value })} />
                    <span className='radio-label'>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className='radio-group'>
                {component.listOfOptions.map((option, optIndex) => (
                  <label key={optIndex} className={`radio-option ${componentValue === option ? 'selected' : ''}`}>
                    <input type='radio' name={`radio-display-${index}`} value={option} checked={componentValue === option} disabled />
                    <span className='radio-label'>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );

      case 'dropDown':
        return (
          <div key={index} className='input-section'>
            <label className='input-label'>{component.header} :</label>
            {isEditable ? (
              <div className='dropdown-wrapper'>
                <select className='dropdown-select' value={componentValue} onChange={(e) => setComponentValues({ ...componentValues, [index]: e.target.value })}>
                  <option value=''>Select an option...</option>
                  {component.listOfOptions.map((option, optIndex) => (
                    <option key={optIndex} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className='dropdown-wrapper'>
                <select className='dropdown-select' value={componentValue} disabled>
                  {component.listOfOptions.map((option, optIndex) => (
                    <option key={optIndex} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case 'inputField':
        return (
          <div key={index} className='input-section'>
            <label className='input-label'>{component.header} :</label>
            {isEditable ? (
              <div className='single-input-wrapper'>
                <input type='text' className='single-input' value={componentValue} onChange={(e) => setComponentValues({ ...componentValues, [index]: e.target.value })} placeholder={component.label || 'Enter your input here...'} />
              </div>
            ) : (
              <div className='single-input-wrapper-display'>
                <div className='single-input-display'>{componentValue}</div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='main-content'>
      <div className='tabs-container'>
        <div className='tabs' ref={tabsContainerRef}>
          {hasTabs ? (
            tabs.map((tab, index) => {
              const tabObj = allTabs && allTabs.find((t) => t.title === tab);
              const tabKey = tabObj ? tabObj.key : tab;
              return (
                <button key={index} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  <span className='tab-title'>{tab}</span>
                  {allTabs && allTabs.length > 1 && (
                    <span className='tab-close' onClick={(e) => handleTabClose(e, tabKey)} title='Close tab'>
                      ×
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className='tabs-empty'>Please select an agent from the left to get started.</div>
          )}
        </div>
      </div>

      {!hasActive ? (
        <div className='empty-state'>
          <div className='empty-state-icon'>💬</div>
          <h2 className='empty-state-title'>Welcome to AI Assistant</h2>
          <p className='empty-state-text'>Select an agent from the left sidebar to start</p>
        </div>
      ) : hasApi ? (
        <div className='chat-container'>
          <div className='chat-messages'>
            <div className='greeting-section'>
              <h3 className='greeting-title'>{selectedAssistant?.welcomeMessage || `Hello! I'm your ${activeTab}`}</h3>
              {selectedAssistant?.capabilities && selectedAssistant.capabilities.length > 0 && (
                <div className='capabilities-box'>
                  <p className='capabilities-heading'>I can help you with:</p>
                  <div className='capabilities-grid'>
                    {selectedAssistant.capabilities.map((capability, index) => (
                      <div key={index} className='capability-item'>
                        <svg className='check-icon' width='16' height='16' viewBox='0 0 24 24' fill='none'>
                          <path d='M20 6L9 17L4 12' stroke='#10b981' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {chatSessions.map((chat) => (
              <div key={chat.id} className='chat-session'>
                {chat.componentData &&
                  selectedAssistant?.components &&
                  selectedAssistant.components.length > 0 &&
                  selectedAssistant.components.map((component, idx) => {
                    return renderDynamicComponent(component, idx, false, chat.componentData[idx]);
                  })}

                {chat.response && (
                  <div className='response-section'>
                    <div className={`response-box ${chat.isError ? 'error' : ''}`}>
                      <div className='response-header'>
                        <button className='copy-btn' onClick={() => handleCopyResponse(chat.response, chat.id)} title='Copy response'>
                          {copiedId === chat.id ? (
                            <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
                              <path d='M20 6L9 17L4 12' stroke='#10b981' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                            </svg>
                          ) : (
                            <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
                              <path d='M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                              <path d='M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className={`response-text ${chat.isError ? 'error-text' : ''}`}>{renderFormattedText(chat.response)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showNewInput && (
              <>
                {selectedAssistant?.components && selectedAssistant.components.length > 0 ? (
                  <>
                    {selectedAssistant.components.map((component, index) => renderDynamicComponent(component, index, true))}
                    <div className='send-button-section'>
                      <button className='send-btn' onClick={handleSendMessage} disabled={!selectedAssistant.components.every((comp, index) => componentValues[index] && componentValues[index].trim() !== '') || isTyping}>
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                          <path d='M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                        Send Message
                      </button>
                    </div>
                  </>
                ) : (
                  <div className='input-section'>
                    <label className='input-label'>Type your message :</label>
                    <div className='text-input-wrapper'>
                      <textarea ref={textareaRef} className='text-input' value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleTextareaKeyDown} placeholder='Type your message here...' rows={8} />
                      <button className='send-icon-btn' onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                          <path d='M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {isTyping && (
              <div className='response-section'>
                <div className='typing-indicator-box'>
                  <div className='typing-dots'>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {chatSessions.length > 0 && !isTyping && !showNewInput && chatSessions[chatSessions.length - 1].response && (
              <div className='new-chat-section'>
                <button className='new-chat-btn' onClick={handleNewChat}>
                  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M12 5v14M5 12h14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                  Initiate a new chat
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : (
        <div className='other-agent-container'>
          <div className='agent-info'>
            <h2 className='agent-title'>{activeTab}</h2>
            <p className='agent-description'>This agent is currently under development.</p>
            <div className='agent-status'>
              <span className='status-badge'>Coming Soon</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
