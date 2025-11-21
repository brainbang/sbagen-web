# Building SBaGen

This document explains how to build SBaGen for different platforms.

## Native Build

### Prerequisites

- CMake 3.15 or higher
- C compiler (GCC, Clang, or MSVC)
- Platform-specific dependencies:
  - **Linux**: `libasound-dev` or OSS support
  - **macOS**: Xcode Command Line Tools
  - **Windows**: MinGW or Visual Studio

### Build Steps

```bash
# Create build directory
mkdir build
cd build

# Configure
cmake ..

# Build
cmake --build .

# Install (optional)
sudo cmake --install .
```

### With OGG/MP3 Support

Install dependencies first:

**Ubuntu/Debian:**
```bash
sudo apt-get install libogg-dev libvorbis-dev libmpg123-dev
```

**macOS:**
```bash
brew install libogg libvorbis mpg123
```

Then build with options:
```bash
cmake -DENABLE_OGG=ON -DENABLE_MP3=ON ..
cmake --build .
```

## WebAssembly Build

### Using Emscripten (Recommended for web)

#### Prerequisites

Install Emscripten:
```bash
# Get emsdk
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate latest
./emsdk install latest
./emsdk activate latest

# Set up environment (add to your shell profile)
source ./emsdk_env.sh
```

#### Build Steps

```bash
# Create build directory
mkdir build-wasm
cd build-wasm

# Configure with Emscripten
emcmake cmake -DBUILD_WASM=ON ..

# Build
emmake make

# Output files: sbagen.js, sbagen.wasm
```

#### Advanced Emscripten Options

For optimized build:
```bash
emcmake cmake -DBUILD_WASM=ON -DCMAKE_BUILD_TYPE=Release ..
emmake make
```

For debug build with assertions:
```bash
emcmake cmake -DBUILD_WASM=ON -DCMAKE_BUILD_TYPE=Debug ..
emmake make
```

### Using WASI SDK

#### Prerequisites

Download WASI SDK from https://github.com/WebAssembly/wasi-sdk/releases

```bash
# Example for macOS/Linux
export WASI_SDK_PATH=/path/to/wasi-sdk
export CC="${WASI_SDK_PATH}/bin/clang"
export CXX="${WASI_SDK_PATH}/bin/clang++"
```

#### Build Steps

```bash
mkdir build-wasi
cd build-wasi

cmake -DBUILD_WASM=ON \
      -DCMAKE_TOOLCHAIN_FILE="${WASI_SDK_PATH}/share/cmake/wasi-sdk.cmake" \
      ..

make
```

## Quick Build Scripts

### Native Build
```bash
./build-native.sh
```

### WASM Build (Emscripten)
```bash
./build-wasm.sh
```

## Build Options

| Option | Default | Description |
|--------|---------|-------------|
| `BUILD_WASM` | OFF | Build for WebAssembly |
| `ENABLE_OGG` | OFF | Enable OGG/Vorbis support |
| `ENABLE_MP3` | OFF | Enable MP3 support |
| `CMAKE_BUILD_TYPE` | Debug | Build type (Debug/Release) |

## Troubleshooting

### Error: "UNIX_MISC or WIN_MISC not defined"

This means the platform wasn't detected correctly. Try explicitly setting:
```bash
# For Linux
cmake -DT_LINUX=ON ..

# For WASM
cmake -DBUILD_WASM=ON ..
```

### Missing delay() function

Make sure you're defining either `UNIX_MISC` or `WIN_MISC`. The CMakeLists.txt should handle this automatically based on your platform.

### Audio not working on Linux

Try installing ALSA development headers:
```bash
sudo apt-get install libasound-dev
```

Or ensure your user is in the `audio` group:
```bash
sudo usermod -a -G audio $USER
```

## Using in the Browser

After building with Emscripten, you'll get `sbagen.mjs` and `sbagen.wasm`. Use them in your web application with ES modules:

### Option 1: ES Module in HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>SBaGen Web</title>
</head>
<body>
    <script type="module">
        import createSBaGenModule from './sbagen.mjs';

        createSBaGenModule().then(function(Module) {
            // Module is ready
            console.log('SBaGen WASM module loaded');

            // Call main function
            Module.callMain(['-h']);
        });
    </script>
</body>
</html>
```

### Option 2: Separate ES Module File

**app.js:**
```javascript
import createSBaGenModule from './sbagen.mjs';

async function initSBaGen() {
    const Module = await createSBaGenModule();
    console.log('SBaGen WASM module loaded');

    // Call main function
    Module.callMain(['-h']);

    return Module;
}

initSBaGen();
```

**index.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>SBaGen Web</title>
</head>
<body>
    <script type="module" src="app.js"></script>
</body>
</html>
```

### Option 3: Node.js/Deno

```javascript
import createSBaGenModule from './sbagen.mjs';

const Module = await createSBaGenModule();
Module.callMain(['-h']);
```
