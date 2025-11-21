This allows you to run [sbagen](https://uazu.net/sbagen/) on the web!

Jim Peters wrote the original, and it's pretty much the best at producing binaural beats. I did a little bit of modification to get it running on web.

If you want some config files for it, check out [sbagen_idoser](https://github.com/brainbang/sbagen_idoser). They are not really "digital drugs", but definitely have an effect.

## Building

### Quick Start

**Native build:**
```bash
./build-native.sh
```

**WebAssembly build (requires Emscripten):**
```bash
./build-wasm.sh
```

### Detailed Instructions

See [BUILD.md](BUILD.md) for comprehensive build instructions, including:
- Platform-specific dependencies
- OGG/MP3 support
- WASI SDK builds
- Troubleshooting

### Manual Build

```bash
# Native
mkdir build && cd build
cmake ..
cmake --build .

# WASM with Emscripten
mkdir build-wasm && cd build-wasm
emcmake cmake -DBUILD_WASM=ON ..
emmake make
```

## Testing the WASM Build

After building with `./build-wasm.sh`, you can test the ES module:

1. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open `http://localhost:8000/example.html` in your browser

The example demonstrates:
- Loading the WASM module as an ES module
- Capturing output from the C program
- Calling sbagen functions from JavaScript
