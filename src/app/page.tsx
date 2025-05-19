'use client';

import { useState, useEffect, useRef } from 'react';
import { DownloadIcon, Hash, Eye, EyeOff } from 'lucide-react';

// CodeMirror Imports
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { vim } from '@replit/codemirror-vim';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, foldGutter, indentOnInput, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Custom setup without line numbers by default
const customSetup = [
  history(),
  foldGutter(),
  indentOnInput(),
  bracketMatching(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
];

// Basic CodeMirror theme
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    backgroundColor: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
  },
  '.cm-scroller': { 
    overflow: 'auto',
    lineHeight: '1.6',
    padding: '1rem 2rem',
  },
  '.cm-content': {
    caretColor: '#ff0000',
    fontFamily: 'inherit',
    maxWidth: '900px',
    margin: '0 auto',
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#ff0000',
  },
  '.cm-gutters': {
    display: 'none', // Hide gutters by default
    backgroundColor: '#f8f9fa',
    color: '#6e7781',
    border: 'none',
    borderRight: '1px solid #e1e4e8',
    paddingRight: '8px',
  },
  '&.show-gutters .cm-gutters': {
    display: 'flex', // Show gutters when the class is present
  },
  '.cm-gutterElement': {
    padding: '0 4px 0 8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: '#24292e',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '&.cm-focused .cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-selectionLayer': {
    zIndex: '1 !important',
  },
  '.cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: 'rgba(173, 216, 230, 0.4) !important',
  },
  '&.cm-focused .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: 'rgba(173, 216, 230, 0.4) !important',
  },
  '.cm-content .cm-selectionBackground': {
    backgroundColor: 'rgba(255, 0, 0, 0.5) !important',
  },
  '.cm-content ::selection': {
    color: 'red !important',
    backgroundColor: 'rgba(173, 216, 230, 0.5) !important',
  },
});

// Markdown preview styles
const markdownPreviewStyles = HighlightStyle.define([
  { tag: tags.url, display: 'none' },
  { tag: tags.heading1, display: 'block', fontSize: "1.6em", fontWeight: "bold", marginTop: "1em", marginBottom: "0.5em" },
  { tag: tags.heading2, display: 'block', fontSize: "1.4em", fontWeight: "bold", marginTop: "0.8em", marginBottom: "0.4em" },
  { tag: tags.heading3, display: 'block', fontSize: "1.2em", fontWeight: "bold", marginTop: "0.6em", marginBottom: "0.3em" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.link, color: "#0969da", textDecoration: "underline" },
  { tag: tags.quote, color: "#6a737d", fontStyle: "italic", marginLeft: "1em", borderLeft: "3px solid #e1e4e8", paddingLeft: "1em" },
  { tag: tags.list, color: "#24292e" },
]);

// Raw markdown styles (when preview is off)
const rawMarkdownStyles = HighlightStyle.define([
  { tag: tags.heading1, color: "#24292e" },
  { tag: tags.heading2, color: "#24292e" },
  { tag: tags.heading3, color: "#24292e" },
  { tag: tags.strong, color: "#24292e", fontWeight: "bold" },
  { tag: tags.emphasis, color: "#24292e", fontStyle: "italic" },
  { tag: tags.link, color: "#0969da" },
  { tag: tags.url, color: "#0969da", textDecoration: "underline" },
  { tag: tags.quote, color: "#24292e" },
  { tag: tags.list, color: "#24292e" },
]);

// Editor component
const Editor = ({ value, onChange, showGutter = false, showMarkdown = true, editorViewRef }: { 
  value: string, 
  onChange: (value: string) => void,
  showGutter?: boolean,
  showMarkdown?: boolean,
  editorViewRef: React.MutableRefObject<EditorView | null>
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const gutterCompartment = useRef(new Compartment());
  const markdownCompartment = useRef(new Compartment());

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const startState = EditorState.create({
        doc: value,
        extensions: [
          vim(),
          customSetup,
          gutterCompartment.current.of(showGutter ? [lineNumbers()] : []),
          markdownCompartment.current.of(showMarkdown ? [
            markdown({ 
              codeLanguages: languages,
            }),
            syntaxHighlighting(markdownPreviewStyles),
          ] : [
            markdown({ 
              codeLanguages: languages,
            }),
            syntaxHighlighting(rawMarkdownStyles),
          ]),
          editorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
        ],
      });

      const view = new EditorView({
        state: startState,
        parent: editorRef.current,
      });
      viewRef.current = view;
      editorViewRef.current = view;

      // Set initial gutter visibility
      view.dom.classList.toggle('show-gutters', showGutter);
    }

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
      editorViewRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: gutterCompartment.current.reconfigure(
          showGutter ? [lineNumbers()] : []
        )
      });
      viewRef.current.dom.classList.toggle('show-gutters', showGutter);
    }
  }, [showGutter]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: markdownCompartment.current.reconfigure(
          showMarkdown ? [
            markdown({ 
              codeLanguages: languages,
            }),
            syntaxHighlighting(markdownPreviewStyles),
          ] : [
            markdown({ 
              codeLanguages: languages,
            }),
            syntaxHighlighting(rawMarkdownStyles),
          ]
        )
      });
    }
  }, [showMarkdown]);

  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={editorRef} className="w-full h-full flex-grow" />;
};

export default function Home() {
  // const [isDarkMode, setIsDarkMode] = useState(false);
  const [showGutter, setShowGutter] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const [textContent, setTextContent] = useState('# Welcome to Vim Editor\n\nStart typing here...\n\n**Bold text** and *italic text*\n\n## Features\n- Markdown support\n- Vim keybindings\n- Clean interface');
  const editorViewRef = useRef<EditorView | null>(null);

  const handleSave = () => {
    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "document.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
}
