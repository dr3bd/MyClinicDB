import { app, BrowserWindow } from 'electron';
import path from 'node:path';

const isDev = process.env.ELECTRON_START_URL ?? process.env.NODE_ENV !== 'production';

async function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    const url = process.env.ELECTRON_START_URL ?? 'http://localhost:5174';
    await window.loadURL(url);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    await window.loadFile(path.join(__dirname, '../../desktop-renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
