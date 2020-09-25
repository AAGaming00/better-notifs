const { getModule } = require('powercord/webpack');
const { PopoutWindow } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { Plugin } = require('powercord/entities');
const { React, ReactDOM } = require('powercord/webpack');
const path = require('path');
const { remote: { BrowserWindow } } = require('electron');
const Notif = require('./components/Notification');
module.exports = class BetternNotifs extends Plugin {
  startPlugin () {
    const showNotifm = getModule([ 'makeTextChatNotification' ], false);
    const transition = getModule([ 'transitionTo' ], false);

    inject('betterNotifs', showNotifm, 'makeTextChatNotification', (args) => {
      console.log(args);
      setTimeout(() => {
        const win = new BrowserWindow({ width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true
          } });
        const discordNotif = {
          React,
          ReactDOM
        };
        const discordJson = JSON.stringify(discordNotif, (key, value) => {
          if (typeof value === 'function') {
            return value.toString();
          }
          return value;
        });
        win.openDevTools();
        win.loadFile(path.join(__dirname, 'notifWindow', 'index.html'), { query: { modules: discordJson } });
      }, 1000);
      return args;
    }, true);
  }

  pluginWillUnload () {
    uninject('betterNotifs');
  }
};
