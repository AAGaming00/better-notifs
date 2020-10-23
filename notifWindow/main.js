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
  async function startAnim () {
    let i = 0;
    async function openWindow () {
      i++;
      const { width, height } = screenData.size;
      const x = Math.floor(width - (document.documentElement.clientWidth + 20) * easeOutExpo(i / 100));
      win.setPosition(x, height - document.documentElement.clientHeight - 80);
      if (i < 100) {
        requestAnimationFrame(openWindow);
      }
    }
    requestAnimationFrame(openWindow);
  }
  startAnim();

  async function endAnim () {
    let i = 0;
    async function closeWindow () {
      i++;
      const { width, height } = screenData.size;
      const x =  Math.floor(width - (document.documentElement.clientWidth + 20) + easeOutExpo(i / 100) * document.documentElement.clientWidth * 1.05);
      win.setPosition(x, height - document.documentElement.clientHeight - 80);
      if (i < 100) {
        requestAnimationFrame(closeWindow);
      }
    }
    requestAnimationFrame(closeWindow);
  }
  let closeTimeout = setTimeout(endAnim, 5000);


  window.onmouseover = () => {
    clearTimeout(closeTimeout);
  };

  window.onmouseout = () => {
    closeTimeout = setTimeout(endAnim, 5000);
  };

  const notifElem = document.getElementById('bn-notif');
  notifElem.onclick = () => {
    notifElem.onclick = undefined;
    clearTimeout(closeTimeout);
    ipcRenderer.sendTo(
      windowId,
      'better-notifs-jump',
      notif
    );
    closeWindow();
  };
})();
