const { getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { Plugin } = require('powercord/entities');
const path = require('path');
const { remote: { BrowserWindow, getCurrentWindow }, ipcRenderer } = require('electron');
const { getUser } = getModule([ 'getCurrentUser' ], false);
const { getChannel } = getModule([ 'getChannel' ], false);
const { getGuild } = getModule([ 'getGuild' ], false);
const { markdownToHtml } = getModule([ 'markdownToHtml' ], false);
const shouldDisplayNotifications = getModule([ 'shouldDisplayNotifications' ], false);
const showNotifm = getModule([ 'makeTextChatNotification' ], false);
const transition = getModule([ 'transitionTo' ], false);
module.exports = class BetterNotifs extends Plugin {
  startPlugin () {
    inject('betterNotifs', showNotifm, 'makeTextChatNotification', (args) => {
      console.log(args);
      if (!shouldDisplayNotifications.shouldDisplayNotifications.bind(shouldDisplayNotifications)()) {
        return args;
      }
      const parsedArgs = JSON.parse(JSON.stringify(args));
      parsedArgs[1].content = markdownToHtml(parsedArgs[1].content
        .replace(/<@!?(\d+)>/g, (_, p) => `@${getUser(p).username}`)
        .replace(/<#(\d+)>/g, (_, p) => `#${getChannel(p).name}`)
        .replace(/<@&(\d+)>/g, (_, p) => `@${getGuild(args[0].guild_id).roles[p].name}`)
        .replace(/\|\|.+\|\|/g, (_, p) => '<spoiler>')); // Thanks Ben!
      setTimeout(() => {
        const bodyStyle = window.getComputedStyle(document.documentElement)
        console.log(bodyStyle.getPropertyValue('--bn-height').trim() || 120)
        const win = new BrowserWindow({
          height: parseInt(bodyStyle.getPropertyValue('--bn-height').trim()) || 120,
          width: parseInt(bodyStyle.getPropertyValue('--bn-width').trim()) || 400,
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
        //win.openDevTools();
        console.log(parsedArgs[1].content);
        win.setResizable(false);
        win.webContents.on('did-finish-load', () => {
          win.webContents.executeJavaScript(`
            window.windowId = ${getCurrentWindow().webContents.id};
          `);
        });
        // show window without setting focus
        win.showInactive();
        win.loadFile(path.join(__dirname, 'notifWindow', 'index.html'), { query: { message: JSON.stringify(parsedArgs) } });
        const handleRedirect = (e, url) => {
          if (url != win.webContents.getURL()) {
            e.preventDefault();
            require('electron').shell.openExternal(url);
          }
        };
        win.webContents.on('will-navigate', handleRedirect);
        win.webContents.on('new-window', handleRedirect);
        win.webContents.executeJavaScript('let newLink;');
        const styles = [];
        Array.prototype.forEach.call(document.querySelectorAll('style'), (link) => {
          styles.push(encodeURIComponent(link.innerHTML));
        });
        win.webContents.executeJavaScript(`
        const { styles } = ${JSON.stringify({ styles })};
        styles.forEach((style) => {
          newLink = document.createElement('style');
          newLink.innerHTML = decodeURIComponent(style);
          document.head.appendChild(newLink);
        })
        `);
      }, 0);
      inject('betterNotifs-blocker', shouldDisplayNotifications, 'shouldDisplayNotifications', (args) => false, true);
      setTimeout(() => {
        uninject('betterNotifs-blocker');
      }, 0);
      return args;
    }, true);
    ipcRenderer.on(
      'better-notifs-jump',
      this.ipcHandler
    );
  }

  pluginWillUnload () {
    uninject('betterNotifs');
    ipcRenderer.removeListener(
      'better-notifs-jump',
      this.ipcHandler
    );
  }

  ipcHandler (event, message) {
    if (message) {
      const guild = getGuild(message[0].guild_id);
      transition.transitionTo(`/channels/${guild ? guild.id : '@me'}/${message[0].id}/${message[1].id}`); // Again, thanks Ben!
      Promise.resolve(message);
    }
    Promise.reject();
  }
};
