#!/bin/bash

# Build script for native platform

set -e

BUILD_DIR="build"
BUILD_TYPE="${BUILD_TYPE:-Release}"
ENABLE_OGG="${ENABLE_OGG:-OFF}"
ENABLE_MP3="${ENABLE_MP3:-OFF}"

echo "Building SBaGen (Native)"
echo "========================"
echo "Build type: $BUILD_TYPE"
echo "OGG support: $ENABLE_OGG"
echo "MP3 support: $ENABLE_MP3"
echo ""

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure
cmake -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
      -DENABLE_OGG="$ENABLE_OGG" \
      -DENABLE_MP3="$ENABLE_MP3" \
      ..

# Build
cmake --build . --config "$BUILD_TYPE"

echo ""
echo "Build complete! Binary is in $BUILD_DIR/"
echo ""
echo "Run with: ./$BUILD_DIR/sbagen -h"
