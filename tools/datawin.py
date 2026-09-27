"""Lector mínimo de data.win (GameMaker Studio 1.4, Undertale) — sprites, texturas, fuentes."""
import struct, io
from PIL import Image

class DataWin:
    def __init__(self, path):
        self.b = open(path, 'rb').read()
        assert self.b[:4] == b'FORM'
        self.chunks = {}
        p, end = 8, 8 + self.u32(4)
        while p < end:
            name = self.b[p:p+4].decode(); size = self.u32(p+4)
            self.chunks[name] = (p+8, size); p += 8 + size
        self._pages = {}
        self._txtr_offsets()

    def u32(self, o): return struct.unpack_from('<I', self.b, o)[0]
    def i32(self, o): return struct.unpack_from('<i', self.b, o)[0]
    def u16(self, o): return struct.unpack_from('<H', self.b, o)[0]
    def s16(self, o): return struct.unpack_from('<h', self.b, o)[0]
    def str_at(self, o):  # punteros a strings apuntan al contenido, longitud en o-4
        n = self.u32(o-4); return self.b[o:o+n].decode('utf-8', 'replace')
    def ptr_list(self, o):
        n = self.u32(o); return [self.u32(o+4+4*i) for i in range(n)]

    def _txtr_offsets(self):
        start, size = self.chunks['TXTR']
        self.txtr = []
        for e in self.ptr_list(start):
            # entrada: [u32 scaled][u32 ptr png] (GMS 1.4)
            self.txtr.append(self.u32(e+4))

    def page(self, i):
        if i not in self._pages:
            o = self.txtr[i]
            self._pages[i] = Image.open(io.BytesIO(self.b[o:])).convert('RGBA')
        return self._pages[i]

    def tpag(self, o):
        v = struct.unpack_from('<11H', self.b, o)
        return dict(sx=v[0], sy=v[1], sw=v[2], sh=v[3], tx=v[4], ty=v[5], tw=v[6], th=v[7], bw=v[8], bh=v[9], page=v[10])

    def tpag_image(self, o):
        t = self.tpag(o)
        crop = self.page(t['page']).crop((t['sx'], t['sy'], t['sx']+t['sw'], t['sy']+t['sh']))
        if (t['sw'], t['sh']) != (t['tw'], t['th']):
            crop = crop.resize((t['tw'], t['th']), Image.NEAREST)
        img = Image.new('RGBA', (t['bw'], t['bh']), (0, 0, 0, 0))
        img.paste(crop, (t['tx'], t['ty']))
        return img

    def sprites(self):
        start, _ = self.chunks['SPRT']
        for s in self.ptr_list(start):
            name = self.str_at(self.u32(s))
            w, h = self.u32(s+4), self.u32(s+8)
            ox, oy = self.i32(s+48), self.i32(s+52)
            bbox = [self.u32(s+12), self.u32(s+24), self.u32(s+16), self.u32(s+20)]  # izq, arriba, der, abajo
            frames = self.ptr_list(s+56)
            yield dict(name=name, w=w, h=h, ox=ox, oy=oy, bbox=bbox, frames=frames)

    def fonts(self):
        start, _ = self.chunks['FONT']
        for f in self.ptr_list(start):
            yield dict(name=self.str_at(self.u32(f)), display=self.str_at(self.u32(f+4)), off=f)

    def sounds(self):
        """Efectos embebidos (AUDO). Devuelve (nombre, bytes .wav)."""
        audo = self.ptr_list(self.chunks['AUDO'][0])
        for e in self.ptr_list(self.chunks['SOND'][0]):
            name, aid = self.str_at(self.u32(e)), self.i32(e+32)
            if 0 <= aid < len(audo):
                o = audo[aid]; yield name, self.b[o+4:o+4+self.u32(o)]
