import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="content-wrapper">
      {children}
    </div>
  );
};

export default Layout; 