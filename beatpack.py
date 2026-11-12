#!/usr/bin/env python3
"""beatpack: Ableton catalog -> loops, 9:16 loop clips, free loop packs, covers.

Stdlib only. Safe to run as `python3 -I beatpack.py ...`.
Renderers: EffectCraft (default, template JSONL) and ffmpeg + GraphicsMagick (fallback).
"""
from __future__ import annotations

import argparse
import array
import contextlib
import csv
import datetime as dt
import fcntl
import http.server
import json
import math
import os
import re
import shutil
import signal
import socket
import sqlite3
import subprocess
import sys
import threading
import urllib.parse
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

REPO = Path(__file__).resolve().parent

DEFAULTS = {
    "producer": "barlitxs",
    "root": "~/Music/loopbelt",
    "db": "~/Library/Application Support/ableton-library/library.db",
    # VCR OSD Mono is the 2021 look; its licence is unresolved (assets/fonts/
    # VCR_OSD_MONO.LICENSE-STATUS.txt). VT323 (OFL) is the free fallback.
    "font": "assets/fonts/VCR_OSD_MONO_1.001.ttf",
    "font_family": "VCR OSD Mono",
    "fallback_font": "assets/fonts/VT323-Regular.ttf",
    "fallback_font_family": "VT323",
    "ffmpeg": "ffmpeg",
    "ffprobe": "ffprobe",
    "gm": "gm",
    "bars": 8,
    "loudness_lufs": -14,
    # Loops: ceiling for both the WAV and the MP3, as true peak (limited at 4x oversampling,
    # then measured). None turns the limiter off. loop_target_lufs (None = off) gains the
    # cut toward that integrated loudness before the limiter.
    "loop_true_peak_dbtp": -1.0,
    "loop_target_lufs": None,
    "audio_codec": "aac_at",
    "audio_bitrate": "256k",
    "renderer": "effectcraft",
    "effectcraft": "~/workspace/effectcraft/repo/target/release/effectcraft-cli",
    "effectcraft_commit": "bb2d2005cee68458a10ae2cc32d609d070b21744",
    "effectcraft_template": "templates/osc-9x16.jsonl",
    "effectcraft_bitrate_kbps": 10000,
    "title": {"right_x": 1020, "top_y": 280, "title_size": 90, "line_size": 55,
              "line_pitch": 58, "gap_after_title": 10, "ascent": 0.72,
              # [dx, dy] prints the block a second time, offset (the 2021 misregistered
              # print); None (the default since 2026-11-06) prints it once.
              "double_offset": None, "double_color": None},
    # Canvas colour per clip. "fixed" (the default) uses palette_default for every clip.
    # "random2021" rolls a tint the way the 2018-19 makeCover.js did
    # (two ranges: blues/purples, or reds/oranges/pinks), seeded by the slug so a re-render
    # gives the same colour. "rotate" walks the fixed list below instead.
    "palette_mode": "fixed",
    "palette_default": "near-black",
    # One flat canvas per clip, rotated down the belt. line: where the 1 px scope runs.
    "palette": [
        {"name": "black", "bg": "#000000", "ink": "#E6E6E6", "line": "bottom"},
        {"name": "coral", "bg": "#D4554A", "ink": "#1A1A1A", "line": "left"},
        {"name": "near-black", "bg": "#0B0B0B", "ink": "#E6E6E6", "line": "bottom"},
        {"name": "brick", "bg": "#8E2E2A", "ink": "#1A1A1A", "line": "left"},
        {"name": "maroon", "bg": "#3A1A1C", "ink": "#E6E6E6", "line": "left"},
        {"name": "salmon", "bg": "#E8837A", "ink": "#1A1A1A", "line": "left"},
    ],
    # Scope geometry (both renderers) and EffectCraft Audio Waveform settings per edge,
    # from research/15-waveform-match.md: A = vertical on colour canvases, B = horizontal
    # on dark canvases. Set insideColor AND outsideColor (outside alone stays white).
    "scope": {"left_x": 40, "left_y": [300, 1600], "bottom_y": 1560, "bottom_x": [120, 960],
              "amplitude_px": 40},
    "viz_effectcraft": {
        "left": {"display_options": 1, "thickness": 0.8, "softness": 0,
                 "audio_duration_ms": 120, "displayed_samples": 600, "maximum_height": 6},
        "bottom": {"display_options": 0, "thickness": 1, "softness": 0,
                   "audio_duration_ms": 120, "displayed_samples": 600, "maximum_height": 8},
        "_display_options": "0 Digital, 1 Analog lines, 2 Analog dots",
    },
    "caption": "{bpm} BPM{key_part}. Free loop in bio.",
    "captions": "captions.txt",  # one caption per line, used in queue order; relative to beatpack.py
    "pack_readme": (
        "Free loops by {producer}.\n\n"
        "Use them in anything you make, paid or free. Credit \"prod. {producer}\" "
        "if you use one.\nDo not resell the loops on their own.\n\n"
        "Each folder has a WAV and a 320k MP3. BPM and key are in the file names.\n"
    ),
}

BELT_COLUMNS = ["slug", "set_id", "name", "title", "bpm", "key", "bars", "start_s",
                "duration_s", "source", "wav", "mp3", "clip", "clip_kind", "palette",
                "status", "updated", "hold_reason", "held_from"]
QUEUE_COLUMNS = ["date", "slug", "clip", "caption", "status", "posted_at"]
STATUS_ORDER = ["loop", "clip", "packed", "posted"]
HOLD = "hold"   # off the belt for now (rights, quality): clips and pack skip it

# Frame grid for the 1080x1920 clip: the 2021 barlitxs look (research/16). Flat canvas,
# footage as a full-width panel in the middle band, title block top right, 1 px scope.
FRAME_W, FRAME_H = 1080, 1920
FOOT_BAND_Y, FOOT_BAND_H = 900, 540

DRY_RUN = False


# ---------------------------------------------------------------- config

def load_config(path: str | None) -> dict:
    cfg = dict(DEFAULTS)
    p = Path(path) if path else REPO / "config.json"
    if p.exists():
        cfg.update(json.loads(p.read_text()))
    elif path:
        sys.exit(f"config not found: {path}")
    cfg["root"] = Path(os.path.expanduser(cfg["root"]))
    cfg["db"] = Path(os.path.expanduser(cfg["db"]))
    for tool in ("ffmpeg", "ffprobe", "gm"):
        cfg[tool] = resolve_tool(cfg[tool])
    cfg["font"], cfg["font_family"] = resolve_font(cfg)
    cfg["effectcraft"] = os.path.expanduser(cfg["effectcraft"])
    for k in ("title", "scope"):
        cfg[k] = {**DEFAULTS[k], **cfg.get(k, {})}
    ve = cfg.get("viz_effectcraft", {})
    cfg["viz_effectcraft"] = {e: {**DEFAULTS["viz_effectcraft"][e], **ve.get(e, {})}
                              for e in ("left", "bottom")}
    return cfg


def resolve_tool(name: str) -> str:
    if os.path.isabs(name) and os.access(name, os.X_OK):
        return name
    found = shutil.which(name)
    if found:
        return found
    brew = f"/opt/homebrew/bin/{Path(name).name}"
    return brew if os.access(brew, os.X_OK) else name


def resolve_font(cfg: dict) -> tuple[str, str]:
    """(path, family). The configured font, else the OFL fallback."""
    for key, fam in (("font", "font_family"), ("fallback_font", "fallback_font_family")):
        f = Path(os.path.expanduser(cfg[key]))
        f = f if f.is_absolute() else REPO / f
        if f.exists():
            return str(f), cfg[fam]
    sys.exit("no font found; set \"font\" in config.json")


def paths(cfg: dict) -> dict:
    root = cfg["root"]
    return {
        "root": root, "loops": root / "loops", "inbox": root / "inbox",
        "clips": root / "clips", "packs": root / "packs", "work": root / ".work",
        "belt": root / "belt.csv", "queue": root / "queue.csv", "state": root / "state.json",
    }


# ---------------------------------------------------------------- pure helpers

def bar_seconds(bpm: float, beats_per_bar: int = 4) -> float:
    """Length of one bar in seconds (port of getLengthOfABar)."""
    if bpm <= 0:
        raise ValueError("bpm must be positive")
    return beats_per_bar * 60.0 / bpm


def bars_to_seconds(bpm: float, bars: int, beats_per_bar: int = 4) -> float:
    """Port of getLengthOfBars from process/getSongDurationInSeconds.js."""
    return bars * bar_seconds(bpm, beats_per_bar)


def loudest_start_bar(bar_energy: list[float], bars: int, step: int = 4) -> int:
    """Start bar (0-based, on a `step`-bar phrase grid) of the loudest `bars` window."""
    n = len(bar_energy)
    if n <= bars:
        return 0
    best, best_i = -1.0, 0
    for i in range(0, n - bars + 1, max(1, step)):
        e = sum(bar_energy[i:i + bars])
        if e > best:
            best, best_i = e, i
    return best_i


KEY_RE = re.compile(
    r"(?<![a-z0-9])([a-g])\s?(#|b|sharp|flat)?\s?(major|minor|maj|min|m)(?![a-z])")


def parse_key(text: str) -> str:
    """'ssg 126 Db major' -> 'Db major'; 'regal 180 bpm a minor' -> 'A minor'; else ''."""
    m = KEY_RE.search(text.lower())
    if not m:
        return ""
    note, acc, mode = m.groups()
    acc = {"sharp": "#", "flat": "b", None: ""}.get(acc, acc)
    mode = "major" if mode in ("major", "maj") else "minor"
    return f"{note.upper()}{acc} {mode}"


def key_line(key: str) -> str:
    """'Bb major' -> 'bb major' (the 2021 block writes keys in lower case)."""
    return key.lower()


def clean_title(name: str, bpm: str = "") -> str:
    """'regal 180 bpm a minor' -> 'REGAL'; 'ssg 126 Db major' (bpm 126) -> 'SSG'."""
    s = re.sub(r"\(prod\.[^)]*\)", " ", name, flags=re.I)
    s = re.sub(r"\d+(\.\d+)?\s?bpm", " ", s, flags=re.I)
    s = KEY_RE.sub(" ", s.lower())
    if bpm:
        s = re.sub(rf"(?<![0-9]){re.escape(bpm)}(?![0-9])", " ", s)
    s = re.sub(r"\s+", " ", s).strip(" -_")
    return (s or name).upper()


def title_lines(cfg: dict, title: str, bpm: str, key: str) -> list[tuple[str, int, int]]:
    """The four-line block as (text, size px, top y), in the owner's 2021 order:
    title, prod. name, bpm, key (key omitted if unknown)."""
    t = cfg["title"]
    texts = [title, f"prod. {cfg['producer']}", f"{bpm} bpm"] + ([key_line(key)] if key else [])
    out, y = [(texts[0], t["title_size"], t["top_y"])], t["top_y"] + t["title_size"] + t["gap_after_title"]
    for tx in texts[1:]:
        out.append((tx, t["line_size"], y))
        y += t["line_pitch"]
    return out


def palette_2021(seed: str) -> dict:
    """The old makeCover.js tint roll, seeded. v1: r 0-255, g 0-130, b 175-255 (blues,
    purples, magentas). v2: r 205-255, g 0-190, b 0 or 175-255 (reds, oranges, pinks).
    Ink and scope edge follow the canvas luminance: dark canvas, light ink, line along
    the bottom; light canvas, dark ink, line down the left or right edge."""
    import random
    rnd = random.Random(seed)
    if rnd.random() < 0.5:
        r, g, b = rnd.randint(0, 255), rnd.randint(0, 130), rnd.randint(175, 255)
    else:
        r, g, b = rnd.randint(205, 255), rnd.randint(0, 190), rnd.choice([0, rnd.randint(175, 255)])
    return palette_from_bg(f"#{r:02X}{g:02X}{b:02X}", seed)


def palette_from_bg(bg: str, seed: str) -> dict:
    """Ink and scope edge for a canvas hex; the edge pick is seeded so it repeats."""
    import random
    bg = bg.upper()
    r, g, b = (int(bg[i:i + 2], 16) for i in (1, 3, 5))
    lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    dark = lum < 0.35
    line = "bottom" if dark else random.Random(seed + "/edge").choice(["left", "right"])
    return {"name": bg, "bg": bg, "ink": "#E6E6E6" if dark else "#1A1A1A", "line": line}


