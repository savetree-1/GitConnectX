import React, { useState } from 'react';

const InfoTooltip = ({ content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    'top': 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    'bottom': 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    'left': 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    'right': 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block ml-2">
      <button
        className="w-6 h-6 rounded-full bg-indigo-200 hover:bg-indigo-300 text-indigo-800 flex items-center justify-center text-xs font-bold focus:outline-none transition-colors shadow-sm"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => { e.preventDefault(); setIsVisible(!isVisible); }}
        aria-label="Implementation information"
      >
        i
      </button>
      
      {isVisible && (
        <div 
          className={`absolute z-50 w-80 max-h-96 overflow-y-auto bg-white shadow-lg rounded-lg p-4 text-sm text-left ${positionClasses[position]}`}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          style={{ 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(229, 231, 235, 1)',
            animation: 'glow 1.5s infinite alternate'
          }}
        >
          <style jsx="true">{`
            @keyframes glow {
              from {
                box-shadow: 0 0 5px -5px rgba(129, 140, 248, 0.6);
              }
              to {
                box-shadow: 0 0 15px 5px rgba(129, 140, 248, 0.6);
              }
            }
          `}</style>
          <div className="font-medium text-gray-800 mb-2 text-base border-b border-indigo-100 pb-2">Implementation Details</div>
          <div className="text-gray-600">{content}</div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip; 