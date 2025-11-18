import React, { useState } from 'react';

interface InputSectionProps {
  title: string;
  children: React.ReactNode;
}

export const InputSection: React.FC<InputSectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-white/10 rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 sm:p-3.5 md:p-4 bg-white/10 hover:bg-white/15 transition-all duration-200 active:bg-white/20"
      >
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white/90 truncate pr-2">{title}</h3>
        <svg
          className={`w-5 h-5 sm:w-6 sm:h-6 text-white/60 transform transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-3 sm:p-4 md:p-5 bg-white/5">
          {children}
        </div>
      )}
    </div>
  );
};