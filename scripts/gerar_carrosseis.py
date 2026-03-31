#!/usr/bin/env python3
"""
Gerador de Carrosseis — CRI-012 a CRI-021
Cliente: Iris Matos / @irismatos.co
Formato: 1290x1290 JPEG
"""

from PIL import Image, ImageDraw, ImageFont
import os

# ─── PATHS ────────────────────────────────────────────────────────────────────
E5   = "/Users/leonardorodrigues/Downloads/Iris Ensaios/Ensaio 5/Ensaio 5/"
E4   = "/Users/leonardorodrigues/Downloads/Iris Ensaios/Ensaio 4/Ensaio 4/"
OUT  = "/Users/leonardorodrigues/dev/Obsidian/Agência de Marketing/Estrategize/05 - Entregáveis/Criativos/"
HN   = "/System/Library/Fonts/HelveticaNeue.ttc"
SFNI = "/System/Library/Fonts/SFNSItalic.ttf"

# ─── CORES ────────────────────────────────────────────────────────────────────
GREEN    = (45, 90, 61)
RED      = (176, 44, 34)
WHITE    = (255, 255, 255)
BLACK    = (18, 18, 18)
DARK     = (22, 22, 22)
WA_BG    = (229, 221, 213)
WA_CARD  = (255, 255, 255)
YELLOW   = (255, 235, 59)

# ─── FOTOS ────────────────────────────────────────────────────────────────────
IRIS_FRONT_SERIOUS  = E5 + "IMG_1385.jpg"
IRIS_SIDE_PROFILE   = E5 + "IMG_1434-Editar.jpg"
IRIS_FRONT_SMILE    = E5 + "IMG_1521-Editar 2.jpg"
IRIS_SIDE_BACK      = E5 + "IMG_1644.jpg"
IRIS_STANDING_SMILE = E5 + "IMG_1810.jpg"
IRIS_STOOL          = E5 + "IMG_1920.jpg"
IRIS_DIRECTOR       = E5 + "IMG_2002.jpg"
IRIS_BOLD_GREEN     = E4 + "IMG_1862.JPG"
IRIS_BOLD_SUIT      = E4 + "IMG_2626.JPG"

# ─── FONTES ───────────────────────────────────────────────────────────────────
SIZE = 1290
PAD  = 60

def fnt(size, style="regular"):
    idx = {"regular":0,"bold":1,"italic":2,"bold_italic":3,"condensed_bold":4,"ultralight":5,"light":7}
    try:
        if style == "italic_sf":
            return ImageFont.truetype(SFNI, size)
        return ImageFont.truetype(HN, size, index=idx.get(style, 0))
    except:
        return ImageFont.load_default()

# ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

