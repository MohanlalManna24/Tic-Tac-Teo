import React, { useEffect, useState } from 'react';
import { GameProvider } from './context/GameContext';
import Landing from './screens/Landing';
import GameRoom from './screens/GameRoom';
import './index.css';

const MainApp = () => {
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room);
    }
  }, []);

  return (
    <div className="antialiased text-white selection:bg-cyan-500/30">
      {roomId ? <GameRoom roomId={roomId} /> : <Landing />}
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}

export default App;
