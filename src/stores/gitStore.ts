import { create } from 'zustand';

export interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface GitStore {
  branch: string;
  status: string[];
  log: GitLogEntry[];
  staged: string[];
  setBranch: (branch: string) => void;
  setStatus: (status: string[]) => void;
  addLogEntry: (entry: GitLogEntry) => void;
  setLog: (log: GitLogEntry[]) => void;
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  clearStaged: () => void;
}

export const useGitStore = create<GitStore>((set) => ({
  branch: 'main',
  status: ['M src/App.tsx', '?? src/index.css'],
  log: [
    { hash: 'a1b2c3d', message: 'Initial commit', author: 'Developer', date: '2026-03-30' },
    { hash: 'e4f5g6h', message: 'Add styling', author: 'Developer', date: '2026-03-31' },
  ],
  staged: [],
  setBranch: (branch) => set({ branch }),
  setStatus: (status) => set({ status }),
  addLogEntry: (entry) => set((s) => ({ log: [entry, ...s.log] })),
  setLog: (log) => set({ log }),
  stageFile: (path) => set((s) => ({ staged: [...s.staged, path] })),
  unstageFile: (path) => set((s) => ({ staged: s.staged.filter((f) => f !== path) })),
  clearStaged: () => set({ staged: [] }),
}));
