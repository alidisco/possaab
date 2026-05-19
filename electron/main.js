// Electron Main Process
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

let mainWindow;
let nextServerProcess;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startNextServerIfNeeded() {
  // In development, run against the Next dev server you start manually (electron:dev)
  if (!app.isPackaged) return;

  // Next.js standalone output writes a server entry we can run with node.
  // With `output: 'standalone'`, there should be: .next/standalone/server.js
  const nextStandaloneServer = path.join(__dirname, '../.next/standalone/server.js');

  // If it doesn't exist, fall back to current behavior (useful for debugging packaged builds).
  // But for production you should run `npm run electron:build`.
  try {
    const fs = require('fs');
    if (!fs.existsSync(nextStandaloneServer)) {
      return;
    }
  } catch {
    return;
  }


  nextServerProcess = spawn(process.execPath, [nextStandaloneServer], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      // Bind Next to a predictable port for Electron to load.
      PORT: '3456',
      HOSTNAME: '127.0.0.1',
      // Next uses different env vars depending on version; keep both just in case.
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: 'inherit',
    shell: false,
  });

  // Give Next a moment to boot
  await wait(1500);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Saab Electric POS',
    icon: path.join(__dirname, '../resources/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0f',
  });

  const isDev = !app.isPackaged;
  const url = 'http://localhost:3456';

  if (isDev) {
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(url);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startNextServerIfNeeded();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextServerProcess) nextServerProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

