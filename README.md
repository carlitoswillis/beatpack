# beatpack

A small command-line tool that turns the Ableton catalog (ableton-library) into daily 9:16 loop clips, free loop packs and covers.
One Python 3 file, standard library only (`python3 -I beatpack.py ...` works). It renders with EffectCraft by default and ffmpeg plus GraphicsMagick as the fallback.
It writes everything to `~/Music/loopbelt/` and tracks progress in two CSV files. It never posts or uploads anything.

## Install

Prerequisites: macOS with Python 3, Homebrew, the ableton-library catalog already scanned (`library.db` below must exist; `loops` stops with "catalog not found" otherwise), and, for the default renderer, a Rust toolchain (`brew install rust`). ffmpeg must include the `aac_at` encoder (the Homebrew build on macOS does; check with `ffmpeg -encoders | grep aac_at`).

```sh
brew install ffmpeg graphicsmagick
# default renderer: EffectCraft CLI, built from source (one-time, ~6 min)
#   git clone https://github.com/storytold/effectcraft ~/workspace/effectcraft/repo   (the path config.json expects)
#   cd ~/workspace/effectcraft/repo && git checkout bb2d2005cee68458a10ae2cc32d609d070b21744   (v0.21.0)
#   commit bb2d2005cee68458a10ae2cc32d609d070b21744 (v0.21.0)
#   cargo build --release -p effectcraft-cli   -> ~/workspace/effectcraft/repo/target/release/effectcraft-cli
python3 -m unittest            # run from the repo root; offline tests, no tools needed
python3 -I beatpack.py serve   # the belt as a local app
```

Without EffectCraft, pass `--renderer ffmpeg` or set `"renderer": "ffmpeg"` in `config.json`.

## Daily workflow (about an hour for a batch)

1. **Pick sets.** In ableton-library, star sets into a list (for example `candidates`), or note their set ids.
2. **Cut loops.** `python3 beatpack.py loops --list candidates` writes an 8-bar WAV and a 320k MP3 per set to `loops/<slug>/`. It prints each slug.
3. **Record the screen.** Open the set in Live and loop the same 8 bars. Press **Cmd-Shift-5**, choose "Record Selected Portion" around the Live window, and record 15-30 s. Save it as `~/Music/loopbelt/inbox/<slug>.mov`.
   - The recording must carry sound. Cmd-Shift-5 only records a microphone, so either pick a loopback device as the microphone in Options, or use OBS (free) with a "macOS Screen Capture" source and app audio.
   - If it has no sound, `clips` stops and says so. `--audio-from-loop` lays the loop WAV under the picture instead.
4. **Render clips.** `python3 beatpack.py clips` writes `clips/<slug>.mp4` for every loop that has a recording. A loop with no recording is skipped with a `wait` line (exit 0) unless you pass `--still`. The recording is never cut and no audio is added to it: its own sound drives the scope and is only loudness-normalised to -14 LUFS.
5. **Pack and queue.** `python3 beatpack.py pack` zips every loop that has a clip into `packs/<date>-loops.zip` (with a plain README) and adds each new clip to `queue.csv`, one per day from tomorrow. Put the zip behind the bio link.
6. **Post by hand, then mark it.** Each day, `python3 beatpack.py status` shows the next clip and its caption. Post it from the phone, then run `python3 beatpack.py posted <slug>`.

## The app: `serve`

`python3 -I beatpack.py serve` opens the belt in the browser at `http://127.0.0.1:8787/`. It is the same tool with a window: one row per loop, moving through four stations (loop, clip, pack, posted), and one button per row that does the next thing.

- **Render** runs `clips <slug>`, **Pack** runs `pack`, **Mark posted** runs `posted <slug>`. Each runs the same code as the CLI, one job at a time, in the background. Its output streams to the log drawer at the bottom of the window.
- **Missing recording:** drop the .mov or .mp4 on the row (or use "choose a file"). It is copied to `inbox/<slug>.<ext>`. An existing recording is never overwritten.
- **Rendering:** the station being worked on is the only amber thing on screen, with the elapsed time. Other buttons wait.
- **Failed:** a crossed square, the word "failed", the line that explains it, and **Retry**. The last failure per row is kept in `~/Music/loopbelt/state.json` until that row runs again, so it survives a server restart.
- **Thumbnails:** one frame at 3 s per clip, made with ffmpeg on first view and cached in `~/Music/loopbelt/thumbs/`. A new render replaces it. A loop with no clip shows a flat block in its canvas colour.
- Flags: `--port` (default 8787) and `--no-open`. If something already listens on the port, it moves to the next free one and prints the URL. Global flags still go first: `python3 beatpack.py --config scratch.json serve`.
- It listens on 127.0.0.1 only and answers only requests addressed to that host. It posts, uploads and deletes nothing. Stop it with Ctrl-C, or `pkill -f "beatpack.py.*serve"` (the `.*` also matches `-I` and `--config` before `serve`).

