'use client';

import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { getCM, vim } from '@replit/codemirror-vim';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, foldGutter, indentOnInput, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Custom setup without line numbers by default
const customSetup = [
  history(),
  foldGutter(),
  indentOnInput(),
  bracketMatching(),
  drawSelection({
    cursorBlinkRate: 1200,
    drawRangeCursor: true
  }),
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
    caretColor: '#0000ff',
    fontFamily: 'inherit',
    maxWidth: '900px',
    margin: '0 auto',
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#0000ff',
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
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(0, 123, 255, 0.3) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(0, 123, 255, 0.4) !important',
  },
  '&.cm-editor.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(0, 123, 255, 0.4) !important',
  },
  '&.cm-editor .cm-selectionBackground': {
    backgroundColor: 'rgba(0, 123, 255, 0.3) !important',
  },
  '.cm-content ::selection': {
    backgroundColor: 'transparent !important',
  },
  '.cm-content ::-moz-selection': {
    backgroundColor: 'transparent !important',
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

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  showGutter?: boolean;
  showMarkdown?: boolean;
  editorViewRef: React.MutableRefObject<EditorView | null>;
  onVimStateChange?: (state: { mode: string; keyBuffer: string }) => void;
}

// Editor component
export const Editor = ({
  value,
  onChange,
  showGutter = false,
  showMarkdown = true,
  editorViewRef,
  onVimStateChange,
}: EditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const gutterCompartment = useRef(new Compartment());
  const markdownCompartment = useRef(new Compartment());
  const onVimStateChangeRef = useRef(onVimStateChange);

  useEffect(() => {
    onVimStateChangeRef.current = onVimStateChange;
  }, [onVimStateChange]);

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

      if (onVimStateChangeRef.current) {
        const cm = getCM(view);
        if (cm) {
          const onKeypress = () => {
            requestAnimationFrame(() => {
              if (onVimStateChangeRef.current && viewRef.current) {
                const currentCm = getCM(viewRef.current);
                if (currentCm?.state.vim) {
                  onVimStateChangeRef.current({
                    mode: currentCm.state.vim.mode || '',
                    keyBuffer: (currentCm.state.vim as any).keyBuffer || '',
                  });
                }
              }
            });
          };
          const onModeChange = (mode: { mode: string }) => {
            if (onVimStateChangeRef.current) {
              onVimStateChangeRef.current({ mode: mode.mode, keyBuffer: '' });
            }
          };
          cm.on('vim-keypress', onKeypress);
          cm.on('vim-mode-change', onModeChange);
          if (cm.state.vim) {
            onVimStateChangeRef.current({ mode: cm.state.vim.mode || '', keyBuffer: '' });
          }
        }
      }
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