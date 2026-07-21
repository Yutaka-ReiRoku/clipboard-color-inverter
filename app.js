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
  const blurSlider = document.getElementById('blur-slider');
  const blurValDisplay = document.getElementById('blur-val-display');

  const preserveTextToggle = document.getElementById('preserve-text-toggle');
  const invertColorToggle = document.getElementById('invert-color-toggle');

  const tabBlur = document.getElementById('tab-blur');
  const tabCaro = document.getElementById('tab-caro');
  const tabShapes = document.getElementById('tab-shapes');
  const blurControls = document.getElementById('blur-controls');
  const caroControls = document.getElementById('caro-controls');
  const shapesControls = document.getElementById('shapes-controls');
  
  const caroColsSlider = document.getElementById('caro-cols-slider');
  const caroColsVal = document.getElementById('caro-cols-val');
  const caroRowsSlider = document.getElementById('caro-rows-slider');
  const caroRowsVal = document.getElementById('caro-rows-val');
  const caroBlurSlider = document.getElementById('caro-blur-slider');
  const caroBlurValDisplay = document.getElementById('caro-blur-val-display');
  const caroInvertToggle = document.getElementById('caro-invert-toggle');

  const sizeMinSlider = document.getElementById('size-min-slider');
  const sizeMaxSlider = document.getElementById('size-max-slider');
  const shapeSizeRangeVal = document.getElementById('shape-size-range-val');
  const sizeTrackHighlight = document.getElementById('size-track-highlight');

  const rotMinSlider = document.getElementById('rot-min-slider');
  const rotMaxSlider = document.getElementById('rot-max-slider');
  const shapeRotRangeVal = document.getElementById('shape-rot-range-val');
  const rotTrackHighlight = document.getElementById('rot-track-highlight');

  const shapeCountSlider = document.getElementById('shape-count-slider');
  const shapeCountVal = document.getElementById('shape-count-val');
  const shapePassesSlider = document.getElementById('shape-passes-slider');
  const shapePassesVal = document.getElementById('shape-passes-val');
  const shapeBlurSlider = document.getElementById('shape-blur-slider');
  const shapeBlurVal = document.getElementById('shape-blur-val');
  const shapeInvertToggle = document.getElementById('shape-invert-toggle');
  const shapeBtns = document.querySelectorAll('.shape-btn');

  let currentMode = 'blur';
  let selectedShape = 'star';
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
        currentMode,
        selectedShape,
        blurSlider: blurSlider ? blurSlider.value : '0',
        invertColorToggle: invertColorToggle ? invertColorToggle.checked : true,
        preserveTextToggle: preserveTextToggle ? preserveTextToggle.checked : true,
        caroColsSlider: caroColsSlider ? caroColsSlider.value : '8',
        caroRowsSlider: caroRowsSlider ? caroRowsSlider.value : '8',
        caroBlurSlider: caroBlurSlider ? caroBlurSlider.value : '0',
        caroInvertToggle: caroInvertToggle ? caroInvertToggle.checked : true,
        sizeMinSlider: sizeMinSlider ? sizeMinSlider.value : '20',
        sizeMaxSlider: sizeMaxSlider ? sizeMaxSlider.value : '80',
        rotMinSlider: rotMinSlider ? rotMinSlider.value : '0',
        rotMaxSlider: rotMaxSlider ? rotMaxSlider.value : '180',
        shapeCountSlider: shapeCountSlider ? shapeCountSlider.value : '30',
        shapePassesSlider: shapePassesSlider ? shapePassesSlider.value : '1',
        shapeBlurSlider: shapeBlurSlider ? shapeBlurSlider.value : '0',
        shapeInvertToggle: shapeInvertToggle ? shapeInvertToggle.checked : true
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

      if (data.currentMode) {
        switchMode(data.currentMode, true);
      }

      if (data.selectedShape) {
        selectedShape = data.selectedShape;
        shapeBtns.forEach(btn => {
          if (btn.dataset.shape === selectedShape) btn.classList.add('active');
          else btn.classList.remove('active');
        });
      }

      if (blurSlider && data.blurSlider !== undefined) {
        blurSlider.value = data.blurSlider;
        if (blurValDisplay) blurValDisplay.textContent = parseInt(data.blurSlider, 10) === 0 ? '0 px (Original)' : `${data.blurSlider} px`;
      }
      if (invertColorToggle && data.invertColorToggle !== undefined) invertColorToggle.checked = data.invertColorToggle;
      if (preserveTextToggle && data.preserveTextToggle !== undefined) preserveTextToggle.checked = data.preserveTextToggle;

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
      if (caroInvertToggle && data.caroInvertToggle !== undefined) caroInvertToggle.checked = data.caroInvertToggle;

      if (sizeMinSlider && data.sizeMinSlider !== undefined) sizeMinSlider.value = data.sizeMinSlider;
      if (sizeMaxSlider && data.sizeMaxSlider !== undefined) sizeMaxSlider.value = data.sizeMaxSlider;
      if (rotMinSlider && data.rotMinSlider !== undefined) rotMinSlider.value = data.rotMinSlider;
      if (rotMaxSlider && data.rotMaxSlider !== undefined) rotMaxSlider.value = data.rotMaxSlider;

      if (shapeCountSlider && data.shapeCountSlider !== undefined) {
        shapeCountSlider.value = data.shapeCountSlider;
        if (shapeCountVal) shapeCountVal.textContent = `${data.shapeCountSlider} Shapes`;
      }
      if (shapePassesSlider && data.shapePassesSlider !== undefined) {
        shapePassesSlider.value = data.shapePassesSlider;
        if (shapePassesVal) shapePassesVal.textContent = parseInt(data.shapePassesSlider, 10) === 1 ? '1 Pass' : `${data.shapePassesSlider} Passes`;
      }
      if (shapeBlurSlider && data.shapeBlurSlider !== undefined) {
        shapeBlurSlider.value = data.shapeBlurSlider;
        if (shapeBlurVal) shapeBlurVal.textContent = parseInt(data.shapeBlurSlider, 10) === 0 ? '0 px (Original)' : `${data.shapeBlurSlider} px`;
      }
      if (shapeInvertToggle && data.shapeInvertToggle !== undefined) shapeInvertToggle.checked = data.shapeInvertToggle;

    } catch (e) {
      console.warn('Cannot load settings from localStorage:', e);
    }
  }

  // Centralized Tab Switcher Helper
  function switchMode(newMode, skipSave = false) {
    currentMode = newMode;

    if (tabBlur) tabBlur.classList.toggle('active', newMode === 'blur');
    if (tabCaro) tabCaro.classList.toggle('active', newMode === 'caro');
    if (tabShapes) tabShapes.classList.toggle('active', newMode === 'shapes');

    if (blurControls) blurControls.classList.toggle('hidden', newMode !== 'blur');
    if (caroControls) caroControls.classList.toggle('hidden', newMode !== 'caro');
    if (shapesControls) shapesControls.classList.toggle('hidden', newMode !== 'shapes');

    if (!skipSave) {
      saveSettings();
    }

    if (cachedLoadedImage) {
      triggerRealtimePreview();
    }
  }

  // Mode Switcher Tabs Listener
  if (tabBlur) tabBlur.addEventListener('click', () => switchMode('blur'));
  if (tabCaro) tabCaro.addEventListener('click', () => switchMode('caro'));
  if (tabShapes) tabShapes.addEventListener('click', () => switchMode('shapes'));

  // Shape Button Selection
  shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedShape = btn.dataset.shape || 'star';
      saveSettings();
      if (cachedLoadedImage) triggerRealtimePreview();
    });
  });

  // Attach change/input listeners to all inputs to auto-save and update realtime preview
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      saveSettings();
      triggerRealtimePreview();
    });
    input.addEventListener('input', () => {
      saveSettings();
      triggerRealtimePreview();
    });
  });

  // Dual-Thumb Range Slider Sync Helper
  function syncDualSlider(minInput, maxInput, displayElem, trackHighlight, unit = '') {
    let minV = parseInt(minInput.value, 10);
    let maxV = parseInt(maxInput.value, 10);

    if (minV > maxV) {
      if (document.activeElement === minInput) {
        maxInput.value = minV;
        maxV = minV;
      } else {
        minInput.value = maxV;
        minV = maxV;
      }
    }

    const minLimit = parseInt(minInput.min, 10);
    const maxLimit = parseInt(minInput.max, 10);
    const range = maxLimit - minLimit;

    const leftPct = ((minV - minLimit) / range) * 100;
    const widthPct = ((maxV - minV) / range) * 100;

    if (trackHighlight) {
      trackHighlight.style.left = `${leftPct}%`;
      trackHighlight.style.width = `${widthPct}%`;
    }

    if (displayElem) {
      displayElem.textContent = `${minV}${unit} - ${maxV}${unit}`;
    }
  }

  // Dual Sliders Listeners
  if (sizeMinSlider && sizeMaxSlider) {
    const updateSize = () => syncDualSlider(sizeMinSlider, sizeMaxSlider, shapeSizeRangeVal, sizeTrackHighlight, ' px');
    sizeMinSlider.addEventListener('input', updateSize);
    sizeMaxSlider.addEventListener('input', updateSize);
    updateSize(); // initial sync
  }

  if (rotMinSlider && rotMaxSlider) {
    const updateRot = () => syncDualSlider(rotMinSlider, rotMaxSlider, shapeRotRangeVal, rotTrackHighlight, '°');
    rotMinSlider.addEventListener('input', updateRot);
    rotMaxSlider.addEventListener('input', updateRot);
    updateRot(); // initial sync
  }

  if (shapeCountSlider && shapeCountVal) {
    shapeCountSlider.addEventListener('input', (e) => shapeCountVal.textContent = `${e.target.value} Shapes`);
  }
  if (shapePassesSlider && shapePassesVal) {
    shapePassesSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      shapePassesVal.textContent = val === 1 ? '1 Pass' : `${val} Passes`;
    });
  }
  if (shapeBlurSlider && shapeBlurVal) {
    shapeBlurSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      shapeBlurVal.textContent = val === 0 ? '0 px (Original)' : `${val} px`;
    });
  }

  // Update Caro Grid Sliders Display
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

  // Update Caro Blur Slider Display
  if (caroBlurSlider && caroBlurValDisplay) {
    caroBlurSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val === 0) {
        caroBlurValDisplay.textContent = '0 px (Original)';
      } else {
        caroBlurValDisplay.textContent = `${val} px`;
      }
    });
  }

  // Update Blur Slider Text Display
  if (blurSlider && blurValDisplay) {
    blurSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val === 0) {
        blurValDisplay.textContent = '0 px (Original)';
      } else {
        blurValDisplay.textContent = `${val} px`;
      }
    });
  }

  loadSettings();

  // Register Service Worker for PWA / Offline Support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker Registered:', reg.scope))
      .catch(err => console.warn('Service Worker Registration Failed:', err));
  }

  // Helper: Draw Vector Shapes on Canvas Context Path with Position & Rotation Transform
  function drawCustomShapePath(ctx, shape, cx, cy, size, angleRad = 0) {
    ctx.save();
    ctx.translate(cx, cy);
    if (angleRad !== 0) {
      ctx.rotate(angleRad);
    }
    ctx.beginPath();
    const r = size / 2;

    switch (shape) {
      case 'circle':
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        break;

      case 'square':
        ctx.rect(-r, -r, size, size);
        break;

      case 'diamond':
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        break;

      case 'heart':
        // Smooth parametric vector heart path relative to (0,0)
        ctx.moveTo(0, r * 0.3);
        ctx.bezierCurveTo(-r * 0.5, -r * 0.4, -r, -r * 0.1, -r, r * 0.35);
        ctx.bezierCurveTo(-r, r * 0.7, -r * 0.4, r * 0.95, 0, r);
        ctx.bezierCurveTo(r * 0.4, r * 0.95, r, r * 0.7, r, r * 0.35);
        ctx.bezierCurveTo(r, -r * 0.1, r * 0.5, -r * 0.4, 0, r * 0.3);
        ctx.closePath();
        break;

      case 'star':
      default:
        // Standard 5-Pointed Vector Star
        const outerR = r;
        const innerR = r * 0.4;
        const points = 5;
        for (let i = 0; i < points * 2; i++) {
          const currR = i % 2 === 0 ? outerR : innerR;
          const currAngle = (i * Math.PI) / points - Math.PI / 2;
          const x = Math.cos(currAngle) * currR;
          const y = Math.sin(currAngle) * currR;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
    }
    ctx.fill();
    ctx.restore();
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
    // 1. Check API support
    if (!navigator.clipboard || !navigator.clipboard.read) {
      updateStatus('error', 'Your browser does not support Clipboard reading API. Please use Chrome or Edge over HTTPS.', '❌');
      showToast('❌ Clipboard API not supported');
      return;
    }

    // Update UI state to loading
    processBtn.classList.add('loading');
    btnText.textContent = 'PROCESSING...';
    processBtn.disabled = true;
    updateStatus('loading', 'Connecting to clipboard and reading data...', '⏳');

    try {
      // 2. Read items from Clipboard
      const clipboardItems = await navigator.clipboard.read();
      let imageBlob = null;
      let imageType = null;
      let textContent = null;

      for (const item of clipboardItems) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) {
          imageBlob = await item.getType(type);
          imageType = type;
          break;
        }
        if (item.types.includes('text/plain')) {
          const textBlob = await item.getType('text/plain');
          textContent = await textBlob.text();
        }
      }

      // Smart Fallback: If no direct image blob, check if text content is an image URL or Base64 data
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

      updateStatus('loading', 'Image found! Processing canvas inversion...', '🔄');

      // 3. Load image blob into HTML Image element
      const originalUrl = URL.createObjectURL(imageBlob);
      originalImg.src = originalUrl;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image data'));
        img.src = originalUrl;
      });

      cachedLoadedImage = img; // Store in cache for realtime preview on slider drag
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

  // Realtime Canvas Render Engine
  async function renderImageToCanvas(img, writeToClipboard = false) {
    if (!img) return;

    try {
      // 4. Draw to Canvas & Process Image based on Selected Mode
      const ctx = processCanvas.getContext('2d');
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      processCanvas.width = width;
      processCanvas.height = height;

      if (currentMode === 'caro') {
        // --- CHẾ ĐỘ ĐAN Ô CARO (CHECKERBOARD INVERSION & BLUR) ---
        const gridCols = caroColsSlider ? (parseInt(caroColsSlider.value, 10) || 8) : 8;
        const gridRows = caroRowsSlider ? (parseInt(caroRowsSlider.value, 10) || 8) : 8;
        const caroBlurPx = caroBlurSlider ? (parseInt(caroBlurSlider.value, 10) || 0) : 0;
        const shouldInvertCaro = caroInvertToggle ? caroInvertToggle.checked : true;

        if (!shouldInvertCaro && caroBlurPx === 0) {
          showToast('💡 Auto-enabled Grid Color Invert switch');
          if (caroInvertToggle) caroInvertToggle.checked = true;
        }
        const activeInvertCaro = caroInvertToggle ? caroInvertToggle.checked : true;

        // 1. Capture 100% sharp original image pixels
        const offCanvasOrig = document.createElement('canvas');
        offCanvasOrig.width = width;
        offCanvasOrig.height = height;
        const offCtxOrig = offCanvasOrig.getContext('2d');
        offCtxOrig.drawImage(img, 0, 0, width, height);
        const origPixels = offCtxOrig.getImageData(0, 0, width, height).data;

        // 2. Render blurred image if caroBlurPx > 0 (No text protection)
        let blurPixels = origPixels;
        if (caroBlurPx > 0) {
          const offCanvasBlur = document.createElement('canvas');
          offCanvasBlur.width = width;
          offCanvasBlur.height = height;
          const offCtxBlur = offCanvasBlur.getContext('2d');
          offCtxBlur.filter = `blur(${caroBlurPx}px)`;
          offCtxBlur.drawImage(img, 0, 0, width, height);
          blurPixels = offCtxBlur.getImageData(0, 0, width, height).data;
        }

        // 3. Composite output image: Original tiles 100% untouched, Alternating tiles (Blurred & Optional Color Invert)
        const outputImageData = ctx.createImageData(width, height);
        const outData = outputImageData.data;

        const tileW = width / gridCols;
        const tileH = height / gridRows;

        for (let y = 0; y < height; y++) {
          const row = Math.floor(y / tileH);
          for (let x = 0; x < width; x++) {
            const col = Math.floor(x / tileW);
            const index = (y * width + x) * 4;

            // If 1x1 grid (gridCols === 1 && gridRows === 1), single tile is treated as Modified Tile
            // Otherwise, alternating tiles (row + col) % 2 === 0 are Original Tiles
            const isOriginal = (gridCols === 1 && gridRows === 1) ? false : ((row + col) % 2 === 0);

            if (isOriginal) {
              // ORIGINAL TILE: 100% sharp original image untouched
              outData[index]     = origPixels[index];
              outData[index + 1] = origPixels[index + 1];
              outData[index + 2] = origPixels[index + 2];
              outData[index + 3] = origPixels[index + 3];
            } else {
              // ALTERNATING TILE: Apply Color Inversion (if enabled) + Optional Blur
              if (activeInvertCaro) {
                outData[index]     = 255 - blurPixels[index];
                outData[index + 1] = 255 - blurPixels[index + 1];
                outData[index + 2] = 255 - blurPixels[index + 2];
              } else {
                outData[index]     = blurPixels[index];
                outData[index + 1] = blurPixels[index + 1];
                outData[index + 2] = blurPixels[index + 2];
              }
              outData[index + 3] = blurPixels[index + 3];
            }
          }
        }

        ctx.putImageData(outputImageData, 0, 0);

      } else if (currentMode === 'shapes') {
        // --- CHẾ ĐỘ HÌNH KHỐI RẢI RÁC (MULTI-PASS XOR OVERLAP & END-STAGE BLUR) ---
        const sizeMin = sizeMinSlider ? (parseInt(sizeMinSlider.value, 10) || 20) : 20;
        const sizeMax = sizeMaxSlider ? (parseInt(sizeMaxSlider.value, 10) || 80) : 80;
        const rotMin = rotMinSlider ? (parseInt(rotMinSlider.value, 10) || 0) : 0;
        const rotMax = rotMaxSlider ? (parseInt(rotMaxSlider.value, 10) || 180) : 180;
        const shapeCount = shapeCountSlider ? (parseInt(shapeCountSlider.value, 10) || 30) : 30;
        const shapePasses = shapePassesSlider ? (parseInt(shapePassesSlider.value, 10) || 1) : 1;
        const shapeBlurPx = shapeBlurSlider ? (parseInt(shapeBlurSlider.value, 10) || 0) : 0;
        const shouldInvertShape = shapeInvertToggle ? shapeInvertToggle.checked : true;

        // 1. Create transparent offscreen canvas for shape mask composition
        const offCanvasMask = document.createElement('canvas');
        offCanvasMask.width = width;
        offCanvasMask.height = height;
        const maskCtx = offCanvasMask.getContext('2d');

        // IMPORTANT: Clear mask canvas to 100% transparent Alpha=0
        maskCtx.clearRect(0, 0, width, height);

        // Native Canvas XOR Compositing: Overlapping shapes toggle Alpha between 255 and 0
        maskCtx.globalCompositeOperation = 'xor';
        maskCtx.fillStyle = '#ffffff';

        // Organic 2D Continuous Random Scattering Pipeline
        for (let pass = 0; pass < shapePasses; pass++) {
          for (let i = 0; i < shapeCount; i++) {
            const sizeRange = Math.max(0, sizeMax - sizeMin);
            const size = sizeMin + Math.random() * sizeRange;

            const rotRange = Math.max(0, rotMax - rotMin);
            const angleDeg = rotMin + Math.random() * rotRange;
            const angleRad = (angleDeg * Math.PI) / 180;

            const cx = Math.random() * width;
            const cy = Math.random() * height;

            drawCustomShapePath(maskCtx, selectedShape, cx, cy, size, angleRad);
          }
        }

        const maskImageData = maskCtx.getImageData(0, 0, width, height);
        const maskPixels = maskImageData.data;

        // 2. Render 100% sharp original image
        const offCanvasOrig = document.createElement('canvas');
        offCanvasOrig.width = width;
        offCanvasOrig.height = height;
        const offCtxOrig = offCanvasOrig.getContext('2d');
        offCtxOrig.drawImage(img, 0, 0, width, height);
        const origPixels = offCtxOrig.getImageData(0, 0, width, height).data;

        // 3. Composite intermediate canvas: Sharp Original vs Inverted inside shapes
        const intermediateCanvas = document.createElement('canvas');
        intermediateCanvas.width = width;
        intermediateCanvas.height = height;
        const interCtx = intermediateCanvas.getContext('2d');
        const interImageData = interCtx.createImageData(width, height);
        const interPixels = interImageData.data;

        for (let i = 0; i < maskPixels.length; i += 4) {
          const isModArea = maskPixels[i + 3] > 128; // Alpha channel > 128 indicates shape area

          if (isModArea) {
            if (shouldInvertShape) {
              interPixels[i]     = 255 - origPixels[i];
              interPixels[i + 1] = 255 - origPixels[i + 1];
              interPixels[i + 2] = 255 - origPixels[i + 2];
            } else {
              interPixels[i]     = origPixels[i];
              interPixels[i + 1] = origPixels[i + 1];
              interPixels[i + 2] = origPixels[i + 2];
            }
            interPixels[i + 3] = origPixels[i + 3];
          } else {
            interPixels[i]     = origPixels[i];
            interPixels[i + 1] = origPixels[i + 1];
            interPixels[i + 2] = origPixels[i + 2];
            interPixels[i + 3] = origPixels[i + 3];
          }
        }
        interCtx.putImageData(interImageData, 0, 0);

        // 4. Apply Single End-Stage Blur ONLY if shapeBlurPx > 0
        if (shapeBlurPx > 0) {
          const blurredModCanvas = document.createElement('canvas');
          blurredModCanvas.width = width;
          blurredModCanvas.height = height;
          const blurCtx = blurredModCanvas.getContext('2d');
          blurCtx.filter = `blur(${shapeBlurPx}px)`;
          blurCtx.drawImage(intermediateCanvas, 0, 0, width, height);
          const blurPixels = blurCtx.getImageData(0, 0, width, height).data;

          const finalImageData = ctx.createImageData(width, height);
          const finalPixels = finalImageData.data;

          for (let i = 0; i < maskPixels.length; i += 4) {
            const isModArea = maskPixels[i + 3] > 128;

            if (isModArea) {
              finalPixels[i]     = blurPixels[i];
              finalPixels[i + 1] = blurPixels[i + 1];
              finalPixels[i + 2] = blurPixels[i + 2];
              finalPixels[i + 3] = blurPixels[i + 3];
            } else {
              finalPixels[i]     = origPixels[i];
              finalPixels[i + 1] = origPixels[i + 1];
              finalPixels[i + 2] = origPixels[i + 2];
              finalPixels[i + 3] = origPixels[i + 3];
            }
          }
          ctx.putImageData(finalImageData, 0, 0);
        } else {
          ctx.drawImage(intermediateCanvas, 0, 0, width, height);
        }

      } else {
        // --- CHẾ ĐỘ GLOBAL BLUR & COLOR INVERSION (MANGA TEXT PROTECTION) ---
        const blurPx = blurSlider ? (parseInt(blurSlider.value, 10) || 0) : 0;
        const shouldInvertColor = invertColorToggle ? invertColorToggle.checked : true;
        const isPreserveText = preserveTextToggle ? preserveTextToggle.checked : true;

        let origData = null;
        if (isPreserveText && blurPx > 0) {
          const offCanvasOrig = document.createElement('canvas');
          offCanvasOrig.width = width;
          offCanvasOrig.height = height;
          const offCtxOrig = offCanvasOrig.getContext('2d');
          offCtxOrig.drawImage(img, 0, 0, width, height);
          origData = offCtxOrig.getImageData(0, 0, width, height).data;
        }

        ctx.clearRect(0, 0, width, height);
        if (blurPx > 0) {
          ctx.filter = `blur(${blurPx}px)`;
        } else {
          ctx.filter = 'none';
        }
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = 'none';

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          let rFinal = data[i];
          let gFinal = data[i + 1];
          let bFinal = data[i + 2];

          if (origData && blurPx > 0) {
            const rO = origData[i];
            const gO = origData[i + 1];
            const bO = origData[i + 2];

            const lumO = 0.299 * rO + 0.587 * gO + 0.114 * bO;
            const diff = Math.abs(rO - rFinal) + Math.abs(gO - gFinal) + Math.abs(bO - bFinal);

            let textWeight = 0;
            if (diff > 30) {
              textWeight = Math.min(1.0, (diff - 30) / 60);
            }
            if (lumO < 130) {
              textWeight = Math.max(textWeight, (130 - lumO) / 130);
            }

            rFinal = rO * textWeight + rFinal * (1 - textWeight);
            gFinal = gO * textWeight + gFinal * (1 - textWeight);
            bFinal = bO * textWeight + bFinal * (1 - textWeight);
          }

          if (shouldInvertColor) {
            data[i]     = 255 - rFinal;
            data[i + 1] = 255 - gFinal;
            data[i + 2] = 255 - bFinal;
          } else {
            data[i]     = rFinal;
            data[i + 1] = gFinal;
            data[i + 2] = bFinal;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // 5. Convert Canvas back to PNG Blob
      const invertedBlob = await new Promise(resolve => {
        processCanvas.toBlob(resolve, 'image/png');
      });

      currentInvertedBlob = invertedBlob;
      const invertedUrl = URL.createObjectURL(invertedBlob);
      invertedImg.src = invertedUrl;
      previewPanel.classList.remove('hidden');

      if (writeToClipboard) {
        // 6. Write inverted image back to system Clipboard
        const clipboardItem = new ClipboardItem({ 'image/png': invertedBlob });
        await navigator.clipboard.write([clipboardItem]);

        // 7. Update UI on Success
        updateStatus('success', 'COLOR INVERSION SUCCESS! New image saved to your Clipboard.', '✅');
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
    a.download = `inverted-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('💾 Processed PNG image downloaded');
  });
}

// Ensure App Initialization runs immediately even if DOMContentLoaded already fired (PWA Cache Fix)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
