# Farnsworth Launcher

A simple [Electron](http://electron.atom.io/) based,
configurable launcher for systems connected to a TV. Farnsworth
is optimized for use with a keyboard, remote, or controller
(see Remote & Controller section below as that requires some further
setup).There is no "media" functionality, that is, no video or music library
or support for live TV. Farnsworth's purpose is to simply launch other
applications and get out of the way. Farnsworth is heavily inspired by the
[Android TV Launcher](https://play.google.com/store/apps/details?id=com.google.android.leanbacklauncher&hl=en)
though is simplified in many ways.

![Category Layout](/doc/category-names.png?raw=true "Tiles with Category Names")
![Tile Layout](/doc/no-category-names.png?raw=true "Tiles without Category Names")
![Manage Tile Popup](/doc/edit-popup.png?raw=true "Managing a Tile")
![Edit Tile](/doc/edit-tile.png?raw=true "Edit Tile Settings")

The launcher allows the setup of individual "Categories" containing
"Tiles". At this time, creating new tiles requires the use of a mouse or
touchscreen due to it being a bit complicated to add keyboard support for
`md-color-picker`.

The grid of categories/tiles can be controlled entirely with the keyboard
(in fact, mouse support isn't implemented at this time). Help for keybindings
is available at any time (when not in the edit tile or settings sections)
by pushing `?`.

## Remote & Controller

Due to limitations in the [mousetrap](https://github.com/ccampbell/mousetrap)
library as well as Chromium, there is no support for game controllers at this
time. Ideally, the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)
will be more supported in browsers and thus Chromium in the future. At the
moment, [AutoHotkey](https://autohotkey.com/) can be used to support arbitrary
key mappings.

Additionally, Valve's Steam Controller also works quite well. Most remotes
that emulate a keyboard seem to work well too. Farnsworth was primarily
tested with [this one](http://www.amazon.com/LYNEC-C2-Wireless-Keyboard-Infrared/dp/B00U78EKM4).

The following simple [AutoHotkey](https://autohotkey.com/) script is useful
for closing and switching apps:

```ahk
Escape::
Browser_Home::
    WinGet, ActiveWindow, ProcessName, A

    if (ActiveWindow != "Farnsworth Launcher.exe")
    {
        Send !{F4}
    }

    return

AppsKey::Send #{Tab}
```

## Development

```bash
# Clone this repository
git clone git@github.com:ikogan/farnsworth.git
# Go into the repository
cd farnsworth
# Install dependencies and run the app
npm install && npm start
```

Debugging may be accomplished with `npm run debug` and attaching
with an appropriate debugger to the standard port. The following command 
line options are supported:

-   `--develop`: Open developer tools once the renderer starts up.
-   `--windowed`: Do not fullscreen automatically.

These may be specified to `start` and `debug` in the following manner:

```bash
npm run debug -- --develop --windowed
```

## Packaging

[electron-builder](https://github.com/electron-userland/electron-builder) is
used to build packages and may be invoked with `npm run dist`. This will build
32-bit and 64-bit packages for Windows, OS X (64-bit only), and Linux (rpm, deb,
and tar.gz).

Note that, at this time, the Windows package has undergone the most testing and
most of the Linux packages have undergone none.

## TODO

At the moment, this is completele enough to use for my own purposes but there
is much left that should be done:

-   Keyboard support for edit tiles and settings screens
-   Refactor controls to be more generic, grid based?
-   Native support for game controllers
-   "Profiles" for a given tile: launch the tile command differently
    depending on a profile selected at launch time.
-   Customizable background color, image, list URL
-   Cleanup as indicated in the source
-   Scrolling the view up and down so more than 3 categories is workable...
    don't kill me.

## License [Apache-2.0](LICENSE.md)
