import React, { useMemo, useState } from 'react';
import { useFileStore, detectLanguage } from '@/stores/fileStore';
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  Plus, Trash2, FileCode, FileJson, FileText, FileCog
} from 'lucide-react';

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const p of paths) {
    const parts = p.split('/');
    let current = root;
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      const isDir = i < parts.length - 1;
      let node = current.find((n) => n.name === parts[i] && n.isDir === isDir);
      if (!node) {
        node = { name: parts[i], path: currentPath, isDir, children: [] };
        current.push(node);
      }
      current = node.children;
    }
  }
  return root;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx': return <FileCode className="w-4 h-4 text-ide-info" />;
    case 'json': return <FileJson className="w-4 h-4 text-ide-warning" />;
    case 'css': case 'scss': return <FileCog className="w-4 h-4 text-accent" />;
    case 'md': return <FileText className="w-4 h-4 text-muted-foreground" />;
    case 'py': return <FileCode className="w-4 h-4 text-ide-success" />;
    default: return <File className="w-4 h-4 text-muted-foreground" />;
  }
}

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const { openFileByPath, openFile, deleteFile } = useFileStore();
  const isActive = openFile?.path === node.path;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-1 px-2 py-0.5 text-sm hover:bg-secondary/50 text-secondary-foreground transition-colors"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          {open ? <FolderOpen className="w-4 h-4 text-ide-warning" /> : <Folder className="w-4 h-4 text-ide-warning" />}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && node.children
          .sort((a, b) => (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0) || a.name.localeCompare(b.name))
          .map((child) => <TreeItem key={child.path} node={child} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        onClick={() => openFileByPath(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-0.5 text-sm transition-colors ${
          isActive ? 'bg-secondary text-foreground' : 'text-secondary-foreground hover:bg-secondary/40'
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {getFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); deleteFile(node.path); }}
        className="absolute right-1 top-0.5 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded transition-opacity"
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </button>
    </div>
  );
}

export default function FileTree() {
  const { files, addFile } = useFileStore();
  const [showNew, setShowNew] = useState(false);
  const [newPath, setNewPath] = useState('');

  const tree = useMemo(() => buildTree(files.map((f) => f.path)), [files]);

  const handleCreate = () => {
    if (newPath.trim()) {
      addFile({ path: newPath.trim(), content: '', language: detectLanguage(newPath.trim()) });
      setNewPath('');
      setShowNew(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</span>
        <button onClick={() => setShowNew(!showNew)} className="p-1 hover:bg-sidebar-accent rounded transition-colors">
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      {showNew && (
        <div className="px-2 py-1 border-b border-sidebar-border">
          <input
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="path/to/file.ts"
            className="w-full bg-input text-sm px-2 py-1 rounded text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
            autoFocus
          />
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-1">
        {tree.sort((a, b) => (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0) || a.name.localeCompare(b.name))
          .map((node) => <TreeItem key={node.path} node={node} depth={0} />)}
      </div>
    </div>
  );
}
