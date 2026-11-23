/**
 * Application Entry Point
 */

import { KonaApp } from './app.js';

window.addEventListener('DOMContentLoaded', () => {
  try {
    new KonaApp();
    console.log('[Kona] Visual Chip Designer initialized.');
  } catch (err) {
    console.error('[Kona] Failed to initialize:', err);
  }
});
