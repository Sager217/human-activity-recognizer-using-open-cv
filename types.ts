export interface ActivityResult {
  activity: string;
  confidence: number;
  description: string;
  timestamp: string;
}

export enum DetectionStatus {
  IDLE = 'IDLE',
  DETECTING_MOTION = 'DETECTING_MOTION',
  ANALYZING = 'ANALYZING',
  COOLDOWN = 'COOLDOWN'
}

export interface ActivityStat {
  name: string;
  count: number;
}