def pick_palette(cfg: dict, belt: list[dict], row: dict, name: str | None = None) -> dict:
    """A forced name or #hex, else the row's stored named entry; then by palette_mode:
    fixed -> palette_default (stored hexes from earlier rolls are ignored), random2021 ->
    the stored hex or a seeded 2021-style roll, rotate -> by belt position."""
    pal = cfg["palette"]
    mode = cfg.get("palette_mode", "rotate")
    want = name or row.get("palette")
    for p in pal:
        if p["name"] == want:
            return p
    if mode == "fixed" and not name:
        dflt = cfg.get("palette_default", "near-black")
        return next((p for p in pal if p["name"] == dflt), pal[0] if pal else
                    palette_from_bg("#0B0B0B", row.get("slug", "")))
    if want and re.fullmatch(r"#[0-9A-Fa-f]{6}", want):
        return palette_from_bg(want, row.get("slug", "") or want)  # stored hex repeats
    if name and re.fullmatch(r"#[0-9A-Fa-f]{6}", name):
        return palette_from_bg(name, row.get("slug", "") or name)
    if mode == "random2021":
        return palette_2021(row.get("slug", "") or str(belt.index(row)))
    return pal[belt.index(row) % len(pal)]


def key_short(key: str) -> str:
    """'A minor' -> 'Amin' (for file names)."""
    if not key:
        return ""
    note, mode = key.split(" ", 1)
    return note + ("maj" if mode == "major" else "min")


def fmt_bpm(bpm: float) -> str:
    return str(int(round(bpm))) if abs(bpm - round(bpm)) < 0.01 else f"{bpm:.1f}"


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"\s+project$", "", s)
    s = re.sub(r"\(prod\.[^)]*\)", " ", s)
    s = re.sub(r"\d+(\.\d+)?\s?bpm", " ", s)
    s = KEY_RE.sub(" ", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:48].strip("-")


def _caption_lines(cfg: dict) -> list[str]:
    name = str(cfg.get("captions") or "")
    if not name:
        return []
    p = Path(os.path.expanduser(name))
    p = p if p.is_absolute() else REPO / p
    if not p.is_file():
        return []
    return [ln.strip() for ln in p.read_text().splitlines()
            if ln.strip() and not ln.lstrip().startswith("#")]


def load_captions(cfg: dict) -> list[str]:
    """Captions pack may assign by position: every line not marked "? " ([] if file missing)."""
    return [ln for ln in _caption_lines(cfg) if not ln.startswith("?")]


def hand_captions(cfg: dict) -> list[str]:
    """Hand-pick-only lines ("? " prefix, stripped): never assigned automatically."""
    return [ln[1:].strip() for ln in _caption_lines(cfg) if ln.startswith("?")]


def fill_caption(line: str, bpm: str, key: str) -> str:
    if key:
        return line.replace("{bpm}", bpm).replace("{key}", key)
    s = line.replace("{bpm}", bpm).replace("{key}", "")
    s = re.sub(r"\s+([,.])", r"\1", s)       # space before punctuation
    s = re.sub(r",\s*(?=[.,]|$)", "", s)      # dangling comma
    return re.sub(r"\s{2,}", " ", s).strip()


def caption_for(cfg: dict, bpm: str, key: str, index: int | None = None) -> str:
    lines = load_captions(cfg) if index is not None else []
    if lines:
        return fill_caption(lines[index % len(lines)], bpm, key)
    return cfg["caption"].format(bpm=bpm, key=key, key_part=f", {key}" if key else "",
                                 producer=cfg["producer"])


def next_dates(existing: list[str], count: int, today: dt.date) -> list[str]:
    """One date per day, starting the day after max(today, last queued date)."""
    last = today
    for d in existing:
        try:
            last = max(last, dt.date.fromisoformat(d))
        except ValueError:
            pass
    return [(last + dt.timedelta(days=i + 1)).isoformat() for i in range(count)]


def status_at_least(status: str, floor: str) -> bool:
    if status not in STATUS_ORDER:
        return False
    return STATUS_ORDER.index(status) >= STATUS_ORDER.index(floor)


def gm_text(s: str) -> str:
    """Make a string safe inside gm -draw "text x,y '...'"."""
    return s.replace("\\", "").replace("'", "").replace('"', "")


def footage_geometry(src_w: int, src_h: int) -> tuple[int, int, int]:
    """Scaled footage height (even), crop height, and overlay y inside the middle band."""
    h = int(round(src_h * FRAME_W / src_w / 2.0)) * 2
    crop_h = min(h, FOOT_BAND_H)
    return h, crop_h, FOOT_BAND_Y + (FOOT_BAND_H - crop_h) // 2


VIZ_KINDS = ("osc", "bars", "strip")


def right_scope_x(cfg: dict) -> int:
    """Right-edge scope x: 22 px further out than the mirror of left_x (1062, not 1040), so
    the line clears the title block's right edge at right_x 1020 instead of touching it."""
    return FRAME_W - cfg["scope"]["left_x"] + 22


def scope_box(cfg: dict, line: str) -> tuple[int, int, int, int, bool]:
    """(x, y, w, h, vertical) of the visualizer box for a palette's line edge."""
    sc, a = cfg["scope"], cfg["scope"]["amplitude_px"]
    if line in ("left", "right"):
        y0, y1 = sc["left_y"]
        x = sc["left_x"] if line == "left" else right_scope_x(cfg)
        return x - a // 2, y0, a, y1 - y0, True
    x0, x1 = sc["bottom_x"]
    return x0, sc["bottom_y"] - a // 2, x1 - x0, a, False


def ff_color(hex_color: str) -> str:
    return "0x" + hex_color.lstrip("#")


def viz_chain(viz: str, src: str, out: str, *, box: tuple, ink: str, bound: float,
              strip_input: int | None = None) -> str:
    """Visualizer in the ink colour with a transparent ground, from audio label `src`.

    Drawn white as a mask, rotated for a vertical edge, then alphamerged onto a solid
    of the ink colour (colorkey on black would also eat a dark ink).
    osc:   1 px oscilloscope trace (showwaves p2p) at 30 fps (each frame shows the last ~33 ms).
    bars:  showfreqs spectrum, thresholded into 60 bars.
    strip: static whole-loop showwavespic (input `strip_input`), the fallback.
    """
    _, _, w, h, vertical = box
    length, amp = (h, w) if vertical else (w, h)
    rot = ",transpose=clock" if vertical else ""
    if viz == "osc":
        mask = (f"[{src}]aformat=channel_layouts=mono,showwaves=s={length}x{amp}:mode=p2p:"
                f"draw=full:rate=30:colors=white,format=gray{rot}[{out}m]")
    elif viz == "bars":
        bars = 60
        mask = (f"[{src}]aformat=channel_layouts=mono,showfreqs=s={length}x{amp}:mode=bar:"
                "ascale=log:fscale=log:win_size=2048:overlap=0.5:averaging=2:colors=white:rate=30,"
                f"format=gray,scale={bars}:{amp}:flags=area,lut=y='if(gt(val,96),255,0)',"
                f"scale={length}:{amp}:flags=neighbor,drawgrid=w={max(1, length // bars)}:h=ih+1:"
                f"t=3:c=black{rot}[{out}m]")
    elif viz == "strip":
        if strip_input is None:
            raise ValueError("strip needs a waveform PNG input")
        mask = f"[{src}]anullsink;[{strip_input}:v]format=gray{rot}[{out}m]"
    else:
        raise ValueError(f"unknown viz {viz!r}; choose from {', '.join(VIZ_KINDS)}")
    return (f"{mask};color=c={ff_color(ink)}:s={w}x{h}:r=30:d={bound:.3f}[{out}c];"
            f"[{out}c][{out}m]alphamerge[{out}]")


def clip_filtergraph(*, src_w: int | None, src_h: int | None, audio: str, loudnorm: str | None,
                     palette: dict, box: tuple, bound: float, viz: str = "osc",
                     strip_input: int | None = None, text_input: int | None = None) -> str:
    """Filtergraph for the 9:16 clip (2021 look).

    Inputs: [0:v] footage (screen recording or still), [1:v] title-block PNG,
    `audio` = the audio input label ('0:a' for a recording, never re-cut).
    Canvas mode (src_w is None): no footage input at all, so the scale/overlay stage is
    skipped and the title PNG is input `text_input` (default 0).
    """
    x, y = box[0], box[1]
    canvas = src_w is None
    tx = 0 if (canvas and text_input is None) else (text_input if text_input is not None else 1)
    parts = [f"color=c={ff_color(palette['bg'])}:s={FRAME_W}x{FRAME_H}:r=30:d={bound:.3f}[cv]"]
    if canvas:
        parts.append("[cv]null[base]")
    else:
        h, crop_h, fy = footage_geometry(src_w, src_h)
        parts += [f"[0:v]fps=30,scale={FRAME_W}:{h},crop={FRAME_W}:{crop_h},setsar=1[fg]",
                  f"[cv][fg]overlay=0:{fy}:shortest=1[base]"]
    parts += [
        f"[{audio}]asplit=2[aw][an]",
        viz_chain(viz, "aw", "wv", box=box, ink=palette["ink"], bound=bound,
                  strip_input=strip_input),
        f"[base][wv]overlay={x}:{y}:shortest=1[v1]",
        f"[{tx}:v]format=rgba[tx]",
        "[v1][tx]overlay=0:0:shortest=1,format=yuv420p[v]",
        f"[an]{loudnorm + ',' if loudnorm else ''}aresample=48000[aud]",
    ]
    return ";\n".join(parts)


def loudnorm_filter(target: float, measured: dict | None) -> str | None:
    """Second-pass loudnorm string from first-pass JSON; None if unmeasurable (silence)."""
    if not measured:
        return None
    try:
        mi = float(measured["input_i"])
    except (KeyError, ValueError):
        return None
    if math.isinf(mi) or mi < -70:
        return None
    return (f"loudnorm=I={target}:TP=-1:LRA=11:measured_I={measured['input_i']}:"
            f"measured_TP={measured['input_tp']}:measured_LRA={measured['input_lra']}:"
            f"measured_thresh={measured['input_thresh']}:offset={measured['target_offset']}:"
            "linear=true")


# ---------------------------------------------------------------- lifecycle
#
# The one place that says what a belt row may do. States are STATUS_ORDER plus HOLD:
#
#   (none) --cut--> loop --render--> clip --pack--> packed --post--> posted
#   loop|clip|packed --hold--> hold --unhold--> held_from (loop if its clip is gone)
#   loop --recut--> loop        clip|packed --reset_recut--> loop (clip blanked)
#   clip|packed --render (re-render)--> same state
#   posted is terminal: nothing moves or rewrites it (post again only re-dates the queue row)
#
# Every writer builds its change through transition(); a transition that is not legal
# from the row's current state raises IllegalTransition, and the caller skips and says so.
# transition() also refuses to touch any field outside the transition's own set.

CUT_FIELDS = {"slug", "set_id", "name", "title", "bpm", "key", "bars", "start_s",
              "duration_s", "source", "wav", "mp3", "clip", "clip_kind", "updated"}
TRANSITIONS = {
    # name: (states it is legal from, fields it may change)
    "cut": ({None}, set(BELT_COLUMNS)),
    "recut": ({"loop", HOLD}, CUT_FIELDS),
    "reset_recut": ({"clip", "packed", HOLD}, CUT_FIELDS | {"status", "held_from"}),
    "render": ({"loop", "clip", "packed"},
               {"clip", "clip_kind", "palette", "title", "updated", "status"}),
    "pack": ({"clip"}, {"status", "updated"}),
    "hold": ({"loop", "clip", "packed", HOLD},
             {"status", "hold_reason", "held_from", "updated"}),
    "unhold": ({HOLD}, {"status", "hold_reason", "held_from", "updated"}),
    "post": ({"clip", "packed", "posted"}, {"status", "updated"}),
}


class IllegalTransition(Exception):
    pass


def recut_transition(row: dict | None, reset: bool) -> str:
    """Which cut transition applies to this set's existing row. --force alone re-imports
    only rows still in loop; rewinding a clip or packed row needs reset=True (the
    --reset-progress flag); posted rows are never cut again."""
    if row is None:
        return "cut"
    state = row["status"]
    far = row["held_from"] if state == HOLD else state
    if far == "posted":
        raise IllegalTransition("is posted and is never re-cut")
    if far in ("clip", "packed"):
        if not reset:
            raise IllegalTransition(f"is {far}; --force alone keeps it, "
                                    "--reset-progress rewinds it to loop")
        return "reset_recut"
    return "recut"


def reconcile_queue(P: dict, slug: str) -> None:
    """A rewound row loses its queued queue.csv row (its clip reference is stale); a
    posted queue row is history and stays."""
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    kept = [q for q in queue if not (q["slug"] == slug and q["status"] == "queued")]
    if len(kept) != len(queue):
        write_csv(P["queue"], QUEUE_COLUMNS, kept)
        print(f"queue {slug} dropped from {P['queue']}")


