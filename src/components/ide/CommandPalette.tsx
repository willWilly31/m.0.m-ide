import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useFileStore } from '@/stores/fileStore';
import { File, GitBranch, MessageSquare, Search } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onFocusChat: () => void;
}

export default function CommandPalette({ open, onClose, onFocusChat }: Props) {
  const { files, openFileByPath } = useFileStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        // Toggle handled by parent
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg">
        <Command className="bg-popover border border-border rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Command.Input
              placeholder="Search files, commands..."
              className="flex-1 bg-transparent text-sm py-3 text-foreground placeholder:text-muted-foreground outline-none font-mono"
              autoFocus
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-1">
            <Command.Empty className="p-4 text-sm text-muted-foreground text-center">No results found.</Command.Empty>

            <Command.Group heading="Files" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {files.map((file) => (
                <Command.Item
                  key={file.path}
                  value={file.path}
                  onSelect={() => { openFileByPath(file.path); onClose(); }}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer text-foreground data-[selected=true]:bg-secondary transition-colors"
                >
                  <File className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">{file.path}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Command.Item
                onSelect={() => { onFocusChat(); onClose(); }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Focus AI Chat</span>
              </Command.Item>
              <Command.Item
                onSelect={onClose}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer text-foreground data-[selected=true]:bg-secondary transition-colors"
              >
                <GitBranch className="w-4 h-4 text-ide-success" />
                <span>Git: Commit</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
