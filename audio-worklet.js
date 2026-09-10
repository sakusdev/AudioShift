class P extends AudioWorkletProcessor {
  constructor() {
    super();
    this.c = [];
    this.n = 0;
    this.pos = 0;
    this.speed = 1;
    this.pitch = 1;
    this.loop = false;
    this.g = 2646;
    this.h = 882;
    this.on = false;
    this.port.onmessage = e => {
      const m = e.data;
      if (m.t === 'buf') {
        this.c = m.c.map(x => new Float32Array(x));
        this.n = this.c[0]?.length || 0;
        this.pos = 0;
        this.on = true;
      } else if (m.t === 'p') {
        Object.assign(this, m);
      } else if (m.t === 'stop') {
        this.on = false;
      }
    };
  }

  process(_, o) {
    const L = o[0][0];
    const R = o[0][1] || L;
    if (!this.on || !this.n) {
      L.fill(0);
      if (R !== L) R.fill(0);
      return true;
    }

    const N = this.n, g = this.g, s = this.speed, p = this.pitch, h = this.h;
    for (let i = 0; i < L.length; i++) {
      let y = 0, z = 0, w = 0;
      const base = Math.floor(this.pos / h) * h;
      for (let k = -3; k <= 0; k++) {
        const gs = base + k * h;
        const loc = this.pos - gs;
        if (loc < 0 || loc >= g) continue;
        let q = gs * s + (loc - g * .5) * p;
        if (this.loop) q = ((q % N) + N) % N;
        if (q < 0 || q >= N - 1) continue;
        const a = q | 0, f = q - a;
        const ww = .5 - .5 * Math.cos(6.2831853 * loc / (g - 1));
        const l = this.c[0][a] * (1 - f) + this.c[0][a + 1] * f;
        const r = this.c[1] ? this.c[1][a] * (1 - f) + this.c[1][a + 1] * f : l;
        y += l * ww;
        z += r * ww;
        w += ww;
      }
      L[i] = w ? y / Math.max(.7, w) : 0;
      R[i] = w ? z / Math.max(.7, w) : 0;
      this.pos++;
    }
    return true;
  }
}
registerProcessor('p', P);
