import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorApp } from '@vim-editor/core';
import './styles.css';

declare global {
  interface Window {
    electronAPI: {
      saveFile: (content: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      openFile: () => Promise<{ success: boolean; content?: string; filePath?: string; error?: string }>;
    };
  }
}

const ElectronEditorApp: React.FC = () => {
  const [currentFilePath, setCurrentFilePath] = useState<string | undefined>();
  const [initialContent, setInitialContent] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  // Add a simple test to see if React is working
  console.log('ElectronEditorApp rendering...');

  const handleSave = async (content: string) => {
    try {
      const result = await window.electronAPI.saveFile(content, currentFilePath);
      if (result.success && result.filePath) {
        setCurrentFilePath(result.filePath);
        console.log('File saved successfully:', result.filePath);
      } else {
        console.error('Save failed:', result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleOpen = async () => {
    try {
      const result = await window.electronAPI.openFile();
      if (result.success && result.content !== undefined) {
        setInitialContent(result.content);
        setCurrentFilePath(result.filePath);
        console.log('File opened successfully:', result.filePath);
      } else {
        console.error('Open failed:', result.error);
      }
    } catch (error) {
      console.error('Open error:', error);
    }
  };

  useEffect(() => {
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        // We'll need to get the current content from the editor
        // This is handled by the EditorApp's save functionality
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', background: '#fee2e2', color: '#dc2626', fontFamily: 'monospace' }}>
        Error: {error}
      </div>
    );
  }

  try {
    return (
      <EditorApp 
        onSave={handleSave}
        initialContent={initialContent}
      />
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error rendering EditorApp:', err);
    setError(errorMessage);
    return null;
  }
};

// Initialize the app
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<ElectronEditorApp />);
} 