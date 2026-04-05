import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useFileStore } from '@/stores/fileStore';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';

export default function ChatPanel() {
  const { messages, isLoading, addMessage, updateLastAssistant, setLoading, clearMessages } = useChatStore();
  const { openFile } = useFileStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemPrompt = `You are an AI coding agent operating inside a real software project.

## CORE BEHAVIOR
- Focus only on completing the user's task.
- Do not explain unless explicitly asked.
- Do not add unnecessary features.
- Always prioritize correctness over creativity.

## TASK EXECUTION RULES
- Break every task into clear steps before coding.
- Execute tasks sequentially (never skip steps).
- Do not assume missing information — infer minimally or ask.

## CODE RULES
- Write clean, minimal, production-ready code.
- Follow existing project structure and conventions.
- Do not rewrite entire files unless necessary.
- Modify only relevant parts.

## FILE OPERATIONS
- When editing files:
  - Make precise changes (diff-style mindset).
  - Avoid duplication.
  - Preserve existing logic unless fixing.

## TOOL USAGE
- Prefer structured tools over raw code generation.
- Use API / DB / filesystem tools when needed.
- Do not hallucinate tools that do not exist.

## VALIDATION
- After coding:
  - Check for syntax errors
  - Check logic correctness
  - Ensure task is fully completed

## STOP CONDITION
- Stop immediately when task is complete.
- Do not continue with extra improvements.

## FAILURE HANDLING
- If result is invalid:
  - Retry once with corrected approach
  - If still failing → return best partial result

## OUTPUT FORMAT
- Return ONLY the final result.
- No explanations, no preambles.`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);

    // Build context
    const context = openFile
      ? `Currently editing: ${openFile.path}\n\`\`\`${openFile.language}\n${openFile.content.slice(0, 2000)}\n\`\`\``
      : 'No file currently open.';

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: `${context}\n\nUser: ${userMsg}` },
    ];

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mom-chat`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Error: ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateLastAssistant(assistantContent);
            }
          } catch {}
        }
      }
    } catch (err) {
      updateLastAssistant('Sorry, I encountered an error. Make sure Lovable Cloud is enabled with the AI chat function deployed.');
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Assistant</span>
        </div>
        <button onClick={clearMessages} className="p-1 hover:bg-secondary rounded transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Ask me about your code</p>
            <p className="text-xs text-muted-foreground/60 mt-1">I can read, edit, and analyze files</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none [&_pre]:bg-background [&_pre]:rounded [&_pre]:p-2 [&_code]:font-mono [&_code]:text-xs">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-accent" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary animate-pulse-glow" />
            </div>
            <div className="bg-secondary rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your code..."
            className="flex-1 bg-input text-sm px-3 py-2 rounded text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
