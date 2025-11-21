cmake_minimum_required(VERSION 3.15)
project(sbagen C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Options
option(BUILD_WASM "Build for WebAssembly" OFF)
option(ENABLE_OGG "Enable OGG support" OFF)
option(ENABLE_MP3 "Enable MP3 support" OFF)

# Main executable
add_executable(sbagen src/sbagen.c)

# Platform detection and configuration
if(BUILD_WASM)
    message(STATUS "Configuring for WebAssembly build")

    # WASM-specific settings - use T_POSIX (no audio, we'll add SDL separately)
    target_compile_definitions(sbagen PRIVATE
        T_POSIX
    )

    # Emscripten-specific flags
    if(EMSCRIPTEN)
        message(STATUS "Using Emscripten toolchain with ES6 modules and SDL2")

        # Export functions that will be callable from JavaScript
        set_target_properties(sbagen PROPERTIES
            LINK_FLAGS "-s WASM=1 \
                        -s EXPORTED_FUNCTIONS='[\"_main\"]' \
                        -s EXPORTED_RUNTIME_METHODS='[\"callMain\",\"FS\"]' \
                        -s ALLOW_MEMORY_GROWTH=1 \
                        -s MODULARIZE=1 \
                        -s EXPORT_ES6=1 \
                        -s EXPORT_NAME='createSBaGenModule' \
                        -s ENVIRONMENT='web,worker' \
                        -s FILESYSTEM=1 \
                        -s EXIT_RUNTIME=0"
        )

        # Enable pthread if needed
        # target_link_options(sbagen PRIVATE "-pthread")
        # target_compile_options(sbagen PRIVATE "-pthread")

        # Set output name and suffix for ES modules
        set_target_properties(sbagen PROPERTIES
            OUTPUT_NAME "sbagen"
            SUFFIX ".mjs"
        )
    else()
        message(STATUS "Using WASI SDK")
        # WASI-specific settings
        target_compile_definitions(sbagen PRIVATE
            __wasi__
        )
    endif()

elseif(UNIX AND NOT APPLE)
    message(STATUS "Configuring for Linux")
    # Only define T_LINUX, let the code define the rest
    target_compile_definitions(sbagen PRIVATE
        T_LINUX
    )

    # Link pthread for Linux
    target_link_libraries(sbagen PRIVATE pthread m)

elseif(APPLE)
    message(STATUS "Configuring for macOS")

    # Note: The original code uses deprecated Carbon.h which is not available
    # on modern macOS. For now, we use POSIX mode with file output.
    # Audio output to device would require updating the CoreAudio code.
    message(WARNING "Using POSIX mode (file output only) due to deprecated Carbon API")
    message(WARNING "For audio device output, the CoreAudio code needs modernization")

    # Only define T_POSIX, let the code define the rest
    target_compile_definitions(sbagen PRIVATE
        T_POSIX
    )

    target_link_libraries(sbagen PRIVATE pthread m)

elseif(WIN32)
    message(STATUS "Configuring for Windows")

    # Only define T_MINGW or T_MSVC, let the code define the rest
    if(MINGW)
        target_compile_definitions(sbagen PRIVATE
            T_MINGW
        )
    elseif(MSVC)
        target_compile_definitions(sbagen PRIVATE
            T_MSVC
        )
    endif()

    # Link Windows multimedia library
    target_link_libraries(sbagen PRIVATE winmm)

else()
    message(WARNING "Unknown platform, using POSIX defaults with no audio")
    # Only define T_POSIX, let the code define the rest
    target_compile_definitions(sbagen PRIVATE
        T_POSIX
    )
    target_link_libraries(sbagen PRIVATE pthread m)
endif()

# OGG support
if(ENABLE_OGG)
    message(STATUS "OGG support enabled")

    # Try to find system libogg and libvorbis
    find_package(PkgConfig)
    if(PKG_CONFIG_FOUND)
        pkg_check_modules(OGG ogg)
        pkg_check_modules(VORBIS vorbis vorbisfile)
    endif()

    if(OGG_FOUND AND VORBIS_FOUND)
        message(STATUS "Using system OGG/Vorbis libraries")
        target_compile_definitions(sbagen PRIVATE OGG_DECODE)
        target_include_directories(sbagen PRIVATE ${OGG_INCLUDE_DIRS} ${VORBIS_INCLUDE_DIRS})
        target_link_libraries(sbagen PRIVATE ${OGG_LIBRARIES} ${VORBIS_LIBRARIES})
    else()
        message(WARNING "OGG/Vorbis not found. Please install libogg-dev and libvorbis-dev")
        message(WARNING "Or the code needs oggdec.c implementation")
    endif()
endif()

# MP3 support
if(ENABLE_MP3)
    message(STATUS "MP3 support enabled")

    # Try to find system libmpg123 or similar
    find_package(PkgConfig)
    if(PKG_CONFIG_FOUND)
        pkg_check_modules(MPG123 libmpg123)
    endif()

    if(MPG123_FOUND)
        message(STATUS "Using system MPG123 library")
        target_compile_definitions(sbagen PRIVATE MP3_DECODE)
        target_include_directories(sbagen PRIVATE ${MPG123_INCLUDE_DIRS})
        target_link_libraries(sbagen PRIVATE ${MPG123_LIBRARIES})
    else()
        message(WARNING "MPG123 not found. Please install libmpg123-dev")
        message(WARNING "Or the code needs mp3dec.c implementation")
    endif()
endif()

# Install target
install(TARGETS sbagen DESTINATION bin)

# Print configuration summary
message(STATUS "")
message(STATUS "=== Configuration Summary ===")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "WASM build: ${BUILD_WASM}")
message(STATUS "OGG support: ${ENABLE_OGG}")
message(STATUS "MP3 support: ${ENABLE_MP3}")
message(STATUS "=============================")
message(STATUS "")
