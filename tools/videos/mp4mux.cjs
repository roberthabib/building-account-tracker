// Minimal MP4 writer for one H.264 video track (moov before mdat, so phones
// can start playing before the whole file has downloaded).
function box(type, ...parts) {
  const body = Buffer.concat(parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))));
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length + 8, 0);
  head.write(type, 4, "latin1");
  return Buffer.concat([head, body]);
}
const full = (type, version, flags, ...parts) => {
  const vf = Buffer.alloc(4);
  vf.writeUInt32BE(((version & 0xff) << 24) | (flags & 0xffffff), 0);
  return box(type, vf, ...parts);
};
const u32 = (...n) => { const b = Buffer.alloc(4 * n.length); n.forEach((v, i) => b.writeUInt32BE(v >>> 0, i * 4)); return b; };
const u16 = (...n) => { const b = Buffer.alloc(2 * n.length); n.forEach((v, i) => b.writeUInt16BE(v & 0xffff, i * 2)); return b; };
const zeros = (n) => Buffer.alloc(n);
const MATRIX = u32(0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000);

// samples: [{ data: Buffer (length-prefixed NAL units), key: boolean }]
function muxH264({ samples, avcC, width, height, fps }) {
  const timescale = fps * 1000;
  const delta = 1000;
  const n = samples.length;
  const mediaDur = n * delta;
  const movieDur = Math.round((n / fps) * 1000);

  const build = (mdatOffset) => {
    const avc1 = box("avc1",
      zeros(6), u16(1),               // reserved, data_reference_index
      zeros(16),                      // pre_defined + reserved
      u16(width, height),
      u32(0x00480000, 0x00480000),    // 72 dpi
      u32(0), u16(1),                 // reserved, frame_count
      zeros(32),                      // compressor name
      u16(0x0018, 0xffff),            // depth, pre_defined -1
      box("avcC", avcC));
    const stbl = box("stbl",
      full("stsd", 0, 0, u32(1), avc1),
      full("stts", 0, 0, u32(1, n, delta)),
      full("stss", 0, 0, u32(samples.filter((s) => s.key).length), u32(...samples.map((s, i) => (s.key ? i + 1 : 0)).filter(Boolean))),
      full("stsc", 0, 0, u32(1, 1, n, 1)),
      full("stsz", 0, 0, u32(0, n), u32(...samples.map((s) => s.data.length))),
      full("stco", 0, 0, u32(1, mdatOffset)));
    const minf = box("minf",
      full("vmhd", 0, 1, u16(0, 0, 0, 0)),
      box("dinf", full("dref", 0, 0, u32(1), full("url ", 0, 1))),
      stbl);
    const mdia = box("mdia",
      full("mdhd", 0, 0, u32(0, 0, timescale, mediaDur), u16(0x55c4, 0)),
      full("hdlr", 0, 0, u32(0), Buffer.from("vide"), zeros(12), Buffer.from("VideoHandler\0")),
      minf);
    const trak = box("trak",
      full("tkhd", 0, 3, u32(0, 0, 1, 0, movieDur), zeros(8), u16(0, 0, 0, 0), MATRIX, u32(width << 16, height << 16)),
      mdia);
    return box("moov",
      full("mvhd", 0, 0, u32(0, 0, 1000, movieDur), u32(0x00010000), u16(0x0100), zeros(10), MATRIX, zeros(24), u32(2)),
      trak);
  };
  const ftyp = box("ftyp", Buffer.from("isom"), u32(512), Buffer.from("isomiso2avc1mp41"));
  const probe = build(0);
  const moov = build(ftyp.length + probe.length + 8);
  const mdatBody = Buffer.concat(samples.map((s) => s.data));
  const mdatHead = Buffer.alloc(8);
  mdatHead.writeUInt32BE(mdatBody.length + 8, 0);
  mdatHead.write("mdat", 4, "latin1");
  return Buffer.concat([ftyp, moov, mdatHead, mdatBody]);
}

module.exports = { muxH264 };
