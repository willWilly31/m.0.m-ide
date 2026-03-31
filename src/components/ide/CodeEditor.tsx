import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useFileStore } from '@/stores/fileStore';
import { X, Code2 } from 'lucide-react';

export default function CodeEditor() {
  const { openFile, openTabs, openFileByPath, closeTab, updateFileContent } = useFileStore();

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (openFile && value !== undefined) {
        updateFileContent(openFile.path, value);
      }
    },
    [openFile, updateFileContent]
  );

  if (!openFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card gap-4">
        <Code2 className="w-16 h-16 text-muted-foreground/30" />
        <div className="text-center">
          <p className="text-muted-foreground text-lg">M.0.m IDE</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Open a file from the explorer to start editing</p>
        </div>
        <div className="text-xs text-muted-foreground/40 mt-4 space-y-1">
          <p><kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Ctrl+P</kbd> Command Palette</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Tabs */}
      <div className="flex items-center bg-ide-tab-inactive overflow-x-auto border-b border-border min-h-[35px]">
        {openTabs.map((tab) => (
          <div
            key={tab.path}
            onClick={() => openFileByPath(tab.path)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-border transition-colors ${
              tab.path === openFile.path
                ? 'bg-ide-tab-active text-foreground border-t-2 border-t-primary'
                : 'text-muted-foreground hover:bg-secondary/30'
            }`}
          >
            <span className="truncate max-w-[120px] font-mono">{tab.path.split('/').pop()}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-secondary rounded transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Breadcrumb */}
      <div className="px-3 py-1 text-xs text-muted-foreground bg-card border-b border-border font-mono">
        {openFile.path}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          theme="vs-dark"
          language={openFile.language}
          value={openFile.content}
          onChange={handleChange}
          path={openFile.path}
          options={{
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            minimap: { enabled: true, maxColumn: 80 },
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            autoIndent: 'full',
            formatOnPaste: true,
            scrollBeyondLastLine: false,
            padding: { top: 8 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>
    </div>
  );
}
