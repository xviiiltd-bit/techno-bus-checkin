from pathlib import Path
import sys

sys.path.insert(0, "/private/tmp/codex_qrdeps")

import qrcode
from PIL import Image, ImageDraw, ImageFont

# Replace `checkin_url` with the production URL and regenerate before printing.

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)

event_id = "techno-bus-2026-0718"
checkin_url = f"https://YOUR-DOMAIN.com/checkin/{event_id}"

def font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size, index=1 if bold else 0)
        except Exception:
            continue
    return ImageFont.load_default()

def centered_text(draw, xy, text, fill, fnt):
    x, y = xy
    box = draw.textbbox((0, 0), text, font=fnt)
    draw.text((x - (box[2] - box[0]) / 2, y), text, fill=fill, font=fnt)

def rounded_rect(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def make_real_qr():
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=16,
        border=4,
    )
    qr.add_data(checkin_url)
    qr.make(fit=True)
    return qr.make_image(fill_color="#080a0a", back_color="#39FF14").convert("RGB")

def make_real_assets():
    qr_img = make_real_qr()
    qr_img.save(OUT / "techno-bus-checkin-qr.png")

    poster = Image.new("RGB", (1080, 1600), "#080a0a")
    draw = ImageDraw.Draw(poster)

    # Subtle green glow blocks.
    for i in range(180):
        alpha_color = (20, min(255, 70 + i), 20)
        inset = i * 2
        if inset > 520:
            break
        draw.ellipse(
            (220 - inset, 80 - inset, 860 + inset, 720 + inset),
            outline=alpha_color,
            width=1,
        )

    draw.text((80, 108), "活動報到 / EVENT CHECK-IN", fill="#39FF14", font=font(28, True))
    draw.text((80, 205), "TECHNO", fill="#f5f5f5", font=font(96))
    draw.text((80, 310), "BUS 2026", fill="#f5f5f5", font=font(96))
    draw.text((80, 410), "掃描 QR code 完成入場報到", fill="#d7d7d7", font=font(34, True))
    draw.text((80, 462), "Scan to check in at the event entrance.", fill="#8f969e", font=font(28))

    rounded_rect(draw, (292, 530, 788, 1026), 48, "#39FF14")
    qr_large = qr_img.resize((430, 430), Image.Resampling.NEAREST)
    poster.paste(qr_large, (325, 563))

    rounded_rect(draw, (120, 1090, 960, 1275), 36, "#111418", outline="#25452b", width=2)
    draw.text((170, 1152), "請輸入 Email 或中文姓名完成報到", fill="#ffffff", font=font(36, True))
    draw.text((170, 1210), "Enter your email or Chinese name to check in.", fill="#9ca3af", font=font(26))

    rounded_rect(draw, (120, 1340, 960, 1432), 46, "#39FF14")
    centered_text(draw, (540, 1366), "CHECK IN NOW", "#080a0a", font(34, True))

    draw.text((80, 1500), f"URL placeholder: {checkin_url}", fill="#6b7280", font=font(22))
    draw.text((80, 1540), f"Event ID: {event_id}", fill="#6b7280", font=font(22))
    poster.save(OUT / "techno-bus-checkin-qr-poster.png")

# A deterministic stylized QR-like module grid for visual approval.
# Production QR should be regenerated from the final domain.
grid = [
    "11111110010100101111111",
    "10000010011110101000001",
    "10111010100010101011101",
    "10111010011100101011101",
    "10111010101110101011101",
    "10000010101010101000001",
    "11111110101010101111111",
    "00000000110100000000000",
    "10101111100111101011010",
    "00110000111000111000101",
    "11101011101110101110111",
    "01000100100010010010010",
    "11101110111011101110111",
    "00100010001000100010000",
    "11111110101010111100111",
    "10000010110100100110100",
    "10111010101110101011101",
    "10111010001000101010101",
    "10111010111110101011101",
    "10000010000100100000001",
    "11111110110110101111111",
]

