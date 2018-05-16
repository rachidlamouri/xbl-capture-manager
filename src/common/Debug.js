const {remote} = require('electron')
const {Menu, MenuItem} = remote

remote.getCurrentWindow().openDevTools()

document.addEventListener('keydown', (keyEvent)=>{
    if(keyEvent.key == 'F5'){
        remote.getCurrentWindow().reload()
    }else if(keyEvent.key == 'F12'){
        remote.getCurrentWindow().toggleDevTools()
    }
})

document.addEventListener('contextmenu', (mouseEvent)=>{
    let mouseX = mouseEvent.clientX
    let mouseY = mouseEvent.clientY
    
    let menu = new Menu()
    menu.append(new MenuItem({
        id: 'inspect',
        label: 'Inspect Element',
        click: (menuItem, browserWindow, clickEvent)=>{
            remote.getCurrentWindow().inspectElement(mouseX,mouseY)
        },
    }))
    menu.popup(remote.getCurrentWindow())
})
