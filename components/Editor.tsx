
import React from 'react';

interface EditorProps {
  content: string;
  onChange: (val: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange }) => {
  return (
    <div className="flex flex-col h-screen w-full max-w-2xl mx-auto pt-32 px-6">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Yozishni boshlang..."
        className="flex-grow text-lg font-light leading-relaxed bg-transparent border-none outline-none resize-none placeholder-gray-300 text-gray-800"
      />
    </div>
  );
};
