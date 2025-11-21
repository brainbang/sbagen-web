/**
 * <sbagen-player> Web Component
 * Simple binaural beat player with play/stop button and time display
 *
 * Usage:
 *   <sbagen-player src="examples/basics/ts-brain-alpha.sbg"></sbagen-player>
 *
 * Attributes:
 *   - src: Path to .sbg file
 *   - autoload: If present, loads file automatically
 *
 * Events:
 *   - load: Fired when file is loaded
 *   - play: Fired when playback starts
 *   - stop: Fired when playback stops
 *   - timeupdate: Fired during playback with current time
 *   - error: Fired on error
 */

import SBaGen from './sbagen-web.js';

class SBaGenPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.sbagen = null;
    this.info = null;
  }

  static get observedAttributes() {
    return ['src', 'ogg-path'];
  }

  async connectedCallback() {
    this.render();

    try {
      this.sbagen = await SBaGen.create();

      // Set up event listeners
      this.sbagen.on('play', () => {
        this.updateUI();
        this.dispatchEvent(new CustomEvent('play'));
      });

      this.sbagen.on('stop', () => {
        this.updateUI();
        this.dispatchEvent(new CustomEvent('stop'));
      });

      this.sbagen.on('timeupdate', (time) => {
        this.updateTime(time);
        this.dispatchEvent(new CustomEvent('timeupdate', { detail: { time } }));
      });

      this.sbagen.on('generating', () => {
        this.setStatus('Generating audio...');
      });

      // Auto-load if src is set
      const src = this.getAttribute('src');
      if (src) {
        await this.load(src);
      }

      this.setStatus('Ready');
    } catch (error) {
      this.setStatus(`Error: ${error.message}`);
      this.dispatchEvent(new CustomEvent('error', { detail: { error } }));
    }
  }

  disconnectedCallback() {
    if (this.sbagen) {
      this.sbagen.dispose();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' && newValue && this.sbagen) {
      this.load(newValue);
    }
  }

  async load(src) {
    try {
      this.setStatus('Loading...');
      const oggPath = this.getAttribute('ogg-path') || 'examples/';
      this.info = await this.sbagen.load(src, { oggPath });
      this.setStatus('Ready');
      this.updateUI();
      this.dispatchEvent(new CustomEvent('load', { detail: { info: this.info } }));
    } catch (error) {
      this.setStatus(`Error: ${error.message}`);
      this.dispatchEvent(new CustomEvent('error', { detail: { error } }));
    }
  }

  async togglePlay() {
    if (!this.sbagen || !this.info) {
      return;
    }

    if (this.sbagen.isPlaying) {
      this.sbagen.stop();
    } else {
      try {
        await this.sbagen.play();
      } catch (error) {
        this.setStatus(`Error: ${error.message}`);
        this.dispatchEvent(new CustomEvent('error', { detail: { error } }));
      }
    }
  }

  updateUI() {
    const playBtn = this.shadowRoot.querySelector('#playBtn');
    if (playBtn) {
      playBtn.textContent = this.sbagen?.isPlaying ? '⏹ Stop' : '▶ Play';
      playBtn.disabled = !this.info;
    }
  }

  updateTime(seconds) {
    const timeDisplay = this.shadowRoot.querySelector('#timeDisplay');
    if (timeDisplay) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      timeDisplay.textContent = `${minutes}:${String(secs).padStart(2, '0')}`;
    }
  }

  setStatus(message) {
    const statusEl = this.shadowRoot.querySelector('#status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: #f9f9f9;
          max-width: 400px;
        }

        .container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .title {
          font-weight: bold;
          font-size: 1.1em;
          margin: 0;
          color: #333;
        }

        .status {
          color: #666;
          font-size: 0.9em;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          font-size: 1em;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover:not(:disabled) {
          background: #0056b3;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .time {
          font-variant-numeric: tabular-nums;
          font-size: 1.2em;
          color: #333;
          min-width: 4em;
        }
      </style>

      <div class="container">
        <h3 class="title">SBaGen Player</h3>
        <div class="status" id="status">Initializing...</div>
        <div class="controls">
          <button id="playBtn" disabled>▶ Play</button>
          <span class="time" id="timeDisplay">0:00</span>
        </div>
      </div>
    `;

    const playBtn = this.shadowRoot.querySelector('#playBtn');
    playBtn.addEventListener('click', () => this.togglePlay());
  }
}

customElements.define('sbagen-player', SBaGenPlayer);

export default SBaGenPlayer;