def transition(row: dict | None, name: str, **kw) -> dict:
    """Apply transition `name` to `row` (None for a new row) and return the row.
    cut/recut/reset_recut take new=<fresh cut_loop row>; hold takes reason=; unhold takes
    clip_exists=; render takes fields=<dict>."""
    legal, allowed = TRANSITIONS[name]
    state = None if row is None else row["status"]
    held_from = "" if row is None else row["held_from"]
    if state not in legal:
        raise IllegalTransition(f"cannot {name} a row that is {state or 'new'}")
    if state == HOLD and name in ("recut", "reset_recut"):
        # A held row is as far along as it was when held.
        if (held_from in ("clip", "packed")) != (name == "reset_recut"):
            raise IllegalTransition(f"cannot {name} a row held from {held_from or 'loop'}")
    before = dict(row) if row else {c: "" for c in BELT_COLUMNS}
    new = dict(row) if row else {c: "" for c in BELT_COLUMNS}
    if name in ("cut", "recut", "reset_recut"):
        fresh = {k: v for k, v in kw["new"].items() if not k.startswith("_") and k != "status"}
        new.update(fresh)
        if name == "cut":
            new["status"] = "loop"
        elif name == "reset_recut":
            if state == HOLD:
                new["held_from"] = "loop"
            else:
                new["status"] = "loop"
        else:
            new["status"] = state            # a recut never moves the row
        if row and row.get("title") and name != "cut":
            new["title"] = row["title"]    # hand edits survive a re-cut
    elif name == "render":
        new.update(kw["fields"])
        if state == "loop":
            new["status"] = "clip"
    elif name == "pack":
        new.update(status="packed", updated=now())
    elif name == "hold":
        if state != HOLD:
            new["held_from"] = state
        new.update(status=HOLD, hold_reason=kw.get("reason", ""), updated=now())
    elif name == "unhold":
        back = held_from if held_from in STATUS_ORDER else "loop"
        if back != "loop" and not kw.get("clip_exists"):
            back = "loop"
        new.update(status=back, hold_reason="", held_from="", updated=now())
    elif name == "post":
        if state != "posted":
            new.update(status="posted", updated=now())
    stray = {k for k in new if new[k] != before.get(k, "")} - allowed
    if stray:
        raise AssertionError(f"transition {name} touched {sorted(stray)}")
    if row is None:
        return new
    row.update(new)
    return row


# ---------------------------------------------------------------- csv

def read_csv(path: Path, columns: list[str]) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline="") as f:
        return [{c: row.get(c, "") or "" for c in columns} for row in csv.DictReader(f)]


def write_csv(path: Path, columns: list[str], rows: list[dict]) -> None:
    if DRY_RUN:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in columns})
    os.replace(tmp, path)


_LOCK_STATE = threading.local()
_LOCK_THREADS = threading.RLock()


@contextlib.contextmanager
def locked(P: dict):
    """Exclusive lock on belt.csv and queue.csv together (flock on <root>/.belt.lock, plus a
    thread lock because the server runs jobs in threads). Re-entrant. Hold it only for
    read, change, write: never across a render."""
    if DRY_RUN:
        yield
        return
    with _LOCK_THREADS:
        depth = getattr(_LOCK_STATE, "depth", 0)
        if depth == 0:
            P["root"].mkdir(parents=True, exist_ok=True)
            _LOCK_STATE.fd = (P["root"] / ".belt.lock").open("a")
            fcntl.flock(_LOCK_STATE.fd, fcntl.LOCK_EX)
        _LOCK_STATE.depth = depth + 1
        try:
            yield
        finally:
            _LOCK_STATE.depth -= 1
            if _LOCK_STATE.depth == 0:
                fcntl.flock(_LOCK_STATE.fd, fcntl.LOCK_UN)
                _LOCK_STATE.fd.close()


def upsert(rows: list[dict], row: dict, key: str = "slug") -> None:
    for i, r in enumerate(rows):
        if r[key] == row[key]:
            rows[i] = {**r, **row}
            return
    rows.append(row)


def now() -> str:
    return dt.datetime.now().replace(microsecond=0).isoformat()


# ---------------------------------------------------------------- subprocess

def run(cmd: list[str], *, capture: bool = False) -> subprocess.CompletedProcess:
    print("  $ " + " ".join(q(c) for c in cmd), file=sys.stderr)
    if DRY_RUN:
        return subprocess.CompletedProcess(cmd, 0, b"", b"")
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode != 0:
        tail = res.stderr.decode(errors="replace")[-1500:]
        raise RuntimeError(f"{Path(cmd[0]).name} failed ({res.returncode}):\n{tail}")
    return res


def q(s: str) -> str:
    return s if re.fullmatch(r"[\w@%+=:,./-]+", s) else "'" + s.replace("'", "'\\''") + "'"


def probe(cfg: dict, path: Path) -> dict:
    res = subprocess.run([cfg["ffprobe"], "-v", "error", "-show_entries",
                          "format=duration:stream=codec_type,width,height,codec_name,sample_rate",
                          "-of", "json", str(path)], capture_output=True)
    if res.returncode != 0:
        raise RuntimeError(f"ffprobe could not read {path}")
    data = json.loads(res.stdout or b"{}")
    streams = data.get("streams", [])
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    a = next((s for s in streams if s.get("codec_type") == "audio"), None)
    return {
        "sample_rate": int(a.get("sample_rate") or 0) if a else 0,
        "duration": float(data.get("format", {}).get("duration", 0) or 0),
        "has_audio": any(s.get("codec_type") == "audio" for s in streams),
        "width": int(v["width"]) if v else 0,
        "height": int(v["height"]) if v else 0,
    }


