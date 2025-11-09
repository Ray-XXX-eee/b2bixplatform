import React from 'react';
import './AssistantDetails.css';

const LabelRow = ({ label, value }) => (
  <div className='detail-row'>
    <div className='detail-label'>{label}</div>
    <div className='detail-value'>{value || '-'}</div>
  </div>
);

const AssistantDetails = ({ assistant }) => {
  if (!assistant) {
    return (
      <div className='assistant-details'>
        <div className='details-header'>
          <h3>Assistant Details</h3>
        </div>
        <div className='details-empty'>Select an assistant on the left to view details.</div>
      </div>
    );
  }

  return (
    <div className='assistant-details'>
      <div className='details-header'>
        <h3>{assistant.name}</h3>
      </div>
      <div className='details-body'>
        <div className='details-description'>{assistant.description}</div>
        <div className='details-meta'>
          <LabelRow label='Version' value={assistant.version} />
          <LabelRow label='Model' value={assistant.model} />
          <LabelRow label='Owner' value={assistant.owner} />
        </div>
      </div>
    </div>
  );
};

export default AssistantDetails;
