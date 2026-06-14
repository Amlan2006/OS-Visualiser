import { Activity, Cpu, Database, HardDrive, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { runCPU, runDisk, runPage, type CPUAlgo, type DiskAlgo, type PageAlgo } from './algorithms';
import { cpuAlgorithms, defaultDiskInput, defaultPageInput, defaultProcesses, diskAlgorithms, pageAlgorithms } from './data';
import type { Domain, PageInput, Process } from './types';

const accents: Record<Domain, string> = {
  cpu: '#4fffb0',
  disk: '#ff6b6b',
  page: '#7b9eff',
};

export function App() {
  const [domain, setDomain] = useState<Domain>('cpu');

  return (
    <div className="app" style={{ '--accent': accents[domain] } as CSSProperties}>
      <Header domain={domain} onDomainChange={setDomain} />
      <main className="workspace">
        {domain === 'cpu' && <CPUModule />}
        {domain === 'disk' && <DiskModule />}
        {domain === 'page' && <PageModule />}
      </main>
    </div>
  );
}

function Header({ domain, onDomainChange }: { domain: Domain; onDomainChange: (domain: Domain) => void }) {
  const items: Array<[Domain, string, ReactNode]> = [
    ['cpu', 'CPU', <Cpu size={18} />],
    ['disk', 'Disk', <HardDrive size={18} />],
    ['page', 'Page', <Database size={18} />],
  ];

  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="OS Algorithm Visualizer home">
        <Activity size={24} />
        <span>OS Algorithm Visualizer</span>
      </a>
      <nav className="domain-tabs" aria-label="Visualizer domains">
        {items.map(([id, label, icon]) => (
          <button className={domain === id ? 'active' : ''} key={id} onClick={() => onDomainChange(id)}>
            {icon}
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Shell({ title, kicker, children, aside }: { title: string; kicker: string; children: ReactNode; aside: ReactNode }) {
  return (
    <>
      <section className="intro">
        <div className="register-tape" aria-hidden="true">
          <span>0x1F4 P1 IRQ 0x0A7 PAGE 07 SEEK 183 Q0 P2 0xBEE</span>
          <span>0x1F4 P1 IRQ 0x0A7 PAGE 07 SEEK 183 Q0 P2 0xBEE</span>
        </div>
        <p>{kicker}</p>
        <h1>{title}</h1>
      </section>
      <section className="module-grid">
        <aside className="panel controls-panel">{aside}</aside>
        <section className="visual-panel">{children}</section>
      </section>
    </>
  );
}

function CPUModule() {
  const [algo, setAlgo] = useState<CPUAlgo>('fcfs');
  const [processes, setProcesses] = useState<Process[]>(defaultProcesses);
  const [quantum, setQuantum] = useState(3);
  const result = useMemo(() => runCPU(algo, processes, quantum), [algo, processes, quantum]);
  const [step, setStep] = useState(999);
  const visibleTimeline = result.timeline.slice(0, Math.min(result.timeline.length, step + 1));

  const updateProcess = (index: number, patch: Partial<Process>) => {
    setProcesses((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  return (
    <Shell
      title="CPU Scheduling"
      kicker="Compare fairness, response time, and CPU utilization across classic schedulers."
      aside={(
        <>
          <Tabs items={cpuAlgorithms} active={algo} onChange={(id) => { setAlgo(id as CPUAlgo); setStep(999); }} />
          <label className="field">
            <span>Time Quantum</span>
            <input type="number" min={1} value={quantum} onChange={(event) => setQuantum(Number(event.target.value) || 1)} />
          </label>
          <div className="table-input">
            <div className="input-row input-head"><span>ID</span><span>AT</span><span>BT</span><span>Pri</span></div>
            {processes.map((process, index) => (
              <div className="input-row" key={process.id}>
                <input value={process.id} onChange={(event) => updateProcess(index, { id: event.target.value })} aria-label="Process ID" />
                <input type="number" min={0} value={process.arrivalTime} onChange={(event) => updateProcess(index, { arrivalTime: Number(event.target.value) })} aria-label="Arrival time" />
                <input type="number" min={1} value={process.burstTime} onChange={(event) => updateProcess(index, { burstTime: Math.max(1, Number(event.target.value)) })} aria-label="Burst time" />
                <input type="number" value={process.priority} onChange={(event) => updateProcess(index, { priority: Number(event.target.value) })} aria-label="Priority" />
              </div>
            ))}
          </div>
          <div className="button-row">
            <button onClick={() => setProcesses(defaultProcesses)}><RotateCcw size={16} />Reset</button>
            <button onClick={() => setProcesses((items) => [...items, { id: `P${items.length + 1}`, arrivalTime: 0, burstTime: 1, priority: 1 }])}>Add Row</button>
          </div>
        </>
      )}
    >
      <StepControls step={Math.min(step, result.timeline.length - 1)} max={result.timeline.length - 1} onStep={setStep} />
      <Gantt timeline={visibleTimeline} />
      <MetricCards items={[
        ['Avg TAT', result.avgTAT.toFixed(2)],
        ['Avg WT', result.avgWT.toFixed(2)],
        ['Avg RT', result.avgRT.toFixed(2)],
        ['CPU Util.', `${result.cpuUtilization.toFixed(1)}%`],
        ['Throughput', result.throughput.toFixed(2)],
      ]} />
      <table className="data-table">
        <thead><tr><th>PID</th><th>CT</th><th>TAT</th><th>WT</th><th>RT</th></tr></thead>
        <tbody>
          {Object.entries(result.metrics).map(([pid, metric]) => (
            <tr key={pid}><td>{pid}</td><td>{metric.completionTime}</td><td>{metric.turnaroundTime}</td><td>{metric.waitingTime}</td><td>{metric.responseTime}</td></tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}

function DiskModule() {
  const [algo, setAlgo] = useState<DiskAlgo>('fcfs');
  const [diskSize, setDiskSize] = useState(defaultDiskInput.diskSize);
  const [headStart, setHeadStart] = useState(defaultDiskInput.headStart);
  const [direction, setDirection] = useState(defaultDiskInput.direction);
  const [requests, setRequests] = useState(defaultDiskInput.requests.join(', '));
  const parsedRequests = parseNumberList(requests);
  const result = useMemo(() => runDisk(algo, { diskSize, headStart, direction, requests: parsedRequests }), [algo, diskSize, headStart, direction, parsedRequests.join(',')]);

  return (
    <Shell
      title="Disk Scheduling"
      kicker="Trace head movement and compare seek cost before it becomes a blur of cylinders."
      aside={(
        <>
          <Tabs items={diskAlgorithms} active={algo} onChange={(id) => setAlgo(id as DiskAlgo)} />
          <label className="field"><span>Disk Size</span><input type="number" min={1} value={diskSize} onChange={(event) => setDiskSize(Number(event.target.value) || 1)} /></label>
          <label className="field"><span>Initial Head</span><input type="number" min={0} max={diskSize - 1} value={headStart} onChange={(event) => setHeadStart(Number(event.target.value) || 0)} /></label>
          <label className="field"><span>Direction</span><select value={direction} onChange={(event) => setDirection(event.target.value as 'LEFT' | 'RIGHT')}><option>RIGHT</option><option>LEFT</option></select></label>
          <label className="field"><span>Request Queue</span><textarea value={requests} onChange={(event) => setRequests(event.target.value)} /></label>
          <button onClick={() => { setDiskSize(defaultDiskInput.diskSize); setHeadStart(defaultDiskInput.headStart); setDirection(defaultDiskInput.direction); setRequests(defaultDiskInput.requests.join(', ')); }}><RotateCcw size={16} />Reset</button>
        </>
      )}
    >
      <SeekPlot head={headStart} sequence={result.sequence} diskSize={diskSize} />
      <MetricCards items={[
        ['Total Seek', result.totalSeekDistance.toString()],
        ['Average Seek', result.avgSeekDistance.toFixed(2)],
        ['Stops', result.sequence.length.toString()],
      ]} />
      <div className="sequence"><strong>Sequence</strong><span>{[headStart, ...result.sequence].join(' -> ')}</span></div>
      <Comparison current={algo} diskSize={diskSize} headStart={headStart} direction={direction} requests={parsedRequests} />
    </Shell>
  );
}

function PageModule() {
  const [algo, setAlgo] = useState<PageAlgo>('fifo');
  const [frames, setFrames] = useState(defaultPageInput.frames);
  const [refs, setRefs] = useState(defaultPageInput.referenceString.join(' '));
  const referenceString = parseNumberList(refs);
  const result = useMemo(() => runPage(algo, { frames, referenceString }), [algo, frames, referenceString.join(',')]);

  return (
    <Shell
      title="Page Replacement"
      kicker="Watch memory frames mutate one reference at a time, with hits and faults called out clearly."
      aside={(
        <>
          <Tabs items={pageAlgorithms} active={algo} onChange={(id) => setAlgo(id as PageAlgo)} />
          <label className="field"><span>Frames</span><input type="number" min={1} max={8} value={frames} onChange={(event) => setFrames(Math.min(8, Math.max(1, Number(event.target.value) || 1)))} /></label>
          <label className="field"><span>Reference String</span><textarea value={refs} onChange={(event) => setRefs(event.target.value)} /></label>
          <button onClick={() => { setFrames(defaultPageInput.frames); setRefs(defaultPageInput.referenceString.join(' ')); }}><RotateCcw size={16} />Reset</button>
        </>
      )}
    >
      <MetricCards items={[
        ['Faults', result.totalFaults.toString()],
        ['Hits', result.totalHits.toString()],
        ['Hit Ratio', `${result.hitRatio.toFixed(1)}%`],
        ['Miss Ratio', `${result.missRatio.toFixed(1)}%`],
      ]} />
      <FrameTable result={result} frames={frames} />
      {algo === 'clock' && <ClockDial step={result.steps[result.steps.length - 1]} />}
      <PageComparison frames={frames} referenceString={referenceString} />
    </Shell>
  );
}

function Tabs<T extends readonly (readonly [string, string])[]>({ items, active, onChange }: { items: T; active: string; onChange: (id: T[number][0]) => void }) {
  return (
    <div className="tabs">
      {items.map(([id, label]) => (
        <button className={active === id ? 'active' : ''} key={id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function StepControls({ step, max, onStep }: { step: number; max: number; onStep: (step: number) => void }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="stepbar">
      <button onClick={() => onStep(0)} title="Reset"><SkipBack size={16} /></button>
      <button onClick={() => onStep(Math.max(0, step - 1))} title="Previous"><Pause size={16} /></button>
      <button onClick={() => { setPlaying(!playing); onStep(playing ? step : max); }} title="Play"><Play size={16} /></button>
      <button onClick={() => onStep(Math.min(max, step + 1))} title="Next"><SkipForward size={16} /></button>
      <span>Step {Math.max(0, step + 1)} / {max + 1}</span>
    </div>
  );
}

function Gantt({ timeline }: { timeline: { id: string | null; start: number; end: number }[] }) {
  const end = Math.max(...timeline.map((slice) => slice.end), 1);
  return (
    <div className="gantt" aria-label="Gantt chart">
      {timeline.map((slice, index) => (
        <div
          className={slice.id ? 'bar' : 'bar idle'}
          key={`${slice.id}-${slice.start}-${index}`}
          style={{ width: `${((slice.end - slice.start) / end) * 100}%` }}
        >
          <span>{slice.id ?? 'IDLE'}</span>
          <small>{slice.start}-{slice.end}</small>
        </div>
      ))}
    </div>
  );
}

function SeekPlot({ head, sequence, diskSize }: { head: number; sequence: number[]; diskSize: number }) {
  const points = [head, ...sequence].map((value, index, all) => {
    const x = 32 + (index / Math.max(1, all.length - 1)) * 720;
    const y = 32 + (value / Math.max(1, diskSize - 1)) * 280;
    return `${x},${y}`;
  });
  return (
    <svg className="seek-plot" viewBox="0 0 784 344" role="img" aria-label="Disk seek path">
      <line x1="32" x2="752" y1="32" y2="32" />
      <line x1="32" x2="752" y1="312" y2="312" />
      <polyline points={points.join(' ')} />
      {[head, ...sequence].map((value, index, all) => {
        const x = 32 + (index / Math.max(1, all.length - 1)) * 720;
        const y = 32 + (value / Math.max(1, diskSize - 1)) * 280;
        return <g key={`${value}-${index}`}><circle cx={x} cy={y} r="6" /><text x={x + 8} y={y - 8}>{value}</text></g>;
      })}
    </svg>
  );
}

function FrameTable({ result, frames }: { result: ReturnType<typeof runPage>; frames: number }) {
  return (
    <div className="frame-wrap">
      <table className="frame-table">
        <thead>
          <tr><th>Frame</th>{result.steps.map((step, index) => <th className={step.fault ? 'fault' : 'hit'} key={index}>{step.page}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: frames }).map((_, frameIndex) => (
            <tr key={frameIndex}>
              <th>F{frameIndex + 1}</th>
              {result.steps.map((step, stepIndex) => <td key={stepIndex}>{step.frameState[frameIndex] ?? '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClockDial({ step }: { step?: { frameState: (number | null)[]; refBits?: boolean[] } }) {
  if (!step) return null;
  return (
    <div className="clock-dial">
      {step.frameState.map((page, index) => <span key={index}>{page ?? '-'}<small>{step.refBits?.[index] ? '1' : '0'}</small></span>)}
    </div>
  );
}

function MetricCards({ items }: { items: [string, string][] }) {
  return (
    <div className="metrics">
      {items.map(([label, value]) => <div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>
  );
}

function Comparison({ current, diskSize, headStart, direction, requests }: { current: DiskAlgo; diskSize: number; headStart: number; direction: 'LEFT' | 'RIGHT'; requests: number[] }) {
  const rows = diskAlgorithms.map(([id, label]) => [label, runDisk(id, { diskSize, headStart, direction, requests }).totalSeekDistance, id] as const)
    .sort((a, b) => a[1] - b[1]);
  return <MiniRank title="Disk Comparison" rows={rows.map(([label, value, id]) => [label, value.toString(), id === current])} />;
}

function PageComparison(input: PageInput) {
  const rows = pageAlgorithms.map(([id, label]) => [label, runPage(id, input).totalFaults] as const).sort((a, b) => a[1] - b[1]);
  return <MiniRank title="Page Fault Ranking" rows={rows.map(([label, value]) => [label, `${value} faults`, false])} />;
}

function MiniRank({ title, rows }: { title: string; rows: [string, string, boolean][] }) {
  return (
    <div className="rank">
      <h2>{title}</h2>
      {rows.map(([label, value, active]) => <div className={active ? 'active' : ''} key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>
  );
}

function parseNumberList(value: string) {
  return value.split(/[,\s]+/).map((item) => Number(item.trim())).filter((item) => Number.isFinite(item));
}
