const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// 1. Single Instance Lock: Prevents opening duplicate app windows
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Atelier Workstation',
    icon: path.join(__dirname, 'icon.ico'), // Place an icon.ico file in your folder
    autoHideMenuBar: true,
    show: false, // Hidden on launch to prevent white flashing screen
    backgroundColor: '#0f172a', // Dark theme slate background matching Atelier UI
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true
    }
  });

  const ATELIER_URL = 'https://dash.atelierws.app';

  // Load Atelier WS
  mainWindow.loadURL(ATELIER_URL);

  // 2. Smooth Launch: Only show window once content has loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 3. Offline Error Handling: Show custom reconnect UI if internet drops
  mainWindow.webContents.on('did-fail-load', (event, errorCode) => {
    // Ignore aborted page loads (-3)
    if (errorCode === -3) return;

    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head>
          <title>Atelier Workstation - Connection Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background-color: #0f172a; 
              color: #f8fafc; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
            }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { color: #94a3b8; margin-bottom: 24px; }
            button { 
              background-color: #3b82f6; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              font-size: 14px; 
              font-weight: 600; 
              border-radius: 6px; 
              cursor: pointer; 
            }
            button:hover { background-color: #2563eb; }
          </style>
        </head>
        <body>
          <h1>Unable to connect to Atelier</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="window.location.href='${ATELIER_URL}'">Retry Connection</button>
        </body>
      </html>
    `);
  });

  // 4. External Routing: Keeps Atelier links in-app, opens third-party links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith('atelierws.app')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    } catch (e) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// Quit when all windows are closed (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});