/* ============================================================
   Teorema de la modulación — visualizaciones interactivas
   Canvas + SVG nativo, sin dependencias externas.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     1. Ondas decorativas de la portada
     ------------------------------------------------------------ */
  function sinePath(width, amp, period, phase, center) {
    var d = 'M 0 ' + (center + amp * Math.sin(phase)).toFixed(1);
    for (var x = 0; x <= width; x += 4) {
      var y = center + amp * Math.sin((2 * Math.PI * x) / period + phase);
      d += ' L ' + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  }

  function setupCoverWaves() {
    var waves = [
      { id: 'wave1', amp: 68, period: 240, phase: 0, drift: '-240px' },
      { id: 'wave2', amp: 44, period: 120, phase: 1.1, drift: '-120px' },
      { id: 'wave3', amp: 28, period: 80, phase: 2.3, drift: '-80px' }
    ];

    waves.forEach(function (w) {
      var el = document.getElementById(w.id);
      if (!el) return;
      el.setAttribute('d', sinePath(1640, w.amp, w.period, w.phase, 120));
      el.style.setProperty('--drift', w.drift);
    });
  }

  /* ------------------------------------------------------------
     2. Espectro interactivo (slide 7)
     ------------------------------------------------------------ */
  var spectrum = {
    canvas: null,
    ctx: null,
    fcRange: null,
    fcValue: null,
    badge: null,
    showBase: null,
    B: 4,          // ancho de banda de la señal mensaje (kHz)
    fMax: 24       // límite del eje de frecuencias (kHz)
  };

  function spectrumX(f, W, L, R) {
    return L + ((f + spectrum.fMax) / (2 * spectrum.fMax)) * (W - L - R);
  }

  function drawSpectrum() {
    var c = spectrum.canvas;
    if (!c || !spectrum.ctx) return;

    var ctx = spectrum.ctx;
    var W = c.width;
    var H = c.height;
    var L = 52, R = 34, T = 30, Bm = 52;
    var base = H - Bm;
    var ampPx = 158;

    ctx.clearRect(0, 0, W, H);

    // Rejilla vertical
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
    ctx.lineWidth = 1;
    for (var f = -24; f <= 24; f += 4) {
      var gx = spectrumX(f, W, L, R);
      ctx.beginPath();
      ctx.moveTo(gx, T);
      ctx.lineTo(gx, base);
      ctx.stroke();
    }
    ctx.restore();

    // Eje horizontal
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(L - 6, base);
    ctx.lineTo(W - R + 8, base);
    ctx.stroke();

    // Eje vertical
    ctx.beginPath();
    ctx.moveTo(spectrumX(0, W, L, R), base);
    ctx.lineTo(spectrumX(0, W, L, R), T - 6);
    ctx.stroke();

    // Puntas de flecha
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.beginPath();
    ctx.moveTo(W - R + 8, base);
    ctx.lineTo(W - R - 2, base - 4);
    ctx.lineTo(W - R - 2, base + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(spectrumX(0, W, L, R), T - 8);
    ctx.lineTo(spectrumX(0, W, L, R) - 4, T + 2);
    ctx.lineTo(spectrumX(0, W, L, R) + 4, T + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Etiquetas del eje
    ctx.save();
    ctx.fillStyle = 'rgba(147, 164, 189, 0.85)';
    ctx.font = '13px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    [-20, -10, 0, 10, 20].forEach(function (tick) {
      ctx.fillText(String(tick), spectrumX(tick, W, L, R), base + 10);
    });
    ctx.textAlign = 'right';
    ctx.fillText('f (kHz)', W - R, base + 30);
    ctx.textAlign = 'left';
    ctx.fillText('|X(f)|', spectrumX(0, W, L, R) + 8, T - 2);
    ctx.restore();

    var fc = parseFloat(spectrum.fcRange.value);

    // Banda base original (referencia opcional)
    if (spectrum.showBase.checked) {
      var bx = spectrumX(0, W, L, R);
      var bw = (spectrum.B / (2 * spectrum.fMax)) * (W - L - R);
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.06)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx - bw, base);
      ctx.lineTo(bx, base - ampPx);
      ctx.lineTo(bx + bw, base);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(110, 231, 183, 0.9)';
      ctx.font = '12px "Cascadia Code", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('X(f) original', bx, base - ampPx - 18);
      ctx.restore();
    }

    // Réplicas desplazadas: 1/2 [X(f - fc) + X(f + fc)]
    var half = ampPx / 2;
    var bw2 = (spectrum.B / (2 * spectrum.fMax)) * (W - L - R);

    function drawCopy(centerF, color, fill, label, labelColor) {
      var cx = spectrumX(centerF, W, L, R);
      var left = spectrumX(centerF - spectrum.B, W, L, R);
      var right = spectrumX(centerF + spectrum.B, W, L, R);

      var grad = ctx.createLinearGradient(0, base - half, 0, base);
      grad.addColorStop(0, fill);
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.02)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(left, base);
      ctx.lineTo(cx, base - half);
      ctx.lineTo(right, base);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Marca de media amplitud
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, base - half);
      ctx.lineTo(right, base - half);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = labelColor;
      ctx.font = '13px "Cascadia Code", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      if (cx - left > 70) {
        ctx.fillText(label, cx, base - half - 12);
      }

      ctx.restore();
      return { cx: cx, left: left, right: right };
    }

    drawCopy(-fc, 'rgba(34, 211, 238, 0.85)', 'rgba(34, 211, 238, 0.22)', '½X(f + f₀)', 'rgba(165, 243, 252, 1)');
    drawCopy(fc, 'rgba(167, 139, 250, 0.9)', 'rgba(167, 139, 250, 0.22)', '½X(f − f₀)', 'rgba(221, 214, 254, 1)');

    // Marcadores de frecuencia de la portadora (debajo de los ticks numéricos)
    ctx.save();
    ctx.font = '13px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(103, 232, 249, 0.95)';
    ctx.fillText('−f₀', spectrumX(-fc, W, L, R), base + 28);
    ctx.fillStyle = 'rgba(196, 181, 253, 0.95)';
    ctx.fillText('+f₀', spectrumX(fc, W, L, R), base + 28);
    ctx.restore();

    // Indicador de separación / solapamiento
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    var y0 = base - half - 40;
    ctx.beginPath();
    ctx.moveTo(spectrumX(-fc, W, L, R), y0);
    ctx.lineTo(spectrumX(fc, W, L, R), y0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(147, 164, 189, 0.75)';
    ctx.font = '12px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('2f₀', spectrumX(0, W, L, R), y0 - 8);
    ctx.restore();

    // Actualizar lectura y badge
    spectrum.fcValue.textContent = 'f₀ = ' + fc.toFixed(1) + ' kHz';
    var badge = spectrum.badge;
    badge.classList.remove('bad');
    if (fc < spectrum.B) {
      badge.textContent = 'Solapamiento';
      badge.classList.add('bad');
    } else if (fc < 2 * spectrum.B) {
      badge.textContent = 'Réplicas contiguas';
      badge.classList.remove('bad');
    } else {
      badge.textContent = 'Réplicas separadas';
    }
  }

  function setupSpectrum() {
    var c = document.getElementById('spectrumCanvas');
    if (!c) return;
    spectrum.canvas = c;
    spectrum.ctx = c.getContext('2d');
    spectrum.fcRange = document.getElementById('fcRange');
    spectrum.fcValue = document.getElementById('fcValue');
    spectrum.badge = document.getElementById('overlapBadge');
    spectrum.showBase = document.getElementById('showBase');

    spectrum.fcRange.addEventListener('input', drawSpectrum);
    spectrum.showBase.addEventListener('change', drawSpectrum);
    drawSpectrum();
  }

  /* ------------------------------------------------------------
     3. Señal AM interactiva (slide 9)
     ------------------------------------------------------------ */
  var am = {
    canvas: null,
    ctx: null,
    muRange: null,
    fmRange: null,
    muValue: null,
    fmValue: null,
    warning: null
  };

  function drawAM() {
    var c = am.canvas;
    if (!c || !am.ctx) return;

    var ctx = am.ctx;
    var W = c.width;
    var H = c.height;
    var L = 46, R = 22, T = 28, Bm = 42;
    var plotW = W - L - R;
    var base = (T + (H - Bm)) / 2;
    var tMax = 2;                       // milisegundos mostrados
    var mu = parseFloat(am.muRange.value);
    var fm = parseFloat(am.fmRange.value);   // kHz
    var fc = 20;                        // kHz (escala visual)
    var ampPx = 108;
    var scale = ampPx / (1 + Math.max(mu, 0));

    ctx.clearRect(0, 0, W, H);

    // Rejilla temporal
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
    ctx.lineWidth = 1;
    for (var t = 0; t <= tMax; t += 0.5) {
      var gx = L + (t / tMax) * plotW;
      ctx.beginPath();
      ctx.moveTo(gx, T);
      ctx.lineTo(gx, H - Bm);
      ctx.stroke();
    }
    ctx.restore();

    // Eje horizontal
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(L - 4, H - Bm);
    ctx.lineTo(W - R + 4, H - Bm);
    ctx.stroke();
    ctx.fillStyle = 'rgba(147, 164, 189, 0.85)';
    ctx.font = '12px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var tt = 0; tt <= tMax + 0.001; tt += 0.5) {
      ctx.fillText(tt.toFixed(1), L + (tt / tMax) * plotW, H - Bm + 10);
    }
    ctx.textAlign = 'right';
    ctx.fillText('t (ms)', W - R, H - Bm + 26);
    ctx.restore();

    // Línea de cero
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(L, base);
    ctx.lineTo(W - R, base);
    ctx.stroke();
    ctx.restore();

    function xAt(i, steps) {
      return L + (i / steps) * plotW;
    }

    function tAt(i, steps) {
      return (i / steps) * tMax;
    }

    // Relleno de la envolvente
    var steps = Math.round(plotW);
    ctx.save();
    var grad = ctx.createLinearGradient(0, base - ampPx, 0, base + ampPx);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.10)');
    grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.03)');
    grad.addColorStop(1, 'rgba(34, 211, 238, 0.10)');
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var tm = tAt(i, steps);
      var env = 1 + mu * Math.cos(2 * Math.PI * fm * tm);
      var y = base - env * scale;
      if (i === 0) ctx.moveTo(xAt(i, steps), y);
      else ctx.lineTo(xAt(i, steps), y);
    }
    for (var j = steps; j >= 0; j--) {
      var tm2 = tAt(j, steps);
      var env2 = 1 + mu * Math.cos(2 * Math.PI * fm * tm2);
      ctx.lineTo(xAt(j, steps), base + env2 * scale);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Envolventes
    ctx.save();
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 5]);
    [1, -1].forEach(function (s) {
      ctx.beginPath();
      for (var k = 0; k <= steps; k++) {
        var tk = tAt(k, steps);
        var ek = 1 + mu * Math.cos(2 * Math.PI * fm * tk);
        var yk = base - s * ek * scale;
        if (k === 0) ctx.moveTo(xAt(k, steps), yk);
        else ctx.lineTo(xAt(k, steps), yk);
      }
      ctx.stroke();
    });
    ctx.restore();

    // Portadora de referencia
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var n = 0; n <= steps; n++) {
      var tn = tAt(n, steps);
      var yn = base - scale * Math.cos(2 * Math.PI * fc * tn);
      if (n === 0) ctx.moveTo(xAt(n, steps), yn);
      else ctx.lineTo(xAt(n, steps), yn);
    }
    ctx.stroke();
    ctx.restore();

    // Señal AM
    ctx.save();
    ctx.strokeStyle = mu > 1 ? 'rgba(251, 113, 133, 0.95)' : 'rgba(34, 211, 238, 0.98)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var m = 0; m <= steps; m++) {
      var tm3 = tAt(m, steps);
      var env3 = 1 + mu * Math.cos(2 * Math.PI * fm * tm3);
      var ym = base - env3 * Math.cos(2 * Math.PI * fc * tm3) * scale;
      if (m === 0) ctx.moveTo(xAt(m, steps), ym);
      else ctx.lineTo(xAt(m, steps), ym);
    }
    ctx.stroke();
    ctx.restore();

    // Etiquetas
    ctx.save();
    ctx.font = '12px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(221, 214, 254, 0.9)';
    ctx.fillText('envolvente', L + 4, T - 14);
    ctx.fillStyle = 'rgba(147, 164, 189, 0.8)';
    ctx.restore();

    // Lecturas y aviso
    am.muValue.textContent = 'μ = ' + mu.toFixed(2);
    am.fmValue.innerHTML = 'f<sub>m</sub> = ' + fm.toFixed(1) + ' kHz';
    am.warning.style.display = mu > 1 ? 'flex' : 'none';
  }

  function setupAM() {
    var c = document.getElementById('amCanvas');
    if (!c) return;
    am.canvas = c;
    am.ctx = c.getContext('2d');
    am.muRange = document.getElementById('muRange');
    am.fmRange = document.getElementById('fmRange');
    am.muValue = document.getElementById('muValue');
    am.fmValue = document.getElementById('fmValue');
    am.warning = document.getElementById('amWarning');

    am.muRange.addEventListener('input', drawAM);
    am.fmRange.addEventListener('input', drawAM);
    drawAM();
  }

  /* ------------------------------------------------------------
     4. Arranque
     ------------------------------------------------------------ */
  function init() {
    setupCoverWaves();
    setupSpectrum();
    setupAM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
