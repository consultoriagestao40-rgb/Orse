export class WavAudioRecorder {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private leftchannel: Float32Array[] = [];
  private recordingLength = 0;
  private sampleRate = 44100;

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.sampleRate = this.audioContext.sampleRate;
    
    // Create script processor with buffer size 2048, 1 input channel, 1 output channel
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.input = this.audioContext.createMediaStreamSource(this.stream);
    
    this.leftchannel = [];
    this.recordingLength = 0;

    this.processor.onaudioprocess = (e) => {
      const left = e.inputBuffer.getChannelData(0);
      this.leftchannel.push(new Float32Array(left));
      this.recordingLength += left.length;
    };

    this.input.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  cancel() {
    if (this.input) this.input.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  stop(): Blob {
    this.cancel();

    // Flatten channel data
    const leftBuffer = this.mergeBuffers(this.leftchannel, this.recordingLength);
    
    // Create WAV container
    const buffer = new ArrayBuffer(44 + this.recordingLength * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + this.recordingLength * 2, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw PCM)
    view.setUint16(20, 1, true);
    // channel count (1 = mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, this.sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, this.sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, this.recordingLength * 2, true);

    // Write PCM audio samples
    let index = 44;
    for (let i = 0; i < leftBuffer.length; i++) {
      // Clamp sample between -1 and 1
      const s = Math.max(-1, Math.min(1, leftBuffer[i]));
      // Convert to 16-bit signed integer
      view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      index += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private mergeBuffers(channelBuffer: Float32Array[], recordingLength: number): Float32Array {
    const result = new Float32Array(recordingLength);
    let offset = 0;
    for (let i = 0; i < channelBuffer.length; i++) {
      const buffer = channelBuffer[i];
      result.set(buffer, offset);
      offset += buffer.length;
    }
    return result;
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
