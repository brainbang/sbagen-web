# SBagen Web

Binaural beats for brain-synchronization, now available for the web!

This adds SDL2 audio support to [sbagen](https://uazu.net/sbagen/) for a more cross-platform & modern system. It can be built on any platform that supports SDL, including WebAssembly.

## Features

- ✅ SDL2 audio support for cross-platform compatibility
- ✅ Modern macOS support (fixed Carbon/CoreAudio issues)
- ✅ WebAssembly build for browser usage
- ✅ OGG Vorbis support (native only)
- ✅ MP3 support with libmad (native only)

## Building

### Native Build

```sh
# Default build (SDL + OGG + MP3)
npm run build

# Run examples
./build/sbagen -i 440+5/5         # Play 440Hz + 5Hz binaural beat
./build/sbagen -i 100+10/10       # Lower frequency tones
./build/sbagen -p drop 00ds+      # Pre-programmed sequences
```

### WebAssembly Build

```sh
# Build for web
npm run wbuild

# Start demo server
npm start
# Then open http://localhost:8080
```

## JavaScript API

### Installation

```sh
npm install sbagen
```

### Basic Usage

```javascript
import sbagen from "sbagen";

// Load an SBG file
const sbg = await sbagen(await fetch("example.sbg").then((r) => r.text()));

// Add audio files to the virtual filesystem (for mixing)
const riverBytes = new Uint8Array(
  await fetch("examples/river2.ogg").then((r) => r.arrayBuffer()),
);
sbg.addFile("river2.ogg", riverBytes);

// Play the sequence
sbg.play();
```

### API Reference

#### `sbagen(sbgContent: string): Promise<SBagenInstance>`

Initialize sbagen with (optional) SBG file content.

- **`addFile(filename: string, bytes:Uint8Array): void`**
  Download a file and add it to the virtual filesystem for use in sequences.

- **`play(duration: Number): void`**
  Start playback of the sequence, optional duration (in seconds.)

- **`stop(): void`**
  Stop playback and reset position.

- **`run(args: Array<string>): void`**
  Run sbagen with any arguments you like

## Dependencies

### Native Build

- CMake 3.16+
- SDL2
- libvorbisfile (for OGG support)
- libmad (for MP3 support)
- pkg-config

### Web Build

- Emscripten

### macOS Installation

```sh
brew install sdl2 libvorbis mad pkg-config cmake
```

### Linux Installation

```sh
sudo apt-get install libsdl2-dev libvorbis-dev libmad0-dev pkg-config cmake
```
