# Interstellar Alliance Social Experiment Step 3

<br/>

Interstellar Alliance Social Experiment Step 3 is a Thunderbird add-on to send emails with a preset content to specified recipient (the inital version only supports one recipient).

Based on Thunderbird add-on [Mail Merge P](https://github.com/siefkenj/MailMergeP)

## Building

Build the entire extension, first run

```sh
npm install
```

then either

```sh
npm run build-and-package
```

```sh
npm run build
npm run build-addon
npm run package-addon
```

The extension will be located in the current directory and called `iases3@iase.one.xpi`.

## Development

The project is divided into _npm workspaces_ located in the `packages/` directory.

-   `packages/interface` the bulk of the UI code. This code runs in an iframe.
-   `packages/iframe-service` an abstraction layer so that the interface can be run in the browser or in thunderbird.
-   `packages/browser-preview` a browser-based implementation of the thunderbird API, so that the UI can be developed more quickly (with technology like hot-reloading)
-   `packages/thunderbird-iframe-service` the connection between the real thunderbird API and `iframe-service`.
-   `packages/thunderbird-extension` the actual extension's `background.js` script.

Most UI and backend work is handled by the html components. The `thunderbird-extension` runs the html
component in an iframe and uses message passing to communicate with the iframe.

This split means that the bulk of the add-on can be developed in the browser without
Thunderbird.

To run thunderbird and force a reload of all extension content, launch thunderbird with

```
thunderbird -purgecaches
```

### Developing the HTML UI

A browser-based simulation of the add-on's Thunderbird API is provided by `packages/browser-preview`.
To develop in the browser first install and build

```sh
npm install
npm run build
```

Then you can launch a dev server and open it in the browser.

```sh
cd packages/browser-preview
npx vite
```

If you want the interface code to automatically rebuild when you make a change, you can do

```sh
cd packages/interface
npx vite build --watch
```

The UI is developed using React and Redux with the helper EasyPeasy.

### Developing the Thunderbird Extension

Copy or link the contents of `thunderbird-src` to `iases3@iase.one`
in your Thunderbird profile/extensions directory. Then restart Thunderbird and activate the
extension.

You can open the Thunderbird debugging console with Command+Option+I. Once in the debugging console,
you can manually open dialogs with the `window.open` command. For example,

    dgl = window.open("chrome://mailmergep/content/iframe-wrapper.xul", "test", "chrome")

will open and run `iframe-wrapper.xul`, which is the main UI component of Mail Merge P.
You can then poke around `dgl` for variables and functions
stored in the extension's scope.

To access the APIs available to the browser extension, you must go to the extensions
tab and click the gear icon and enable "Debug Mode". Then you can open a console
in the context of mailmergep and the `browser.*` apis will be available.

### Packaging

Note that a version bump must take place in `packages/thunderbird-extension/public/manifest.json`. After that, run `npm run build-and-package`.
The resulting `iases3@iase.one.xpi` is a bundle of the extension.