def bar_energies(cfg: dict, audio: Path, bpm: float, beats: int) -> list[float]:
    """Decode to mono 2 kHz and sum squares per bar. Assumes the render starts on bar 1."""
    rate = 2000
    res = subprocess.run([cfg["ffmpeg"], "-v", "error", "-i", str(audio), "-ac", "1",
                          "-ar", str(rate), "-f", "s16le", "-"], capture_output=True)
    if res.returncode != 0:
        raise RuntimeError(f"could not decode {audio}")
    samples = array.array("h")
    samples.frombytes(res.stdout[: len(res.stdout) // 2 * 2])
    per_bar = bar_seconds(bpm, beats) * rate
    out, i = [], 0
    while (i + 1) * per_bar <= len(samples):
        a, b = int(i * per_bar), int((i + 1) * per_bar)
        out.append(sum(x * x for x in samples[a:b]) / max(1, b - a))
        i += 1
    return out


def measure_loudness(cfg: dict, audio_input: list[str], t: float | None) -> dict | None:
    cmd = [cfg["ffmpeg"], "-hide_banner", "-nostats", *audio_input]
    if t:
        cmd += ["-t", f"{t:.3f}"]
    cmd += ["-af", f"loudnorm=I={cfg['loudness_lufs']}:TP=-1:LRA=11:print_format=json",
            "-vn", "-f", "null", "-"]
    if DRY_RUN:
        print("  $ " + " ".join(q(c) for c in cmd), file=sys.stderr)
        return None
    res = subprocess.run(cmd, capture_output=True)
    err = res.stderr.decode(errors="replace")
    m = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S)
    return json.loads(m[-1]) if m else None


# ---------------------------------------------------------------- catalog

@dataclass
class CatalogSet:
    set_id: int
    name: str
    als_path: str
    bpm: float
    beats: int
    preview: str
    key: str = ""
    extra: dict = field(default_factory=dict)


def open_catalog(cfg: dict) -> sqlite3.Connection:
    if not cfg["db"].exists():
        sys.exit(f"catalog not found: {cfg['db']}")
    con = sqlite3.connect(f"file:{cfg['db']}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def set_ids_for_list(con: sqlite3.Connection, list_name: str) -> list[int]:
    rows = con.execute(
        "SELECT s.id FROM lists l JOIN list_items li ON li.list_id = l.id "
        "JOIN sets s ON s.als_path = li.als_path WHERE l.name = ? COLLATE NOCASE "
        "ORDER BY li.added_at", (list_name,)).fetchall()
    if not rows:
        names = [r[0] for r in con.execute("SELECT name FROM lists")]
        sys.exit(f"list '{list_name}' is empty or missing; lists: {', '.join(names)}")
    return [r[0] for r in rows]


def load_set(con: sqlite3.Connection, set_id: int) -> CatalogSet:
    r = con.execute(
        "SELECT s.id, s.als_path, s.tempo, s.time_signature, p.name AS pname, p.folder_path "
        "FROM sets s JOIN projects p ON p.id = s.project_id WHERE s.id = ?", (set_id,)).fetchone()
    if not r:
        raise LookupError(f"set {set_id} not in catalog")
    pv = con.execute(
        "SELECT audio_path FROM previews WHERE set_id = ? "
        "ORDER BY is_primary DESC, confidence DESC, mtime DESC LIMIT 1", (set_id,)).fetchone()
    if not pv:
        raise LookupError(f"set {set_id} has no preview render")
    preview = pv[0]
    if not os.path.isabs(preview):
        preview = os.path.join(r["folder_path"], preview)
    name = re.sub(r"\s+Project$", "", r["pname"]).strip()
    stem = Path(r["als_path"]).stem
    beats = 4
    if r["time_signature"] and "/" in r["time_signature"]:
        try:
            beats = int(r["time_signature"].split("/")[0])
        except ValueError:
            pass
    if not r["tempo"]:
        raise LookupError(f"set {set_id} has no tempo")
    return CatalogSet(set_id=r["id"], name=name, als_path=r["als_path"], bpm=float(r["tempo"]),
                      beats=beats, preview=preview, key=parse_key(name) or parse_key(stem))


# ---------------------------------------------------------------- loops

LOOP_OVERSAMPLE = 4
TP_MARGIN_DB = 0.3      # first try limits this far under the ceiling; MP3 encoding adds a little


def db_to_lin(db: float) -> float:
    return 10 ** (db / 20)


def loop_filter(start: float, length: float, *, rate: int, ceiling_db: float | None = None,
                gain_db: float | None = None, fade: float = 0.005) -> str:
    """The -af chain for one loop. The limiter runs on the whole source (so it has context
    either side of the cut), at 4x the rate so inter-sample peaks are caught, with its
    lookahead delay compensated (latency=1) so the cut does not move. Then the
    sample-accurate atrim and the 5 ms fades, so the loop does not click."""
    parts = []
    if gain_db:
        parts.append(f"volume={gain_db:.2f}dB")
    if ceiling_db is not None:
        limit = min(1.0, max(0.0625, db_to_lin(ceiling_db)))
        parts += [f"aresample={rate * LOOP_OVERSAMPLE}",
                  f"alimiter=limit={limit:.6f}:level=0:latency=1",
                  f"aresample={rate}"]
    parts += [f"atrim=start={start:.6f}:duration={length:.6f}", "asetpts=PTS-STARTPTS",
              f"afade=t=in:d={fade}",
              f"afade=t=out:st={max(0.0, length - fade):.6f}:d={fade}"]
    return ",".join(parts)


def parse_ebur128(stderr: str) -> dict:
    """Integrated loudness and true peak from ffmpeg's ebur128=peak=true summary."""
    out = {}
    m = re.findall(r"\bI:\s+(-?[\d.]+|-inf) LUFS", stderr)
    if m:
        out["lufs"] = float(m[-1])
    m = re.findall(r"Peak:\s+(-?[\d.]+|-inf) dBFS", stderr)
    if m:
        out["true_peak"] = float(m[-1])
    return out


def measure_ebur128(cfg: dict, path: Path, af_prefix: str = "") -> dict:
    cmd = [cfg["ffmpeg"], "-hide_banner", "-nostats", "-i", str(path), "-af",
           f"{af_prefix}ebur128=peak=true", "-f", "null", "-"]
    if DRY_RUN:
        print("  $ " + " ".join(q(c) for c in cmd), file=sys.stderr)
        return {}
    res = subprocess.run(cmd, capture_output=True)
    return parse_ebur128(res.stderr.decode(errors="replace"))


def cmd_loops(cfg: dict, args) -> int:
    P = paths(cfg)
    con = open_catalog(cfg)
    ids = list(args.ids or [])
    if args.list:
        ids += set_ids_for_list(con, args.list)
    if not ids:
        sys.exit("give --ids or --list")
    if args.audio and len(ids) != 1:
        sys.exit("--audio overrides the preview for one set only")
    belt = read_csv(P["belt"], BELT_COLUMNS)
    bars = args.bars or int(cfg["bars"])
    failures = 0
    for sid in ids:
        try:
            cs = load_set(con, sid)
        except LookupError as e:
            print(f"skip {sid}: {e}", file=sys.stderr)
            failures += 1
            continue
        existing = next((r for r in belt if r["set_id"] == str(sid)), None)
        if existing and not args.force:
            print(f"skip {sid}: already on the belt as '{existing['slug']}' (use --force)")
            continue
        if existing:
            try:
                recut_transition(existing, args.reset_progress)
            except IllegalTransition as e:
                print(f"skip {sid}: '{existing['slug']}' {e}")
                continue
        slug = existing["slug"] if existing else unique_slug(slugify(cs.name) or f"set-{sid}", sid, belt)
        src = Path(args.audio or cs.preview)
        keep_start = None
        if (existing and not args.audio and args.at is None and args.at_bar is None
                and existing["start_s"] and existing["bars"] == str(bars)):
            # A re-cut keeps the window and source it had; --at/--at-bar/--audio move it.
            keep_start = float(existing["start_s"])
            if existing["source"] and Path(existing["source"]).exists():
                src = Path(existing["source"])
        if not src.exists():
            print(f"skip {sid}: preview missing on disk: {src}", file=sys.stderr)
            failures += 1
            continue
        try:
            row = cut_loop(cfg, P, cs, slug, src, bars, args, start=keep_start)
        except RuntimeError as e:
            print(f"fail {slug}: {e}", file=sys.stderr)
            failures += 1
            continue
        tp = row.pop("_tp", "")
        with locked(P):   # the cut took minutes: re-read, and apply only this transition
            belt = read_csv(P["belt"], BELT_COLUMNS)
            current = next((r for r in belt if r["set_id"] == str(sid)), None)
            try:
                if current is None and any(r["slug"] == slug for r in belt):
                    raise IllegalTransition(f"slug {slug} was taken while this was cutting")
                if (current is None) != (existing is None):
                    raise IllegalTransition("the belt changed while this was cutting")
                if current and not args.force:
                    raise IllegalTransition("already on the belt")
                name = recut_transition(current, args.reset_progress)
                if current is None:
                    row = transition(None, name, new=row)
                    belt.append(row)
                else:
                    transition(current, name, new=row)
                    row = current
                    if name == "reset_recut":
                        reconcile_queue(P, slug)
            except IllegalTransition as e:
                print(f"skip {sid} ({slug}): {e}", file=sys.stderr)
                failures += 1
                continue
            write_csv(P["belt"], BELT_COLUMNS, belt)
        print(f"loop  {slug}: {row['bpm']} BPM {row['key'] or '(no key)'}, "
              f"{bars} bars from {row['start_s']} s{tp} -> {row['wav']}")
    return 1 if failures else 0


def unique_slug(base: str, set_id: int, belt: list[dict]) -> str:
    taken = {r["slug"] for r in belt}
    return base if base not in taken else f"{base}-{set_id}"


def cut_loop(cfg: dict, P: dict, cs: CatalogSet, slug: str, src: Path, bars: int, args,
             start: float | None = None) -> dict:
    info = probe(cfg, src)
    length = bars_to_seconds(cs.bpm, bars, cs.beats)
    bar_len = bar_seconds(cs.bpm, cs.beats)
    if start is not None:
        pass
    elif args.at is not None:
        start = float(args.at)
    elif args.at_bar is not None:
        start = (args.at_bar - 1) * bar_len
    else:
        energies = bar_energies(cfg, src, cs.bpm, cs.beats) if not DRY_RUN else []
        start = loudest_start_bar(energies, bars) * bar_len
    if info["duration"] and start + length > info["duration"]:
        start = max(0.0, info["duration"] - length)
        length = min(length, info["duration"])
    out_dir = P["loops"] / slug
    if not DRY_RUN:
        out_dir.mkdir(parents=True, exist_ok=True)
    bpm = fmt_bpm(cs.bpm)
    base = "_".join(x for x in (slug, f"{bpm}bpm", key_short(cs.key)) if x)
    wav, mp3 = out_dir / f"{base}.wav", out_dir / f"{base}.mp3"
    rate = info.get("sample_rate") or 44100
    tp_max = cfg.get("loop_true_peak_dbtp")
    gain = None
    if cfg.get("loop_target_lufs") is not None:
        trim = f"atrim=start={start:.6f}:duration={length:.6f},"
        lufs = measure_ebur128(cfg, src, trim).get("lufs")
        if lufs is not None and lufs > -70:
            gain = float(cfg["loop_target_lufs"]) - lufs
    ceiling = None if tp_max is None else float(tp_max) - TP_MARGIN_DB
    peaks = {}
    for _ in range(4):
        af = loop_filter(start, length, rate=rate, ceiling_db=ceiling, gain_db=gain)
        run([cfg["ffmpeg"], "-v", "error", "-y", "-i", str(src), "-af", af,
             "-c:a", "pcm_s24le", str(wav)])
        # Port of process/encode.js: libmp3lame CBR 320k.
        run([cfg["ffmpeg"], "-v", "error", "-y", "-i", str(wav), "-c:a", "libmp3lame",
             "-b:a", "320k", str(mp3)])
        if tp_max is None or DRY_RUN:
            break
        peaks = {f: measure_ebur128(cfg, f).get("true_peak") for f in (wav, mp3)}
        over = max((v for v in peaks.values() if v is not None), default=None)
        if over is None or over <= float(tp_max):
            break
        ceiling -= (over - float(tp_max)) + 0.1   # tighten by the overshoot and go again
    else:
        raise RuntimeError(f"true peak {over:.1f} dBTP still above {tp_max} after 4 tries")
    tp_note = ""
    if peaks:
        tp_note = (f", true peak wav {peaks[wav]:.1f} / mp3 {peaks[mp3]:.1f} dBTP"
                   if None not in peaks.values() else "")
    return {"slug": slug, "set_id": str(cs.set_id), "name": cs.name,
            "title": clean_title(cs.name, bpm), "bpm": bpm, "key": cs.key,
            "bars": str(bars), "start_s": f"{start:.3f}", "duration_s": f"{length:.3f}",
            "source": str(src), "wav": str(wav), "mp3": str(mp3), "clip": "", "clip_kind": "",
            "status": "loop", "updated": now(), "_tp": tp_note}


# ---------------------------------------------------------------- clips

@dataclass
class ClipJob:
    slug: str
    footage: Path | None     # screen recording, or still image in fallback mode (None: canvas)
    is_still: bool
    audio: Path | None       # None: use the recording's own audio
    duration: float | None   # only bounds still/looped inputs; recordings are never cut
    text_png: Path
    out: Path
    bpm: str
    key: str
    title: str = ""
    palette: dict = field(default_factory=dict)
    viz: str = "osc"
    canvas: bool = False     # no footage at all: the clip is the title block and the scope


def title_draws(cfg: dict, lines: list, ink: str, scale: float = 1.0) -> list[str]:
    """gm arguments for the doubled title block (gravity NorthEast, right edge at right_x).
    Second copy only if double_offset is set: that many px right and down, same ink unless
    double_color is set."""
    t = cfg["title"]
    right = (FRAME_W - t["right_x"]) * scale
    args = ["-gravity", "NorthEast", "-font", cfg["font"]]
    copies = [(0, 0, ink)]
    if t.get("double_offset"):
        dx, dy = t["double_offset"]
        copies.append((dx, dy, t["double_color"] or ink))
    for ox, oy, color in copies:
        args += ["-fill", color]
        for text, size, top in lines:
            base = (top + t["ascent"] * size + oy) * scale   # gm draws at the baseline
            args += ["-pointsize", f"{size * scale:g}",
                     "-draw", f"text {right - ox * scale:g},{base:g} '{gm_text(text)}'"]
    return args


def make_text_png(cfg: dict, out: Path, job: ClipJob) -> None:
    """The four-line block, printed twice, as one transparent 1080x1920 PNG (ffmpeg path)."""
    lines = title_lines(cfg, job.title, job.bpm, job.key)
    run([cfg["gm"], "convert", "-size", f"{FRAME_W}x{FRAME_H}", "xc:none",
         *title_draws(cfg, lines, job.palette["ink"]), str(out)])


def render_ffmpeg(cfg: dict, job: ClipJob) -> None:
    # Every looped image input gets an input-side -t. Without it a `-loop 1` still keeps
    # producing frames after the audio (and the visualizer) end, and the graph never
    # finishes (measured: stalls at 14.6 s of a 15.2 s loop with the osc visualizer).
    if job.canvas:
        src_w = src_h = None
        bound = job.duration
        inputs = []
    elif job.is_still:
        src_w, src_h = (1920, 1080) if DRY_RUN else image_size(cfg, job.footage)
        bound = job.duration
        inputs = ["-loop", "1", "-framerate", "30", "-t", f"{bound:.3f}", "-i", str(job.footage)]
    else:
        info = probe(cfg, job.footage)
        src_w, src_h = info["width"] or 1920, info["height"] or 1080
        bound = job.duration or info["duration"] or 600.0
        inputs = ["-i", str(job.footage)]
    loop_img = ["-loop", "1", "-framerate", "30", "-t", f"{bound:.3f}", "-i"]
    text_idx = 0 if job.canvas else 1
    inputs += [*loop_img, str(job.text_png)]
    if job.audio:
        # `-stream_loop` is not used: a still loops via -loop 1, and a recording is never cut.
        # (Canvas audio is already repeated into one WAV by canvas_audio().)
        inputs += ["-i", str(job.audio)]
        audio_label, audio_in = f"{text_idx + 1}:a", ["-i", str(job.audio)]
    else:
        audio_label, audio_in = "0:a", ["-i", str(job.footage)]
    box = scope_box(cfg, job.palette["line"])
    strip_input = None
    if job.viz == "strip":
        strip_png = job.text_png.with_name(f"{job.slug}-strip.png")
        cmd = [cfg["ffmpeg"], "-v", "error", "-y", *audio_in]
        if job.duration:
            cmd += ["-t", f"{job.duration:.3f}"]
        _, _, bw, bh, vert = box
        length, amp = (bh, bw) if vert else (bw, bh)
        run(cmd + ["-filter_complex", f"[0:a]showwavespic=s={length}x{amp}:colors=white:"
                   "split_channels=0", "-frames:v", "1", str(strip_png)])
        strip_input = text_idx + (2 if job.audio else 1)
        inputs += [*loop_img, str(strip_png)]
    measured = measure_loudness(cfg, audio_in, job.duration)
    graph = clip_filtergraph(src_w=src_w, src_h=src_h, audio=audio_label,
                             loudnorm=loudnorm_filter(cfg["loudness_lufs"], measured),
                             palette=job.palette, box=box, bound=bound, viz=job.viz,
                             strip_input=strip_input, text_input=text_idx)
    cmd = [cfg["ffmpeg"], "-v", "error", "-y", *inputs, "-filter_complex", graph,
           "-map", "[v]", "-map", "[aud]"]
    if job.duration:
        # -shortest does not bound a looped input; -t does (lesson from process/ffmpeg.js).
        cmd += ["-t", f"{job.duration:.3f}"]
    cmd += ["-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
            "-c:a", cfg["audio_codec"], "-b:a", cfg["audio_bitrate"], "-ar", "48000"]
    run(cmd + [str(job.out)])    # job.out is cmd_clips' .part.mp4, replaced only on success


# ---------------------------------------------------------------- effectcraft

PLACEHOLDER = re.compile(r"^\{\{([A-Z0-9_]+)\}\}$")


def fill_template(lines: list[str], values: dict, flags: set[str]) -> list[dict]:
    """Template JSONL -> command list. A string that is exactly "{{NAME}}" becomes
    values[NAME] with its JSON type; a line with "when": flag (or a list of flags) is kept
    only if every flag is set."""
    def sub(x):
        if isinstance(x, str):
            m = PLACEHOLDER.match(x)
            if m:
                if m.group(1) not in values:
                    raise KeyError(f"template placeholder {m.group(1)} has no value")
                return values[m.group(1)]
            return x
        if isinstance(x, list):
            return [sub(i) for i in x]
        if isinstance(x, dict):
            return {k: sub(v) for k, v in x.items()}
        return x
    out = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        cmd = json.loads(line)
        when = cmd.pop("when", None)
        need = [when] if isinstance(when, str) else (when or [])
        if any(w not in flags for w in need):
            continue
        cmd.pop("note", None)
        out.append(sub(cmd))
    return out


def capture_index(cmds: list[dict], name: str) -> int:
    """Step index of the command tagged "capture": name (its result carries a layer id)."""
    for i, c in enumerate(cmds):
        if c.get("capture") == name:
            return i
    raise KeyError(f"no step captures {name!r}")


def hex_rgba(hex_color: str) -> list[float]:
    h = hex_color.lstrip("#")
    return [round(int(h[i:i + 2], 16) / 255.0, 4) for i in (0, 2, 4)] + [1]


def effectcraft_values(cfg: dict, job: ClipJob, src_w: int, src_h: int, duration: float) -> dict:
    pal, t, sc = job.palette, cfg["title"], cfg["scope"]
    side = pal["line"] if pal["line"] in ("left", "right", "bottom") else "bottom"
    edge = "bottom" if side == "bottom" else "left"      # viz settings are per orientation
    v = cfg["viz_effectcraft"][edge]
    if job.canvas:
        src_w = src_h = 1                      # no footage: the footage rows are skipped
    fg_scale = FRAME_W / src_w * 100.0
    vis_h = min(src_h, FOOT_BAND_H / (fg_scale / 100.0))      # source px kept by the mask
    mask = [0, round((src_h - vis_h) / 2.0, 2), src_w, round(vis_h, 2)]
    if side in ("left", "right"):
        x = sc["left_x"] if side == "left" else right_scope_x(cfg)
        start, end = [x, sc["left_y"][0]], [x, sc["left_y"][1]]
    else:
        start, end = [sc["bottom_x"][0], sc["bottom_y"]], [sc["bottom_x"][1], sc["bottom_y"]]
    audio = job.audio or job.footage
    footage_item = job.footage.name if job.footage else ""
    vals = {
        "DURATION": round(duration, 3), "CANVAS": pal["bg"], "INK": pal["ink"],
        "INK2": t["double_color"] or pal["ink"], "INK_RGBA": hex_rgba(pal["ink"]),
        "FONT": cfg["font_family"],
        "IMPORTS": sorted({str(p) for p in (job.footage, audio) if p}),
        "FOOTAGE_ITEM": footage_item, "AUDIO_ITEM": audio.name,
        "FG_SCALE": round(fg_scale, 3), "FG_MASK": mask,
        "FG_POS": [FRAME_W / 2, FOOT_BAND_Y + FOOT_BAND_H / 2, 0],
        "SCOPE_START": start, "SCOPE_END": end,
        "MAX_HEIGHT": v["maximum_height"], "AUDIO_DURATION_MS": v["audio_duration_ms"],
        "DISPLAYED_SAMPLES": v["displayed_samples"], "THICKNESS": v["thickness"],
        "SOFTNESS": v["softness"], "DISPLAY_OPTIONS": v["display_options"],
    }
    # Text layers are positioned at the baseline (right-justified at right_x).
    lines = title_lines(cfg, job.title, job.bpm, job.key)
    dx, dy = t.get("double_offset") or (0, 0)
    for i in range(4):
        text, size, top = lines[i] if i < len(lines) else ("", t["line_size"], 0)
        base = round(top + t["ascent"] * size, 1)
        vals[f"L{i + 1}"], vals[f"S{i + 1}"] = text, size
        vals[f"P{i + 1}"] = [t["right_x"], base]
        vals[f"Q{i + 1}"] = [t["right_x"] + dx, base + dy]
    return vals


def render_effectcraft(cfg: dict, job: ClipJob) -> None:
    """Fill templates/osc-9x16.jsonl, build a per-clip .ecproj, point the Audio Waveform at
    the audio layer by numeric id, render H.264, then loudnorm the audio only if needed."""
    ec = cfg["effectcraft"]
    if not DRY_RUN and not os.access(ec, os.X_OK):
        raise RuntimeError(f"effectcraft-cli not found at {ec}; use --renderer ffmpeg")
    if job.viz != "osc":
        raise RuntimeError("the effectcraft template only has the osc visualizer; "
                           "use --renderer ffmpeg for bars or strip")
    if job.canvas:
        src_w = src_h = 1
        duration = job.duration
    elif job.is_still:
        src_w, src_h = (1920, 1080) if DRY_RUN else image_size(cfg, job.footage)
        duration = job.duration
    else:
        info = probe(cfg, job.footage)
        src_w, src_h = info["width"] or 1920, info["height"] or 1080
        # A recording is never cut: the comp is as long as the recording.
        duration = min(job.duration, info["duration"]) if job.duration else info["duration"]
    flags = {"audio_is_footage"} if job.audio is None else set()
    if not job.canvas:
        flags.add("footage")
    if job.key:
        flags.add("has_key")
    if cfg["title"].get("double_offset"):
        flags.add("doubled")
    template = REPO / cfg.get("effectcraft_template", "templates/osc-9x16.jsonl")
    cmds = fill_template(template.read_text().splitlines(),
                         effectcraft_values(cfg, job, src_w, src_h, duration), flags)
    audio_step = capture_index(cmds, "audio")
    work = job.text_png.parent
    steps, proj = work / f"{job.slug}.ec.jsonl", work / f"{job.slug}.ecproj"
    raw = job.out.with_name(job.out.stem + ".ec-raw.mp4")
    if not DRY_RUN:
        steps.write_text("".join(json.dumps({k: v for k, v in c.items() if k != "capture"})
                                 + "\n" for c in cmds))
    env = {**os.environ, "EFFECTCRAFT_FONT_DIRS": str(Path(cfg["font"]).parent)}
    res = run_env(env, [ec, "run", "--commands", str(steps), "--empty", "--save-as", str(proj),
                        "--json"])
    # Layer-reference parameters take the layer's numeric id ("#n" silently stays null).
    audio_id = 0 if DRY_RUN else json.loads(res.stdout)["result"][audio_step]["result"]["layer"]
    run_env(env, [ec, "set", "Main", "Scope", "effects/#1/audioLayer", str(audio_id), str(proj),
                  "--save"])
    if not DRY_RUN:
        got = json.loads(run_env(env, [ec, "get", "Main", "Scope", "effects/#1/audioLayer",
                                       str(proj), "--json"]).stdout)
        if got.get("value") != audio_id:
            raise RuntimeError(f"audioLayer did not take id {audio_id}: {got}")
    run_env(env, [ec, "render", "--comp", "Main", "--out", str(raw), "--format", "h264",
                  "--audio", "on", "--bitrate", str(cfg.get("effectcraft_bitrate_kbps", 10000)),
                  str(proj)])
    finish_loudness(cfg, raw, job.out)


def finish_loudness(cfg: dict, raw: Path, out: Path) -> None:
    """Keep the render as is if it is within 1 LU of target; otherwise remux with 2-pass
    loudnorm (video stream copied)."""
    target = float(cfg["loudness_lufs"])
    measured = measure_loudness(cfg, ["-i", str(raw)], None)
    if DRY_RUN:
        return
    try:
        off = abs(float(measured["input_i"]) - target) if measured else 99.0
    except ValueError:
        off = 0.0  # silence: nothing to normalize
    ln = loudnorm_filter(target, measured)
    if off <= 1.0 or not ln:
        os.replace(raw, out)
        print(f"      loudness {measured and measured.get('input_i')} LUFS, kept as rendered")
        return
    tmp = out.with_name(out.stem + ".remux.mp4")
    try:
        run([cfg["ffmpeg"], "-v", "error", "-y", "-i", str(raw), "-map", "0:v", "-map", "0:a",
             "-c:v", "copy", "-af", f"{ln},aresample=48000", "-c:a", cfg["audio_codec"],
             "-b:a", cfg["audio_bitrate"], "-ar", "48000", "-movflags", "+faststart", str(tmp)])
        if tmp.stat().st_size == 0:
            raise RuntimeError("loudness remux wrote an empty file")
        os.replace(tmp, out)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
    raw.unlink()
    print(f"      loudness {measured.get('input_i')} -> {target} LUFS (remuxed, video copied)")


def run_env(env: dict, cmd: list[str]) -> subprocess.CompletedProcess:
    print("  $ " + " ".join(q(c) for c in cmd), file=sys.stderr)
    if DRY_RUN:
        return subprocess.CompletedProcess(cmd, 0, b"{}", b"")
    res = subprocess.run(cmd, capture_output=True, env=env)
    if res.returncode != 0:
        tail = (res.stderr or res.stdout).decode(errors="replace")[-1500:]
        raise RuntimeError(f"{Path(cmd[0]).name} {cmd[1]} failed ({res.returncode}):\n{tail}")
    return res


RENDERERS = {"ffmpeg": render_ffmpeg, "effectcraft": render_effectcraft}


def image_size(cfg: dict, path: Path) -> tuple[int, int]:
    res = run([cfg["gm"], "identify", "-format", "%w %h", str(path)], capture=True)
    w, h = res.stdout.decode().split()[:2]
    return int(w), int(h)


def find_recording(inbox: Path, slug: str) -> Path | None:
    for ext in (".mov", ".mp4", ".MOV", ".MP4", ".m4v"):
        p = inbox / f"{slug}{ext}"
        if p.exists():
            return p
    return None


CANVAS_MIN_S = 15.0


def canvas_repeats(loop_s: float, minimum: float = CANVAS_MIN_S) -> int:
    """How many times the loop plays so the canvas clip reaches at least `minimum` seconds."""
    if loop_s <= 0:
        raise ValueError("loop has no length")
    return max(1, math.ceil(minimum / loop_s - 1e-9))


def canvas_audio(cfg: dict, wav: Path, loop_s: float, out: Path) -> tuple[Path, float]:
    """The loop WAV repeated end to end (the loops carry 5 ms fades, so the seams are clean)
    until it reaches CANVAS_MIN_S. Returns (path, duration)."""
    n = canvas_repeats(loop_s)
    if DRY_RUN:
        return out, loop_s * n
    out.parent.mkdir(parents=True, exist_ok=True)
    run([cfg["ffmpeg"], "-v", "error", "-y", "-stream_loop", str(n - 1), "-i", str(wav),
         "-c", "copy", str(out)])
    return out, probe(cfg, out)["duration"] or loop_s * n


def drop_partial(part: Path) -> None:
    """Remove a half-written render and the effectcraft intermediate next to it."""
    if DRY_RUN:
        return
    for f in (part, part.with_name(part.stem + ".ec-raw.mp4"),
              part.with_name(part.stem + ".remux.mp4")):
        f.unlink(missing_ok=True)


def verify_render(cfg: dict, path: Path) -> None:
    """A render counts only if ffmpeg exited 0 (run() raised otherwise), the file is
    non-empty and ffprobe can read a video stream with a duration from it."""
    if DRY_RUN:
        return
    if not path.exists() or path.stat().st_size == 0:
        raise RuntimeError(f"render produced no output at {path.name}")
    info = probe(cfg, path)
    if not info["duration"] or not info["width"]:
        raise RuntimeError(f"render at {path.name} is not a playable video")


def cmd_clips(cfg: dict, args) -> int:
    P = paths(cfg)
    belt = read_csv(P["belt"], BELT_COLUMNS)
    rows = [r for r in belt if not args.slugs or r["slug"] in args.slugs]
    if args.slugs:
        missing = set(args.slugs) - {r["slug"] for r in rows}
        for m in sorted(missing):
            print(f"skip {m}: not on the belt (run `loops` first)", file=sys.stderr)
    renderer_name = args.renderer or cfg["renderer"]
    renderer = RENDERERS[renderer_name]
    if not DRY_RUN:
        for k in ("clips", "work", "inbox"):
            P[k].mkdir(parents=True, exist_ok=True)
    failures = 0
    for r in rows:
        if r["status"] == HOLD:
            if args.slugs:
                print(f"hold  {r['slug']}: {r['hold_reason'] or 'held'} (unhold it first)")
            continue
        if r["status"] != "loop" and not args.force:
            continue
        if r["status"] not in TRANSITIONS["render"][0]:
            print(f"skip  {r['slug']}: {r['status']} rows are not re-rendered")
            continue
        slug = r["slug"]
        rec = find_recording(P["inbox"], slug)
        text_png = P["work"] / f"{slug}-text.png"
        out = P["clips"] / f"{slug}.mp4"
        part = out.with_name(f"{slug}.part.mp4")   # renders land here, never on `out`
        if rec:
            info = probe(cfg, rec)
            if info["has_audio"]:
                job = ClipJob(slug, rec, False, None, None, text_png, part, r["bpm"], r["key"])
                kind = "recording"
            elif args.audio_from_loop:
                # The recording has no sound (Cmd-Shift-5 records mic only). Lay the loop
                # under it, bounded to the recording's own length; the video is not cut.
                dur = min(info["duration"], float(r["duration_s"] or 0) or info["duration"])
                job = ClipJob(slug, rec, False, Path(r["wav"]), dur, text_png, part,
                              r["bpm"], r["key"])
                kind = "recording+loop-audio"
            else:
                print(f"fail {slug}: {rec.name} has no audio track. Record with sound "
                      "(see README) or pass --audio-from-loop.", file=sys.stderr)
                failures += 1
                continue
        elif args.still:
            job = ClipJob(slug, Path(args.still), True, Path(r["wav"]), float(r["duration_s"]),
                          text_png, part, r["bpm"], r["key"])
            kind = "still-fallback"
            print(f"FALLBACK {slug}: no recording in inbox, using still {args.still}")
        else:
            # No recording and no --still: the clip is just the canvas (title block + scope).
            try:
                wav, dur = canvas_audio(cfg, Path(r["wav"]), float(r["duration_s"] or 0),
                                        P["work"] / f"{slug}-canvas.wav")
            except (RuntimeError, OSError, ValueError) as e:
                print(f"fail {slug}: cannot prepare canvas audio: {e}", file=sys.stderr)
                failures += 1
                continue
            job = ClipJob(slug, None, False, wav, dur, text_png, part, r["bpm"], r["key"],
                          canvas=True)
            kind = "canvas"
            print(f"CANVAS {slug}: no recording in inbox, rendering title + scope only "
                  f"({dur:.1f} s)")
        pal = pick_palette(cfg, belt, r, args.palette)
        job.title = r.get("title") or clean_title(r["name"], r["bpm"])
        job.palette, job.viz = pal, args.viz
        try:
            drop_partial(part)
            if renderer_name == "ffmpeg":
                make_text_png(cfg, text_png, job)
            renderer(cfg, job)
            verify_render(cfg, part)
        except (RuntimeError, NotImplementedError) as e:
            drop_partial(part)       # the row and any earlier clip stay as they were
            print(f"fail {slug}: {e}", file=sys.stderr)
            failures += 1
            continue
        except BaseException:
            drop_partial(part)
            raise
        fields = dict(clip=str(out), clip_kind=f"{kind}:{renderer_name}", palette=pal["name"],
                      title=job.title, updated=now())
        with locked(P):   # the render took minutes: re-read, apply only this row's transition
            fresh = read_csv(P["belt"], BELT_COLUMNS)
            cur = next((x for x in fresh if x["slug"] == slug), None)
            try:
                if cur is None:
                    raise IllegalTransition("is no longer on the belt")
                transition(cur, "render", fields=fields)
            except IllegalTransition as e:
                drop_partial(part)
                print(f"skip {slug}: {e}; render result not recorded", file=sys.stderr)
                failures += 1
                continue
            if not DRY_RUN:
                os.replace(part, out)
            write_csv(P["belt"], BELT_COLUMNS, fresh)
        r.update(cur)   # keep the palette-rotation snapshot current
        print(f"clip  {slug} [{kind}, {renderer_name}, {pal['name']}] -> {out}")
    return 1 if failures else 0


# ---------------------------------------------------------------- pack / queue

def cmd_pack(cfg: dict, args) -> int:
    if getattr(args, "captions", None):
        cfg["captions"] = args.captions
    P = paths(cfg)
    belt = read_csv(P["belt"], BELT_COLUMNS)
    ready = [r for r in belt if status_at_least(r["status"], "clip")]
    zipped = {r["slug"] for r in ready}
    if not ready:
        print("nothing to pack: no loop has a clip yet")
        return 0
    today = dt.date.today()
    zpath = P["packs"] / f"{today.isoformat()}-loops.zip"
    top = f"{cfg['producer']} free loops {today.isoformat()}"
    print(f"pack  {len(ready)} loops -> {zpath}")
    if not DRY_RUN:
        P["packs"].mkdir(parents=True, exist_ok=True)
        tmp = zpath.with_suffix(".zip.tmp")
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr(f"{top}/README.txt", cfg["pack_readme"].format(producer=cfg["producer"]))
            for r in ready:
                for f in (r["wav"], r["mp3"]):
                    if f and Path(f).exists():
                        z.write(f, f"{top}/{r['slug']}/{Path(f).name}")
        os.replace(tmp, zpath)
    with locked(P):   # apply only this pack's transitions to the belt as it is now
        belt = read_csv(P["belt"], BELT_COLUMNS)
        for r in belt:
            if r["slug"] in zipped and r["status"] == "clip":
                transition(r, "pack")
        write_csv(P["belt"], BELT_COLUMNS, belt)
        # a row that reached clip after the zip was cut is not packed, so not queued yet
        refresh_queue(cfg, P, [r for r in belt if r["status"] != "clip"], today)
    for item in getattr(args, "caption", None) or []:
        slug, _, text = item.partition("=")
        if not text:
            sys.exit(f"--caption wants slug=text, got {item!r}")
        cmd_caption(cfg, argparse.Namespace(slug=slug, text=text))
    return 0


def refresh_queue(cfg: dict, P: dict, belt: list[dict], today: dt.date) -> list[dict]:
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    have = {r["slug"] for r in queue}
    belt_by = {r["slug"]: r for r in belt}
    for i, q in enumerate(queue):  # upgrade untouched generic captions on queued rows
        b = belt_by.get(q["slug"])
        if b and q["status"] == "queued" and q["caption"] == caption_for(cfg, b["bpm"], b["key"]):
            q["caption"] = caption_for(cfg, b["bpm"], b["key"], i)
    new = [r for r in belt if r["clip"] and r["slug"] not in have
           and status_at_least(r["status"], "clip")]
    for d, r in zip(next_dates([x["date"] for x in queue], len(new), today), new):
        queue.append({"date": d, "slug": r["slug"], "clip": r["clip"],
                      "caption": caption_for(cfg, r["bpm"], r["key"], len(queue)),
                      "status": "queued", "posted_at": ""})
    write_csv(P["queue"], QUEUE_COLUMNS, queue)
    print(f"queue {len(new)} added, {sum(1 for x in queue if x['status'] == 'queued')} queued "
          f"-> {P['queue']}")
    return queue


def cmd_caption(cfg: dict, args) -> int:
    P = paths(cfg)
    with locked(P):
        return _caption(cfg, P, args)


def _caption(cfg: dict, P: dict, args) -> int:
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    row = next((r for r in queue if r["slug"] == args.slug), None)
    if not row:
        sys.exit(f"{args.slug} is not in {P['queue']}")
    b = next((r for r in read_csv(P["belt"], BELT_COLUMNS) if r["slug"] == args.slug), None)
    row["caption"] = fill_caption(args.text, b["bpm"] if b else "", b["key"] if b else "")
    write_csv(P["queue"], QUEUE_COLUMNS, queue)
    print(f"caption {args.slug}: {row['caption']}")
    return 0


def cmd_hold(cfg: dict, args) -> int:
    P = paths(cfg)
    with locked(P):
        return _hold_locked(cfg, P, args)


def _hold_locked(cfg: dict, P: dict, args) -> int:
    """Take a loop off the belt for now: clips and pack skip it, and a queued (not posted)
    queue row is dropped. The status it had is kept in held_from for `unhold`."""
    belt = read_csv(P["belt"], BELT_COLUMNS)
    row = next((r for r in belt if r["slug"] == args.slug), None)
    if not row:
        sys.exit(f"{args.slug} is not on the belt")
    reason = " ".join(args.reason).strip()
    try:
        transition(row, "hold", reason=reason)
    except IllegalTransition:
        sys.exit(f"{args.slug} is already posted; nothing to hold")
    write_csv(P["belt"], BELT_COLUMNS, belt)
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    kept = [q for q in queue if not (q["slug"] == args.slug and q["status"] == "queued")]
    if len(kept) != len(queue):
        write_csv(P["queue"], QUEUE_COLUMNS, kept)
        print(f"queue {args.slug} dropped from {P['queue']}")
    print(f"hold  {args.slug}" + (f": {reason}" if reason else ""))
    return 0


def cmd_unhold(cfg: dict, args) -> int:
    P = paths(cfg)
    with locked(P):
        return _unhold_locked(cfg, P, args)


def _unhold_locked(cfg: dict, P: dict, args) -> int:
    belt = read_csv(P["belt"], BELT_COLUMNS)
    row = next((r for r in belt if r["slug"] == args.slug), None)
    if not row:
        sys.exit(f"{args.slug} is not on the belt")
    try:
        transition(row, "unhold", clip_exists=bool(row["clip"] and Path(row["clip"]).exists()))
    except IllegalTransition:
        print(f"skip {args.slug}: not on hold ({row['status']})")
        return 0
    write_csv(P["belt"], BELT_COLUMNS, belt)
    print(f"unhold {args.slug} -> {row['status']}")
    return 0


def cmd_posted(cfg: dict, args) -> int:
    P = paths(cfg)
    with locked(P):
        return _posted_locked(cfg, P, args)


def _posted_locked(cfg: dict, P: dict, args) -> int:
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    row = next((r for r in queue if r["slug"] == args.slug), None)
    if not row:
        sys.exit(f"{args.slug} is not in {P['queue']}")
    belt = read_csv(P["belt"], BELT_COLUMNS)
    brow = next((r for r in belt if r["slug"] == args.slug), None)
    if brow:
        try:
            transition(brow, "post")
        except IllegalTransition as e:
            sys.exit(f"{args.slug}: {e}; belt and queue left as they were")
    row["status"], row["posted_at"] = "posted", args.date or dt.date.today().isoformat()
    write_csv(P["queue"], QUEUE_COLUMNS, queue)
    write_csv(P["belt"], BELT_COLUMNS, belt)
    print(f"posted {args.slug} on {row['posted_at']}")
    return 0


# ---------------------------------------------------------------- cover

def cmd_cover(cfg: dict, args) -> int:
    """3000x3000 + 1080x1080: flat palette canvas (or a background image), the doubled
    title block top right, optional full-frame logo overlay."""
    out = Path(os.path.expanduser(args.out)) if args.out else paths(cfg)["root"] / "covers"
    if not DRY_RUN:
        out.mkdir(parents=True, exist_ok=True)
    name = slugify(args.title) or "cover"
    big, small = out / f"{name}-3000.png", out / f"{name}-1080.png"
    want = args.palette or cfg.get("palette_default", "near-black")
    pal = next((p for p in cfg["palette"] if p["name"] == want), cfg["palette"][0])
    ink = args.ink or pal["ink"]
    if args.bg:
        base = [cfg["gm"], "convert", os.path.expanduser(args.bg), "-resize", "3000x3000^",
                "-gravity", "center", "-extent", "3000x3000"]
    else:
        base = [cfg["gm"], "convert", "-size", "3000x3000", f"xc:{args.color or pal['bg']}"]
    # Square: no Reels top zone, so the block sits 60 px (at 1080) from the top edge.
    sq = {**cfg, "title": {**cfg["title"], "top_y": 60}}
    lines = title_lines(sq, args.title.upper(), args.bpm or "", args.key or "")
    if not args.bpm:
        lines = [l for l in lines if not l[0].endswith(" bpm")]
    run(base + [*title_draws(sq, lines, ink, scale=3000 / FRAME_W), str(big)])
    if args.logo:
        logo = paths(cfg)["work"] / "cover-logo.png"
        if not DRY_RUN:
            logo.parent.mkdir(parents=True, exist_ok=True)
        if args.logo_corner:   # small mark, bottom right
            run([cfg["gm"], "convert", os.path.expanduser(args.logo), "-trim", "+repage",
                 "-resize", "420x420", str(logo)])
            geo = ["-gravity", "southeast", "-geometry", "+160+160"]
        else:                  # full-bleed overlay, as assets/logo.png is drawn
            run([cfg["gm"], "convert", os.path.expanduser(args.logo), "-resize", "3000x3000!",
                 str(logo)])
            geo = ["-geometry", "+0+0"]
        run([cfg["gm"], "composite", *geo, str(logo), str(big), str(big)])
    run([cfg["gm"], "convert", str(big), "-resize", "1080x1080", str(small)])
    print(f"cover {big}\ncover {small}")
    return 0


def doctor_findings(P: dict) -> dict[str, list[str]]:
    """Belt/queue consistency, read-only: files are opened for reading and stat'd, never
    written, and no lock file is created. Returns {problem: [slug or path, ...]}."""
    belt = read_csv(P["belt"], BELT_COLUMNS)
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    out: dict[str, list[str]] = {}

    def add(kind: str, what: str) -> None:
        out.setdefault(kind, []).append(what)

    def file_problem(path: str) -> str | None:
        f = Path(path)
        if not f.exists():
            return "missing"
        return "empty" if f.stat().st_size == 0 else None

    seen: set[str] = set()
    for r in belt:
        if r["slug"] in seen:
            add("belt duplicate slug", r["slug"])
        seen.add(r["slug"])
    belt_by = {r["slug"]: r for r in belt}
    q_by: dict[str, list[dict]] = {}
    for q_ in queue:
        q_by.setdefault(q_["slug"], []).append(q_)
    for slug, rows in q_by.items():
        if len(rows) > 1:
            add("queue duplicate slug", slug)
    for r in belt:
        st, slug = r["status"], r["slug"]
        if st not in STATUS_ORDER and st != HOLD:
            add("belt unknown status", slug)
        if st == HOLD and r["held_from"] not in STATUS_ORDER[:3] + [""]:
            add("belt held_from invalid", slug)
        if st in ("loop",) and r["clip"]:
            add("belt loop row has a clip", slug)
        if st in ("clip", "packed", "posted"):
            if not r["clip"]:
                add("belt clip row without a clip path", slug)
            elif (bad := file_problem(r["clip"])):
                add(f"belt clip file {bad}", slug)
        qs = q_by.get(slug, [])
        qstat = qs[0]["status"] if qs else None
        if st == "posted" and qstat != "posted":
            add("belt posted, queue not posted", slug)
        if st == "packed" and not qs:
            add("belt packed, not in queue", slug)
        if st in ("loop", HOLD, "clip") and qstat == "queued":
            add(f"queued row for a {st} belt row", slug)
        if st != "posted" and qstat == "posted":
            add("queue posted, belt not posted", slug)
    for slug, rows in q_by.items():
        b = belt_by.get(slug)
        if b is None:
            add("queue row not on the belt", slug)
            continue
        q_ = rows[0]
        if q_["clip"] and (bad := file_problem(q_["clip"])):
            add(f"queue clip file {bad}", slug)
        if q_["clip"] and b["clip"] and q_["clip"] != b["clip"] and q_["status"] == "queued":
            add("queue clip differs from belt clip", slug)
    clips = P["clips"]
    if clips.is_dir():
        for f in sorted(clips.iterdir()):
            if f.name.endswith((".part.mp4", ".ec-raw.mp4", ".remux.mp4")):
                add("leftover partial render", f.name)
    return out


def cmd_doctor(cfg: dict, args) -> int:
    """Read-only consistency check of belt.csv and queue.csv and the clip files they name."""
    P = paths(cfg)
    found = doctor_findings(P)
    belt_n = len(read_csv(P["belt"], BELT_COLUMNS))
    queue_n = len(read_csv(P["queue"], QUEUE_COLUMNS))
    print(f"doctor belt {belt_n} rows, queue {queue_n} rows")
    if not found:
        print("ok: belt, queue and clip files agree")
        return 0
    for kind, items in sorted(found.items()):
        print(f"{len(items):>4}  {kind}")
        if not args.counts:
            for it in items:
                print(f"        {it}")
    return 1


# ---------------------------------------------------------------- status

def cmd_status(cfg: dict, args) -> int:
    P = paths(cfg)
    belt = read_csv(P["belt"], BELT_COLUMNS)
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    print(f"belt  {P['belt']}  ({len(belt)} loops)")
    counts = {s: sum(1 for r in belt if r["status"] == s) for s in STATUS_ORDER + [HOLD]}
    print("      " + "  ".join(f"{s} {n}" for s, n in counts.items()))
    dim = sys.stdout.isatty()
    for r in belt:
        line = (f"      {r['status']:<7} {r['slug']:<27} {r['bpm']:>5} BPM  {r['key'] or '-':<9} "
                f"{r['clip_kind'] or ''}")
        if r["status"] == HOLD:
            line = line.rstrip() + f"  ({r['hold_reason'] or 'held'})"
            if dim:
                line = f"\033[2m{line}\033[0m"
        print(line)
    print(f"queue {P['queue']}  ({len(queue)} rows)")
    for r in queue:
        print(f"      {r['date']}  {r['status']:<7} {r['slug']:<24} {r['caption']}"
              + (f"  (posted {r['posted_at']})" if r["posted_at"] else ""))
    nxt = next((r for r in queue if r["status"] == "queued"), None)
    if nxt:
        print(f"next  post {nxt['slug']} on {nxt['date']}: {nxt['clip']}")
    return 0


# ---------------------------------------------------------------- serve (the local app)
#
# `beatpack serve`: a stdlib http.server on 127.0.0.1 that shows the belt (app/index.html)
# and runs the same subcommands as the CLI, one at a time, in a background thread.

STATUS_STATION = {"loop": 0, "clip": 1, "packed": 2, "posted": 3}
CMD_STATION = {"loops": 0, "clips": 1, "pack": 2, "posted": 3, "cover": 1}
RUN_CMDS = ("loops", "clips", "pack", "posted", "cover")
UPLOAD_EXTS = ("mov", "mp4", "m4v")


def job_slugs(job: dict | None, belt: list[dict]) -> set[str]:
    """Belt slugs a job will touch: the slugs named in its args, else what the command
    picks on its own (clips: loops without a clip, or every row with --force; pack: clips)."""
    if not job:
        return set()
    known = {r["slug"] for r in belt}
    named = {a for a in job["args"] if a in known}
    if named and job["cmd"] == "clips":   # clips skips held rows: never shown as rendering
        return named - {r["slug"] for r in belt if r["status"] == HOLD}
    if named or job["cmd"] in ("posted", "cover", "loops"):
        return named
    if job["cmd"] == "clips":
        force = "--force" in job["args"]
        return {r["slug"] for r in belt
                if r["status"] != HOLD and (force or r["status"] == "loop")}
    if job["cmd"] == "pack":
        return {r["slug"] for r in belt if r["status"] == "clip"}
    return set()


def next_action(row: dict, has_rec: bool, queued: bool) -> dict | None:
    """The one button a row shows: what moves it to the next station."""
    slug, st = row["slug"], row["status"]
    if st == HOLD:
        return None
    if st == "loop":
        return {"label": "Render", "cmd": "clips", "args": [slug]} if has_rec else None
    if st == "clip" or (st == "packed" and not queued):
        return {"label": "Pack", "cmd": "pack", "args": []}
    if st == "packed":
        return {"label": "Mark posted", "cmd": "posted", "args": [slug]}
    return None


def thumb_path(cfg: dict, slug: str) -> Path:
    return paths(cfg)["root"] / "thumbs" / f"{slug}.jpg"


def build_state(cfg: dict, job: dict | None = None, failures: dict | None = None,
                today: dt.date | None = None) -> dict:
    """Everything the belt screen draws, from belt.csv, queue.csv and the inbox. No network,
    no subprocess: thumbnails are only referenced here (made on request by /thumb)."""
    P = paths(cfg)
    belt = read_csv(P["belt"], BELT_COLUMNS)
    queue = read_csv(P["queue"], QUEUE_COLUMNS)
    qby = {q["slug"]: q for q in queue}
    failures = failures or {}
    busy = set(job["slugs"]) if job and "slugs" in job else job_slugs(job, belt)
    rows = []
    for r in belt:
        slug = r["slug"]
        rec = find_recording(P["inbox"], slug)
        clip = Path(r["clip"]) if r["clip"] else None
        has_clip = bool(clip and clip.exists())
        q = qby.get(slug)
        station = STATUS_STATION.get(r["held_from"] if r["status"] == HOLD else r["status"], 0)
        if r["status"] == HOLD and not has_clip:
            station = 0
        fail = failures.get(slug)
        if slug in busy:
            state = "rendering"
        elif fail:
            state = "failed"
        elif r["status"] == HOLD:
            state = "held"
        elif r["status"] == "posted":
            state = "posted"
        elif q and q["status"] == "queued":
            state = "queued"
        elif r["status"] == "loop" and not rec:
            state = "empty"
        else:
            state = "done"
        src = job if slug in busy else fail
        target = CMD_STATION.get(src["cmd"], station) if src else min(station + 1, 3)
        action = next_action(r, bool(rec), bool(q))
        if rec and r["clip_kind"].startswith("canvas") and r["status"] in ("clip", "packed"):
            # A recording arrived after the canvas clip: offer the re-render first.
            action = {"label": "Render", "cmd": "clips", "args": [slug, "--force"]}
        if fail:
            action = {"label": "Retry", "cmd": fail["cmd"], "args": fail["args"]}
        pal = pick_palette(cfg, belt, r)
        rows.append({
            "slug": slug, "title": r["title"] or clean_title(r["name"], r["bpm"]),
            "bpm": r["bpm"], "key": key_line(r["key"]), "status": r["status"],
            "station": station, "state": state, "target": target,
            "color": pal["bg"], "has_recording": bool(rec), "has_clip": has_clip,
            "thumb": f"/thumb/{slug}.jpg?v={int(clip.stat().st_mtime)}" if has_clip else None,
            "queue_date": q["date"] if q else "", "caption": q["caption"] if q else "",
            "posted_at": q["posted_at"] if q else "", "action": action,
            "error": fail["line"] if fail else "",
            "hold_reason": r["hold_reason"] if r["status"] == HOLD else "",
            "clip_kind": r["clip_kind"],
            "is_canvas": has_clip and r["clip_kind"].startswith("canvas") and not rec,
        })
    # Held rows sink below the active ones, posted rows below those; the rest keep belt order.
    rows.sort(key=lambda x: {"held": 1, "posted": 2}.get(x["state"], 0))
    posted = sum(1 for r in belt if r["status"] == "posted")
    nxt = next((q for q in queue if q["status"] == "queued"), None)
    n = len(belt)
    held = sum(1 for r in belt if r["status"] == HOLD)
    line = f"{n} loop{'' if n == 1 else 's'}, {posted} posted"
    if held:
        line += f", {held} on hold"
    if nxt:
        line += f", next: {nxt['slug']} on {nxt['date']}"
    return {
        "producer": cfg["producer"], "status_line": line, "next_slug": nxt["slug"] if nxt else "", "empty": not belt, "rows": rows,
        "queue": queue, "stations": ["loop", "clip", "pack", "posted"],
        "job": {k: job[k] for k in ("cmd", "args", "started") if k in job} if job else None,
        "now": dt.datetime.now().timestamp(),
        "today": (today or dt.date.today()).isoformat(),
        "config": {"root": str(cfg["root"]), "renderer": cfg["renderer"],
                   "palette_mode": cfg.get("palette_mode"), "catalog": cfg["db"].exists(),
                   "inbox": str(P["inbox"])},
    }


def make_thumb(cfg: dict, clip: Path, out: Path) -> bool:
    """One frame at t=3 s (t=0 for a shorter clip), 270 px wide, cached until the clip changes."""
    if out.exists() and out.stat().st_mtime >= clip.stat().st_mtime:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    for t in ("3", "0"):
        res = subprocess.run([cfg["ffmpeg"], "-v", "error", "-y", "-ss", t, "-i", str(clip),
                              "-frames:v", "1", "-vf", "scale=270:-2", "-q:v", "3", str(out)],
                             capture_output=True)
        if res.returncode == 0 and out.exists() and out.stat().st_size:
            return True
    return False


class _Routed:
    """sys.stdout/sys.stderr stand-in: writes from a job thread go to that job's log."""
    def __init__(self, orig):
        self.orig = orig

    def write(self, s):
        sink = _JOB_THREADS.get(threading.get_ident())
        if sink:
            sink.feed(s)
            return len(s)
        return self.orig.write(s)

    def flush(self):
        self.orig.flush()

    def __getattr__(self, name):
        return getattr(self.orig, name)


_JOB_THREADS: dict = {}


def load_failures(path: Path) -> dict:
    """Last failure per slug from <root>/state.json; anything unreadable counts as none."""
    try:
        data = json.loads(path.read_text())
        fails = data.get("failures", {})
        return {k: v for k, v in fails.items()
                if isinstance(v, dict) and {"line", "cmd", "args"} <= v.keys()}
    except (OSError, ValueError, AttributeError):
        return {}


def save_failures(path: Path, failures: dict) -> None:
    """Rewrite state.json atomically; it only holds what the belt CSVs cannot."""
    if not path.parent.is_dir():
        return
    tmp = path.with_name(".state.json.part")
    tmp.write_text(json.dumps({"failures": failures}, indent=2) + "\n")
    os.replace(tmp, path)


class Worker:
    """One job at a time, like a render queue. Keeps the log and the last failure per slug;
    failures also live in <root>/state.json so a restart does not hide them."""
    def __init__(self, cfg: dict, config_path: str | None):
        self.cfg, self.config_path = cfg, config_path
        self.lock = threading.Lock()
        self.log: list[str] = []
        self.job: dict | None = None
        self.state_file = paths(cfg)["state"]
        self.failures: dict = load_failures(self.state_file)
        self._partial = ""

    def feed(self, s: str) -> None:
        with self.lock:
            buf = self._partial + s
            *lines, self._partial = buf.split("\n")
            self.log.extend(l.rstrip() for l in lines if l.strip())

    def start(self, cmd: str, args: list[str]) -> bool:
        belt = read_csv(paths(self.cfg)["belt"], BELT_COLUMNS)
        with self.lock:
            if self.job:
                return False
            job = {"cmd": cmd, "args": args, "started": dt.datetime.now().timestamp()}
            job["slugs"] = sorted(job_slugs(job, belt))
            self.job = job
        threading.Thread(target=self._run, args=(job,), daemon=True).start()
        return True

    def _run(self, job: dict) -> None:
        _JOB_THREADS[threading.get_ident()] = self
        self.feed(f"$ beatpack {' '.join([job['cmd'], *map(q, job['args'])])}\n")
        mark = len(self.log)
        argv = (["--config", self.config_path] if self.config_path else []) + [job["cmd"], *job["args"]]
        try:
            code = main(argv)
        except SystemExit as e:
            code = e.code if isinstance(e.code, int) else 1
            if isinstance(e.code, str):
                self.feed(e.code + "\n")
        except Exception as e:  # keep the server up; the log says what broke
            self.feed(f"error: {e}\n")
            code = 1
        finally:
            _JOB_THREADS.pop(threading.get_ident(), None)
        self.feed(f"exit {code} after {dt.datetime.now().timestamp() - job['started']:.0f} s\n")
        with self.lock:
            run_log = self.log[mark:]
            failed = {}
            for line in run_log:
                m = re.match(r"fail (\S+): ?(.*)", line)
                if m:
                    failed[m.group(1)] = line
            if code and not failed:
                last = next((l for l in reversed(run_log[:-1]) if l.strip()), "failed")
                failed = {s: last for s in job["slugs"]}
            for s in job["slugs"]:
                self.failures.pop(s, None)
            retry_flags = [a for a in job["args"] if a == "--force"]
            for s, line in failed.items():
                args = [s, *retry_flags] if job["cmd"] in ("clips", "posted") else job["args"]
                self.failures[s] = {"line": line, "cmd": job["cmd"], "args": args}
            try:
                save_failures(self.state_file, self.failures)
            except OSError as e:
                self.log.append(f"note: could not write {self.state_file}: {e}")
            self.job = None

    def lines_since(self, n: int) -> dict:
        with self.lock:
            return {"lines": self.log[n:], "next": len(self.log), "running": bool(self.job)}


def make_handler(worker: Worker, port: int):
    cfg = worker.cfg
    hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}

    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, fmt, *a):  # quiet: the app has its own log
            pass

        def send(self, code: int, body: bytes, ctype: str, cache: bool = False) -> None:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "max-age=86400" if cache else "no-store")
            self.end_headers()
            self.wfile.write(body)

        def json(self, obj, code: int = 200) -> None:
            self.send(code, json.dumps(obj).encode(), "application/json")

        def guard(self) -> bool:
            # Only this machine's browser, and (for writes) only same-origin fetches: a JSON
            # content type or a custom header forces a CORS preflight that nothing answers.
            if self.headers.get("Host") not in hosts:
                self.json({"error": "bad host"}, 403)
                return False
            return True

        def do_GET(self):
            if not self.guard():
                return
            url = urllib.parse.urlparse(self.path)
            p = url.path
            if p in ("/", "/index.html"):
                self.send(200, (REPO / "app" / "index.html").read_bytes(), "text/html; charset=utf-8")
            elif p == "/api/state":
                with worker.lock:
                    job, fails = worker.job, dict(worker.failures)
                self.json(build_state(cfg, job, fails))
            elif p == "/api/log":
                since = urllib.parse.parse_qs(url.query).get("since", ["0"])[0]
                self.json(worker.lines_since(int(since) if since.isdigit() else 0))
            elif m := re.fullmatch(r"/fonts/([\w.-]+\.ttf)", p):
                f = REPO / "assets" / "fonts" / m.group(1)
                if f.exists():
                    self.send(200, f.read_bytes(), "font/ttf", cache=True)
                else:
                    self.json({"error": "no such font"}, 404)
            elif m := re.fullmatch(r"/thumb/([a-z0-9-]+)\.jpg", p):
                row = next((r for r in read_csv(paths(cfg)["belt"], BELT_COLUMNS)
                            if r["slug"] == m.group(1)), None)
                out = thumb_path(cfg, m.group(1))
                if row and row["clip"] and Path(row["clip"]).exists() \
                        and make_thumb(cfg, Path(row["clip"]), out):
                    self.send(200, out.read_bytes(), "image/jpeg", cache=True)
                else:
                    self.json({"error": "no clip"}, 404)
            else:
                self.json({"error": "not found"}, 404)

        def do_POST(self):
            if not self.guard():
                return
            url = urllib.parse.urlparse(self.path)
            length = int(self.headers.get("Content-Length") or 0)
            if url.path == "/api/run":
                if not self.headers.get("Content-Type", "").startswith("application/json"):
                    return self.json({"error": "send JSON"}, 415)
                try:
                    body = json.loads(self.rfile.read(length) or b"{}")
                except ValueError:
                    return self.json({"error": "bad JSON"}, 400)
                cmd, args = body.get("cmd"), body.get("args", [])
                if cmd not in RUN_CMDS or not isinstance(args, list) \
                        or not all(isinstance(a, str) for a in args):
                    return self.json({"error": f"cmd must be one of {', '.join(RUN_CMDS)}"}, 400)
                if not worker.start(cmd, args):
                    return self.json({"error": "a job is already running"}, 409)
                return self.json({"ok": True})
            if url.path == "/api/inbox":
                if self.headers.get("X-Beatpack") != "1":
                    return self.json({"error": "missing X-Beatpack header"}, 403)
                qs = urllib.parse.parse_qs(url.query)
                slug = qs.get("slug", [""])[0]
                ext = qs.get("ext", [""])[0].lower().lstrip(".")
                belt = {r["slug"] for r in read_csv(paths(cfg)["belt"], BELT_COLUMNS)}
                if slug not in belt or ext not in UPLOAD_EXTS:
                    return self.json({"error": "unknown slug or not a .mov/.mp4/.m4v"}, 400)
                inbox = paths(cfg)["inbox"]
                if find_recording(inbox, slug):
                    return self.json({"error": f"{slug} already has a recording in the inbox"}, 409)
                inbox.mkdir(parents=True, exist_ok=True)
                dest, tmp = inbox / f"{slug}.{ext}", inbox / f".{slug}.{ext}.part"
                left = length
                with tmp.open("wb") as f:
                    while left > 0:
                        chunk = self.rfile.read(min(left, 1 << 20))
                        if not chunk:
                            break
                        f.write(chunk)
                        left -= len(chunk)
                if left or not length:
                    tmp.unlink(missing_ok=True)
                    return self.json({"error": "upload incomplete"}, 400)
                os.replace(tmp, dest)
                worker.feed(f"inbox {slug}: saved {dest} ({length / 1e6:.1f} MB)\n")
                return self.json({"ok": True, "path": str(dest)})
            self.json({"error": "not found"}, 404)

    return Handler


