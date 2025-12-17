import React, { useState, useEffect } from 'react';
import { ActivityStream } from './components/ActivityStream';
import { StatsChart } from './components/StatsChart';
import { ActivityResult } from './types';
import { Activity, Clock, Cpu, Eye, History, AlertCircle } from 'lucide-react';

const App = () => {
  const [history, setHistory] = useState<ActivityResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityResult | null>(null);

  const handleNewResult = (result: ActivityResult) => {
    setCurrentActivity(result);
    // Add to history if not error and not "No Activity" (optional filter)
    if (result.activity !== 'Error') {
      setHistory(prev => [result, ...prev].slice(0, 100)); // Keep last 100
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Eye size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Gemini Vision
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Activity Recognition System</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
             <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                {isProcessing ? 'Processing AI...' : 'System Ready'}
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Camera & Live Status */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Feed */}
          <section className="bg-slate-900/50 rounded-2xl p-1 border border-slate-800 shadow-xl">
             <ActivityStream 
               onActivityResult={handleNewResult} 
               isProcessing={isProcessing}
               setIsProcessing={setIsProcessing}
             />
          </section>

          {/* Current Detection Card */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Cpu size={120} />
            </div>
            
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} /> Live Analysis
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
              <div className="flex-1">
                 <div className="text-sm text-slate-500 mb-1">Detected Activity</div>
                 <div className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                   {currentActivity ? currentActivity.activity : <span className="text-slate-600">Waiting...</span>}
                 </div>
                 <div className="text-slate-400 leading-relaxed max-w-lg">
                   {currentActivity?.description || "Motion detection active. Waiting for significant movement to analyze..."}
                 </div>
              </div>

              {currentActivity && (
                <div className="flex flex-col items-center justify-center bg-slate-950/50 rounded-xl p-4 border border-slate-700/50 min-w-[120px]">
                   <div className="text-3xl font-mono font-bold text-blue-400">
                     {(currentActivity.confidence * 100).toFixed(0)}%
                   </div>
                   <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Confidence</div>
                </div>
              )}
            </div>
          </section>

          {/* Charts Area */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-80">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Activity Frequency</h3>
                <StatsChart history={history} />
             </div>
             <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-80 relative overflow-hidden">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">System Metrics</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Detections</span>
                    <span className="text-xl font-mono text-white">{history.length}</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                     <span className="text-slate-400 text-sm">Model</span>
                     <span className="text-sm font-mono text-blue-400">gemini-2.5-flash</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-xs mb-2">Technique</div>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">Pixel Difference (Motion)</span>
                       <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">Visual Transformer (Gemini)</span>
                    </div>
                  </div>
                </div>
             </div>
          </section>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden max-h-[calc(100vh-6rem)] sticky top-24">
          <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <History size={14} /> Detection Log
            </h2>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-2">
                 <AlertCircle size={24} />
                 <p className="text-sm">No detection history</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="group p-3 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-200 text-sm">{item.activity}</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Clock size={10} /> {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 group-hover:text-slate-400 transition-colors">
                    {item.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
