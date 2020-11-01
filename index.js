const { getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { Plugin } = require('powercord/entities');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

module.exports = class BetterNotifs extends Plugin {
  run (data) {
    const tChild = cp.spawn(process.execPath, [ 'bn-show', path.join(__dirname, 'bruh.js') ], { stdio:  [ 'pipe', 'pipe', 'pipe', 'ipc' ],
      silent: 'true' });
    tChild.stdout.on('data', (data) => {
      // output from the child process
      console.log(data.toString());
    });
    tChild.stderr.on('data', (data) => {
      // output from the child process
      console.log(data.toString());
    });
    tChild.on('exit', (d) => {
      console.log(d);
    });
    tChild.send(JSON.stringify(data));
    tChild.on('message', (m) => this.ipcHandler(m));
  }

  startPlugin () {
    const { getUser } = getModule([ 'getCurrentUser' ], false);
    const { getChannel } = getModule([ 'getChannel' ], false);
    const { getGuild } = getModule([ 'getGuild' ], false);
    const { markdownToHtml } = getModule([ 'markdownToHtml' ], false);
    const shouldDisplayNotifications = getModule([ 'shouldDisplayNotifications' ], false);
    const showNotifm = getModule([ 'makeTextChatNotification' ], false);
    const electronPath = process.resourcesPath;
    const packagePath = path.join(electronPath, 'app');
    const wrapper = require('./wrapper');
    this.indexPath = path.join(packagePath, 'index.js');
    let index = fs.readFileSync(this.indexPath).toString();
    console.log(index);
    if (!index.includes('console.log(\'loading BN\')')) {
      fs.writeFileSync(path.join(this.indexPath, '..', 'index.bn.js'), index);
      this.oldindex = index;
      index = `${wrapper}\n${index}`;
      fs.writeFileSync(this.indexPath, index);
    }
    console.log(process.execPath);
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
      const styles = [];
      Array.prototype.forEach.call(document.querySelectorAll('style'), (link) => {
        styles.push(encodeURIComponent(link.innerHTML));
      });
      parsedArgs[1].styles = styles;
      parsedArgs[1].html = path.join(__dirname, 'notifWindow', 'index.html');
      const bodyStyle = window.getComputedStyle(document.documentElement);
      parsedArgs[1].height = bodyStyle.getPropertyValue('--bn-height').trim();
      parsedArgs[1].width = bodyStyle.getPropertyValue('--bn-width').trim();
      console.log(parsedArgs);
      this.run(parsedArgs);
      inject('betterNotifs-blocker', shouldDisplayNotifications, 'shouldDisplayNotifications', (args) => false, true);
      setTimeout(() => {
        uninject('betterNotifs-blocker');
      }, 0);
      return args;
    }, true);
  }

  pluginWillUnload () {
    uninject('betterNotifs');
    if (this.oldindex) {
      fs.writeFileSync(this.indexPath, this.oldindex);
    } else {
      fs.writeFileSync(this.indexPath, fs.readFileSync(path.join(this.indexPath, '..', 'index.bn.js')));
    }
  }

  ipcHandler (message) {
    const { getGuild } = getModule([ 'getGuild' ], false);
    console.log(message)
    const transition = getModule([ 'transitionTo' ], false);
    return new Promise((resolve, reject) => {
      if (message) {
        const guild = getGuild(message[0].guild_id);
        transition.transitionTo(`/channels/${guild ? guild.id : '@me'}/${message[0].id}/${message[1].id}`); // Again, thanks Ben!
        resolve(message);
      }
      reject();
    });
  }
};
