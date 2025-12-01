
import React, { useState } from 'react';
import { Alarm } from '../types';

interface AlarmListProps {
  alarms: Alarm[];
  onAddAlarm: (time: string) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onClose: () => void;
}

export const AlarmList: React.FC<AlarmListProps> = ({ alarms, onAddAlarm, onToggleAlarm, onDeleteAlarm, onClose }) => {
  const [newTime, setNewTime] = useState("");

  const handleAdd = () => {
    if (newTime) {
      onAddAlarm(newTime);
      setNewTime("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-900/80 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
           ⏰ 闹钟列表
        </h2>

        {/* Add Alarm */}
        <div className="flex gap-4 mb-8">
            <input 
                type="time" 
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-xl text-white outline-none focus:border-blue-500 transition-colors"
            />
            <button 
                onClick={handleAdd}
                disabled={!newTime}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
                添加
            </button>
        </div>

        {/* List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {alarms.length === 0 && (
                <div className="text-center text-white/30 py-8">
                    暂无闹钟
                </div>
            )}
            {alarms.map(alarm => (
                <div key={alarm.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-3xl font-mono text-white">
                        {alarm.time}
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => onToggleAlarm(alarm.id)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${alarm.enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${alarm.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                        <button 
                            onClick={() => onDeleteAlarm(alarm.id)}
                            className="text-red-400 hover:text-red-300 p-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
