# Farnsworth Launcher

A simple [Electron](http://electron.atom.io/) based,
configurable launcher for systems connected to a TV. Farnsworth
is optimized for use with a keyboard, remote, or controller 
(see Remote & Controller section below as that requires some further
setup).There is no "media" functionality, that is, no video or music library
or support for live TV. Farnsworth's purpose is to simply launch other
applications and get out of the way. Farnsworth is heavily inspired on the
[Android TV Launcher](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=0ahUKEwiP6bjelpLNAhUQElIKHeh7DTAQFggdMAA&url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.google.android.leanbacklauncher%26hl%3Den&usg=AFQjCNEJgOJ6h8LfWBrVskrz5Axt6kwYWA&sig2=Cz9PvBK1FP-R4wl3ncCcXw) though is simplified in many ways. 

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
library as well as Chromium, there is no support for game controllers at this time. Ideally,
the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)
will be more supported in browsers and thus Chromium in the future. At the
moment, [AutoHotkey](https://autohotkey.com/) can be used to support arbitrary
keymappings. The following is an example script:

```au3
```

## Development

```bash
# Clone this repository
git clone git clone git@bitbucket.org:ikogan/farnsworth.git
# Go into the repository
cd farnsworth
# Install dependencies and run the app
npm install && npm start
```

Debugging may be accomplished with `npm run debug`. The following command line
options are supported:

- `--develop`: Open developer tools once the renderer starts up.
- `--windowed`: Do not fullscreen automatically.

These may be specified to `start` and `debug` in the following manner:

```bash
npm run debug -- --develop --windowed
```

## Packaging

[electron-builder](https://github.com/electron-userland/electron-builder) is used to
build packages and may be invoked with `npm run dist`. This will build 32-bit and
64-bit packages for Windows, OS X (64-bit only), and Linux (rpm, deb, and tar.gz).

Note that, at this time, the Windows package has undergone the most testing and most
of the Linux packages have undergone none.

## TODO

At the moment, this is completele enough to use for my own purposes but there
is much left that should be done:

-   Avoid packaging development modules
-   Windows Installer, Mac DMG, Linux packages
-   Keyboard support for edit tiles and settings screens
-   Refactor controls to be more generic, grid based?
-   Native support for game controllers
-   "Profiles" for a given tile: launch the tile command differently
    depending on a profile selected at launch time.
-   Customizable background color, image, list URL
-   Cleanup as indicated in the source

## License [Apache-2.0](LICENSE.md)
