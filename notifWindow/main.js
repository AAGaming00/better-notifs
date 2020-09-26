(async () => {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
        }
    const { ipcRenderer } = require("electron")
    const screenInfo = require('electron').remote.screen
    const win = require('electron').remote.getCurrentWindow()
    function getQueryStringValue (key) {  
        return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
        }
    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
        
    }
    const notif = JSON.parse(getQueryStringValue('message'))
    document.getElementById('bn-avatar').src = `https://cdn.discordapp.com/avatars/${notif[2].id}/${notif[2].avatar}.png?size=2048`
    document.getElementById('bn-text').innerHTML = notif[1].content
    document.getElementById('bn-username').innerHTML = notif[2].username
    const screenData = screenInfo.getAllDisplays()[0]
    setTimeout(async () => {
        for (let i = 0; i < 100 ; i++) {
            const width = screenData.size.width
            const x = Math.floor(width - 420 * easeOutExpo(i/100))
            win.setPosition(x, screenData.size.height - 200)
            await sleep(10)
        }
    }, 0)
    async function closeWindow() {
        for (let i = 0; i < 100 ; i++) {
            const width = screenData.size.width
            const x =  Math.floor(width - 420 + easeOutExpo(i/100) * 420)
            win.setPosition(x, screenData.size.height - 200)
            await sleep(10)
        }
        window.close()
    }
    const closeTimeout = setTimeout(closeWindow, 5000)
    const notifElem = document.getElementById('bn-notif')
    notifElem.onclick = () => {
        notifElem.onclick = undefined
        clearTimeout(closeTimeout)
        require("electron").ipcRenderer.sendTo(
            windowId,
            "better-notifs-jump",
            notif
         );
         closeWindow()
    };
})();