Routes, for scripting: `GET /api/state`, `GET /api/log?since=N`, `POST /api/run` with JSON `{"cmd": "clips", "args": ["regal", "--force"]}` (loops, clips, pack, posted, cover), and `POST /api/inbox?slug=<slug>&ext=mov` with the file as the body and the header `X-Beatpack: 1`.

## Subcommands

| Command | Example | What it does |
|---|---|---|
| `loops` | `loops --ids 1471 1501 --bars 8` | Cuts a loop at the set's tempo from its primary preview: the loudest `bars` window on a 4-bar grid, or `--at-bar 17` or `--at 32.5`. `--audio stem.wav` swaps in another source (one set), e.g. a stemdrop melody stem. `--list NAME` reads a catalog list. Sets already on the belt are skipped unless you pass `--force`. |
| `clips` | `clips regal --palette coral` | Renders 1080x1920, 30 fps, H.264 yuv420p, AAC 48 kHz. `--still shot.png` is the fallback for loops with no recording: it is marked `still-fallback` in belt.csv, and the loop WAV is used for 8 bars. `--renderer effectcraft\|ffmpeg`, `--viz osc\|bars\|strip` (ffmpeg only; osc is the default and the only one in the EffectCraft template), `--force` re-renders. |
| `pack` | `pack` | Zips loops with status clip or later, sets them to `packed`, and refreshes queue.csv. |
| `posted` | `posted regal` | Marks the queue row posted with today's date (`--date` to override) and sets the belt row to `posted`. |
| `cover` | `cover "regal" --palette coral --bpm 180 --key "A minor"` | Writes 3000x3000 and 1080x1080 PNGs to `covers/`: a flat canvas (`palette_default`, near-black like the clips, unless `--palette`, `--color` or `--bg image`), the same single title block 60 px from the top and right, and an optional `--logo assets/logo.png` (full-frame overlay; `--logo-corner` puts a small mark bottom right). |
| `status` | `status` | Counts by status, every belt row, every queue row, and the next post. |
| `serve` | `serve --port 8787` | The belt as a local app in the browser (see above). |

Global flags: `--config path.json` and `--dry-run`, which prints every ffmpeg, gm and EffectCraft command and writes nothing. They go **before** the subcommand (`python3 beatpack.py --dry-run clips regal`); after it, argparse rejects them.

Exit codes: a missing recording (with no `--still`) or an unknown slug prints a `wait`/`skip` line and exits 0, so check the output rather than the exit status. A render failure, a recording with no audio, a bad `--config` and `posted` on a slug that is not in `queue.csv` exit 1. `posted` only works after `pack` has queued the clip.

## The clip (the 2021 look)

The clip follows the owner's own 2021 posts (see `producer/research/16-the-2021-look.md`):

- **Canvas:** one flat colour per clip, near-black by default (see Palette below for the 2021 rotation and the random tint). No blur and no gradient.
- **Footage:** the screen recording as a full-width panel in the middle band (y 760-1300). It is scaled to 1080 wide and a 16:9 source is centre-cropped to 540 px tall.
- **Title block:** top right, right edge at x 1020, top at y 280. Four lines in VCR OSD Mono: the title in caps (90 px), `prod. barlitxs`, `NNN bpm`, and the key in lower case (55 px; the key line is dropped if unknown). The block is printed once. Setting `title.double_offset` in `config.json` to `[dx, dy]` (the 2021 posts used about `[0, 300]`) prints it a second time, offset like a misregistered print; `null` (the default) turns that off. Ink is `#E6E6E6` on dark canvases and `#1A1A1A` on light ones, chosen by the canvas luminance.
- **Scope:** a 1 px oscilloscope in the ink colour, drawn from the clip's own audio. It runs horizontally at y 1560 from x 120 to 960 on dark canvases, and vertically (x 40 on the left edge, x 1062 on the right so it clears the title block, y 300 to 1600) on light ones.