class _Server(http.server.ThreadingHTTPServer):
    daemon_threads = True


def port_in_use(port: int) -> bool:
    """True if something already accepts on 127.0.0.1:port. SO_REUSEADDR (which http.server
    sets) lets macOS bind a port another server holds as *:port, and the browser then
    reaches either one at random, so a live listener is checked for first."""
    try:
        socket.create_connection(("127.0.0.1", port), timeout=0.3).close()
        return True
    except OSError:
        return False


def _sigterm(*_):
    raise KeyboardInterrupt


def cmd_serve(cfg: dict, args) -> int:
    worker = Worker(cfg, args.config)
    sys.stdout, sys.stderr = _Routed(sys.stdout), _Routed(sys.stderr)
    srv, port = None, args.port
    for port in range(args.port, args.port + 10):
        try:
            if not port_in_use(port):
                srv = _Server(("127.0.0.1", port), make_handler(worker, port))
                break
        except OSError:
            pass
        print(f"port {port} is taken; trying {port + 1}", flush=True)
    if not srv:
        sys.exit(f"no free port in {args.port}-{args.port + 9}")
    # pkill / kill send SIGTERM: leave through the same path as Ctrl-C so the socket closes.
    signal.signal(signal.SIGTERM, _sigterm)
    url = f"http://127.0.0.1:{port}/"
    print(f"serve {url}  (root {cfg['root']}; Ctrl-C to stop)", flush=True)
    if not args.no_open:
        subprocess.run(["open", url])
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    srv.server_close()
    return 0


