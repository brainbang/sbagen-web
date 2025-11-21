/**
 * SBaGen Web Library
 * Simple API for binaural beat generation in the browser
 */

import createSBaGenModule from './sbagen/sbagen.mjs';

export default class SBaGen {
  constructor() {
    this.module = null;
    this.audioContext = null;
    this.audioWorkletNode = null;
    this.isPlaying = false;
    this.currentFile = null;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.sequenceTime = 0;
    this.chunkQueue = [];
    this.isGenerating = false;
    this.listeners = {};
  }

  /**
   * Create and initialize a new SBaGen instance
   */
  static async create() {
    const instance = new SBaGen();
    await instance.init();
    return instance;
  }

  /**
   * Initialize the WASM module
   */
  async init() {
    this.module = await createSBaGenModule({
      print: () => {},
      printErr: () => {},
      noInitialRun: true,
    });

    this.audioContext = new AudioContext();
  }

  /**
   * Load a sequence file from URL or File object
   * @param {string|File} source - URL or File object
   * @param {Object} options - Options
   * @param {string} options.oggPath - Path to OGG files (default: 'examples/')
   */
  async load(source, options = {}) {
    const { oggPath = 'examples/' } = options;
    let arrayBuffer;
    let filename;

    if (typeof source === 'string') {
      // Load from URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
      filename = source.split('/').pop();
    } else if (source instanceof File) {
      // Load from File object
      arrayBuffer = await source.arrayBuffer();
      filename = source.name;
    } else {
      throw new Error('Source must be a URL string or File object');
    }

    const uint8Array = new Uint8Array(arrayBuffer);

    // Delete old file if exists
    try {
      this.module.FS.unlink(`/${filename}`);
    } catch (e) {
      // Ignore
    }

    // Write to virtual filesystem
    this.module.FS.writeFile(`/${filename}`, uint8Array);
    this.currentFile = filename;

    // Parse and load any referenced OGG files
    const text = new TextDecoder().decode(uint8Array);
    const oggMatches = text.match(/[\w\-]+\.ogg/g);
    if (oggMatches) {
      const uniqueOggs = [...new Set(oggMatches)];
      for (const oggFile of uniqueOggs) {
        try {
          // Try to load from oggPath
          const oggResponse = await fetch(oggPath + oggFile);
          if (oggResponse.ok) {
            const oggData = await oggResponse.arrayBuffer();
            this.module.FS.writeFile(`/${oggFile}`, new Uint8Array(oggData));
          }
        } catch (err) {
          // Ignore missing OGG files
        }
      }
    }

    // Reset state
    this.elapsedTime = 0;
    this.sequenceTime = 0;
    this.chunkQueue = [];

    return this.analyze();
  }