def load_crop(path, bias="center"):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    side = min(w, h)
    x = (w - side) // 2
    if bias == "top":
        y = max(0, (h - side) // 4)
    elif bias == "face":
        y = max(0, (h - side) // 2 - side // 8)
    else:
        y = (h - side) // 2
    y = max(0, min(y, h - side))
    img = img.crop((x, y, x+side, y+side))
    return img.resize((SIZE, SIZE), Image.LANCZOS)

def rr(draw, xy, radius, fill, outline=None, ow=0):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=ow)

def wrap(text, font, max_w, draw):
    words = text.split()
    lines, cur = [], ""
    for word in words:
        test = (cur + " " + word).strip()
        bb = draw.textbbox((0,0), test, font=font)
        if bb[2] - bb[0] <= max_w:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = word
    if cur: lines.append(cur)
    return lines or [""]

def block_h(draw, lines, font, gap=12):
    h = 0
    for i, line in enumerate(lines):
        bb = draw.textbbox((0,0), line, font=font)
        h += bb[3] - bb[1]
        if i < len(lines)-1: h += gap
    return h

def draw_block(draw, lines, font, cx, y, color, align="center", gap=12):
    for line in lines:
        bb = draw.textbbox((0,0), line, font=font)
        tw = bb[2] - bb[0]
        tx = cx - tw//2 if align == "center" else cx
        draw.text((tx, y), line, font=font, fill=color)
        y += (bb[3]-bb[1]) + gap
    return y

# ─── SLIDE: HEADSHOT + CAIXA BASE ─────────────────────────────────────────────

def slide_headshot_hook(photo, text, box_color, text_color=WHITE, font_size=52, bias="face"):
    img = load_crop(photo, bias)
    draw = ImageDraw.Draw(img)
    f = fnt(font_size, "bold")
    max_w = SIZE - PAD*4
    lines = wrap(text, f, max_w, draw)
    th = block_h(draw, lines, f)
    bh = max(th + 70, 110)
    by = SIZE - bh - 30
    rr(draw, (PAD, by, SIZE-PAD, SIZE-30), 20, box_color)
    draw_block(draw, lines, f, SIZE//2, by + (bh-th)//2, text_color)
    return img

# ─── SLIDE: TEXTO PURO ────────────────────────────────────────────────────────

def slide_text_only(text, bg=DARK, fg=WHITE, font_size=60,
                    sub=None, sub_fg=None, accent=None, accent_fg=RED):
    img = Image.new("RGB", (SIZE, SIZE), bg)
    draw = ImageDraw.Draw(img)
    f = fnt(font_size, "bold")
    max_w = SIZE - PAD*5

    main_lines = wrap(text, f, max_w, draw)
    total = block_h(draw, main_lines, f, 16)

    fs = fnt(font_size-10, "regular")
    sub_lines = wrap(sub, fs, max_w, draw) if sub else []
    if sub_lines: total += block_h(draw, sub_lines, fs, 12) + 40

    fa = fnt(font_size-6, "bold")
    acc_lines = wrap(accent, fa, max_w, draw) if accent else []
    if acc_lines: total += block_h(draw, acc_lines, fa, 12) + 40

    y = (SIZE - total) // 2
    y = draw_block(draw, main_lines, f, SIZE//2, y, fg, gap=16)
    if sub_lines:
        y += 40
        y = draw_block(draw, sub_lines, fs, SIZE//2, y, sub_fg or (200,200,200), gap=12)
    if acc_lines:
        y += 40
        draw_block(draw, acc_lines, fa, SIZE//2, y, accent_fg, gap=12)
    return img

# ─── SLIDE: LISTA COM MARCADORES ──────────────────────────────────────────────

def slide_text_list(items, title=None, title_fg=RED, bg=DARK, fg=WHITE,
                    font_size=48, strike=True):
    img = Image.new("RGB", (SIZE, SIZE), bg)
    draw = ImageDraw.Draw(img)
    f = fnt(font_size, "bold")
    ft = fnt(font_size+4, "bold")
    max_w = SIZE - PAD*5 - 60
    marker = "×" if strike else "✓"
    m_color = (200,60,50) if strike else (80,180,100)
    fm = fnt(font_size+2, "bold")

    # Calcula altura total
    total = 0
    if title:
        tl = wrap(title, ft, SIZE-PAD*4, draw)
        total += block_h(draw, tl, ft) + 50
    item_data = []
    for item in items:
        il = wrap(item, f, max_w, draw)
        ih = block_h(draw, il, f, 10)
        item_data.append((il, ih))
        total += ih + 30

    y = (SIZE - total) // 2

    if title:
        tl = wrap(title, ft, SIZE-PAD*4, draw)
        y = draw_block(draw, tl, ft, SIZE//2, y, title_fg, gap=12)
        y += 50

    for il, ih in item_data:
        # marcador
        mb = draw.textbbox((0,0), marker, font=fm)
        mw = mb[2]-mb[0]
        mx = PAD*3
        draw.text((mx, y), marker, font=fm, fill=m_color)
        tx = mx + mw + 20
        for line in il:
            bb = draw.textbbox((0,0), line, font=f)
            draw.text((tx, y), line, font=f, fill=fg)
            y += (bb[3]-bb[1]) + 10
        y += 20

    return img

# ─── SLIDE: WHATSAPP PROOF ────────────────────────────────────────────────────

def _draw_wa_card(draw, x0, inner_w, y0, sender, message, highlight_phrase,
                  f_name, f_msg, f_high, lh=48):
    """Desenha card WA com highlight inline na frase exata."""
    pad = 35
    name_h = 52
    msg_lines = []
    for ml in message.split("\n"):
        msg_lines += wrap(ml, f_msg, inner_w, draw) or [ml]

    card_h = pad + name_h + len(msg_lines)*lh + pad
    x1 = x0 + inner_w + 60
    y1 = y0 + card_h

    rr(draw, (x0, y0, x1, y1), 22, WA_CARD)
    draw.text((x0+pad, y0+pad), sender, font=f_name, fill=(0,130,100))

    ty = y0 + pad + name_h
    hl = highlight_phrase.lower() if highlight_phrase else ""
    for line in msg_lines:
        tx = x0 + pad
        if hl and hl in line.lower():
            idx = line.lower().find(hl)
            before  = line[:idx]
            hl_part = line[idx:idx+len(hl)]
            after   = line[idx+len(hl):]
            if before:
                draw.text((tx, ty), before, font=f_msg, fill=(50,50,50))
                bb = draw.textbbox((tx,ty), before, font=f_msg)
                tx += bb[2]-bb[0]
            bb_hl = draw.textbbox((tx,ty), hl_part, font=f_high)
            rr(draw, (bb_hl[0]-3,bb_hl[1]-3,bb_hl[2]+3,bb_hl[3]+3), 5, YELLOW)
            draw.text((tx,ty), hl_part, font=f_high, fill=BLACK)
            tx += bb_hl[2]-bb_hl[0]
            if after:
                draw.text((tx,ty), after, font=f_msg, fill=(50,50,50))
        else:
            draw.text((tx,ty), line, font=f_msg, fill=(50,50,50))
        ty += lh

    return y1, x1

def slide_wa_proof(sender, message, highlight_phrase, caption,
                   caption_bg=GREEN, caption_font=48):
    img = Image.new("RGB", (SIZE, SIZE), WA_BG)
    draw = ImageDraw.Draw(img)

    x0     = PAD + 20
    iw     = SIZE - (PAD+20)*2 - 60
    f_name = fnt(34, "bold")
    f_msg  = fnt(38, "regular")
    f_high = fnt(38, "bold")
    f_cap  = fnt(caption_font, "bold")
    lh     = 50

    # Pré-calcular alturas para centrar verticalmente
    msg_lines = []
    for ml in message.split("\n"):
        msg_lines += wrap(ml, f_msg, iw, draw) or [ml]
    card_h = 35 + 52 + len(msg_lines)*lh + 35

    cap_lines = wrap(caption, f_cap, SIZE-PAD*4, draw)
    cap_th    = block_h(draw, cap_lines, f_cap)
    cap_bh    = cap_th + 60

    total_h = card_h + 35 + cap_bh
    y0 = (SIZE - total_h) // 2

    y1, _ = _draw_wa_card(draw, x0, iw, y0, sender, message,
                          highlight_phrase, f_name, f_msg, f_high, lh)

    # Timestamp
    f_time = fnt(26, "light")
    draw.text((SIZE-PAD-80, y1-36), "✓✓", font=f_time, fill=(120,120,120))

    # Caption box
    cy0 = y1 + 35
    rr(draw, (PAD, cy0, SIZE-PAD, cy0+cap_bh), 20, caption_bg)
    draw_block(draw, cap_lines, f_cap, SIZE//2, cy0+(cap_bh-cap_th)//2, WHITE)
    return img

def slide_wa_dual(proof1, proof2, title=None, bg_dark=True):
    """Dois prints WA empilhados, verticalmente centrados."""
    bg = DARK if bg_dark else (245,245,245)
    img = Image.new("RGB", (SIZE, SIZE), bg)
    draw = ImageDraw.Draw(img)
    tc = WHITE if bg_dark else BLACK

    x0     = PAD
    iw     = SIZE - PAD*2 - 60
    f_name = fnt(30, "bold")
    f_msg  = fnt(34, "regular")
    f_high = fnt(34, "bold")
    ft     = fnt(40, "bold")
    lh     = 44

    def card_h(msg):
        lines = []
        for ml in msg.split("\n"):
            lines += wrap(ml, f_msg, iw, draw) or [ml]
        return 30 + 46 + len(lines)*lh + 30

    h1 = card_h(proof1[1])
    h2 = card_h(proof2[1])
    gap = 28
    title_h = 0
    if title:
        tl = wrap(title, ft, SIZE-PAD*4, draw)
        title_h = block_h(draw, tl, ft) + 45

    total = title_h + h1 + gap + h2
    y = (SIZE - total) // 2

    if title:
        tl = wrap(title, ft, SIZE-PAD*4, draw)
        y = draw_block(draw, tl, ft, SIZE//2, y, tc, gap=12)
        y += 45

    y1, _ = _draw_wa_card(draw, x0, iw, y,
                          proof1[0], proof1[1], proof1[2], f_name, f_msg, f_high, lh)
    _draw_wa_card(draw, x0, iw, y1+gap,
                  proof2[0], proof2[1], proof2[2], f_name, f_msg, f_high, lh)
    return img

# ─── SLIDE: CTA ───────────────────────────────────────────────────────────────

def slide_cta(photo, cta_text, box_color=GREEN, font_size=50):
    img = load_crop(photo, "top")
    draw = ImageDraw.Draw(img)
    f = fnt(font_size, "italic_sf")
    max_w = SIZE - PAD*4
    lines = wrap(cta_text, f, max_w, draw)
    th = block_h(draw, lines, f)
    bh = max(th + 60, 100)
    by = SIZE - bh - 30

    overlay = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle((PAD, by, SIZE-PAD, SIZE-30), radius=20,
                          fill=(*box_color, 225))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_block(draw, lines, f, SIZE//2, by+(bh-th)//2, WHITE)
    return img

# ─── SLIDE: SPLIT CORES ───────────────────────────────────────────────────────

def slide_split_colors(top_text, top_bg, bottom_text, bottom_bg,
                       top_label=None, bot_label=None, font_size=50):
    img = Image.new("RGB", (SIZE, SIZE), WHITE)
    draw = ImageDraw.Draw(img)
    half = SIZE//2
    f  = fnt(font_size, "bold")
    fl = fnt(font_size-10, "condensed_bold")
    max_w = SIZE - PAD*4

    draw.rectangle((0,0,SIZE,half), fill=top_bg)
    draw.rectangle((0,half,SIZE,SIZE), fill=bottom_bg)

    if top_label:
        draw.text((PAD*2, PAD), top_label, font=fl, fill=(255,255,255,180))
    tl = wrap(top_text, f, max_w, draw)
    th = block_h(draw, tl, f)
    draw_block(draw, tl, f, SIZE//2, (half-th)//2, WHITE)

    if bot_label:
        draw.text((PAD*2, half+PAD), bot_label, font=fl, fill=(255,255,255,180))
    bl = wrap(bottom_text, f, max_w, draw)
    bh = block_h(draw, bl, f)
    draw_block(draw, bl, f, SIZE//2, half+(half-bh)//2, WHITE)
    return img

# ─── SAVE ─────────────────────────────────────────────────────────────────────

def save(img, cri, n):
    folder = os.path.join(OUT, cri)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"{n}.jpg")
    img.save(path, "JPEG", quality=93)
    print(f"  ✓ {cri}/{n}.jpg")

# ─── CRI-012 ──────────────────────────────────────────────────────────────────

def gerar_cri_012():
    c = "CRI-012"; print(f"\n[{c}] Você cancela turma.")
    save(slide_headshot_hook(IRIS_FRONT_SERIOUS,
         "Você cancela turma.\nE ainda acha que é normal.",
         WHITE, BLACK, 52), c, 1)
    save(slide_text_only(
         "Turma vazia não é\nfalta de aluna.",
         sub="É falta de estratégia de captação\npara O SEU CASO.",
         font_size=62), c, 2)
    save(slide_wa_proof("Thais",
         "Oie boa tarde\nFalei com um monte\nFechei 2 turmas 1 para março outra pra abril",
         "Fechei 2 turmas",
         "Em 1 mês. 2 turmas fechadas.", GREEN), c, 3)
    save(slide_cta(IRIS_SIDE_PROFILE,
         "Comenta 'CONSULTORIA' aqui embaixo 👇"), c, 4)

# ─── CRI-013 ──────────────────────────────────────────────────────────────────

def gerar_cri_013():
    c = "CRI-013"; print(f"\n[{c}] Falta de estratégia de atração.")
    save(slide_headshot_hook(IRIS_BOLD_SUIT,
         "Não é falta de aluno.\nÉ falta de estratégia de ATRAÇÃO.",
         WHITE, BLACK, 50), c, 1)
    save(slide_text_only(
         "A aluna que você quer EXISTE.",
         sub="Ela só não está te encontrando\ndo jeito certo.",
         font_size=64), c, 2)
    save(slide_wa_dual(
         ("Valeria",
          "Com seu direcionamento do primeiro encontro\nfechei a primeira aluna cobrando 2k",
          "cobrando 2k"),
         ("Rafaela Instrutora",
          "Ainda não fechei o perfil privado!\nMas fechei uma aluna para o presencial",
          "fechei uma aluna"),
         title="Quando a estratégia está certa, alunas aparecem:"), c, 3)
    save(slide_cta(IRIS_FRONT_SMILE,
         "Acessa o meu perfil 👇"), c, 4)

# ─── CRI-014 ──────────────────────────────────────────────────────────────────

def gerar_cri_014():
    c = "CRI-014"; print(f"\n[{c}] Quanto você deixou de ganhar.")
    save(slide_headshot_hook(IRIS_FRONT_SERIOUS,
         "Quanto você deixou de ganhar\nesperando o momento certo?",
         WHITE, BLACK, 50), c, 1)
    save(slide_text_only(
         "Cada mês sem estratégia é um mês de faturamento parado.",
         accent="Não é abstrato. É dinheiro real.",
         accent_fg=RED, font_size=58), c, 2)
    save(slide_wa_proof("Raquel",
         "Minha renda aumentou muito\nFiz R$23.547 esse mês\nMais que o mês anterior inteiro",
         "R$23.547",
         "Em 1 mês. Mais que o mês anterior.", RED), c, 3)
    save(slide_cta(IRIS_SIDE_BACK,
         "Comenta 'CONSULTORIA' aqui embaixo 👇"), c, 4)

# ─── CRI-015 ──────────────────────────────────────────────────────────────────

def gerar_cri_015():
    c = "CRI-015"; print(f"\n[{c}] R$22k em 1 dia sem anúncio.")
    save(slide_headshot_hook(IRIS_BOLD_GREEN,
         "R$22k em 1 dia de carrinho aberto.\nSEM anúncio.",
         RED, WHITE, 52), c, 1)
    save(slide_wa_proof("Thais Bessa",
         "Foram 22k em 1 dia de carrinho aberto!\nSurreal... foi sem anúncio,\nsó usando os conteúdos certos.",
         "22k em 1 dia",
         "Com a estratégia certa. Sem anúncio.", DARK), c, 2)
    save(slide_split_colors(
         "SOZINHA: sem resultado, tentando\nadivinhar o caminho", RED,
         "COM ESTRATÉGIA: R$22k em\n1 dia de carrinho", GREEN,
         "ANTES", "DEPOIS", 46), c, 3)
    save(slide_headshot_hook(IRIS_STOOL,
         "O que mudou: alguém que olhou\npara o SEU CASO e montou o plano certo.",
         GREEN, WHITE, 46), c, 4)
    save(slide_cta(IRIS_SIDE_PROFILE,
         "Pronta para ser a próxima?\nAcessa o meu perfil 👇"), c, 5)

# ─── CRI-016 ──────────────────────────────────────────────────────────────────

def gerar_cri_016():
    c = "CRI-016"; print(f"\n[{c}] Não precisa dançar no Reels.")
    save(slide_headshot_hook(IRIS_FRONT_SERIOUS,
         "Você NÃO PRECISA dançar\nno Reels para encher turma.",
         WHITE, BLACK, 50), c, 1)
    save(slide_text_list(
         ["Postar todo dia",
          "50 mil seguidores",
          "Agência de marketing"],
         title="Você NÃO PRECISA de:",
         title_fg=RED, font_size=52, strike=True), c, 2)
    save(slide_wa_proof("Ana Educadora",
         "Véi o guia vendi um dia nos stories\ndeu mais de 12 mil reais,\nse tem noção?",
         "12 mil reais",
         "Sem ser influencer. Só com estratégia.", RED), c, 3)
    save(slide_cta(IRIS_SIDE_BACK,
         "Comenta 'CONSULTORIA' aqui embaixo 👇"), c, 4)

# ─── CRI-017 ──────────────────────────────────────────────────────────────────

def gerar_cri_017():
    c = "CRI-017"; print(f"\n[{c}] Primeiro encontro que muda tudo.")
    save(slide_headshot_hook(IRIS_DIRECTOR,
         "O que eu faço no PRIMEIRO\nENCONTRO que muda tudo",
         GREEN, WHITE, 52), c, 1)
    save(slide_text_only(
         "Eu analiso o seu caso.",
         sub="Entendo o seu nicho.\nMonto o plano que vai funcionar para VOCÊ.",
         font_size=66), c, 2)
    save(slide_text_list(
         ["O que mudar no perfil hoje",
          "Que conteúdo criar essa semana",
          "Como abordar e fechar a próxima aluna"],
         title="No fim do 1º encontro você sabe:",
         title_fg=GREEN, font_size=46, strike=False), c, 3)
    save(slide_wa_proof("Valeria",
         "Com seu direcionamento do primeiro encontro\nde algumas mudanças que tem que ser feita,\nfechei a primeira aluna cobrando 2k",
         "cobrando 2k",
         "Sem esperar semanas para ver resultado.", RED), c, 4)
    save(slide_cta(IRIS_SIDE_PROFILE,
         "Pronta para o seu primeiro encontro?\nAcessa o meu perfil 👇"), c, 5)

# ─── CRI-018 ──────────────────────────────────────────────────────────────────

def gerar_cri_018():
    c = "CRI-018"; print(f"\n[{c}] De R$1.500 para R$3.500.")
    save(slide_headshot_hook(IRIS_STOOL,
         "De R$1.500 sem turma cheia\npara R$3.500 fechando todo mês.",
         RED, WHITE, 50), c, 1)
    save(slide_text_only(
         "Antes: cobrava R$1.500\ne ainda não enchia.",
         accent="Tinha medo de cobrar mais.\nA turma ainda assim não fechava.",
         accent_fg=(200,200,200), font_size=58), c, 2)
    save(slide_wa_proof("Thais Bessa",
         "Antes eu cobrava 1500 e passei a cobrar 2500\nO curso VIP já comecei 2026 cobrando mais.\nHoje ele custa R$3500.",
         "R$3500",
         "Sem medo de perder aluna por preço.", GREEN), c, 3)
    save(slide_cta(IRIS_SIDE_BACK,
         "Comenta 'CONSULTORIA' aqui embaixo 👇"), c, 4)

# ─── CRI-019 ──────────────────────────────────────────────────────────────────

def gerar_cri_019():
    c = "CRI-019"; print(f"\n[{c}] Você já tentou tudo.")
    save(slide_headshot_hook(IRIS_FRONT_SERIOUS,
         "Você já tentou TUDO.\nMenos isso.",
         WHITE, BLACK, 58), c, 1)
    save(slide_text_list(
         ["Mentoria coletiva com 200 pessoas",
          "Grupo de WhatsApp pago",
          "Curso de vendas no digital",
          "Consultora de tráfego"],
         title="E ainda não vive de cursos.",
         title_fg=RED, font_size=46, strike=True), c, 2)
    save(slide_text_only(
         "Porque nenhum desses olhou\npara O SEU CASO.",
         accent="É isso que eu faço de diferente.",
         accent_fg=GREEN, font_size=58), c, 3)
    save(slide_wa_proof("Ana Educadora",
         "Você sabe que participei de uma mentoria\nque me custou mais de 20 mil\ne não aprendi o que você me ensinou.",
         "20 mil",
         "Mentoria cara não é mentoria certa.", RED), c, 4)
    save(slide_headshot_hook(IRIS_DIRECTOR,
         "Aqui é diferente.\nPortanto é personalizado para VOCÊ.",
         GREEN, WHITE, 52), c, 5)
    save(slide_cta(IRIS_SIDE_PROFILE,
         "Comenta 'CONSULTORIA' aqui embaixo 👇"), c, 6)

# ─── CRI-020 ──────────────────────────────────────────────────────────────────

def gerar_cri_020():
    c = "CRI-020"; print(f"\n[{c}] Você ensina bem. Ninguém sabe disso.")
    save(slide_headshot_hook(IRIS_STANDING_SMILE,
         "Você ensina bem.\nO problema é que ninguém sabe disso.",
         WHITE, BLACK, 50), c, 1)
    save(slide_headshot_hook(IRIS_DIRECTOR,
         "Você entrega resultado.\nMas seu posicionamento não mostra isso\npara quem ainda não te conhece.",
         GREEN, WHITE, 44), c, 2)
    save(slide_wa_dual(
         ("Rafaela Instrutora",
          "Ainda não fechei o perfil privado!\nMas fechei uma aluna para o presencial",
          "fechei uma aluna"),
         ("Valeria",
          "Com seu direcionamento do primeiro encontro\nfechei a primeira aluna cobrando 2k",
          "cobrando 2k"),
         title="Com o posicionamento certo, as alunas certas aparecem:"), c, 3)
    save(slide_cta(IRIS_SIDE_PROFILE,
         "Pronta para ser vista\npelas alunas certas?\nAcessa o meu perfil 👇"), c, 4)

# ─── CRI-021 ──────────────────────────────────────────────────────────────────

def gerar_cri_021():
    c = "CRI-021"; print(f"\n[{c}] R$12k em 1 dia de stories.")
    save(slide_headshot_hook(IRIS_BOLD_GREEN,
         "R$12k em 1 dia de stories.\nCom um guia de R$77.",
         RED, WHITE, 54), c, 1)
    save(slide_wa_proof("Ana Educadora",
         "Véi o guia vendi um dia nos stories\ndeu mais de 12 mil reais,\nse tem noção?",
         "12 mil reais",
         "Só com stories. Sem anúncio.", DARK), c, 2)
    save(slide_text_only(
         "Ela sabia o que criar.",
         sub="Para quem criar. E como conduzir\na venda nos stories.",
         accent="É isso que a consultoria entrega.",
         accent_fg=GREEN, font_size=68), c, 3)
    save(slide_cta(IRIS_SIDE_BACK,
         "Comenta 'CONSULTORIA' aqui embaixo 👇"), c, 4)

# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Gerando CRI-012 a CRI-021 ===")
    gerar_cri_012()
    gerar_cri_013()
    gerar_cri_014()
    gerar_cri_015()
    gerar_cri_016()
    gerar_cri_017()
    gerar_cri_018()
    gerar_cri_019()
    gerar_cri_020()
    gerar_cri_021()
    print(f"\n✅ Todos os criativos salvos em:\n   {OUT}")
