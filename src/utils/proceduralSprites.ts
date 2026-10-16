/**
 * Procedural Pixel-Art Sprite and Sprite-Sheet Generator
 * Creates authentic 64x64 pixel sprites & 4x4 direction sprite sheets using HTML5 Canvas.
 */

export function generateBuildingSprite(
  type: string,
  footprint: '1x1' | '2x2' | '3x3',
  primaryColor: string
): string {
  const size = footprint === '3x3' ? 192 : footprint === '2x2' ? 128 : 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  // Clear transparent
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size * 0.75;
  const radius = size * 0.42;

  // Draw isometric base foundation
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Building Structure based on type
  if (type.toLowerCase().includes('campfire')) {
    // Campfire logs & flames
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 18, cy - 8, 36, 10);
    ctx.fillRect(cx - 12, cy - 14, 24, 8);
    // Fire glow
    const gradient = ctx.createRadialGradient(cx, cy - 16, 2, cx, cy - 16, 26);
    gradient.addColorStop(0, '#fef08a');
    gradient.addColorStop(0.4, '#f97316');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy - 16, 24, 0, Math.PI * 2);
    ctx.fill();

    // Embers
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 4, cy - 24, 6, 8);
    ctx.fillRect(cx + 6, cy - 18, 4, 6);
    ctx.fillRect(cx - 10, cy - 18, 5, 5);
  } else if (type.toLowerCase().includes('lumber') || type.toLowerCase().includes('cabin')) {
    // Cabin body
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.45, size * 0.6, size * 0.4);
    // Log stripes
    ctx.fillStyle = '#713f12';
    for (let y = cy - size * 0.45; y < cy - size * 0.05; y += size * 0.08) {
      ctx.fillRect(cx - size * 0.3, y, size * 0.6, 2);
    }
    // Wooden door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - size * 0.08, cy - size * 0.22, size * 0.16, size * 0.22);
    // Roof (A-frame peak)
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.68);
    ctx.lineTo(cx - size * 0.38, cy - size * 0.42);
    ctx.lineTo(cx + size * 0.38, cy - size * 0.42);
    ctx.closePath();
    ctx.fill();
    // Chimney & smoke
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx + size * 0.18, cy - size * 0.62, size * 0.08, size * 0.18);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.beginPath();
    ctx.arc(cx + size * 0.22, cy - size * 0.68, 4, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.26, cy - size * 0.76, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type.toLowerCase().includes('tavern') || type.toLowerCase().includes('guild')) {
    // Stone foundation
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.25, size * 0.7, size * 0.25);
    // Upper timber floor
    ctx.fillStyle = '#a16207';
    ctx.fillRect(cx - size * 0.38, cy - size * 0.52, size * 0.76, size * 0.28);
    // Timber beams
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - size * 0.38, cy - size * 0.52, size * 0.04, size * 0.28);
    ctx.fillRect(cx + size * 0.34, cy - size * 0.52, size * 0.04, size * 0.28);
    ctx.fillRect(cx - size * 0.02, cy - size * 0.52, size * 0.04, size * 0.28);
    // Warm glowing tavern windows
    ctx.fillStyle = '#fde047';
    ctx.fillRect(cx - size * 0.24, cy - size * 0.45, size * 0.12, size * 0.12);
    ctx.fillRect(cx + size * 0.12, cy - size * 0.45, size * 0.12, size * 0.12);
    // Tavern sign
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cx - size * 0.32, cy - size * 0.2, size * 0.1, size * 0.08);
    // Blue/Slate tile roof
    ctx.fillStyle = '#1e3a5f';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.72);
    ctx.lineTo(cx - size * 0.42, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.42, cy - size * 0.5);
    ctx.closePath();
    ctx.fill();
  } else {
    // Generic high-fantasy building
    ctx.fillStyle = primaryColor || '#3b82f6';
    ctx.fillRect(cx - size * 0.32, cy - size * 0.45, size * 0.64, size * 0.4);
    // Roof
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.68);
    ctx.lineTo(cx - size * 0.36, cy - size * 0.42);
    ctx.lineTo(cx + size * 0.36, cy - size * 0.42);
    ctx.closePath();
    ctx.fill();
    // Accent door
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - size * 0.08, cy - size * 0.2, size * 0.16, size * 0.2);
  }

  // Draw arcade highlight rim
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/**
 * Generates a 4x4 Sprite Sheet (4 directions x 4 animation frames)
 * Directions: Row 0 = South (Down), Row 1 = West (Left), Row 2 = East (Right), Row 3 = North (Up)
 * Frames: 0 = Idle, 1 = Step Left, 2 = Passing, 3 = Step Right
 */
export function generateResidentSpriteSheet(
  name: string,
  role: string,
  accentColor: string
): string {
  const cellWidth = 64;
  const cellHeight = 64;
  const cols = 4;
  const rows = 4;

  const canvas = document.createElement('canvas');
  canvas.width = cols * cellWidth;
  canvas.height = rows * cellHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const skinColor = '#fed7aa';
  const hairColor = name.toLowerCase().includes('elara') ? '#d97706' : name.toLowerCase().includes('bork') ? '#475569' : '#78350f';
  const shirtColor = accentColor || (role.toLowerCase().includes('wood') ? '#15803d' : role.toLowerCase().includes('mason') ? '#b45309' : '#2563eb');
  const pantsColor = '#1e293b';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = c * cellWidth;
      const oy = r * cellHeight;
      const cx = ox + cellWidth / 2;
      const cy = oy + cellHeight * 0.65;

      // Small bounce delta based on frame
      const bounceY = (c === 1 || c === 3) ? -3 : 0;
      const legOffset = (c === 1) ? -4 : (c === 3) ? 4 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs / Boots
      ctx.fillStyle = pantsColor;
      if (r === 0 || r === 3) {
        // South or North
        ctx.fillRect(cx - 6 + legOffset * 0.5, cy + 4 + bounceY, 4, 8);
        ctx.fillRect(cx + 2 - legOffset * 0.5, cy + 4 + bounceY, 4, 8);
      } else {
        // West or East
        ctx.fillRect(cx - 3 + legOffset, cy + 4 + bounceY, 6, 8);
      }

      // Torso / Shirt
      ctx.fillStyle = shirtColor;
      ctx.fillRect(cx - 8, cy - 8 + bounceY, 16, 12);

      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(cx - 6, cy - 20 + bounceY, 12, 11);

      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(cx - 7, cy - 23 + bounceY, 14, 5);
      if (r === 3) {
        // North view - back of hair covers face
        ctx.fillRect(cx - 6, cy - 19 + bounceY, 12, 8);
      }

      // Face details for South, West, East
      if (r === 0) {
        // South (Down) - Two eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 4, cy - 16 + bounceY, 2, 3);
        ctx.fillRect(cx + 2, cy - 16 + bounceY, 2, 3);
      } else if (r === 1) {
        // West (Left) - One eye
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 5, cy - 16 + bounceY, 2, 3);
      } else if (r === 2) {
        // East (Right) - One eye
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx + 3, cy - 16 + bounceY, 2, 3);
      }

      // Hands / Tools
      if (role.toLowerCase().includes('wood') || role.toLowerCase().includes('lumber')) {
        // Axe in hand
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx + 7, cy - 12 + bounceY, 2, 14);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx + 5, cy - 14 + bounceY, 6, 4);
      } else if (role.toLowerCase().includes('mason')) {
        // Hammer / Chisel
        ctx.fillStyle = '#713f12';
        ctx.fillRect(cx + 7, cy - 8 + bounceY, 3, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx + 5, cy - 10 + bounceY, 7, 4);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
