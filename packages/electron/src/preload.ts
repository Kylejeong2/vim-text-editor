import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  saveFile: (content: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  openFile: () => Promise<{ success: boolean; content?: string; filePath?: string; error?: string }>;
}

const electronAPI: ElectronAPI = {
  saveFile: (content: string, filePath?: string) => ipcRenderer.invoke('save-file', content, filePath),
  openFile: () => ipcRenderer.invoke('open-file'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI); 