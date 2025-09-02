import React from 'react';
import ClubNavigation from './ClubNavigation';
import '../styles/ClubLayout.css';

const ClubLayout = ({ children }) => {
  return (
    <div className="club-layout">
      <ClubNavigation />
      <main className="club-main">
        {children}
      </main>
    </div>
  );
};

export default ClubLayout;

