# SBaGen Web Library & Component

This allows you to run [sbagen](https://uazu.net/sbagen/) on the web!

Jim Peters wrote the original, and it's pretty much the best at producing binaural beats. I did a little bit of modification to get it running on web.

If you want some config files for it, check out [sbagen_idoser](https://github.com/brainbang/sbagen_idoser). They are not really "digital drugs", but definitely have an effect. There are also a bunch of [examples](docs/examples).

JavaScript library and web component for binaural beat generation in the browser using SBaGen compiled to WebAssembly.

## Features

- 🎵 Generate binaural beats directly in the browser
- 🎨 Simple web component for easy integration
- 📦 Clean JavaScript API
- 🔊 OGG file support with threading
- ⚡ High-performance WebAssembly

## Installation

Copy these files to your project:

- `sbagen-web.js` - JavaScript library
- `sbagen-player.js` - Web component
- `sbagen/` - WASM module directory
- `audio-processor.js` - Audio worklet processor

## Server Requirements

**Important:** OGG support requires pthread/SharedArrayBuffer, which needs these HTTP headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

You can run this locally with:

```bash
npm start
```

Sequences without OGG files work without these headers.

## Examples

See [index.html](docs/index.html) for complete examples of both the library and web component.

## Browser Support

- Chrome/Edge 89+
- Firefox 79+
- Safari 15.2+

Requires:

- ES6 modules
- WebAssembly
- AudioWorklet
- SharedArrayBuffer (for OGG support only)

## Usage

### Web Component

The simplest way to add a binaural beat player to your page:

```html
<script type="module" src="sbagen-player.js"></script>

<sbagen-player src="examples/basics/ts-brain-alpha.sbg"></sbagen-player>
```

#### Attributes

- `src` - Path to .sbg sequence file

#### Events

```javascript
const player = document.querySelector("sbagen-player");

player.addEventListener("load", (e) => {
  console.log("Loaded:", e.detail.info);
});

player.addEventListener("play", () => {
  console.log("Playing");
});

player.addEventListener("stop", () => {
  console.log("Stopped");
});

player.addEventListener("timeupdate", (e) => {
  console.log("Time:", e.detail.time);
});

player.addEventListener("error", (e) => {
  console.error("Error:", e.detail.error);
});
```

### JavaScript Library

For programmatic control:

```javascript
import SBaGen from "./sbagen-web.js";

// Initialize
const sbagen = await SBaGen.create();

// Load a sequence from URL
const info = await sbagen.load("examples/basics/ts-brain-alpha.sbg");

// Or load from File object
const file = document.querySelector("input[type=file]").files[0];
const info = await sbagen.load(file);

// Analyze the sequence
console.log("Filename:", info.filename);
console.log("Duration:", info.estimatedDuration, "seconds");
console.log("Description:", info.description);

// Play
await sbagen.play();

// Get current time
const time = sbagen.getCurrentTime(); // in seconds

// Stop
sbagen.stop();

// Event listeners
sbagen.on("play", () => console.log("Started"));
sbagen.on("stop", () => console.log("Stopped"));
sbagen.on("timeupdate", (time) => console.log("Time:", time));
sbagen.on("generating", () => console.log("Generating audio..."));

// Remove listeners
sbagen.off("play", callback);

// Cleanup
sbagen.dispose();
```

## API Reference

### SBaGen Class

#### Static Methods

##### `SBaGen.create()`

Create and initialize a new SBaGen instance.

**Returns:** `Promise<SBaGen>`

#### Instance Methods

##### `load(source)`

Load a sequence file.

**Parameters:**

- `source` - URL string or File object

**Returns:** `Promise<Object>` - Sequence info:

```javascript
{
  filename: string,
  description: string,
  estimatedDuration: number, // seconds
  content: string // raw file content
}
```

##### `analyze()`

Analyze the currently loaded sequence.

**Returns:** `Object` - Same as load() return value

##### `play()`

Start playback.

**Returns:** `Promise<void>`

##### `stop()`

Stop playback.

##### `getCurrentTime()`

Get current playback time.

**Returns:** `number` - Time in seconds

##### `on(event, callback)`

Add event listener.

**Events:**

- `play` - Playback started
- `stop` - Playback stopped
- `timeupdate` - Time updated (callback receives time in seconds)
- `generating` - Audio buffer generation started

##### `off(event, callback)`

Remove event listener.

##### `dispose()`

Cleanup and release resources.

## License

SBaGen is GPL v2. See original project at https://uazu.net/sbagen/