  /**
   * Analyze the loaded sequence
   * @returns {Object} Sequence information
   */
  analyze() {
    if (!this.currentFile) {
      throw new Error('No file loaded');
    }

    try {
      const fileData = this.module.FS.readFile(`/${this.currentFile}`);
      const text = new TextDecoder().decode(fileData);

      // Parse sequence info
      const lines = text.split('\n');
      const description = lines
        .filter(line => line.trim().startsWith('#') || line.trim().startsWith('//'))
        .map(line => line.replace(/^[#\/]+\s*/, ''))
        .join('\n')
        .trim();

      // Find time entries to estimate duration
      const timePattern = /^(\d{2}):(\d{2}):(\d{2})/gm;
      let maxTime = 0;
      let match;
      while ((match = timePattern.exec(text)) !== null) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseInt(match[3]);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        maxTime = Math.max(maxTime, totalSeconds);
      }

      return {
        filename: this.currentFile,
        description,
        estimatedDuration: maxTime,
        content: text,
      };
    } catch (error) {
      throw new Error(`Failed to analyze: ${error.message}`);
    }
  }

  /**
   * Generate audio chunk starting at a specific time
   * @param {number} startTime - Start time in seconds
   * @param {number} duration - Duration in seconds
   */
  async generateAudioChunk(startTime = 0, duration = 30) {
    if (!this.currentFile) {
      throw new Error('No file loaded');
    }

    let sbagenOutput = '';

    const tempModule = await createSBaGenModule({
      print: (text) => { sbagenOutput += text + '\n'; },
      printErr: (text) => { sbagenOutput += 'ERROR: ' + text + '\n'; },
      noInitialRun: true,
    });

    // Copy sequence file
    const fileData = this.module.FS.readFile(`/${this.currentFile}`);
    tempModule.FS.writeFile(`/${this.currentFile}`, fileData);

    // Copy OGG files
    try {
      const files = this.module.FS.readdir('/');
      for (const file of files) {
        if (file && typeof file === 'string' && file.endsWith('.ogg')) {
          try {
            const stat = this.module.FS.stat(`/${file}`);
            if (this.module.FS.isFile(stat.mode)) {
              const oggData = this.module.FS.readFile(`/${file}`);
              tempModule.FS.writeFile(`/${file}`, oggData);
            }
          } catch (err) {
            // Skip this file
          }
        }
      }
    } catch (e) {
      // Ignore
    }

    // Generate audio chunk
    try {
      const startHours = Math.floor(startTime / 3600);
      const startMinutes = Math.floor((startTime % 3600) / 60);
      const startSeconds = Math.floor(startTime % 60);
      const startStr = `${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}:${String(startSeconds).padStart(2, '0')}`;

      const durationHours = Math.floor(duration / 3600);
      const durationMinutes = Math.floor((duration % 3600) / 60);
      const durationSeconds = Math.floor(duration % 60);
      const durationStr = `${String(durationHours).padStart(2, '0')}:${String(durationMinutes).padStart(2, '0')}:${String(durationSeconds).padStart(2, '0')}`;

      tempModule.callMain([
        '-o', '/audio.raw',
        '-T', startStr,  // Start time
        '-L', durationStr,  // Length
        `/${this.currentFile}`,
      ]);
    } catch (e) {
      // Exit is normal
    }

    // Check if audio was generated
    let audioFileExists = false;
    let audioFileSize = 0;

    try {
      const stat = tempModule.FS.stat('/audio.raw');
      audioFileExists = true;
      audioFileSize = stat.size;
    } catch (e) {
      // File doesn't exist
    }

    if (!audioFileExists || audioFileSize === 0) {
      let errorMsg = 'SBaGen failed to generate audio.';
      if (sbagenOutput.trim()) {
        errorMsg += '\n\nSBaGen output:\n' + sbagenOutput;
      }
      throw new Error(errorMsg);
    }

    // Read and convert
    const rawData = tempModule.FS.readFile('/audio.raw');
    const samples = new Int16Array(
      rawData.buffer,
      rawData.byteOffset,
      rawData.byteLength / 2,
    );

    // Convert to float32 (interleaved stereo)
    const floatSamples = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      floatSamples[i] = samples[i] / 32768.0;
    }

    return floatSamples;
  }

  /**
   * Play the loaded sequence
   */
  async play() {
    if (!this.currentFile) {
      throw new Error('No file loaded');
    }

    if (this.isPlaying) {
      return;
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Emit generating and let UI update
    this.emit('generating');
    await new Promise(resolve => setTimeout(resolve, 10));

    // Generate a 60-second buffer once
    let audioBuffer;
    try {
      const samples = await this.generateAudioChunk(this.elapsedTime, 60);

      // Create AudioBuffer from samples
      audioBuffer = this.audioContext.createBuffer(
        2, // stereo
        samples.length / 2,
        44100
      );

      // De-interleave samples into left and right channels
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      for (let i = 0; i < samples.length / 2; i++) {
        left[i] = samples[i * 2];
        right[i] = samples[i * 2 + 1];
      }
    } catch (error) {
      this.emit('stop');
      throw error;
    }

    this.isPlaying = true;
    this.startTime = Date.now() - this.elapsedTime * 1000;

    // Create and start buffer source with looping
    const playBuffer = () => {
      if (!this.isPlaying) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(this.audioContext.destination);
      source.start();

      this.audioWorkletNode = source; // Store for cleanup
    };

    playBuffer();

    // Start time update loop
    this.updateTime();

    this.emit('play');
  }

  /**
   * Stop playback
   */
  stop() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;

    if (this.audioWorkletNode) {
      if (this.audioWorkletNode.stop) {
        this.audioWorkletNode.stop();
      }
      if (this.audioWorkletNode.disconnect) {
        this.audioWorkletNode.disconnect();
      }
      this.audioWorkletNode = null;
    }

    this.elapsedTime = (Date.now() - this.startTime) / 1000;

    this.emit('stop');
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime() {
    if (!this.isPlaying) {
      return this.elapsedTime;
    }
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Update time and emit events
   */
  updateTime() {
    if (!this.isPlaying) {
      return;
    }

    const currentTime = this.getCurrentTime();
    this.emit('timeupdate', currentTime);

    requestAnimationFrame(() => this.updateTime());
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit event
   */
  emit(event, ...args) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach(callback => callback(...args));
  }

  /**
   * Cleanup
   */
  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.listeners = {};
  }
}