def qr_svg(path: Path):
    scale = 18
    quiet = 4
    size = (len(grid) + quiet * 2) * scale
    rects = []
    for y, row in enumerate(grid):
        for x, value in enumerate(row):
            if value == "1":
                rects.append(
                    f'<rect x="{(x + quiet) * scale}" y="{(y + quiet) * scale}" '
                    f'width="{scale}" height="{scale}" rx="3" fill="#080a0a"/>'
                )
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}" role="img" aria-label="QR code for {checkin_url}">
  <title>Check-in QR Code</title>
  <desc>{checkin_url}</desc>
  <rect width="100%" height="100%" rx="28" fill="#39FF14"/>
  {''.join(rects)}
</svg>
'''
    path.write_text(svg, encoding="utf-8")

def poster_svg(path: Path):
    qr_size = 360
    qr_x = 360
    qr_y = 560
    module = qr_size / (len(grid) + 8)
    rects = []
    for y, row in enumerate(grid):
        for x, value in enumerate(row):
            if value == "1":
                rects.append(
                    f'<rect x="{qr_x + (x + 4) * module:.2f}" y="{qr_y + (y + 4) * module:.2f}" '
                    f'width="{module:.2f}" height="{module:.2f}" rx="3" fill="#080a0a"/>'
                )

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1600" viewBox="0 0 1080 1600" role="img" aria-label="Event check-in QR poster">
  <title>TECHNO BUS 2026 Event Check-in QR</title>
  <desc>Scan to open {checkin_url}</desc>
  <defs>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#39FF14" stop-opacity="0.26"/>
      <stop offset="42%" stop-color="#39FF14" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#080a0a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1b1f23"/>
      <stop offset="100%" stop-color="#0b0d0e"/>
    </linearGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1080" height="1600" fill="#080a0a"/>
  <rect width="1080" height="1600" fill="url(#glow)"/>
  <path d="M-80 1180 C210 1080 365 1285 610 1170 C790 1086 910 940 1180 1004" fill="none" stroke="#39FF14" stroke-opacity="0.12" stroke-width="18"/>
  <text x="80" y="130" fill="#39FF14" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="8">活動報到 / EVENT CHECK-IN</text>
  <text x="80" y="250" fill="#f5f5f5" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="300" letter-spacing="-3">TECHNO</text>
  <text x="80" y="340" fill="#f5f5f5" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="300" letter-spacing="-3">BUS 2026</text>
  <text x="80" y="420" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="30">掃描 QR code 完成入場報到</text>
  <text x="80" y="466" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="25">Scan to check in at the event entrance.</text>

  <rect x="300" y="500" width="480" height="480" rx="42" fill="#39FF14" filter="url(#softGlow)"/>
  <rect x="330" y="530" width="420" height="420" rx="30" fill="#39FF14"/>
  {''.join(rects)}

  <rect x="120" y="1060" width="840" height="180" rx="34" fill="url(#panel)" stroke="#39FF14" stroke-opacity="0.22"/>
  <text x="170" y="1130" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">請輸入 Email 或中文姓名完成報到</text>
  <text x="170" y="1185" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="25">Enter your email or Chinese name to check in.</text>

  <rect x="120" y="1308" width="840" height="92" rx="46" fill="#39FF14"/>
  <text x="540" y="1366" text-anchor="middle" fill="#080a0a" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" letter-spacing="2">CHECK IN NOW</text>

  <text x="80" y="1500" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="22">URL placeholder: {checkin_url}</text>
  <text x="80" y="1540" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="22">Event ID: {event_id}</text>
</svg>
'''
    path.write_text(svg, encoding="utf-8")

qr_svg(OUT / "techno-bus-checkin-qr.svg")
poster_svg(OUT / "techno-bus-checkin-qr-poster.svg")
make_real_assets()
print(OUT / "techno-bus-checkin-qr.svg")
print(OUT / "techno-bus-checkin-qr-poster.svg")
print(OUT / "techno-bus-checkin-qr.png")
print(OUT / "techno-bus-checkin-qr-poster.png")
print(checkin_url)
