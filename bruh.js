module.exports = function (strdata) {
  console.log(__dirname, strdata);
  const { BrowserWindow, ipcMain } = require('electron');
  console.log('helo', strdata);
  const data = JSON.parse(strdata);
  setTimeout(() => {
    const win = new BrowserWindow({
      height: parseInt(data[1].height) || 120,
      width: parseInt(data[1].width) || 400,
      x: -900000,
      y: -900000,
      alwaysOnTop: true,
      skipTaskbar: true,
      type: 'notification',
      frame: false,
      show: false,
      focusable: false,
      resizable: false,
      acceptFirstMouse: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        enableRemoteModule: true
      }
    });
    // win.openDevTools();
    console.log(data[1].content);
    win.setResizable(false);
    // show window without setting focus
    win.showInactive();
    win.loadFile(data[1].html, { query: { message: JSON.stringify(data) } });
    const handleRedirect = (e, url) => {
      if (url != win.webContents.getURL()) {
        e.preventDefault();
        require('electron').shell.openExternal(url);
      }
    };
    win.webContents.on('will-navigate', handleRedirect);
    win.webContents.on('new-window', handleRedirect);
    const { styles } = data[1];
    win.webContents.executeJavaScript(`
      let newLink;
      const { styles } = ${JSON.stringify({ styles })};
      styles.forEach((style) => {
        newLink = document.createElement('style');
        newLink.innerHTML = decodeURIComponent(style);
        document.head.appendChild(newLink);
      })
      `);
    ipcMain.on(
      'better-notifs-jump',
      (_, m) => process.send(m)
    );
  }, 0);
};
