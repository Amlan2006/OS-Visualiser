import type { DiskInput, PageInput, Process } from './types';

export const defaultProcesses: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3 },
  { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
  { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 4 },
  { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 },
];

export const defaultDiskInput: DiskInput = {
  diskSize: 200,
  headStart: 53,
  direction: 'RIGHT',
  requests: [98, 183, 37, 122, 14, 124, 65, 67],
};

export const defaultPageInput: PageInput = {
  frames: 3,
  referenceString: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
};

export const cpuAlgorithms = [
  ['fcfs', 'FCFS'],
  ['sjf-np', 'SJF'],
  ['sjf-p', 'SRTF'],
  ['rr', 'Round Robin'],
  ['priority-np', 'Priority'],
  ['priority-p', 'Priority P'],
  ['hrrn', 'HRRN'],
  ['mlfq', 'MLFQ'],
] as const;

export const diskAlgorithms = [
  ['fcfs', 'FCFS'],
  ['sstf', 'SSTF'],
  ['scan', 'SCAN'],
  ['c-scan', 'C-SCAN'],
  ['look', 'LOOK'],
  ['c-look', 'C-LOOK'],
] as const;

export const pageAlgorithms = [
  ['fifo', 'FIFO'],
  ['lru', 'LRU'],
  ['opt', 'OPT'],
  ['lfu', 'LFU'],
  ['mfu', 'MFU'],
  ['clock', 'Clock'],
] as const;