# ---------------------------------------------------------------- main

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="beatpack", description=__doc__.splitlines()[0])
    p.add_argument("--config", help="config.json path (default: config.json next to this file)")
    p.add_argument("--dry-run", action="store_true", help="print commands, write nothing")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("loops", help="cut N-bar loops from catalog previews")
    s.add_argument("--ids", type=int, nargs="+", help="ableton-library set ids")
    s.add_argument("--list", help="ableton-library list name, e.g. candidates")
    s.add_argument("--bars", type=int, help="loop length in bars (default from config, 8)")
    g = s.add_mutually_exclusive_group()
    g.add_argument("--at-bar", type=int, help="start at this bar (1-based) instead of the loudest")
    g.add_argument("--at", type=float, help="start at this many seconds")
    s.add_argument("--audio", help="use this file instead of the preview (one set), e.g. a stem")
    s.add_argument("--force", action="store_true",
                   help="re-cut sets still in loop (not ones with a clip, packed or posted)")
    s.add_argument("--reset-progress", action="store_true",
                   help="with --force: also rewind clip/packed rows to loop (drops the clip "
                        "reference and the queued row); posted rows are never re-cut")

    s = sub.add_parser("clips", help="render 1080x1920 clips from inbox recordings")
    s.add_argument("slugs", nargs="*", help="only these slugs (default: every loop without a clip)")
    s.add_argument("--still", help="explicit fallback image for loops with no recording (default: render the canvas, no footage)")
    s.add_argument("--audio-from-loop", action="store_true",
                   help="if a recording has no audio track, use the loop WAV under it")
    s.add_argument("--renderer", choices=sorted(RENDERERS),
                   help="effectcraft (default from config) or ffmpeg (fallback)")
    s.add_argument("--palette", help="force one palette entry by name (default: rotate)")
    s.add_argument("--viz", choices=VIZ_KINDS, default="osc",
                   help="visualizer: osc (oscilloscope, default), bars (spectrum), strip (static)")
    s.add_argument("--force", action="store_true", help="re-render clips that exist")

    s = sub.add_parser("pack", help="zip loops with clips and refresh queue.csv")
    s.add_argument("--captions", help="captions file, one per line (default from config: captions.txt)")
    s.add_argument("--caption", action="append", metavar="SLUG=TEXT",
                   help="set one queued row's caption by hand (repeatable)")

    s = sub.add_parser("caption", help="set one queued row's caption by hand")
    s.add_argument("slug")
    s.add_argument("text", help="caption; {bpm} and {key} are filled from the belt")

    s = sub.add_parser("hold", help="take a loop off the belt for now, with a reason")
    s.add_argument("slug")
    s.add_argument("reason", nargs="*", help="why (rights, quality); shown in status and the app")

    s = sub.add_parser("unhold", help="put a held loop back where it was")
    s.add_argument("slug")

    s = sub.add_parser("posted", help="mark a queued clip as posted")
    s.add_argument("slug")
    s.add_argument("--date", help="ISO date (default today)")

    s = sub.add_parser("cover", help="3000x3000 and 1080x1080 cover PNGs")
    s.add_argument("title")
    s.add_argument("--bg", help="background image (default: flat --color)")
    s.add_argument("--palette", help="palette entry name for canvas and ink "
                   "(default: palette_default, near-black, as the clips)")
    s.add_argument("--color", help="canvas colour (overrides --palette)")
    s.add_argument("--ink", help="text colour (overrides --palette)")
    s.add_argument("--bpm")
    s.add_argument("--key")
    s.add_argument("--logo", help="transparent PNG overlaid full-frame (e.g. assets/logo.png)")
    s.add_argument("--logo-corner", action="store_true", help="place --logo small, bottom right")
    s.add_argument("--out", help="output folder (default <root>/covers)")

    sub.add_parser("status", help="summarize belt.csv and queue.csv")

    s = sub.add_parser("doctor", help="read-only check that belt, queue and clip files agree")
    s.add_argument("--counts", action="store_true", help="counts only, no slugs")

    s = sub.add_parser("serve", help="open the belt as a local app on 127.0.0.1")
    s.add_argument("--port", type=int, default=8787)
    s.add_argument("--no-open", action="store_true", help="do not open the browser")
    return p


def main(argv: list[str] | None = None) -> int:
    global DRY_RUN
    args = build_parser().parse_args(argv)
    DRY_RUN = args.dry_run
    cfg = load_config(args.config)
    handler = {"loops": cmd_loops, "clips": cmd_clips, "pack": cmd_pack,
               "posted": cmd_posted, "caption": cmd_caption, "hold": cmd_hold, "unhold": cmd_unhold, "cover": cmd_cover, "status": cmd_status, "doctor": cmd_doctor,
               "serve": cmd_serve}[args.cmd]
    return handler(cfg, args)


if __name__ == "__main__":
    sys.exit(main())
