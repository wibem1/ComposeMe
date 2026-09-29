// Presentation-only beaming. ABC whitespace controls beams, not playback.
// Touch only fully parsed, simple measures of individually written eighth notes;
// leave expressive/complex and already-beamed music unchanged.
const SIMPLE = /^(?:"([^"]*)")?([\^_=]{0,2}[A-Ga-g][,']*|z)([1-9][0-9]*)?$/;

function beatPlan(abc) {
  const head = abc.split(/^K\s*:/m)[0];
  const meter = head.match(/^M\s*:\s*(\d+)\s*\/\s*(\d+)/m);
  const unit = head.match(/^L\s*:\s*(\d+)\s*\/\s*(\d+)/m);
  if (!meter || !unit || Number(unit[1]) !== 1 || Number(unit[2]) !== 8) return null;
  const [n, d] = [Number(meter[1]), Number(meter[2])];
  if (d === 4 && [2, 3, 4].includes(n)) return { eighths: n * 2, beat: 2 };
  if (d === 8 && [6, 9, 12].includes(n)) return { eighths: n, beat: 3 };
  return null;
}

function beamMeasure(measure, plan) {
  const source = measure.trim();
  if (!source || /[\[\](){}<>!~&+:]/.test(source)) return measure;
  const tokens = source.split(/\s+/);
  const notes = tokens.map(token => {
    const m = SIMPLE.exec(token);
    if (!m) return null;
    return { chord: m[1] != null, rest: m[2] === 'z', length: Number(m[3] || 1) };
  });
  if (notes.some(x => !x) || notes.reduce((n, x) => n + x.length, 0) !== plan.eighths) return measure;
  // A joined pair/triple would already be one token and fail full-measure validation
  // unless another token were unexpectedly compensating: do not reinterpret it.
  let position = 0;
  let output = '';
  for (let i = 0; i < tokens.length; i++) {
    const here = notes[i];
    if (i) {
      const prev = notes[i - 1];
      const inSameBeat = Math.floor((position - 1) / plan.beat) === Math.floor(position / plan.beat);
      output += prev.length === 1 && here.length === 1 && !prev.rest && !here.rest &&
        !here.chord && inSameBeat ? '' : ' ';
    }
    output += tokens[i];
    position += here.length;
  }
  const leading = measure.match(/^\s*/)[0], trailing = measure.match(/\s*$/)[0];
  return leading + output + trailing;
}

export function beamSimpleEighths(abc) {
  if (typeof abc !== 'string' || !abc.trim()) return abc;
  const plan = beatPlan(abc);
  if (!plan) return abc;
  const lines = abc.split('\n');
  const body = lines.findIndex(line => /^K\s*:/.test(line.trim()));
  if (body < 0) return abc;
  return lines.map((line, i) => {
    if (i <= body || /^\s*(?:%|[A-Za-z]:)/.test(line)) return line;
    const prefix = line.match(/^(\s*(?:\[V:[^\]]+\]\s*)?)/)[0];
    const music = line.slice(prefix.length);
    // Unambiguous ordinary measure bars only. Preserve everything else.
    if (!music.includes('|') || /\|:|:\||\|\||\[\||\[[12]|!/.test(music)) return line;
    const chunks = music.split(/(\|\]?)/);
    for (let j = 0; j < chunks.length; j += 2) {
      if (j === chunks.length - 1 && !chunks[j].trim()) continue;
      // Do not infer a beat-grid for an unfinished trailing bar.
      if (j + 1 < chunks.length) chunks[j] = beamMeasure(chunks[j], plan);
    }
    return prefix + chunks.join('');
  }).join('\n');
}
