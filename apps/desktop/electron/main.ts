import { app, BrowserWindow, ipcMain, safeStorage, Tray, Menu, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const SECRETS_FILE = path.join(app.getPath('userData'), 'jarvis_secrets.json');

function readSecrets() {
  if (!fs.existsSync(SECRETS_FILE)) return {};
  try {
    const data = fs.readFileSync(SECRETS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read secrets file', e);
    return {};
  }
}

function writeSecrets(secrets: Record<string, string>) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets));
}

function startPythonBackend() {
  const secrets = readSecrets();
  let geminiKey = '';
  
  if (secrets['GEMINI_API_KEY']) {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedBuffer = Buffer.from(secrets['GEMINI_API_KEY'], 'base64');
        geminiKey = safeStorage.decryptString(encryptedBuffer);
      }
    } catch (e) {
      console.error('Failed to decrypt API key', e);
    }
  }

  const env = { ...process.env, GEMINI_API_KEY: geminiKey };
  const isDev = !app.isPackaged;
  
  if (isDev) {
    const backendPath = path.join(__dirname, '../../../backend/src/main.py');
    const venvPython = path.join(__dirname, '../../../backend/venv/Scripts/python.exe');
    
    if (fs.existsSync(venvPython)) {
      backendProcess = spawn(venvPython, [backendPath], { env });
    } else {
      console.error("VENV Python not found at", venvPython);
    }
  } else {
    const backendExe = path.join(process.resourcesPath, 'backend', 'jarvis_backend.exe');
    if (fs.existsSync(backendExe)) {
      backendProcess = spawn(backendExe, [], { env });
    }
  }

  if (backendProcess) {
    backendProcess.stdout?.on('data', (data) => console.log(`[Backend]: ${data}`));
    backendProcess.stderr?.on('data', (data) => console.error(`[Backend ERR]: ${data}`));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0F172A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'tray-icon.png')
    : path.join(__dirname, '../../public/tray-icon.png');
    
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open Harsha's Assistant", click: () => mainWindow?.show() },
    { label: 'Founder Briefing', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'founder'); } },
    { label: 'Daily Brief', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'dashboard'); } },
    { label: 'Settings', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'settings'); } },
    { label: 'Diagnostics', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'diagnostics'); } },
    { type: 'separator' },
    { label: "Exit Harsha's Assistant", click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip("Harsha's Assistant AI Personal OS");
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
}

app.whenReady().then(() => {
  // Auto Start with Windows setting
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath("exe")
  });

  // Setup IPC for safeStorage
  ipcMain.handle('secure-store-set', (event, key: string, value: string) => {
    if (!safeStorage.isEncryptionAvailable()) return false;
    const encrypted = safeStorage.encryptString(value).toString('base64');
    const secrets = readSecrets();
    secrets[key] = encrypted;
    writeSecrets(secrets);
    
    // Restart backend to inject new environment variables if needed
    if (key === 'GEMINI_API_KEY') {
      if (backendProcess) backendProcess.kill();
      startPythonBackend();
    }
    return true;
  });

  ipcMain.handle('secure-store-get', (event, key: string) => {
    const secrets = readSecrets();
    if (!secrets[key]) return null;
    if (!safeStorage.isEncryptionAvailable()) return null;
    
    try {
      const buffer = Buffer.from(secrets[key], 'base64');
      return safeStorage.decryptString(buffer);
    } catch (e) {
      console.error('Failed to decrypt', e);
      return null;
    }
  });

  startPythonBackend();
  createWindow();
  createTray();

  globalShortcut.register('Alt+Space', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('trigger-listening');
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
  }
});
