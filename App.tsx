
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock } from './components/Clock';
import { WeatherWidget } from './components/WeatherWidget';
import { AlarmList } from './components/AlarmList';
import { Alarm } from './types';

// Icons
const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
);
const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
);
const RefreshIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16l5 5v-5"/></svg>
);
const AlarmIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3 2 6"></path><path d="M22 6 19 3"></path><path d="M6.38 18.7 4 21"></path><path d="M17.64 18.67 20 21"></path></svg>
);

const App: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bgImage, setBgImage] = useState<string>('');
  
  // Alarm State
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
        const saved = localStorage.getItem('zenclock_alarms');
        return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });
  const [showAlarmList, setShowAlarmList] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Save alarms to local storage
  useEffect(() => {
    localStorage.setItem('zenclock_alarms', JSON.stringify(alarms));
  }, [alarms]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    // Unlock Audio Context on first interaction
    const unlockAudio = () => {
        if (!audioCtxRef.current) {
             audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const handleInteraction = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
      unlockAudio();
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);

    // Initial load background
    refreshBackground();

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      clearTimeout(timeout);
      stopAlarmSound();
    };
  }, []);

  const refreshBackground = () => {
      // Use landscape oriented nature images
      const timestamp = new Date().getTime();
      setBgImage(`https://picsum.photos/${window.screen.width}/${window.screen.height}?nature,landscape&blur=3&t=${timestamp}`);
  }

  // Alarm Logic
  const startAlarmSound = () => {
    try {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        
        // Ensure context is running
        if(ctx.state === 'suspended') {
            ctx.resume();
        }

        // Create oscillator for beep sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        
        // Siren effect pattern
        const now = ctx.currentTime;
        const duration = 60; // Play for 60 seconds max
        
        // Loop frequency ramp
        for(let i=0; i < duration; i++) {
             osc.frequency.setValueAtTime(440, now + i);
             osc.frequency.linearRampToValueAtTime(880, now + i + 0.5);
             osc.frequency.linearRampToValueAtTime(440, now + i + 1.0);
        }
        
        // Gain envelope for each beep
        gain.gain.setValueAtTime(0.5, now);
        
        osc.start(now);
        oscillatorRef.current = osc;
        
        // Auto stop after 60s
        osc.stop(now + duration);
        
    } catch (e) {
        console.error("Audio play failed", e);
    }
  };

  const stopAlarmSound = () => {
    if (oscillatorRef.current) {
        try {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
        } catch(e) {}
        oscillatorRef.current = null;
    }
  };

  const handleAlarmTrigger = useCallback((alarm: Alarm) => {
    setRingingAlarm(alarm);
    startAlarmSound();
  }, []);

  const dismissAlarm = () => {
    setRingingAlarm(null);
    stopAlarmSound();
  };

  const addAlarm = (time: string) => {
    const newAlarm: Alarm = {
        id: Date.now().toString(),
        time,
        enabled: true
    };
    setAlarms(prev => [...prev, newAlarm].sort((a,b) => a.time.localeCompare(b.time)));
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-gray-900 text-white flex flex-col justify-between transition-all duration-1000 font-sans"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Alarm Ringing Overlay */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-red-600/90 backdrop-blur-xl animate-pulse">
            <h1 className="text-6xl font-bold mb-8">⏰ 闹钟响了!</h1>
            <div className="text-4xl mb-12">{ringingAlarm.time}</div>
            <button 
                onClick={dismissAlarm}
                className="bg-white text-red-600 px-12 py-6 rounded-full text-3xl font-bold shadow-xl hover:scale-105 transition-transform"
            >
                停止
            </button>
        </div>
      )}

      {/* Alarm List Modal */}
      {showAlarmList && (
        <AlarmList 
            alarms={alarms}
            onAddAlarm={addAlarm}
            onToggleAlarm={toggleAlarm}
            onDeleteAlarm={deleteAlarm}
            onClose={() => setShowAlarmList(false)}
        />
      )}

      {/* Top Controls */}
      <div className={`absolute top-0 right-0 p-4 z-50 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowAlarmList(true)}
                className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all text-white/80 hover:text-white"
                title="闹钟"
            >
                <AlarmIcon />
            </button>
            <button 
                onClick={refreshBackground}
                className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all text-white/80 hover:text-white"
                title="刷新背景"
            >
                <RefreshIcon />
            </button>
            <button 
                onClick={toggleFullscreen}
                className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all text-white/80 hover:text-white"
                title={isFullscreen ? "退出全屏" : "全屏模式"}
            >
                {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full">
        {/* Clock takes up central space */}
        <div className="flex-1 flex items-center justify-center w-full">
            <Clock alarms={alarms} onAlarmTrigger={handleAlarmTrigger} />
        </div>
        
        {/* Weather sits at bottom */}
        <div className="w-full pb-8 md:pb-12">
            <WeatherWidget />
        </div>
      </div>

      {/* Footer Info */}
      {!isFullscreen && (
        <div className="absolute bottom-2 right-2 text-xs text-white/30 hidden md:block">
          ZenClock Web v2.0
        </div>
      )}
    </div>
  );
};

export default App;
