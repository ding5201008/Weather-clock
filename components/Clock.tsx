
import React, { useState, useEffect, useRef } from 'react';
import { Alarm } from '../types';

interface ClockProps {
  alarms?: Alarm[];
  onAlarmTrigger?: (alarm: Alarm) => void;
}

export const Clock: React.FC<ClockProps> = ({ alarms = [], onAlarmTrigger }) => {
  const [time, setTime] = useState(new Date());
  const lastCheckedMinute = useRef<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      // Check alarms logic
      if (alarms.length > 0 && onAlarmTrigger) {
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        // Only trigger once per minute
        if (currentTimeStr !== lastCheckedMinute.current) {
           const matchedAlarm = alarms.find(a => a.enabled && a.time === currentTimeStr);
           if (matchedAlarm) {
             onAlarmTrigger(matchedAlarm);
             lastCheckedMinute.current = currentTimeStr;
           }
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [alarms, onAlarmTrigger]);

  const formatTime = (date: Date) => {
    return {
      hours: date.getHours().toString().padStart(2, '0'),
      minutes: date.getMinutes().toString().padStart(2, '0'),
      seconds: date.getSeconds().toString().padStart(2, '0'),
    };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const { hours, minutes, seconds } = formatTime(time);

  return (
    <div className="flex flex-col items-center justify-center text-white select-none relative z-10">
      <div className="flex items-baseline font-bold leading-none tracking-tighter" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
        <span className="text-[25vw] md:text-[20vw] lg:text-[18vw] font-[Arial]">{hours}</span>
        <span className="text-[10vw] md:text-[8vw] lg:text-[6vw] animate-pulse pb-[4vw] relative -top-[2vw]">:</span>
        <span className="text-[25vw] md:text-[20vw] lg:text-[18vw] font-[Arial]">{minutes}</span>
        <span className="hidden lg:inline-block text-[4vw] ml-4 text-gray-300 font-light font-[Arial]">{seconds}</span>
      </div>
      <div className="text-xl md:text-3xl lg:text-4xl font-light tracking-widest uppercase opacity-80 mt-[-2vw] font-sans">
        {formatDate(time)}
      </div>
    </div>
  );
};
