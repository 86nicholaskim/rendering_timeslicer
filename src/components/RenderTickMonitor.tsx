import React, { useEffect, useState } from 'react';

export const RenderTickMonitor: React.FC = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let rafId: number;
    const loop = () => {
      setTick((t) => t + 1);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div style={tickBoxStyle}>
      실시간 렌더링 틱: {tick.toLocaleString()}
    </div>
  );
};

const tickBoxStyle: React.CSSProperties = {
  background: '#1a1a1a',
  color: '#00ff00',
  padding: '15px 25px',
  borderRadius: '8px',
  fontSize: '24px',
  fontWeight: 'bold',
  display: 'inline-block',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};
