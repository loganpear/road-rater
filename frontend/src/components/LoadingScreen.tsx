import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div>
      <h2>Analyzing Video...</h2>
      <p>This may take a few moments.</p>
      {/* You can add a spinner or a more complex loading animation here */}
    </div>
  );
}

export default LoadingScreen;
