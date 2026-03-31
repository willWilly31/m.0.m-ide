import React, { useState } from 'react';
import { useGitStore } from '@/stores/gitStore';
import { GitBranch, GitCommit, Plus, Minus, RefreshCw, Upload, Download } from 'lucide-react';

export default function GitPanel() {
  const { branch, status, log, staged, stageFile, unstageFile, addLogEntry, clearStaged } = useGitStore();
  const [commitMsg, setCommitMsg] = useState('');

  const handleCommit = () => {
    if (!commitMsg.trim() || staged.length === 0) return;
    addLogEntry({
      hash: Math.random().toString(36).slice(2, 9),
      message: commitMsg.trim(),
      author: 'Developer',
      date: new Date().toISOString().split('T')[0],
    });
    setCommitMsg('');
    clearStaged();
  };

  const unstaged = status.filter((s) => {
    const path = s.slice(2).trim();
    return !staged.includes(path);
  });

  return (
    <div className="h-full flex flex-col bg-card overflow-y-auto">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <GitBranch className="w-4 h-4 text-ide-success" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source Control</span>
        <span className="ml-auto text-xs font-mono text-primary">{branch}</span>
      </div>

      {/* Commit input */}
      <div className="p-2 border-b border-border">
        <input
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
          placeholder="Commit message"
          className="w-full bg-input text-sm px-3 py-1.5 rounded text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
        />
        <div className="flex gap-1 mt-1.5">
          <button
            onClick={handleCommit}
            disabled={!commitMsg.trim() || staged.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <GitCommit className="w-3 h-3" /> Commit
          </button>
          <button className="p-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Staged */}
      {staged.length > 0 && (
        <div className="border-b border-border">
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            Staged ({staged.length})
          </div>
          {staged.map((path) => (
            <div key={path} className="flex items-center gap-2 px-3 py-0.5 text-xs group hover:bg-secondary/30">
              <span className="text-ide-success font-mono flex-1 truncate">{path}</span>
              <button onClick={() => unstageFile(path)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Minus className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unstaged */}
      {unstaged.length > 0 && (
        <div className="border-b border-border">
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            Changes ({unstaged.length})
          </div>
          {unstaged.map((line) => {
            const status_char = line[0];
            const path = line.slice(2).trim();
            return (
              <div key={path} className="flex items-center gap-2 px-3 py-0.5 text-xs group hover:bg-secondary/30">
                <span className={`font-bold w-3 ${status_char === 'M' ? 'text-ide-warning' : status_char === '?' ? 'text-ide-success' : 'text-destructive'}`}>
                  {status_char === '?' ? 'U' : status_char}
                </span>
                <span className="font-mono flex-1 truncate text-foreground">{path}</span>
                <button onClick={() => stageFile(path)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3 h-3 text-ide-success" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Log */}
      <div>
        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">History</div>
        {log.map((entry) => (
          <div key={entry.hash} className="px-3 py-1.5 border-b border-border/50 hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-primary">{entry.hash}</span>
              <span className="text-xs text-muted-foreground">{entry.date}</span>
            </div>
            <p className="text-xs text-foreground mt-0.5">{entry.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
