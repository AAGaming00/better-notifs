// https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
function FpsCtrl (fps, callback) {
  let	delay = 1000 / fps,
    time = null,
    frame = -1,
    tref;

  function loop (timestamp) {
    if (time === null) {
      time = timestamp;
    }
    const seg = Math.floor((timestamp - time) / delay);
    if (seg > frame) {
      frame = seg;
      callback({
        time: timestamp,
        frame
      });
    }
    tref = requestAnimationFrame(loop);
  }

  this.isPlaying = false;

  this.frameRate = function (newfps) {
    if (!arguments.length) {
      return fps;
    }
    fps = newfps;
    delay = 1000 / fps;
    frame = -1;
    time = null;
  };

  this.start = function () {
    if (!this.isPlaying) {
      this.isPlaying = true;
      tref = requestAnimationFrame(loop);
    }
  };

  this.pause = function () {
    if (this.isPlaying) {
      cancelAnimationFrame(tref);
      this.isPlaying = false;
      time = null;
      frame = -1;
    }
  };
}


(async () => {
  // Open all links in external browser
  const { shell } = require('electron');
  document.addEventListener('click', (event) => {
    if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
      event.preventDefault();
      shell.openExternal(event.target.href);
    }
  });
  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const { ipcRenderer, remote: { getCurrentWindow, screen: screenInfo } } = require('electron');
  const win = getCurrentWindow();
  win.webContents.getOwnerBrowserWindow();
  function getQueryStringValue (key) {
    return decodeURIComponent(window.location.search.replace(new RegExp(`^(?:.*[&\\?]${encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&')}(?:\\=([^&]*))?)?.*$`, 'i'), '$1'));
  }
  function easeOutExpo (x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }
  const notif = JSON.parse(getQueryStringValue('message'));
  console.log(notif);
  document.getElementById('bn-avatar').src = `https://cdn.discordapp.com/avatars/${notif[2].id}/${notif[2].avatar}.png?size=2048`;
  document.getElementById('bn-text').innerHTML = notif[1].content;
  document.getElementById('bn-username').innerHTML = notif[2].username;
  const screenData = screenInfo.getAllDisplays()[0];
  const startAnimator = new FpsCtrl(60, startAnim);
  let i = 0;
  async function startAnim () {
    i += 1;
    console.log(i);
    if (i > 100) {
      setTimeout(() => {
        startAnimator.pause();
      }, 0);
      console.log(i, 'pausing');
      return;
    }
    const { width, height } = screenData.size;
    const x = Math.floor(width - (document.documentElement.clientWidth + 20) * easeOutExpo(i / 100));
    win.setPosition(x, height - document.documentElement.clientHeight - 80);
  }
  const endAnimator = new FpsCtrl(60, endAnim);
  let ii = 0;
  async function endAnim () {
    if (ii === 0) {
      startAnimator.pause();
      clearTimeout(closeTimeout);
    }
    ii += 1;

    if (ii > 100) {
      setTimeout(() => {
        endAnimator.pause();
      }, 0);
      window.close();
      return;
    }
    const { width, height } = screenData.size;
    const x =  Math.floor(width - (document.documentElement.clientWidth + 20) + easeOutExpo(ii / 100) * document.documentElement.clientWidth * 1.05);
    win.setPosition(x, height - document.documentElement.clientHeight - 80);
  }

  let closeTimeout;
  document.getElementById('bn-avatar').onerror = document.getElementById('bn-avatar').onload = () => {
    startAnimator.start();
    closeTimeout = setTimeout(endAnimator.start, 5000);
  };
  document.documentElement.onmouseover = (event) => {
    console.log(event);
    if (document.documentElement !== event.relatedTarget) {
      return;
    }
    console.log('clearing timeout');
    clearTimeout(closeTimeout);
  };

  document.body.onmouseout = (event) => {
    console.log(event);
    if (document.documentElement !== event.relatedTarget) {
      return;
    }
    console.log('starting timeout');
    closeTimeout = setTimeout(endAnimator.start, 5000);
  };


  document.body.onclick = () => {
    document.documentElement.onclick = undefined;
    clearTimeout(closeTimeout);
    endAnimator.start();
    ipcRenderer.send(
      'better-notifs-jump',
      notif
    );
  };
})();


