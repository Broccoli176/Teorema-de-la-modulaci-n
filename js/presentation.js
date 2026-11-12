/* ============================================================
   Teorema de la modulación — visualizaciones interactivas
   Canvas + SVG nativo, sin dependencias externas.
   Toda la notación usa frecuencia f en Hz.
   ============================================================ */

(function () {
  'use strict';

  var MONO = '"JetBrains Mono", "Cascadia Code", Consolas, monospace';
  var DPR = Math.min(window.devicePixelRatio || 1, 2) * 1.5; // reveal escala las diapositivas: sobremuestrear

  /* Prepara un canvas para alta resolución conservando sus
     dimensiones lógicas (atributos width/height originales). */
  function hiDPI(canvas) {
    var w = canvas.width;
    var h = canvas.height;
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx: ctx, W: w, H: h };
  }

  /* Evita que los sliders se queden con el foco y "roben" las
     flechas del teclado a reveal.js. */
  function releaseFocus(el) {
    ['change', 'pointerup', 'mouseup', 'touchend'].forEach(function (ev) {
      el.addEventListener(ev, function () { el.blur(); });
    });
  }

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
     2. Espectro interactivo
     ------------------------------------------------------------ */
  var spectrum = {
    canvas: null, ctx: null, W: 0, H: 0,
    fcRange: null, fcValue: null, badge: null, showBase: null, play: null,
    B: 4,          // ancho de banda de la señal mensaje (kHz)
    fMax: 24,      // límite del eje de frecuencias (kHz)
    raf: 0, t0: 0
  };

  function spectrumX(f, W, L, R) {
    return L + ((f + spectrum.fMax) / (2 * spectrum.fMax)) * (W - L - R);
  }

  function drawSpectrum() {
    if (!spectrum.ctx) return;

    var ctx = spectrum.ctx;
    var W = spectrum.W;
    var H = spectrum.H;
    var L = 52, R = 34, T = 30, Bm = 52;
    var base = H - Bm;
    var ampPx = 150;

    ctx.clearRect(0, 0, W, H);

    // Rejilla vertical
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
    ctx.lineWidth = 1;
    for (var f = -24; f <= 24; f += 2) {
      var gx = spectrumX(f, W, L, R);
      ctx.beginPath();
      ctx.moveTo(gx, T);
      ctx.lineTo(gx, base);
      ctx.stroke();
    }
    ctx.restore();

    // Ejes
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(L - 6, base);
    ctx.lineTo(W - R + 8, base);
    ctx.stroke();

    var x0 = spectrumX(0, W, L, R);
    ctx.beginPath();
    ctx.moveTo(x0, base);
    ctx.lineTo(x0, T - 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(W - R + 8, base);
    ctx.lineTo(W - R - 2, base - 4);
    ctx.lineTo(W - R - 2, base + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x0, T - 8);
    ctx.lineTo(x0 - 4, T + 2);
    ctx.lineTo(x0 + 4, T + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Etiquetas del eje
    ctx.save();
    ctx.fillStyle = 'rgba(147, 164, 189, 0.85)';
    ctx.font = '13px ' + MONO;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    [-20, -10, 0, 10, 20].forEach(function (tick) {
      ctx.fillText(String(tick), spectrumX(tick, W, L, R), base + 10);
    });
    ctx.textAlign = 'right';
    ctx.fillText('f (kHz)', W - R, base + 30);
    ctx.textAlign = 'left';
    ctx.fillText('|S(f)|', x0 + 8, T - 2);
    ctx.restore();

    var fc = parseFloat(spectrum.fcRange.value);
    var bw = (spectrum.B / (2 * spectrum.fMax)) * (W - L - R);

    // Banda base original (referencia opcional)
    if (spectrum.showBase.checked) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.07)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x0 - bw, base);
      ctx.lineTo(x0, base - ampPx);
      ctx.lineTo(x0 + bw, base);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(110, 231, 183, 0.95)';
      ctx.font = '12px ' + MONO;
      ctx.textAlign = 'center';
      ctx.fillText('X(f) original', x0, base - ampPx - 18);
      ctx.restore();
    }

    // Réplicas desplazadas: 1/2 [X(f - f0) + X(f + f0)]
    var half = ampPx / 2;

    function drawCopy(centerF, color, fill, label, labelColor) {
      var cx = spectrumX(centerF, W, L, R);
      var left = cx - bw;
      var right = cx + bw;

      var grad = ctx.createLinearGradient(0, base - half, 0, base);
      grad.addColorStop(0, fill);
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.02)');

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(left, base);
      ctx.lineTo(cx, base - half);
      ctx.lineTo(right, base);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

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
      ctx.font = '13px ' + MONO;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, cx, base - half - 12);
      ctx.restore();
    }

    drawCopy(-fc, 'rgba(34, 211, 238, 0.9)', 'rgba(34, 211, 238, 0.24)', '½X(f + f₀)', 'rgba(165, 243, 252, 1)');
    drawCopy(fc, 'rgba(167, 139, 250, 0.95)', 'rgba(167, 139, 250, 0.24)', '½X(f − f₀)', 'rgba(221, 214, 254, 1)');

    // Zona de solapamiento
    if (fc < spectrum.B) {
      var ovL = spectrumX(-(spectrum.B - fc), W, L, R);
      var ovR = spectrumX(spectrum.B - fc, W, L, R);
      ctx.save();
      ctx.fillStyle = 'rgba(251, 113, 133, 0.16)';
      ctx.fillRect(ovL, T, ovR - ovL, base - T);
      ctx.restore();
    }

    // Marcadores de la portadora
    ctx.save();
    ctx.font = '13px ' + MONO;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(103, 232, 249, 0.95)';
    ctx.fillText('−f₀', spectrumX(-fc, W, L, R), base + 28);
    ctx.fillStyle = 'rgba(196, 181, 253, 0.95)';
    ctx.fillText('+f₀', spectrumX(fc, W, L, R), base + 28);
    ctx.restore();

    // Indicador de separación 2f0
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
    ctx.fillStyle = 'rgba(147, 164, 189, 0.8)';
    ctx.font = '12px ' + MONO;
    ctx.textAlign = 'center';
    ctx.fillText('2f₀ = ' + (2 * fc).toFixed(1) + ' kHz', x0, y0 - 8);
    ctx.restore();

    // Lectura y badge
    spectrum.fcValue.textContent = 'f₀ = ' + fc.toFixed(1) + ' kHz';
    var badge = spectrum.badge;
    badge.classList.remove('bad', 'mid');
    if (fc < spectrum.B) {
      badge.textContent = 'Solapamiento';
      badge.classList.add('bad');
    } else if (fc < 2 * spectrum.B) {
      badge.textContent = 'Réplicas contiguas';
      badge.classList.add('mid');
    } else {
      badge.textContent = 'Réplicas separadas';
    }
  }

  function spectrumTick(now) {
    if (!spectrum.t0) spectrum.t0 = now;
    var s = (now - spectrum.t0) / 1000;
    // Barrido suave de 2 kHz a 20 kHz y vuelta (periodo 8 s)
    var v = 11 - 9 * Math.cos((2 * Math.PI * s) / 8);
    spectrum.fcRange.value = v.toFixed(1);
    drawSpectrum();
    spectrum.raf = requestAnimationFrame(spectrumTick);
  }

  function spectrumStop() {
    if (spectrum.raf) cancelAnimationFrame(spectrum.raf);
    spectrum.raf = 0;
    spectrum.t0 = 0;
    if (spectrum.play) {
      spectrum.play.textContent = '▶ Barrido';
      spectrum.play.classList.remove('on');
    }
  }

  function spectrumToggle() {
    if (spectrum.raf) { spectrumStop(); return; }
    spectrum.play.textContent = '❚❚ Pausa';
    spectrum.play.classList.add('on');
    spectrum.raf = requestAnimationFrame(spectrumTick);
  }

  function setupSpectrum() {
    var c = document.getElementById('spectrumCanvas');
    if (!c) return;
    var hd = hiDPI(c);
    spectrum.canvas = c;
    spectrum.ctx = hd.ctx;
    spectrum.W = hd.W;
    spectrum.H = hd.H;
    spectrum.fcRange = document.getElementById('fcRange');
    spectrum.fcValue = document.getElementById('fcValue');
    spectrum.badge = document.getElementById('overlapBadge');
    spectrum.showBase = document.getElementById('showBase');
    spectrum.play = document.getElementById('fcPlay');

    spectrum.fcRange.addEventListener('input', function () { spectrumStop(); drawSpectrum(); });
    spectrum.showBase.addEventListener('change', drawSpectrum);
    spectrum.play.addEventListener('click', function () { spectrumToggle(); spectrum.play.blur(); });
    releaseFocus(spectrum.fcRange);
    releaseFocus(spectrum.showBase);
    drawSpectrum();
  }

  /* ------------------------------------------------------------
     3. Señal AM interactiva
     ------------------------------------------------------------ */
  var am = {
    canvas: null, ctx: null, W: 0, H: 0,
    muRange: null, fmRange: null, muValue: null, fmValue: null,
    warning: null, play: null,
    phase: 0, raf: 0, last: 0
  };

  function drawAM() {
    if (!am.ctx) return;

    var ctx = am.ctx;
    var W = am.W;
    var H = am.H;
    var L = 46, R = 22, T = 28, Bm = 42;
    var plotW = W - L - R;
    var base = (T + (H - Bm)) / 2;
    var tMax = 2;                              // ms mostrados
    var mu = parseFloat(am.muRange.value);
    var fm = parseFloat(am.fmRange.value);     // kHz
    var fc = 20;                               // kHz (escala visual)
    var ampPx = 108;
    var scale = ampPx / (1 + Math.max(mu, 0));
    var off = am.phase;                        // desplazamiento temporal (ms)

    ctx.clearRect(0, 0, W, H);

    // Rejilla temporal
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
    ctx.lineWidth = 1;
    for (var t = 0; t <= tMax; t += 0.25) {
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
    ctx.font = '12px ' + MONO;
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

    var steps = Math.round(plotW * 1.5);
    function xAt(i) { return L + (i / steps) * plotW; }
    function tAt(i) { return (i / steps) * tMax + off; }
    function envAt(tm) { return 1 + mu * Math.cos(2 * Math.PI * fm * tm); }

    // Relleno de la envolvente
    ctx.save();
    var grad = ctx.createLinearGradient(0, base - ampPx, 0, base + ampPx);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.12)');
    grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.02)');
    grad.addColorStop(1, 'rgba(34, 211, 238, 0.12)');
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var y = base - envAt(tAt(i)) * scale;
      if (i === 0) ctx.moveTo(xAt(i), y); else ctx.lineTo(xAt(i), y);
    }
    for (var j = steps; j >= 0; j--) {
      ctx.lineTo(xAt(j), base + envAt(tAt(j)) * scale);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Envolventes
    ctx.save();
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    [1, -1].forEach(function (s) {
      ctx.beginPath();
      for (var k = 0; k <= steps; k++) {
        var yk = base - s * envAt(tAt(k)) * scale;
        if (k === 0) ctx.moveTo(xAt(k), yk); else ctx.lineTo(xAt(k), yk);
      }
      ctx.stroke();
    });
    ctx.restore();

    // Señal AM
    ctx.save();
    var col = mu > 1 ? 'rgba(251, 113, 133, 0.95)' : 'rgba(34, 211, 238, 0.98)';
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var m = 0; m <= steps; m++) {
      var tm = tAt(m);
      var ym = base - envAt(tm) * Math.cos(2 * Math.PI * fc * tm) * scale;
      if (m === 0) ctx.moveTo(xAt(m), ym); else ctx.lineTo(xAt(m), ym);
    }
    ctx.stroke();
    ctx.restore();

    // Leyenda
    ctx.save();
    ctx.font = '12px ' + MONO;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(221, 214, 254, 0.95)';
    ctx.fillText('— — envolvente  A_c[1 + μ m(t)]', L + 4, T - 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = mu > 1 ? 'rgba(253, 164, 175, 0.95)' : 'rgba(165, 243, 252, 0.95)';
    ctx.fillText('s_AM(t)', W - R, T - 18);
    ctx.restore();

    // Lecturas y aviso
    am.muValue.textContent = 'μ = ' + mu.toFixed(2);
    am.fmValue.innerHTML = 'f<sub>m</sub> = ' + fm.toFixed(1) + ' kHz';
    am.warning.style.display = mu > 1 ? 'flex' : 'none';
  }

  function amTick(now) {
    if (am.last) {
      var dt = Math.min(now - am.last, 50);
      am.phase += dt * 0.00045;   // 0.45 ms de señal por segundo real
    }
    am.last = now;
    drawAM();
    am.raf = requestAnimationFrame(amTick);
  }

  function amStop() {
    if (am.raf) cancelAnimationFrame(am.raf);
    am.raf = 0;
    am.last = 0;
    if (am.play) {
      am.play.textContent = '▶ Animar';
      am.play.classList.remove('on');
    }
  }

  function amToggle() {
    if (am.raf) { amStop(); return; }
    am.play.textContent = '❚❚ Pausa';
    am.play.classList.add('on');
    am.raf = requestAnimationFrame(amTick);
  }

  function setupAM() {
    var c = document.getElementById('amCanvas');
    if (!c) return;
    var hd = hiDPI(c);
    am.canvas = c;
    am.ctx = hd.ctx;
    am.W = hd.W;
    am.H = hd.H;
    am.muRange = document.getElementById('muRange');
    am.fmRange = document.getElementById('fmRange');
    am.muValue = document.getElementById('muValue');
    am.fmValue = document.getElementById('fmValue');
    am.warning = document.getElementById('amWarning');
    am.play = document.getElementById('amPlay');

    am.muRange.addEventListener('input', drawAM);
    am.fmRange.addEventListener('input', drawAM);
    am.play.addEventListener('click', function () { amToggle(); am.play.blur(); });
    releaseFocus(am.muRange);
    releaseFocus(am.fmRange);
    drawAM();
  }

  /* ------------------------------------------------------------
     4. Constelación 16-QAM: recorre los símbolos (código Gray)
     ------------------------------------------------------------ */
  var qam = { timer: 0, idx: 0, points: [], readout: null };
  var GRAY = ['00', '01', '11', '10'];

  function qamStep() {
    var pts = qam.points;
    if (!pts.length) return;
    pts.forEach(function (p) { p.classList.remove('active'); });
    // Orden pseudoaleatorio fijo para que parezca un flujo de datos
    qam.idx = (qam.idx * 7 + 3) % 16;
    var p = pts[qam.idx];
    p.classList.add('active');
    var row = Math.floor(qam.idx / 4);   // Q (de arriba a abajo)
    var col = qam.idx % 4;               // I (de izquierda a derecha)
    qam.readout.textContent = 'símbolo: ' + GRAY[col] + GRAY[3 - row] + '  (I' + GRAY[col] + ' · Q' + GRAY[3 - row] + ')';
  }

  function qamStart() {
    if (qam.timer || !qam.points.length) return;
    qamStep();
    qam.timer = setInterval(qamStep, 900);
  }

  function qamStop() {
    clearInterval(qam.timer);
    qam.timer = 0;
  }

  function setupQAM() {
    var g = document.getElementById('qamPoints');
    if (!g) return;
    qam.points = Array.prototype.slice.call(g.querySelectorAll('circle'));
    qam.readout = document.getElementById('qamBits');
  }

  /* ------------------------------------------------------------
     5. Integración con reveal.js
     ------------------------------------------------------------ */
  function onSlide(slide) {
    var state = slide && slide.getAttribute('data-state');
    if (state !== 'viz-spectrum') spectrumStop();
    if (state !== 'viz-am') amStop();
    if (slide && slide.querySelector('#qamPoints')) qamStart(); else qamStop();
    document.body.classList.toggle('on-cover', !!(slide && slide.classList.contains('title-slide')));
  }

  function hookReveal() {
    if (typeof Reveal === 'undefined' || !Reveal.on) return;
    Reveal.on('ready', function (e) { onSlide(e.currentSlide); });
    Reveal.on('slidechanged', function (e) { onSlide(e.currentSlide); });
    Reveal.on('overviewshown', function () { spectrumStop(); amStop(); });
    if (Reveal.isReady && Reveal.isReady()) onSlide(Reveal.getCurrentSlide());
  }

  function redrawAll() {
    drawSpectrum();
    drawAM();
  }

  function init() {
    setupCoverWaves();
    setupSpectrum();
    setupAM();
    setupQAM();
    hookReveal();
    // Volver a dibujar cuando carguen las tipografías web
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(redrawAll);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
