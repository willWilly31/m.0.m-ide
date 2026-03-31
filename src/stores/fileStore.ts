import { create } from 'zustand';

export interface VFile {
  path: string;
  content: string;
  language: string;
}

interface FileStore {
  files: VFile[];
  openFile: VFile | null;
  openTabs: VFile[];
  setFiles: (files: VFile[]) => void;
  addFile: (file: VFile) => void;
  deleteFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  openFileByPath: (path: string) => void;
  closeTab: (path: string) => void;
  setOpenFile: (file: VFile | null) => void;
}

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
    py: 'python', json: 'json', html: 'html', css: 'css', md: 'markdown',
    yaml: 'yaml', yml: 'yaml', toml: 'toml', sh: 'shell', bash: 'shell',
    sql: 'sql', txt: 'plaintext', xml: 'xml', svg: 'xml',
  };
  return map[ext] || 'plaintext';
}

const defaultFiles: VFile[] = [
  {
    path: 'src/main.tsx',
    content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
    language: 'typescriptreact',
  },
  {
    path: 'src/App.tsx',
    content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">\n      <h1 className="text-4xl font-bold">Hello M.0.m!</h1>\n    </div>\n  );\n}`,
    language: 'typescriptreact',
  },
  {
    path: 'package.json',
    content: JSON.stringify({ name: "my-project", version: "1.0.0", scripts: { dev: "vite", build: "vite build" }, dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" }, devDependencies: { vite: "^5.0.0", "@vitejs/plugin-react": "^4.0.0" } }, null, 2),
    language: 'json',
  },
  {
    path: 'README.md',
    content: '# My Project\n\nCreated with M.0.m IDE.\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```',
    language: 'markdown',
  },
  {
    path: 'src/index.css',
    content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}',
    language: 'css',
  },
];

export const useFileStore = create<FileStore>((set, get) => ({
  files: defaultFiles,
  openFile: defaultFiles[0],
  openTabs: [defaultFiles[0]],
  setFiles: (files) => set({ files }),
  addFile: (file) => set((s) => ({ files: [...s.files, file] })),
  deleteFile: (path) => set((s) => ({
    files: s.files.filter((f) => f.path !== path),
    openTabs: s.openTabs.filter((f) => f.path !== path),
    openFile: s.openFile?.path === path ? null : s.openFile,
  })),
  updateFileContent: (path, content) => set((s) => ({
    files: s.files.map((f) => f.path === path ? { ...f, content } : f),
    openFile: s.openFile?.path === path ? { ...s.openFile, content } : s.openFile,
    openTabs: s.openTabs.map((f) => f.path === path ? { ...f, content } : f),
  })),
  openFileByPath: (path) => {
    const file = get().files.find((f) => f.path === path);
    if (!file) return;
    const tabs = get().openTabs;
    if (!tabs.find((t) => t.path === path)) {
      set({ openTabs: [...tabs, file], openFile: file });
    } else {
      set({ openFile: file });
    }
  },
  closeTab: (path) => {
    const tabs = get().openTabs.filter((t) => t.path !== path);
    const current = get().openFile;
    set({
      openTabs: tabs,
      openFile: current?.path === path ? (tabs[tabs.length - 1] || null) : current,
    });
  },
  setOpenFile: (file) => set({ openFile: file }),
}));

export { detectLanguage };
