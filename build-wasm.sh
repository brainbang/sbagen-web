#!/bin/bash

# Build script for WebAssembly using Emscripten

set -e

BUILD_DIR="docs/sbagen"
BUILD_TYPE="${BUILD_TYPE:-Release}"

echo "Building SBaGen (WebAssembly)"
echo "============================="
echo "Build type: $BUILD_TYPE"
echo ""

# Check if emcc is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten not found!"
    echo ""
    echo "Please install Emscripten:"
    echo "  git clone https://github.com/emscripten-core/emsdk.git"
    echo "  cd emsdk"
    echo "  ./emsdk install latest"
    echo "  ./emsdk activate latest"
    echo "  source ./emsdk_env.sh"
    echo ""
    exit 1
fi

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure (need to go up two levels since BUILD_DIR is docs/sbagen)
emcmake cmake -DBUILD_WASM=ON \
              -DENABLE_OGG=ON \
              -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
              ../..

# Build
emmake make

echo ""
echo "Build complete! Output files:"
echo "  $BUILD_DIR/sbagen.mjs (ES module)"
echo "  $BUILD_DIR/sbagen.wasm"
echo ""
echo "To test, import sbagen.mjs as an ES module in your HTML/JS:"
echo "  import createSBaGenModule from './sbagen.mjs';"
