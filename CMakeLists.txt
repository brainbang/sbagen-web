cmake_minimum_required(VERSION 3.16)
project(sbagen LANGUAGES C)

# Always build sbagen.c
set(SBAGEN_SOURCES src/sbagen.c)

find_package(PkgConfig REQUIRED)

if(CMAKE_SYSTEM_NAME STREQUAL "Darwin")
    list(APPEND CMAKE_PREFIX_PATH "/opt/homebrew")
endif()

# Platform-specific setup
if(EMSCRIPTEN)
    # Emscripten build - SDL only, no OGG/MP3 (would need different implementation)
    add_executable(sbagen ${SBAGEN_SOURCES})

    target_compile_options(sbagen PRIVATE -sUSE_SDL=2)
    set_target_properties(sbagen PROPERTIES
        SUFFIX ".mjs"
        LINK_FLAGS "-sUSE_SDL=2 -sEXPORTED_RUNTIME_METHODS=['FS','callMain'] -sEXPORTED_FUNCTIONS=['_main','_signal_handler'] -sALLOW_MEMORY_GROWTH=1 -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker -sASYNCIFY=1 -sASYNCIFY_STACK_SIZE=524288 -sASYNCIFY_IMPORTS=['emscripten_sleep']"
    )
    message(STATUS "Building for Emscripten with SDL2")
else()
    # Native build - try to include OGG and MP3 support

    # Check for OGG support
    pkg_check_modules(VORBISIDEC vorbisidec)
    if(VORBISIDEC_FOUND)
        list(APPEND SBAGEN_SOURCES src/oggdec.c)
        set(HAVE_OGG TRUE)
        set(OGG_IMPL "Tremor")
    else()
        pkg_check_modules(VORBISFILE vorbisfile)
        if(VORBISFILE_FOUND)
            list(APPEND SBAGEN_SOURCES src/oggdec.c)
            set(HAVE_OGG TRUE)
            set(OGG_IMPL "libvorbisfile")
        endif()
    endif()

    # Check for MP3 support
    pkg_check_modules(MAD mad)
    if(MAD_FOUND)
        list(APPEND SBAGEN_SOURCES src/mp3dec.c)
        set(HAVE_MP3 TRUE)
    endif()

    add_executable(sbagen ${SBAGEN_SOURCES})

    # SDL2 is required
    find_package(SDL2 REQUIRED CONFIG)
    target_link_libraries(sbagen PRIVATE SDL2::SDL2)

    # Link OGG libraries if available
    if(HAVE_OGG)
        target_compile_definitions(sbagen PRIVATE OGG_DECODE)
        if(VORBISIDEC_FOUND)
            target_compile_definitions(sbagen PRIVATE HAVE_TREMOR)
            target_include_directories(sbagen PRIVATE ${VORBISIDEC_INCLUDE_DIRS})
            target_link_directories(sbagen PRIVATE ${VORBISIDEC_LIBRARY_DIRS})
            target_link_libraries(sbagen PRIVATE ${VORBISIDEC_LIBRARIES})
        else()
            target_include_directories(sbagen PRIVATE ${VORBISFILE_INCLUDE_DIRS})
            target_link_directories(sbagen PRIVATE ${VORBISFILE_LIBRARY_DIRS})
            target_link_libraries(sbagen PRIVATE ${VORBISFILE_LIBRARIES})
        endif()
    endif()

    # Link MP3 libraries if available
    if(HAVE_MP3)
        target_compile_definitions(sbagen PRIVATE MP3_DECODE)
        target_include_directories(sbagen PRIVATE ${MAD_INCLUDE_DIRS})
        target_link_directories(sbagen PRIVATE ${MAD_LIBRARY_DIRS})
        target_link_libraries(sbagen PRIVATE ${MAD_LIBRARIES})
    endif()

    # Status message
    set(FORMAT_SUPPORT "SDL2")
    if(HAVE_OGG)
        set(FORMAT_SUPPORT "${FORMAT_SUPPORT}, OGG (${OGG_IMPL})")
    endif()
    if(HAVE_MP3)
        set(FORMAT_SUPPORT "${FORMAT_SUPPORT}, MP3 (libmad)")
    endif()
    message(STATUS "Building with ${FORMAT_SUPPORT}")
endif()

# Platform defines
if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
    target_compile_definitions(sbagen PRIVATE T_LINUX)
elseif(CMAKE_SYSTEM_NAME STREQUAL "Darwin")
    target_compile_definitions(sbagen PRIVATE T_MACOSX)
elseif(CMAKE_SYSTEM_NAME STREQUAL "Windows")
    target_compile_definitions(sbagen PRIVATE T_MSVC)
endif()
