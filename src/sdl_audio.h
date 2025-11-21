// SDL2 Audio backend for sbagen (Emscripten/WASM)
// This allows sbagen to output audio directly through SDL2,
// which Emscripten automatically routes to Web Audio API

#ifndef SDL_AUDIO_H
#define SDL_AUDIO_H

#ifdef SDL_AUDIO

#include <SDL2/SDL.h>

// Audio callback function that will be called by SDL to fill the buffer
void sdl_audio_callback(void* userdata, Uint8* stream, int len);

// Initialize SDL audio
int sdl_audio_init(int sample_rate, int channels);

// Close SDL audio
void sdl_audio_close(void);

// Write audio samples (called by sbagen's audio generation code)
void sdl_audio_write(const int16_t* samples, int num_samples);

#endif // SDL_AUDIO

#endif // SDL_AUDIO_H
