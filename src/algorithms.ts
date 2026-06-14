import type { CPUResult, CPUSlice, DiskInput, DiskResult, PageInput, PageResult, PageStep, Process } from './types';

type CPUAlgo = 'fcfs' | 'sjf-np' | 'sjf-p' | 'rr' | 'priority-np' | 'priority-p' | 'hrrn' | 'mlfq';
type DiskAlgo = 'fcfs' | 'sstf' | 'scan' | 'c-scan' | 'look' | 'c-look';
type PageAlgo = 'fifo' | 'lru' | 'opt' | 'lfu' | 'mfu' | 'clock';

interface RuntimeProcess extends Process {
  remaining: number;
  completionTime?: number;
  firstRun?: number;
  queue?: number;
}

const byArrival = (a: Process, b: Process) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id);
const clone = (processes: Process[]): RuntimeProcess[] => processes.map((p) => ({ ...p, remaining: p.burstTime, queue: 0 }));

function pushSlice(timeline: CPUSlice[], id: string | null, start: number, end: number) {
  if (end <= start) return;
  const prev = timeline[timeline.length - 1];
  if (prev && prev.id === id && prev.end === start) {
    prev.end = end;
    return;
  }
  timeline.push({ id, start, end });
}

function summarize(processes: RuntimeProcess[], timeline: CPUSlice[]): CPUResult {
  const metrics: CPUResult['metrics'] = {};
  let totalBusy = 0;
  timeline.forEach((slice) => {
    if (slice.id) totalBusy += slice.end - slice.start;
  });

  for (const process of processes) {
    const completionTime = process.completionTime ?? 0;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;
    const responseTime = (process.firstRun ?? process.arrivalTime) - process.arrivalTime;
    metrics[process.id] = { completionTime, turnaroundTime, waitingTime, responseTime };
  }

  const values = Object.values(metrics);
  const end = Math.max(...timeline.map((slice) => slice.end), 0);
  const start = Math.min(...processes.map((process) => process.arrivalTime), 0);
  const span = Math.max(1, end - start);
  return {
    timeline,
    metrics,
    avgTAT: average(values.map((metric) => metric.turnaroundTime)),
    avgWT: average(values.map((metric) => metric.waitingTime)),
    avgRT: average(values.map((metric) => metric.responseTime)),
    cpuUtilization: (totalBusy / span) * 100,
    throughput: processes.length / span,
  };
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

export function runCPU(algo: CPUAlgo, source: Process[], quantum = 3): CPUResult {
  const processes = clone(source).sort(byArrival);
  const timeline: CPUSlice[] = [];

  if (algo === 'fcfs' || algo === 'sjf-np' || algo === 'priority-np' || algo === 'hrrn') {
    let time = 0;
    const pending = [...processes];
    while (pending.length) {
      const ready = pending.filter((p) => p.arrivalTime <= time);
      if (!ready.length) {
        const nextArrival = Math.min(...pending.map((p) => p.arrivalTime));
        pushSlice(timeline, null, time, nextArrival);
        time = nextArrival;
        continue;
      }

      let next = ready[0];
      if (algo === 'sjf-np') next = [...ready].sort((a, b) => a.burstTime - b.burstTime || byArrival(a, b))[0];
      if (algo === 'priority-np') next = [...ready].sort((a, b) => a.priority - b.priority || byArrival(a, b))[0];
      if (algo === 'hrrn') {
        next = [...ready].sort((a, b) => {
          const ar = (time - a.arrivalTime + a.burstTime) / a.burstTime;
          const br = (time - b.arrivalTime + b.burstTime) / b.burstTime;
          return br - ar || byArrival(a, b);
        })[0];
      }

      next.firstRun ??= time;
      pushSlice(timeline, next.id, time, time + next.burstTime);
      time += next.burstTime;
      next.remaining = 0;
      next.completionTime = time;
      pending.splice(pending.indexOf(next), 1);
    }
    return summarize(processes, timeline);
  }

  if (algo === 'rr' || algo === 'mlfq') {
    return runQueueScheduler(processes, timeline, algo === 'mlfq' ? [2, 4, 8] : [quantum]);
  }

  let time = 0;
  while (processes.some((p) => p.remaining > 0)) {
    const ready = processes.filter((p) => p.arrivalTime <= time && p.remaining > 0);
    if (!ready.length) {
      const nextArrival = Math.min(...processes.filter((p) => p.remaining > 0).map((p) => p.arrivalTime));
      pushSlice(timeline, null, time, nextArrival);
      time = nextArrival;
      continue;
    }
    const next = [...ready].sort((a, b) => {
      if (algo === 'priority-p') return a.priority - b.priority || a.remaining - b.remaining || byArrival(a, b);
      return a.remaining - b.remaining || byArrival(a, b);
    })[0];
    next.firstRun ??= time;
    pushSlice(timeline, next.id, time, time + 1);
    next.remaining -= 1;
    time += 1;
    if (next.remaining === 0) next.completionTime = time;
  }
  return summarize(processes, timeline);
}

function runQueueScheduler(processes: RuntimeProcess[], timeline: CPUSlice[], quantums: number[]): CPUResult {
  let time = 0;
  const ready: RuntimeProcess[] = [];
  const arrived = new Set<string>();
  const enqueueArrivals = () => {
    processes.filter((p) => p.arrivalTime <= time && p.remaining > 0 && !arrived.has(p.id)).forEach((p) => {
      arrived.add(p.id);
      ready.push(p);
    });
  };

  while (processes.some((p) => p.remaining > 0)) {
    enqueueArrivals();
    if (!ready.length) {
      const nextArrival = Math.min(...processes.filter((p) => p.remaining > 0 && !arrived.has(p.id)).map((p) => p.arrivalTime));
      pushSlice(timeline, null, time, nextArrival);
      time = nextArrival;
      enqueueArrivals();
    }

    ready.sort((a, b) => (a.queue ?? 0) - (b.queue ?? 0) || a.arrivalTime - b.arrivalTime);
    const current = ready.shift();
    if (!current) continue;
    const level = current.queue ?? 0;
    const slice = Math.min(current.remaining, quantums[Math.min(level, quantums.length - 1)]);
    current.firstRun ??= time;
    pushSlice(timeline, current.id, time, time + slice);
    for (let tick = 0; tick < slice; tick += 1) {
      time += 1;
      current.remaining -= 1;
      enqueueArrivals();
      if (current.remaining === 0) break;
    }
    if (current.remaining === 0) current.completionTime = time;
    else {
      current.queue = Math.min(level + (quantums.length > 1 ? 1 : 0), quantums.length - 1);
      ready.push(current);
    }
  }
  return summarize(processes, timeline);
}

export function runDisk(algo: DiskAlgo, input: DiskInput): DiskResult {
  const requests = input.requests.filter((request) => request >= 0 && request < input.diskSize);
  const sorted = [...requests].sort((a, b) => a - b);
  let sequence: number[] = [];

  if (algo === 'fcfs') sequence = requests;
  if (algo === 'sstf') {
    const pending = [...requests];
    let head = input.headStart;
    while (pending.length) {
      pending.sort((a, b) => Math.abs(a - head) - Math.abs(b - head) || a - b);
      const next = pending.shift()!;
      sequence.push(next);
      head = next;
    }
  }
  if (algo !== 'fcfs' && algo !== 'sstf') {
    const left = sorted.filter((request) => request < input.headStart).reverse();
    const right = sorted.filter((request) => request >= input.headStart);
    const goingRight = input.direction === 'RIGHT';
    if (algo === 'scan') sequence = goingRight ? [...right, input.diskSize - 1, ...left] : [...left, 0, ...right];
    if (algo === 'c-scan') sequence = goingRight ? [...right, input.diskSize - 1, 0, ...left.reverse()] : [...left, 0, input.diskSize - 1, ...right.reverse()];
    if (algo === 'look') sequence = goingRight ? [...right, ...left] : [...left, ...right];
    if (algo === 'c-look') sequence = goingRight ? [...right, ...left.reverse()] : [...left, ...right.reverse()];
  }

  let head = input.headStart;
  const totalSeekDistance = sequence.reduce((total, cylinder) => {
    const distance = total + Math.abs(cylinder - head);
    head = cylinder;
    return distance;
  }, 0);
  return {
    sequence,
    totalSeekDistance,
    avgSeekDistance: totalSeekDistance / Math.max(1, requests.length),
  };
}

export function runPage(algo: PageAlgo, input: PageInput): PageResult {
  const frames: (number | null)[] = Array.from({ length: input.frames }, () => null);
  const queue: number[] = [];
  const lastUsed = new Map<number, number>();
  const frequencies = new Map<number, number>();
  const refBits = Array.from({ length: input.frames }, () => false);
  let pointer = 0;
  const steps: PageStep[] = [];

  input.referenceString.forEach((page, index) => {
    const hitIndex = frames.indexOf(page);
    const hit = hitIndex !== -1;
    let evicted: number | null = null;
    frequencies.set(page, (frequencies.get(page) ?? 0) + 1);
    if (hit) {
      lastUsed.set(page, index);
      if (algo === 'clock') refBits[hitIndex] = true;
    } else {
      let target = frames.indexOf(null);
      if (target === -1) {
        target = chooseVictim(algo, frames as number[], queue, lastUsed, frequencies, input.referenceString, index, refBits, pointer);
        if (algo === 'clock') {
          pointer = (target + 1) % frames.length;
        }
        evicted = frames[target];
        const queueIndex = queue.indexOf(evicted!);
        if (queueIndex !== -1) queue.splice(queueIndex, 1);
      }
      frames[target] = page;
      queue.push(page);
      lastUsed.set(page, index);
      if (algo === 'clock') refBits[target] = true;
    }
    steps.push({ page, frameState: [...frames], fault: !hit, evicted, refBits: algo === 'clock' ? [...refBits] : undefined });
  });

  const totalFaults = steps.filter((step) => step.fault).length;
  const totalHits = steps.length - totalFaults;
  return {
    steps,
    totalFaults,
    totalHits,
    hitRatio: (totalHits / Math.max(1, steps.length)) * 100,
    missRatio: (totalFaults / Math.max(1, steps.length)) * 100,
  };
}

function chooseVictim(
  algo: PageAlgo,
  frames: number[],
  queue: number[],
  lastUsed: Map<number, number>,
  frequencies: Map<number, number>,
  refs: number[],
  index: number,
  refBits: boolean[],
  pointer: number,
) {
  if (algo === 'fifo') return frames.indexOf(queue[0]);
  if (algo === 'lru') return frames.map((page, i) => [i, lastUsed.get(page) ?? -1] as const).sort((a, b) => a[1] - b[1])[0][0];
  if (algo === 'opt') {
    return frames.map((page, i) => {
      const nextUse = refs.slice(index + 1).indexOf(page);
      return [i, nextUse === -1 ? Number.POSITIVE_INFINITY : nextUse] as const;
    }).sort((a, b) => b[1] - a[1])[0][0];
  }
  if (algo === 'lfu' || algo === 'mfu') {
    return frames.map((page, i) => [i, frequencies.get(page) ?? 0, lastUsed.get(page) ?? -1] as const)
      .sort((a, b) => algo === 'lfu' ? a[1] - b[1] || a[2] - b[2] : b[1] - a[1] || a[2] - b[2])[0][0];
  }
  while (true) {
    if (!refBits[pointer]) return pointer;
    refBits[pointer] = false;
    pointer = (pointer + 1) % frames.length;
  }
}

export type { CPUAlgo, DiskAlgo, PageAlgo };
