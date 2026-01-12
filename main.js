import { app, BrowserWindow, protocol } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    autoHideMenuBar: true,
    title: 'PlayerTube',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Necessario per caricare video locali senza blocchi CORS
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    win.loadURL('http://localhost:5000');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});