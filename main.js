'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// URL where our backgrounds are
const BACKGROUND_URL = 'https://raw.githubusercontent.com/dconnolly/chromecast-backgrounds/master/backgrounds.json';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function init() {
    createWindow();
    downloadBackgrounds();
}

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        movable: false,
        fullscreen: true,
        title: 'Farnsworth Launcher',
        frame: false,
        backgroundColor: '#000',
        titleBarStyle: 'hidden'
    });
    mainWindow.setFullScreen(true);

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/ui/index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    mainWindow.on('app-command', function(ev, command) {
        if(command === 'browser-backward' && someWindow.webContents.canGoBack()) {
            someWindow.webContents.goBack();
        }
    })
}

function downloadBackgrounds() {

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit();
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
