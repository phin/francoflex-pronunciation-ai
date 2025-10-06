import axios from 'axios';

/**
 * Download audio file from URL
 * 
 * @param {string} audioUrl - URL of the audio file
 * @returns {Promise<Buffer>} Audio file as buffer
 * @throws {Error} If download fails
 */
export async function downloadAudio(audioUrl) {
  if (!audioUrl) {
    throw new Error('Audio URL is required');
  }

  try {
    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB max
    });

    const audioBuffer = Buffer.from(response.data);
    
    if (audioBuffer.length === 0) {
      throw new Error('Downloaded audio file is empty');
    }

    return audioBuffer;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Audio download timed out');
    }
    if (error.response?.status === 404) {
      throw new Error('Audio file not found');
    }
    throw new Error(`Failed to download audio: ${error.message}`);
  }
}

/**
 * Validate audio buffer format
 * 
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {boolean} True if valid
 * @throws {Error} If invalid
 */
export function validateAudioFormat(audioBuffer) {
  if (!Buffer.isBuffer(audioBuffer)) {
    throw new Error('Invalid audio buffer');
  }

  if (audioBuffer.length === 0) {
    throw new Error('Audio buffer is empty');
  }

  // Check for common audio file signatures
  const isWav = audioBuffer.slice(0, 4).toString() === 'RIFF';
  const isMp3 = audioBuffer.slice(0, 3).toString() === 'ID3' || 
                audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0;
  const isOgg = audioBuffer.slice(0, 4).toString() === 'OggS';
  const isWebm = audioBuffer.slice(0, 4).toString('hex') === '1a45dfa3';

  if (!isWav && !isMp3 && !isOgg && !isWebm) {
    console.warn('Audio format may not be supported. First bytes:', 
      audioBuffer.slice(0, 16).toString('hex'));
  }

  return true;
}

/**
 * Get audio metadata (if available)
 * 
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Object} Basic metadata
 */
export function getAudioMetadata(audioBuffer) {
  const format = getAudioFormat(audioBuffer);
  
  return {
    size: audioBuffer.length,
    sizeKB: (audioBuffer.length / 1024).toFixed(2),
    format: format,
    isSupported: ['wav', 'mp3', 'ogg', 'webm'].includes(format)
  };
}

/**
 * Detect audio format from buffer
 * 
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {string} Format name
 */
function getAudioFormat(audioBuffer) {
  if (audioBuffer.slice(0, 4).toString() === 'RIFF') return 'wav';
  if (audioBuffer.slice(0, 3).toString() === 'ID3') return 'mp3';
  if (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0) return 'mp3';
  if (audioBuffer.slice(0, 4).toString() === 'OggS') return 'ogg';
  if (audioBuffer.slice(0, 4).toString('hex') === '1a45dfa3') return 'webm';
  return 'unknown';
}
