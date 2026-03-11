'use strict';

class MemeGenerator {
  constructor() {
    this.canvas = document.getElementById('meme-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this.image  = null;

    // Two draggable text objects
    this.texts = [
      { id: 'top',    content: '', x: 310, y: 50,  color: '#ffffff', size: 40, font: 'Impact' },
      { id: 'bottom', content: '', x: 310, y: 460, color: '#ffffff', size: 40, font: 'Impact' },
    ];

    this.activeText  = null;
    this.dragOffset  = { x: 0, y: 0 };

    this._bindEvents();
    this._draw();
  }

  // ─── Event Binding ──────────────────────────────────────

  _bindEvents() {
    document.getElementById('image-upload')
      .addEventListener('change', e => this._loadImage(e));

    document.getElementById('top-text')
      .addEventListener('input', e => { this.texts[0].content = e.target.value; this._draw(); });

    document.getElementById('bottom-text')
      .addEventListener('input', e => { this.texts[1].content = e.target.value; this._draw(); });

    document.getElementById('text-color').addEventListener('input', e => {
      this.texts.forEach(t => (t.color = e.target.value));
      this._draw();
    });

    document.getElementById('text-size').addEventListener('input', e => {
      const size = Math.min(150, Math.max(10, parseInt(e.target.value, 10) || 40));
      this.texts.forEach(t => (t.size = size));
      this._draw();
    });

    document.getElementById('font-family').addEventListener('change', e => {
      this.texts.forEach(t => (t.font = e.target.value));
      this._draw();
    });

    document.getElementById('save-btn')
      .addEventListener('click', () => this._save());

    document.getElementById('share-twitter')
      .addEventListener('click', () => this._share('twitter'));

    document.getElementById('share-reddit')
      .addEventListener('click', () => this._share('reddit'));

    // Mouse drag
    this.canvas.addEventListener('mousedown',  e => this._startDrag(this._getPos(e)));
    this.canvas.addEventListener('mousemove',  e => this._moveDrag(this._getPos(e)));
    this.canvas.addEventListener('mouseup',    () => this._endDrag());
    this.canvas.addEventListener('mouseleave', () => this._endDrag());

    // Touch drag
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this._startDrag(this._getPos(e.touches[0]));
    }, { passive: false });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      this._moveDrag(this._getPos(e.touches[0]));
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => this._endDrag());
  }

  // ─── Image Loading ───────────────────────────────────────

  _loadImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP, etc.).');
      event.target.value = '';
      return;
    }

    // Limit to 10 MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        this.image = img;

        // Scale down to fit within 700 × 600 while preserving aspect ratio
        const MAX_W = 700, MAX_H = 600;
        let w = img.width, h = img.height;
        if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
        if (h > MAX_H) { w = Math.round(w * MAX_H / h); h = MAX_H; }

        this.canvas.width  = w;
        this.canvas.height = h;

        // Reset text positions to top / bottom of the new canvas size
        const sz = this.texts[0].size;
        this.texts[0].x = w / 2;  this.texts[0].y = sz + 10;
        this.texts[1].x = w / 2;  this.texts[1].y = h - 15;

        this._draw();
      };

      img.onerror = () => alert('Could not load the image. Please try a different file.');
      img.src = e.target.result;
    };

    reader.onerror = () => alert('Failed to read the file.');
    reader.readAsDataURL(file);
  }

  // ─── Drawing ─────────────────────────────────────────────

  _draw() {
    const { ctx, canvas, image } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      // Placeholder when no image is loaded
      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#4b5563';
      ctx.font = '22px Segoe UI, system-ui, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Upload an image to get started', canvas.width / 2, canvas.height / 2);
    }

    this.texts.forEach(t => {
      if (t.content.trim()) this._drawText(t);
    });
  }

  _drawText({ content, x, y, color, size, font }) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font         = `bold ${size}px "${font}", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin     = 'round';
    ctx.lineWidth    = Math.max(2, size / 9);

    // Black outline for readability on any background
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(content, x, y);

    // Coloured fill
    ctx.fillStyle = color;
    ctx.fillText(content, x, y);

    ctx.restore();
  }

  // ─── Drag Logic ──────────────────────────────────────────

  _getPos(event) {
    const rect   = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top)  * scaleY,
    };
  }

  /** Return the topmost text element under the given canvas position, or null. */
  _hitTest(pos) {
    const ctx = this.ctx;
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      if (!t.content.trim()) continue;

      ctx.font = `bold ${t.size}px "${t.font}", sans-serif`;
      const w = ctx.measureText(t.content).width;
      const h = t.size;

      if (
        pos.x >= t.x - w / 2 - 10 && pos.x <= t.x + w / 2 + 10 &&
        pos.y >= t.y - h - 5       && pos.y <= t.y + 10
      ) {
        return t;
      }
    }
    return null;
  }

  _startDrag(pos) {
    const hit = this._hitTest(pos);
    if (hit) {
      this.activeText        = hit;
      this.dragOffset.x      = pos.x - hit.x;
      this.dragOffset.y      = pos.y - hit.y;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  _moveDrag(pos) {
    if (this.activeText) {
      this.activeText.x = pos.x - this.dragOffset.x;
      this.activeText.y = pos.y - this.dragOffset.y;
      this._draw();
    } else {
      this.canvas.style.cursor = this._hitTest(pos) ? 'grab' : 'default';
    }
  }

  _endDrag() {
    this.activeText          = null;
    this.canvas.style.cursor = 'default';
  }

  // ─── Save / Share ────────────────────────────────────────

  _save() {
    if (!this.image) {
      alert('Please upload an image first!');
      return;
    }
    const link      = document.createElement('a');
    link.download   = 'meme.png';
    link.href       = this.canvas.toDataURL('image/png');
    link.click();
  }

  _share(platform) {
    const text = encodeURIComponent('Check out this meme! #MemeGenerator');
    const urls  = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      reddit:  `https://www.reddit.com/submit?title=${text}`,
    };
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new MemeGenerator());