- **Palette:** `palette_mode` in `config.json` picks the canvas colour. `fixed` (the default) uses `palette_default` (`near-black`, #0B0B0B with light ink and the scope along the bottom) for every clip, and ignores hexes stored by earlier random rolls, so existing rows re-render near-black. `random2021` rolls a tint like the old makeCover.js, seeded by the slug: either blues and purples, or reds, oranges and pinks. `rotate` walks the fixed `palette` list down the belt instead. `--palette <name or #hex>` forces one colour. belt.csv stores the hex of each clip, so a re-render repeats the colour; clear the `palette` cell to roll again.

Everything above lives in `config.json` (`palette_mode`, `palette`, `title`, `scope`, `viz_effectcraft`) and can be tuned without touching code. To keep a clip's title, edit the `title` column in belt.csv; `--palette` forces a colour.

## Renderers

- **EffectCraft (default).** `templates/osc-9x16.jsonl` is a list of EffectCraft commands with typed `{{PLACEHOLDERS}}`. Per clip, beatpack:
  - fills the placeholders: footage, audio, canvas, ink, the eight text layers, and the scope path and settings;
  - runs `effectcraft-cli run --commands <slug>.ec.jsonl --empty --save-as <slug>.ecproj --json`;
  - reads the audio layer's numeric id from that output and sets the Audio Waveform's `audioLayer` to it, then checks it with `get` (the `#n` form silently stays empty);
  - renders H.264 with `effectcraft-cli render`;
  - remuxes with two-pass loudnorm (video copied) only when the result is more than 1 LU from -14 LUFS.

  When the recording carries sound, the audio layer is the recording itself, with its video switched off. The picture layer is muted. Fonts load through `EFFECTCRAFT_FONT_DIRS=assets/fonts`. The per-clip `.ecproj` and `.ec.jsonl` stay in `~/Music/loopbelt/.work/`, so one clip can be opened in the EffectCraft app and adjusted by hand.
- **ffmpeg (fallback).** It draws the same layout: the title block is a GraphicsMagick PNG, and the scope is `showwaves` p2p alphamerged onto the ink colour. The filtergraphs it uses are written out at the end of `docs/ffmpeg-recipes.sh`. A showwaves frame only holds one frame period of audio (33 ms), while EffectCraft uses a 120 ms window, so the trace moves a little differently.

Adding a renderer means adding a function `render_x(cfg, job)` and an entry in `RENDERERS` in `beatpack.py`. The `ClipJob` it receives carries footage, audio (None means the recording's own sound), duration, title, bpm, key, palette, viz and the output path.

## Folder layout

```
~/Music/loopbelt/
  belt.csv               one row per loop
  queue.csv              one row per clip to post
  inbox/<slug>.mov       your screen recordings (also .mp4, .m4v)
  loops/<slug>/<slug>_<bpm>bpm_<key>.wav and .mp3
  clips/<slug>.mp4
  packs/<date>-loops.zip
  covers/<name>-3000.png, <name>-1080.png
  stills/                optional fallback images
  thumbs/<slug>.jpg      app thumbnails (frame at 3 s), safe to delete
  .work/                 title PNGs, per-clip EffectCraft projects, logs
```

The catalog is opened read-only at `~/Library/Application Support/ableton-library/library.db` (tables sets, projects, previews, lists, list_items).

## CSV columns

**belt.csv:**
- `slug`, `set_id`, `name` (project name), `title` (what the clip prints; edit freely)
- `bpm` (the set's tempo), `key` (parsed from the project or set name, may be empty)
- `bars`, `start_s`, `duration_s` (the cut)
- `source` (preview path), `wav`, `mp3`, `clip`
- `clip_kind`: `recording`, `recording+loop-audio` or `still-fallback`, plus `:renderer`
- `palette`, `status` (`loop` → `clip` → `packed` → `posted`), `updated`

**queue.csv:** `date` (planned post day), `slug`, `clip`, `caption` (e.g. "180 BPM, A minor. Free loop in bio."), `status` (`queued` or `posted`), `posted_at`.

## Fonts

- `assets/fonts/VCR_OSD_MONO_1.001.ttf` is the 2021 font. **Its licence is unresolved**: see `assets/fonts/VCR_OSD_MONO.LICENSE-STATUS.txt`. Settle it before this repo is public.
- `VT323-Regular.ttf` (SIL OFL) is the free fallback. It is used automatically if the VCR file is missing, or set `"font"`/`"font_family"` to it.

## Test data on this machine

The clips made on 2026-11-06 (`regal`, `ssg-126`, `522-idea`) are placeholders. Their "screen recordings" in `inbox/` are ffmpeg `testsrc2` colour bars with the loop's own audio muxed in, and `ssg-126` uses the still fallback with a testsrc2 frame. Delete those files, record the real Live window, and run `clips --force`. Do not post them.

## What was removed and why

The 2018-19 Electron app is gone from this branch. It is still in git history: `git log master`, or `git show 861bfc3:<path>`. Removed:
- **Electron/React/webpack UI** (`main.js`, `app/`, `views/`, bundles): a second app over folders the catalog already indexes.
- **Express server, YouTube OAuth uploader, Spotify stub** (`server/`, `youtube/`, `process/upload_old.js`): broken (missing credentials and modules) and not needed. Posting is by hand.
- **process/cleanUp.js:** it deleted every non-mp3/wav file in the *source* folder. It was not ported, and nothing in beatpack deletes inputs.
- **Folder-name parsing, settings JSON, random cover colours, BOGO text, the jest tests** for the removed code.

Ported into `beatpack.py`, at about 150 lines of the old logic:
- the 320k MP3 encode (`encode.js`);
- the ffprobe duration and bar math (`getSongDurationInSeconds.js`, minus its `bars` name bug);
- the `-t` bound for looped input and `-loop 1 -framerate 30` for stills (`ffmpeg.js`);
- zipping (`zipfolder.js`, now stdlib `zipfile`);
- the doubled title block (`makeCover.js`).

`docs/ffmpeg-recipes.sh` keeps the old showwaves recipes and the aac_at notes.
