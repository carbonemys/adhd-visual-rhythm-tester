
import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-cyan-400 mb-3 border-b-2 border-cyan-500 pb-2">How it Works</h2>
      <ol className="list-decimal list-inside space-y-2 text-gray-300">
        <li>Click <strong>'Start Trial'</strong> to begin.</li>
        <li>A 5-letter word will flash on the black screen.</li>
        <li>The word's clarity changes based on the rhythm set in the controls.</li>
        <li>Type the word you saw and press Enter.</li>
        <li>Adjust the controls to see how timing affects your perception!</li>
      </ol>
    </div>
  );
};

export default Instructions;
