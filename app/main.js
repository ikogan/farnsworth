'use strict';

if(require('electron-squirrel-startup')) {
    return;
}

const debug = require('debug')('farnsworth:main');
const _ = require('lodash');
const electron = require('electron');
const spawn = require('spawn-shell');
const sq = require('shell-quote');
const downloadBackgrounds = require('./backend/backgrounds');

// Module to control application life.
const app = electron.app;
// Module to get events from renders.
const ipc = electron.ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function init() {
    createWindow();
    downloadBackgrounds();
}

// Create the main window, mostly unchanged from the template
function createWindow () {
    // Setup browser window options
    var options = {
        movable: false,
        fullscreen: true,
        title: 'Farnsworth Launcher',
        frame: false,
        backgroundColor: '#000',
        titleBarStyle: 'hidden'
    };

    // Turn off fullscreen if requested, useful for debugging
    if(process.argv.indexOf('--windowed') !== -1) {
        options.fullscreen = false;
        options.frame = true;
        options.movable = true;
    }

    // Create the browser window.
    mainWindow = new BrowserWindow(options);

    // TODO: Can't recall why we call this if we set it in the options
    // remove?
    if(options.fullscreen) {
        mainWindow.setFullScreen(true);
    }

    // Automatically start dev tools if we're trying to develop
    if(process.argv.indexOf('--develop') !== -1) {
        mainWindow.toggleDevTools();
    }

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/ui/index.html');

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
    });
}

// Minimize the application if the renderer requested it.
ipc.on('farnsworth-minimize', function(ev) {
    mainWindow.minimize();
});

// Launch an application as requested by the renderer
ipc.on('launch-application', function(ev, command) {
    debug(`Launching ${command}...`);

    var child = spawn(`"${command}"`);

    child.on('close', function(code) {
        mainWindow.restore();
        mainWindow.focus();

        debug(`Command ${command} exited with code ${code}.`);

        if(code !== 0) {
            ev.sender.send('application-launch-error', code);
        }
    });

    mainWindow.minimize();
});

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
