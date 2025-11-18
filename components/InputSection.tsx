import React, { useState } from 'react';

interface InputSectionProps {
  title: string;
  children: React.ReactNode;
}

export const InputSection: React.FC<InputSectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-white/10 hover:bg-white/20 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white/80">{title}</h3>
        <svg
          className={`w-6 h-6 text-white/60 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-white/5">
          {children}
        </div>
      )}
    </div>
  );
};