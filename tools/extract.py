"""Extrae de TU data.win los assets que usa Undyne Web.
Uso: python3 extract.py "<ruta a data.win>" ../assets"""
import sys, os, re, json, struct
from datawin import DataWin

SPRITES = [r'^spr_undynex_', r'^spr_(fight|talk|item|spare)bt$', r'^spr_heart$', r'^spr_heartgreen$',
           r'^spr_hpname$', r'^spr_undynespear', r'^spr_target$', r'^spr_targetchoice$', r'^spr_strike$',
           r'^spr_heartbreak$', r'^spr_heartshards$',
           r'^spr_bullet_test(_[lrud])?$', r'^spr_dmgnum_o$', r'^spr_dmgmiss_o$', r'^spr_undyneb_smear$',
           r'^spr_bullet_testx(_arrow)?$', r'^spr_risespearbullet$', r'^spr_whitespearbullet$', r'^spr_followspear_2$', r'^spr_blconwdshrt$',
           r'^spr_spiderb_', r'^spr_heartpurple(_center)?$', r'^spr_hideouscupcake$', r'^spr_spiderbullet1$', r'^spr_donutbullet$',
           r'^spr_cupcakebullet$', r'^spr_croissant[lr]$', r'^spr_cupcakemonster$', r'^spr_spidertelegram$', r'^spr_tinyspider(_sign|_flower)?$',
           r'^spr_spiderpour$', r'^spr_muffethurt$',
           r'^spr_napstabattle$', r'^spr_teardrop$', r'^spr_streambullet$', r'^spr_bulletNapstaSad$', r'^spr_blookhat$', r'^spr_bulletgenmd$',
           r'^spr_blconsm$', r'^spr_battlebg$',
           r'^spr_mettb_upperbody', r'^spr_mettface(1|_general|_hurt|_defeated)$', r'^spr_mettleg[1-5]', r'^spr_mettarm[1-8]$',
           r'^spr_heartyellow_flip$', r'^spr_heartbullet$', r'^spr_plusbomb', r'^spr_blackbox_pl$', r'^spr_(rec|rew)box$', r'^spr_happybreaktime$',
           r'^spr_exclamationpoint$', r'^spr_tinysparkle$', r'^spr_tinydancemett', r'^spr_parasolmett$', r'^spr_kissbullet$', r'^spr_mettheart',
           r'^spr_discoball(_invert)?_pl$', r'^spr_mettlightning_pl$', r'^spr_mettlegbullet_[lr]$', r'^spr_yellowtrigger(_off)?_pl$',
           r'^spr_metthand_(pl|r)$', r'^spr_starburst_x$', r'^spr_mettshine$', r'^spr_shockblcon2$', r'^spr_tsunderplanecloud$',
           # decoración del menú e icono de la página
           r'^spr_sansb_face$', r'^spr_floweynice$', r'^spr_floweywink$', r'^spr_sleepdog$', r'^spr_tobydogscoot$', r'^spr_tembattle$', r'^spr_froggit$',
           r'^spr_papyrusboss_head$', r'^spr_napstablook_d$', r'^spr_heartshards$']
SOUNDS = ['SND_TXT1', 'snd_hurtgirl', 'snd_txtund_hyper', 'snd_vaporized', 'snd_swallow', 'snd_power', 'snd_speedup', 'snd_spearappear', 'snd_spearrise', 'snd_arrow', 'snd_impact', 'snd_bell', 'snd_hurt1', 'snd_damage', 'snd_laz', 'snd_select', 'snd_squeak', 'SND_TXT2',
          'snd_mtt1', 'snd_mtt2', 'snd_mtt3', 'snd_mtt4', 'snd_mtt5', 'snd_mtt6', 'snd_mtt7', 'snd_mtt8', 'snd_mtt9', 'snd_heartshot', 'snd_mtt_hit',
          'snd_mtt_prebomb', 'snd_mtt_burst', 'snd_bomb', 'snd_noise', 'snd_block2', 'snd_phone', 'snd_heavydamage', 'snd_yeah', 'mus_explosion', 'snd_break1', 'snd_break2', 'snd_dogsalad']
# Cada jefe nuevo puede listar lo que necesita en tools/assets/<jefe>.txt:
#   una línea por sprite (expresión regular) o "sound: <nombre>" por sonido
_here = os.path.dirname(os.path.abspath(__file__))
for _f in sorted(os.listdir(os.path.join(_here, 'assets'))) if os.path.isdir(os.path.join(_here, 'assets')) else []:
    if not _f.endswith('.txt'): continue
    for _l in open(os.path.join(_here, 'assets', _f), encoding='utf-8'):
        _l = _l.split('#')[0].strip()
        if not _l: continue
        if _l.startswith('sound:'): SOUNDS.append(_l[6:].strip())
        else: SPRITES.append(_l)
FONTS = ['fnt_main', 'fnt_curs', 'fnt_small', 'fnt_dmg', 'fnt_plain', 'fnt_maintext', 'fnt_papyrus', 'fnt_comicsans']

def main(src, out):
    d = DataWin(src)
    os.makedirs(f'{out}/sprites', exist_ok=True); os.makedirs(f'{out}/fonts', exist_ok=True)
    meta = {}
    for s in d.sprites():
        if not any(re.search(p, s['name']) for p in SPRITES): continue
        safe_name = os.path.basename(s['name'])
        for i, f in enumerate(s['frames']):
            d.tpag_image(f).save(f"{out}/sprites/{safe_name}_{i}.png")
        meta[s['name']] = dict(w=s['w'], h=s['h'], ox=s['ox'], oy=s['oy'], bbox=s['bbox'], frames=len(s['frames']))
    json.dump(meta, open(f'{out}/sprites/sprites.json', 'w'), indent=1)
    for f in d.fonts():
        if f['name'] not in FONTS: continue
        safe_name = os.path.basename(f['name'])
        o = f['off']
        d.tpag_image(d.u32(o+28)).save(f"{out}/fonts/{safe_name}.png")
        glyphs = {}
        for g in d.ptr_list(o+40):
            c, x, y, w, h = struct.unpack_from('<5H', d.b, g); shift, off = struct.unpack_from('<2h', d.b, g+10)
            glyphs[chr(c)] = [x, y, w, h, shift, off]
        json.dump(dict(size=d.u32(o+8), glyphs=glyphs), open(f"{out}/fonts/{safe_name}.json", 'w'))
    os.makedirs(f'{out}/sfx', exist_ok=True)
    for name, data in d.sounds():
        if name in SOUNDS: open(f'{out}/sfx/{os.path.basename(name.lower())}.wav', 'wb').write(data)
    print(len(meta), 'sprites,', len(FONTS), 'fuentes,', len(SOUNDS), 'sonidos ->', out)

if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
