# SBaGen Web

This allows you to run [sbagen](https://uazu.net/sbagen/) in the browser!

Jim Peters wrote the original - it's the best at producing binaural beats. I did a little modification to get it running on the web.

JavaScript library and web component for binaural beat generation in the browser using SBaGen compiled to WebAssembly.

## Features

- 🎵 Generate binaural beats directly in the browser
- 🎨 Minimal web component - style it your way
- 📦 Clean JavaScript API
- 🔊 Full OGG file support
- ⚡ High-performance WebAssembly
- 🌐 Works on GitHub Pages (no special headers required)
- 🎧 Smooth looping audio playback

## Quick Start

Check out the [live demo](https://brainbang.github.io/sbagen-web/) or see [index.html](docs/index.html) for complete examples.

## Installation

Copy these files to your project:

- `docs/sbagen-web.js` - JavaScript library
- `docs/sbagen-player.js` - Web component
- `docs/sbagen/` - WASM module directory

Or just use them directly from the `docs/` folder.

## Sequences

Looking for .sbg sequence files? Check out:
- [sbagen_idoser](https://github.com/brainbang/sbagen_idoser) - Large collection
- [examples](docs/examples) - Included examples

## Browser Support

- Chrome/Edge 89+
- Firefox 79+
- Safari 15.2+

Requires ES6 modules and WebAssembly (all modern browsers).

## Usage

### Web Component

The simplest way to add a binaural beat player to your page:

```html
<script type="module" src="sbagen-player.js"></script>

<sbagen-player src="examples/basics/ts-brain-alpha.sbg"></sbagen-player>
```

The component has minimal styling - style it with your own CSS:

```css
sbagen-player {
  /* your styling here */
}

sbagen-player button {
  /* button styling */
}
```

#### Attributes

- `src` - Path to .sbg sequence file
- `ogg-path` - Directory for OGG files (default: `examples/`)

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

// Optional: specify OGG file directory
await sbagen.load("path/to/file.sbg", { oggPath: "path/to/oggs/" });

// Analyze the sequence
console.log("Filename:", info.filename);
console.log("Duration:", info.estimatedDuration, "seconds");
console.log("Description:", info.description);

// Play
await sbagen.play();

// Get current time
const time = sbagen.getCurrentTime(); // in seconds

// Pause (keeps time position)
sbagen.pause();

// Stop (resets time to 0)
sbagen.stop();

// Event listeners
sbagen.on("play", () => console.log("Started"));
sbagen.on("pause", () => console.log("Paused"));
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

##### `load(source, options)`

Load a sequence file.

**Parameters:**

- `source` - URL string or File object
- `options` (optional)
  - `oggPath` - Directory for OGG files (default: `'examples/'`)

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

Start or resume playback.

**Returns:** `Promise<void>`

##### `pause()`

Pause playback (keeps current time position).

##### `stop()`

Stop playback (resets time to 0).

##### `getCurrentTime()`

Get current playback time.

**Returns:** `number` - Time in seconds

##### `on(event, callback)`

Add event listener.

**Events:**

- `play` - Playback started
- `pause` - Playback paused (time kept)
- `stop` - Playback stopped (time reset to 0)
- `timeupdate` - Time updated (callback receives time in seconds)
- `generating` - Audio buffer generation started

##### `off(event, callback)`

Remove event listener.

##### `dispose()`

Cleanup and release resources.

## Building

To rebuild the WASM module:

```bash
./build-wasm.sh
```

Requirements:
- CMake 3.15+
- Emscripten 4.0+

The build script compiles SBaGen to WebAssembly with OGG support via libvorbis.

## License

SBaGen is GPL v2. See original project at https://uazu.net/sbagen/

Web port modifications by konsumer.
