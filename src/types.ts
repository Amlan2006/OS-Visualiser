export type Domain = 'cpu' | 'disk' | 'page';

export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
}

export interface CPUSlice {
  id: string | null;
  start: number;
  end: number;
}

export interface CPUResult {
  timeline: CPUSlice[];
  metrics: Record<string, {
    completionTime: number;
    turnaroundTime: number;
    waitingTime: number;
    responseTime: number;
  }>;
  avgTAT: number;
  avgWT: number;
  avgRT: number;
  cpuUtilization: number;
  throughput: number;
}

export interface DiskInput {
  diskSize: number;
  headStart: number;
  direction: 'LEFT' | 'RIGHT';
  requests: number[];
}

export interface DiskResult {
  sequence: number[];
  totalSeekDistance: number;
  avgSeekDistance: number;
}

export interface PageInput {
  frames: number;
  referenceString: number[];
}

export interface PageStep {
  page: number;
  frameState: (number | null)[];
  fault: boolean;
  evicted: number | null;
  refBits?: boolean[];
}

export interface PageResult {
  steps: PageStep[];
  totalFaults: number;
  totalHits: number;
  hitRatio: number;
  missRatio: number;
}
