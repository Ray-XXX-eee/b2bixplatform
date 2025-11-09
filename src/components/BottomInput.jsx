import React, { useState } from 'react';
import './BottomInput.css';

const BottomInput = () => {
  const [input, setInput] = useState('I need an assistance in drafting email');

  const handleSubmit = () => {
    console.log('Submitted:', input);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className='bottom-input'>
      <div className='input-container'>
        <input type='text' className='input-field' value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder='Enter your query...' />
        <button className='submit-btn' onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default BottomInput;
