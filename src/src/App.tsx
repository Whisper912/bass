import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Game } from './components/Game';
import { OrientationGuard } from './components/OrientationGuard';
import './global.css';

const App: React.FC = () => {
  return (
    <HashRouter>
      <OrientationGuard />
      <div className="h-screen h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center overflow-hidden">
        <Routes>
          <Route path="/" element={<Game />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
