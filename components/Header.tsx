
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full h-16 flex items-center px-8 z-50">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
        </div>
        <span className="font-medium tracking-widest uppercase text-[10px]">Bo'shliq</span>
      </div>
    </header>
  );
};
