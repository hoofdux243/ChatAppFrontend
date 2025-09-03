import React from 'react';

const DateSeparator = ({ date }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      margin: '20px 0 10px 0',
      position: 'relative'
    }}>
      <div style={{
        backgroundColor: '#e5e7eb',
        color: '#6b7280',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {date}
      </div>
    </div>
  );
};

export default DateSeparator;
