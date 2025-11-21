// AudioWorklet processor for streaming sbagen audio (stereo)
class SBaGenProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = [];
    this.currentBuffer = null;
    this.bufferIndex = 0;
    this.isPlaying = true;

    this.port.onmessage = (e) => {
      if (e.data.type === "audio") {
        // Received new audio data (interleaved stereo: L,R,L,R...)
        this.buffers.push(e.data.samples);
      } else if (e.data.type === "stop") {
        this.isPlaying = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const leftChannel = output[0];
    const rightChannel = output[1];

    if (!this.isPlaying) {
      return false;
    }

    for (let i = 0; i < leftChannel.length; i++) {
      // Get next buffer if needed
      if (!this.currentBuffer || this.bufferIndex >= this.currentBuffer.length) {
        if (this.buffers.length > 0) {
          this.currentBuffer = this.buffers.shift();
          this.bufferIndex = 0;

          // Request more audio when buffer is running low
          if (this.buffers.length < 2) {
            this.port.postMessage({ type: "needsData" });
          }
        } else {
          // No audio available, output silence
          leftChannel[i] = 0;
          rightChannel[i] = 0;
          continue;
        }
      }

      // Read interleaved stereo samples (L,R,L,R...)
      leftChannel[i] = this.currentBuffer[this.bufferIndex++];
      rightChannel[i] = this.currentBuffer[this.bufferIndex++];
    }

    return true;
  }
}

registerProcessor("sbagen-processor", SBaGenProcessor);
