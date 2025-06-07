'use client';

import { useState, useRef } from 'react';
import { DownloadIcon, Hash, Eye, EyeOff } from 'lucide-react';
import { EditorView } from '@codemirror/view';
import { Editor } from './Editor';

export interface EditorAppProps {
  onSave?: (content: string) => void;
  initialContent?: string;
}

export const EditorApp = ({ 
  onSave,
  initialContent = '# Welcome to Vim Editor\n\nStart typing here...\n\n**Bold text** and *italic text*\n\n## Features\n- Markdown support\n- Vim keybindings\n- Clean interface'
}: EditorAppProps) => {
  const [showGutter, setShowGutter] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const [textContent, setTextContent] = useState(initialContent);
  const editorViewRef = useRef<EditorView | null>(null);

  const handleSave = () => {
    if (onSave) {
      onSave(textContent);
    } else {
      // Default web save behavior
      const element = document.createElement("a");
      const file = new Blob([textContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "document.md";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const insertMarkdown = (type: 'bold' | 'italic' | 'underline' | 'h1' | 'h2' | 'normal') => {
    const view = editorViewRef.current;
    if (!view) return;
    
    const selection = view.state.selection.main;
    let from = selection.from;
    let to = selection.to;
    const selectedText = view.state.sliceDoc(from, to);
    
    let newText = '';
    switch (type) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'underline':
        newText = `_${selectedText}_`;
        break;
      case 'h1':
        newText = `# ${selectedText}`;
        break;
      case 'h2':
        newText = `## ${selectedText}`;
        break;
      case 'normal':
        // Remove any markdown syntax
        newText = selectedText.replace(/^#+ |[*_]+/g, '');
        break;
    }
    
    view.dispatch({
      changes: { from, to, insert: newText }
    });
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-black">
      {/* Floating Navbar */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-gray-200/50 flex items-center gap-2 w-[95%] max-w-5xl">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setShowGutter(!showGutter)}
            className="p-1.5 hover:bg-gray-100 rounded-md flex items-center gap-1 text-sm"
            title="Toggle line numbers"
          >
            <Hash size={16} />
            {showGutter ? 'Hide' : 'Show'} Numbers
          </button>
          <button 
            onClick={() => setShowMarkdown(!showMarkdown)}
            className="p-1.5 hover:bg-gray-100 rounded-md flex items-center gap-1 text-sm"
            title="Toggle markdown preview"
          >
            {showMarkdown ? <EyeOff size={16} /> : <Eye size={16} />}
            {showMarkdown ? 'Show Raw' : 'Show Preview'}
          </button>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <button
          onClick={handleSave}
          className="p-1.5 hover:bg-gray-100 rounded-md flex items-center gap-1.5 text-sm"
        >
          <DownloadIcon size={16} /> Save as .md
        </button>
      </header>

      {/* Editor */}
      <main className="pt-20 h-[calc(100vh-40px)]">
        <Editor 
          value={textContent} 
          onChange={setTextContent}
          showGutter={showGutter}
          showMarkdown={showMarkdown}
          editorViewRef={editorViewRef}
        />
      </main>
    </div>
  );
}; 