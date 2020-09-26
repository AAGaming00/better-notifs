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
const transition = getModule([ 'transitionTo' ], false);
module.exports = class BetterNotifs extends Plugin {
  startPlugin () {
    const showNotifm = getModule([ 'makeTextChatNotification' ], false);
    const transition = getModule([ 'transitionTo' ], false);
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
        const win = new BrowserWindow({
          height: 120,
          width: 400,
          x: -900000,
          y: -900000,
          alwaysOnTop: true,
          skipTaskbar: true,
          frame: false,
          webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            enableRemoteModule: true
          }
        });
        console.log(parsedArgs[1].content);
        win.setResizable(false);
        win.webContents.on('did-finish-load', () => {
          ipcRenderer.on(
            'better-notifs-jump',
            (event, message) => {
              if (message) {
                const guild = getGuild(message[0].guild_id);
                transition.transitionTo(`/channels/${guild ? guild.id : '@me'}/${message[0].id}/${message[1].id}`); // Again, thanks Ben!
                resolve(message);
              }
              reject();
            }
          );
          win.webContents.executeJavaScript(`
            window.windowId = ${getCurrentWindow().webContents.id};
          `);
        });
        win.loadFile(path.join(__dirname, 'notifWindow', 'index.html'), { query: { message: JSON.stringify(parsedArgs) } });
      }, 0);
      inject('betterNotifs-blocker', shouldDisplayNotifications, 'shouldDisplayNotifications', (args) => false, true);
      setTimeout(() => {
        uninject('betterNotifs-blocker');
      }, 0);
      return args;
    }, true);
  }

  pluginWillUnload () {
    uninject('betterNotifs');
  }
};
