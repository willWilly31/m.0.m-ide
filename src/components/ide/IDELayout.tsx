import React, { useState, useEffect } from 'react';
import FileTree from '@/components/ide/FileTree';
import CodeEditor from '@/components/ide/CodeEditor';
import ChatPanel from '@/components/ide/ChatPanel';
import Preview from '@/components/ide/Preview';
import GitPanel from '@/components/ide/GitPanel';
import CommandPalette from '@/components/ide/CommandPalette';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Code2, MessageSquare, Eye, GitBranch,
  PanelLeftClose, PanelLeftOpen, Settings, Search, X
} from 'lucide-react';

type RightTab = 'chat' | 'preview' | 'git';

export default function IDELayout() {
  const isMobile = useIsMobile();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [rightTab, setRightTab] = useState<RightTab>('chat');
  const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
    setRightPanelOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const tabs: { id: RightTab; icon: React.ElementType; label: string }[] = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'preview', icon: Eye, label: 'Preview' },
    { id: 'git', icon: GitBranch, label: 'Git' },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="h-10 bg-ide-titlebar flex items-center px-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/80" />
          <div className="w-3 h-3 rounded-full bg-ide-warning/80" />
          <div className="w-3 h-3 rounded-full bg-ide-success/80" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">M.0.m IDE</span>
        </div>
        <button onClick={() => setCmdOpen(true)} className="p-1 hover:bg-secondary rounded transition-colors">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {!isMobile && (
          <div className="w-12 bg-ide-activitybar flex flex-col items-center py-2 gap-1 border-r border-border flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded transition-colors ${sidebarOpen ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <button onClick={() => setCmdOpen(true)} className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}

        {sidebarOpen && (
          <div className={`${isMobile ? 'absolute inset-y-0 left-0 z-20 w-72 shadow-xl' : 'w-60'} flex-shrink-0 border-r border-border bg-card`}>
            <FileTree />
          </div>
        )}

        {isMobile && sidebarOpen && (
          <button className="absolute inset-0 z-10 bg-black/40" onClick={() => setSidebarOpen(false)} aria-label="Close file tree" />
        )}

        <div className="flex-1 min-w-0">
          <CodeEditor />
        </div>

        {!isMobile && rightPanelOpen && (
          <div className="w-80 flex-shrink-0 border-l border-border flex flex-col">
            <div className="flex border-b border-border bg-ide-tab-inactive">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs transition-colors ${
                    rightTab === tab.id
                      ? 'bg-card text-foreground border-b-2 border-b-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {rightTab === 'chat' && <ChatPanel />}
              {rightTab === 'preview' && <Preview />}
              {rightTab === 'git' && <GitPanel />}
            </div>
          </div>
        )}

        {isMobile && rightPanelOpen && (
          <div className="absolute inset-x-0 bottom-0 z-30 h-[55vh] border-t border-border bg-card shadow-2xl flex flex-col">
            <div className="flex items-center px-2 py-1 border-b border-border bg-ide-tab-inactive">
              <div className="flex flex-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs ${rightTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setRightPanelOpen(false)} className="p-1 text-muted-foreground" aria-label="Close panel">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {rightTab === 'chat' && <ChatPanel />}
              {rightTab === 'preview' && <Preview />}
              {rightTab === 'git' && <GitPanel />}
            </div>
          </div>
        )}
      </div>

      <div className="h-8 bg-ide-statusbar flex items-center px-3 text-xs text-primary-foreground flex-shrink-0 gap-3">
        <button onClick={() => setSidebarOpen((v) => !v)} className="flex items-center gap-1 hover:opacity-80">
          {sidebarOpen ? <PanelLeftClose className="w-3 h-3" /> : <PanelLeftOpen className="w-3 h-3" />} Files
        </button>
        <span className="flex items-center gap-1">
          <Code2 className="w-3 h-3" /> M.0.m
        </span>
        <div className="flex-1" />
        <button onClick={() => setRightPanelOpen((v) => !v)} className="hover:opacity-80 transition-opacity">
          {rightPanelOpen ? 'Panel ✓' : 'Panel ✗'}
        </button>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onFocusChat={() => setRightTab('chat')} />
    </div>
  );
}
