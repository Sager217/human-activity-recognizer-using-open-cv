import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Eye, Zap, Activity as ActivityIcon, VideoOff } from 'lucide-react';
import { analyzeActivity } from '../services/geminiService';
import { ActivityResult, DetectionStatus } from '../types';

interface ActivityStreamProps {
  onActivityResult: (result: ActivityResult) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({ onActivityResult, isProcessing, setIsProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [status, setStatus] = useState<DetectionStatus>(DetectionStatus.IDLE);
  const [motionScore, setMotionScore] = useState(0);
  const [lastFrameData, setLastFrameData] = useState<Uint8ClampedArray | null>(null);

  // Configuration
  const MOTION_THRESHOLD = 25; // Pixel difference threshold
  const MOTION_SCORE_TRIGGER = 500; // Total accumulated pixel changes to trigger
  const CHECK_INTERVAL_MS = 200; // How often to check motion
  const COOLDOWN_MS = 2000; // Minimum time between API calls

  const lastAnalysisTime = useRef<number>(0);

  // Start Camera
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: "user"
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startVideo();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Motion Detection Loop
  useEffect(() => {
    if (!streamActive || !videoRef.current || !canvasRef.current) return;

    const intervalId = setInterval(() => {
      detectMotion();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamActive, isProcessing]);

  const detectMotion = () => {
    if (isProcessing) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // optimize for read
    if (!ctx) return;

    // Draw current frame to canvas
    // We use a small size for performance
    const width = 64; 
    const height = 48;
    
    ctx.drawImage(video, 0, 0, width, height);
    
    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;
    const dataLength = data.length;

    let score = 0;

    if (lastFrameData) {
      // Simple pixel difference (Computer Vision basic)
      for (let i = 0; i < dataLength; i += 4) {
        // Compare RGB
        const rDiff = Math.abs(data[i] - lastFrameData[i]);
        const gDiff = Math.abs(data[i + 1] - lastFrameData[i + 1]);
        const bDiff = Math.abs(data[i + 2] - lastFrameData[i + 2]);

        if (rDiff + gDiff + bDiff > MOTION_THRESHOLD) {
          score++;
        }
      }
    }

    setLastFrameData(data);
    setMotionScore(score);

    // Trigger AI Logic
    const now = Date.now();
    if (score > MOTION_SCORE_TRIGGER && (now - lastAnalysisTime.current > COOLDOWN_MS)) {
      triggerAnalysis();
    } else if (score > MOTION_SCORE_TRIGGER) {
      setStatus(DetectionStatus.COOLDOWN);
    } else {
      setStatus(DetectionStatus.IDLE);
    }
  };

  const triggerAnalysis = useCallback(async () => {
    if (!videoRef.current || isProcessing) return;

    setStatus(DetectionStatus.ANALYZING);
    setIsProcessing(true);
    lastAnalysisTime.current = Date.now();

    try {
      // Capture full resolution frame for AI
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = videoRef.current.videoWidth;
      captureCanvas.height = videoRef.current.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = captureCanvas.toDataURL('image/jpeg', 0.8);
        
        const result = await analyzeActivity(base64);
        onActivityResult(result);
      }
    } catch (e) {
      console.error("Analysis trigger failed", e);
    } finally {
      setIsProcessing(false);
      setStatus(DetectionStatus.DETECTING_MOTION);
    }
  }, [isProcessing, onActivityResult, setIsProcessing]);

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl group">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} width="64" height="48" className="hidden" />

      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Loading / Empty State */}
      {!streamActive && (
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-slate-500">
           <VideoOff size={48} />
           <p>Waiting for camera permissions...</p>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 backdrop-blur-md transition-colors ${
          status === DetectionStatus.ANALYZING ? 'bg-blue-500/80 text-white' :
          status === DetectionStatus.COOLDOWN ? 'bg-orange-500/80 text-white' :
          status === DetectionStatus.DETECTING_MOTION || motionScore > 0 ? 'bg-green-500/80 text-white' : 
          'bg-slate-700/80 text-slate-300'
        }`}>
          {status === DetectionStatus.ANALYZING ? <Eye className="animate-pulse" size={14} /> :
           status === DetectionStatus.COOLDOWN ? <ActivityIcon size={14} /> :
           <Camera size={14} />}
          {status === DetectionStatus.IDLE && motionScore > 0 ? "Motion Detected" : status.replace('_', ' ')}
        </div>
      </div>

      {/* Motion Metre */}
      <div className="absolute bottom-4 left-4 right-4 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-200 ease-out"
          style={{ width: `${Math.min((motionScore / 2000) * 100, 100)}%` }}
        />
      </div>
      <div className="absolute bottom-6 right-4 text-[10px] text-slate-400 font-mono">
        Motion Delta: {motionScore}
      </div>

      {/* Scanline Effect (Aesthetic) */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />
      
      {/* Manual Trigger (Optional) */}
      <button 
        onClick={() => triggerAnalysis()}
        disabled={isProcessing || !streamActive}
        className="absolute bottom-4 right-4 p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 z-10"
        title="Force Analysis"
      >
        <Zap size={20} />
      </button>
    </div>
  );
};
