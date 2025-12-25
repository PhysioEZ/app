import * as React from 'react';
import { Construction } from 'lucide-react';

const ComingSoon: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <Construction size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500">This feature is under development.</p>
    </div>
  );
};

export default ComingSoon;
