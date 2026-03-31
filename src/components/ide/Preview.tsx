import React from 'react';
import { useFileStore } from '@/stores/fileStore';
import { Eye, ExternalLink } from 'lucide-react';

export default function Preview() {
  const { openFile } = useFileStore();

  const isHtml = openFile?.language === 'html';
  const isMarkdown = openFile?.language === 'markdown';

  if (!openFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card gap-3">
        <Eye className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Open an HTML or Markdown file to preview</p>
      </div>
    );
  }

  if (isHtml) {
    return (
      <div className="h-full flex flex-col bg-card">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Eye className="w-4 h-4 text-ide-info" />
          <span className="text-xs font-mono text-muted-foreground truncate">{openFile.path}</span>
        </div>
        <div className="flex-1">
          <iframe
            srcDoc={openFile.content}
            className="w-full h-full border-none bg-foreground"
            sandbox="allow-scripts"
            title="Preview"
          />
        </div>
      </div>
    );
  }

  if (isMarkdown) {
    return (
      <div className="h-full flex flex-col bg-card">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Eye className="w-4 h-4 text-ide-info" />
          <span className="text-xs font-mono text-muted-foreground truncate">{openFile.path}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">{openFile.content}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-card gap-3">
      <Eye className="w-10 h-10 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">Preview available for HTML & Markdown files</p>
      <p className="text-xs text-muted-foreground/60">
        For React projects, connect the backend and use <code className="font-mono text-primary">npm run dev</code>
      </p>
    </div>
  );
}
