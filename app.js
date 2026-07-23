function initApp() {
  // UI Elements
  const previewBtn = document.getElementById('preview-btn');
  const processBtn = document.getElementById('process-btn');
  const btnText = document.getElementById('btn-text');
  const statusBox = document.getElementById('status-box');
  const statusIcon = document.getElementById('status-icon');
  const statusMessage = document.getElementById('status-message');
  const previewPanel = document.getElementById('preview-panel');
  const originalImg = document.getElementById('original-img');
  const invertedImg = document.getElementById('inverted-img');
  const copyAgainBtn = document.getElementById('copy-again-btn');
  const downloadBtn = document.getElementById('download-btn');
  const processCanvas = document.getElementById('process-canvas');
  const toastContainer = document.getElementById('toast-container');

  // Checkerboard Grid Control Elements
  const caroColsSlider = document.getElementById('caro-cols-slider');
  const caroColsVal = document.getElementById('caro-cols-val');
  const caroRowsSlider = document.getElementById('caro-rows-slider');
  const caroRowsVal = document.getElementById('caro-rows-val');
  const caroBlurSlider = document.getElementById('caro-blur-slider');
  const caroBlurValDisplay = document.getElementById('caro-blur-val-display');
  const caroInvertToggle = document.getElementById('caro-invert-toggle');

  let currentInvertedBlob = null;
  let cachedLoadedImage = null; // Store loaded image for realtime live preview

  function triggerRealtimePreview() {
    if (cachedLoadedImage) {
      renderImageToCanvas(cachedLoadedImage, false);
    }
  }

  // LocalStorage Settings Persistence
  const STORAGE_KEY = 'clipboard_inverter_settings_v1';

  function saveSettings() {
    try {
      const data = {
        caroColsSlider: caroColsSlider ? caroColsSlider.value : '8',
        caroRowsSlider: caroRowsSlider ? caroRowsSlider.value : '8',
        caroBlurSlider: caroBlurSlider ? caroBlurSlider.value : '0',
        caroInvertToggle: caroInvertToggle ? caroInvertToggle.checked : true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Cannot save settings to localStorage:', e);
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (caroColsSlider && data.caroColsSlider !== undefined) {
        caroColsSlider.value = data.caroColsSlider;
        if (caroColsVal) caroColsVal.textContent = `${data.caroColsSlider} Cols`;
      }
      if (caroRowsSlider && data.caroRowsSlider !== undefined) {
        caroRowsSlider.value = data.caroRowsSlider;
        if (caroRowsVal) caroRowsVal.textContent = `${data.caroRowsSlider} Rows`;
      }
      if (caroBlurSlider && data.caroBlurSlider !== undefined) {
        caroBlurSlider.value = data.caroBlurSlider;
        if (caroBlurValDisplay) caroBlurValDisplay.textContent = parseInt(data.caroBlurSlider, 10) === 0 ? '0 px (Original)' : `${data.caroBlurSlider} px`;
      }
      if (caroInvertToggle && data.caroInvertToggle !== undefined) {
        caroInvertToggle.checked = data.caroInvertToggle;
      }
    } catch (e) {
      console.warn('Cannot load settings from localStorage:', e);
    }
  }

  // Attach change & input listeners to grid controls for auto-save & realtime preview
  [caroColsSlider, caroRowsSlider, caroBlurSlider, caroInvertToggle].forEach(input => {
    if (!input) return;
    input.addEventListener('change', () => {
      saveSettings();
      triggerRealtimePreview();
    });
    input.addEventListener('input', () => {
      saveSettings();
      triggerRealtimePreview();
    });
  });

  // Update Caro Grid Sliders Display Text
  if (caroColsSlider && caroColsVal) {
    caroColsSlider.addEventListener('input', (e) => {
      caroColsVal.textContent = `${e.target.value} Cols`;
    });
  }
  if (caroRowsSlider && caroRowsVal) {
    caroRowsSlider.addEventListener('input', (e) => {
      caroRowsVal.textContent = `${e.target.value} Rows`;
    });
  }
  if (caroBlurSlider && caroBlurValDisplay) {
    caroBlurSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      caroBlurValDisplay.textContent = val === 0 ? '0 px (Original)' : `${val} px`;
    });
  }

  loadSettings();

  // Register Service Worker for PWA / Offline Support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker Registered:', reg.scope))
      .catch(err => console.warn('Service Worker Registration Failed:', err));
  }

  // Toast Notification Helper (Auto-fade & auto-remove)
  function showToast(message, duration = 2500) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 320);
    }, duration);
  }

  // Status Indicator Update Helper
  function updateStatus(type, message, icon) {
    statusBox.className = `status-box ${type}`;
    statusIcon.textContent = icon;
    statusMessage.textContent = message;
  }

  // Main Processing Function
  async function processClipboardImage(writeToClipboard = true) {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      updateStatus('error', 'Your browser does not support Clipboard reading API. Please use Chrome or Edge over HTTPS.', '❌');
      showToast('❌ Clipboard API not supported');
      return;
    }

    processBtn.classList.add('loading');
    btnText.textContent = 'PROCESSING...';
    processBtn.disabled = true;
    updateStatus('loading', 'Connecting to clipboard and reading data...', '⏳');

    try {
      const clipboardItems = await navigator.clipboard.read();
      let imageBlob = null;
      let textContent = null;

      for (const item of clipboardItems) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) {
          imageBlob = await item.getType(type);
          break;
        }
        if (item.types.includes('text/plain')) {
          const textBlob = await item.getType('text/plain');
          textContent = await textBlob.text();
        }
      }

      if (!imageBlob && textContent) {
        const trimmed = textContent.trim();
        if (trimmed.startsWith('data:image/') || trimmed.match(/^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i)) {
          try {
            updateStatus('loading', 'Detected image URL/data in clipboard, fetching image...', '🌐');
            const res = await fetch(trimmed);
            imageBlob = await res.blob();
          } catch (e) {
            console.warn('Cannot fetch image URL from text clipboard:', e);
          }
        }
      }

      if (!imageBlob) {
        updateStatus('error', 'No image found in Clipboard! Please Copy (Ctrl+C) an image first.', '⚠️');
        showToast('⚠️ Clipboard currently has no image data');
        return;
      }

      updateStatus('loading', 'Image found! Processing checkerboard grid...', '🔄');

      const originalUrl = URL.createObjectURL(imageBlob);
      originalImg.src = originalUrl;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image data'));
        img.src = originalUrl;
      });

      cachedLoadedImage = img;
      await renderImageToCanvas(img, writeToClipboard);
    } catch (err) {
      console.error('Clipboard Processing Error:', err);

      if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
        updateStatus('error', 'Clipboard access denied by browser. Please grant clipboard permissions!', '🚫');
        showToast('🚫 Please grant clipboard permission to web app');
      } else {
        updateStatus('error', `Error: ${err.message || 'Unable to process image from Clipboard'}`, '❌');
        showToast(`❌ ${err.message || 'Image processing error'}`);
      }
    } finally {
      processBtn.classList.remove('loading');
      btnText.textContent = 'INVERT & SAVE';
      processBtn.disabled = false;
    }
  }

  // Realtime Checkerboard Canvas Render Engine
  async function renderImageToCanvas(img, writeToClipboard = false) {
    if (!img) return;

    try {
      const ctx = processCanvas.getContext('2d');
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      processCanvas.width = width;
      processCanvas.height = height;

      const gridCols = caroColsSlider ? (parseInt(caroColsSlider.value, 10) || 8) : 8;
      const gridRows = caroRowsSlider ? (parseInt(caroRowsSlider.value, 10) || 8) : 8;
      const caroBlurPx = caroBlurSlider ? (parseInt(caroBlurSlider.value, 10) || 0) : 0;
      const shouldInvertCaro = caroInvertToggle ? caroInvertToggle.checked : true;

      if (!shouldInvertCaro && caroBlurPx === 0) {
        showToast('💡 Auto-enabled Grid Color Invert switch');
        if (caroInvertToggle) caroInvertToggle.checked = true;
      }
      const activeInvertCaro = caroInvertToggle ? caroInvertToggle.checked : true;

      // 1. Draw 100% sharp original image to processCanvas
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Prepare inverted/blurred layer on offscreen canvas
      const offCanvasInv = document.createElement('canvas');
      offCanvasInv.width = width;
      offCanvasInv.height = height;
      const offCtxInv = offCanvasInv.getContext('2d');

      if (caroBlurPx > 0) {
        offCtxInv.filter = `blur(${caroBlurPx}px)`;
      }
      offCtxInv.drawImage(img, 0, 0, width, height);

      if (activeInvertCaro) {
        // Fast 1D linear array inversion (Zero division/floor/modulo math overhead)
        const invImgData = offCtxInv.getImageData(0, 0, width, height);
        const d = invImgData.data;
        const len = d.length;
        for (let i = 0; i < len; i += 4) {
          d[i]     = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
        offCtxInv.putImageData(invImgData, 0, 0);
      }

      // 3. GPU-Accelerated tile compositing using native drawImage sub-rectangles
      const tileW = width / gridCols;
      const tileH = height / gridRows;

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const isOriginal = (gridCols === 1 && gridRows === 1) ? false : ((r + c) % 2 === 0);
          if (!isOriginal) {
            const x = Math.round(c * tileW);
            const y = Math.round(r * tileH);
            const w = Math.round((c + 1) * tileW) - x;
            const h = Math.round((r + 1) * tileH) - y;
            ctx.drawImage(offCanvasInv, x, y, w, h, x, y, w, h);
          }
        }
      }

      // 4. Convert Canvas back to PNG Blob
      const invertedBlob = await new Promise(resolve => {
        processCanvas.toBlob(resolve, 'image/png');
      });

      currentInvertedBlob = invertedBlob;
      const invertedUrl = URL.createObjectURL(invertedBlob);
      invertedImg.src = invertedUrl;
      previewPanel.classList.remove('hidden');

      if (writeToClipboard) {
        const clipboardItem = new ClipboardItem({ 'image/png': invertedBlob });
        await navigator.clipboard.write([clipboardItem]);

        updateStatus('success', 'CHECKERBOARD INVERSION SUCCESS! New image saved to Clipboard.', '✅');
        showToast('🎉 Inverted image saved to Clipboard!');
      } else {
        updateStatus('success', '👁️ IMAGE PREVIEW ACTIVE (Click "INVERT & SAVE" to update Clipboard)', '👁️');
      }
    } catch (err) {
      console.error('Render Canvas Error:', err);
    }
  }

  // Action Button Event Listeners
  if (previewBtn) {
    previewBtn.addEventListener('click', () => processClipboardImage(false));
  }
  if (processBtn) {
    processBtn.addEventListener('click', () => processClipboardImage(true));
  }

  // Copy Again Button
  copyAgainBtn.addEventListener('click', async () => {
    if (!currentInvertedBlob) return;
    try {
      const item = new ClipboardItem({ 'image/png': currentInvertedBlob });
      await navigator.clipboard.write([item]);
      showToast('📋 Re-copied to Clipboard!');
    } catch (err) {
      showToast('❌ Unable to copy: ' + err.message);
    }
  });

  // Global Paste (Ctrl + V) Handler for Instant Zero-Click Live Preview
  window.addEventListener('paste', async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    if (!items) return;

    for (const item of items) {
      if (item.type && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          e.preventDefault();
          updateStatus('loading', 'Pasted image detected (Ctrl+V)! Rendering preview...', '🔄');
          
          const originalUrl = URL.createObjectURL(blob);
          originalImg.src = originalUrl;

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            cachedLoadedImage = img;
            renderImageToCanvas(img, false);
            showToast('📋 Image loaded from Ctrl+V for live preview!');
          };
          img.src = originalUrl;
          return;
        }
      }
    }
  });

  // Download Image Button
  downloadBtn.addEventListener('click', () => {
    if (!currentInvertedBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(currentInvertedBlob);
    a.download = `checkerboard-inverted-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('💾 Processed PNG image downloaded');
  });
}

// Ensure App Initialization runs immediately even if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
