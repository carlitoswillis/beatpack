#!/bin/sh
#
# BeatPack ffmpeg scratch recipes
# ------------------------------
# Recipes 1-3 are exploratory one-liners kept from the old app. The final
# clip filtergraphs that beatpack.py builds are at the end of this file.
# The file exists so the commands live somewhere they can actually be run,
# instead of in a .js file that was never valid JavaScript.
#
# History: these were previously "ffmpeg analyze audio.js" and
# "process/showwaves.js" -- two shell scratchpads with .js extensions.
# They ran `docker run jrottenberg/ffmpeg:3.2-scratch` (an ffmpeg 3.2 image
# from 2016; the second invocation pinned no tag at all, so it floated to
# :latest) and encoded audio with `-c:a libfdk_aac -vbr 5`.
#
# WHY libfdk_aac IS GONE
# ----------------------
# Fraunhofer FDK AAC is non-free. ffmpeg linked against it must be built
# --enable-nonfree, and the resulting binary is NOT redistributable. It is
# also simply absent from the ffmpeg this project targets (Homebrew 8.1.1,
# built --enable-gpl --enable-version3, no libfdk_aac), so those commands
# failed here anyway:
#   [aost#0:1] Error selecting an encoder / Encoder not found  (exit 8)
#
# THE REPLACEMENT: -c:a aac_at -aac_at_mode vbr -q:a 1
#
#   `aac_at` is Apple AudioToolbox AAC, available because this ffmpeg is
#   built --enable-audiotoolbox. It is the only free encoder in this build
#   with a real VBR ratecontrol mode:
#       ffmpeg -h encoder=aac_at
#       -aac_at_mode <int> ... vbr 3 ... variable bitrate
#                              auto -1 ... VBR if global quality is given
#   driven by -q:a.
#
#   Measured on this machine, aac_at VBR on a music-like stereo signal:
#       q=0 -> 182919 bps (91.5 kbps/channel)
#       q=1 -> 164202 bps (82.1 kbps/channel)
#       q=2 -> 149562 bps (74.8 kbps/channel)
#       q=3 -> 127346 bps (63.7 kbps/channel)
#   `man ffmpeg-codecs` on this machine documents libfdk_aac's -vbr 5 as
#   "about 80-96 kbps/channel". q=1 lands inside that band. VBR output is
#   content-dependent: on a high-entropy pink-noise signal the same q=1 rose
#   to 317101 bps, which is VBR working as intended, not a misconfiguration.
#
#   This is NOT a claim that aac_at matches libfdk_aac perceptually -- that
#   cannot be measured here, because libfdk_aac does not exist in this build.
#   The defensible claim is narrower: same ratecontrol structure (true VBR
#   driven by a quality scalar), output bitrate inside the documented band of
#   the flag being replaced, muxes into the target container, ships in a
#   freely redistributable build.
#
# WHAT NOT TO DO
# --------------
#   Do NOT swap to `-c:a aac -vbr 5`. That is the trap, and it fails
#   silently. `-vbr` is an fdk-private option; native aac has no equivalent.
#   ffmpeg accepts and ignores it -- measured 128168 bps, byte-for-byte the
#   same as `-c:a aac` with no options at all. (ffmpeg does reject genuinely
#   unknown options; `-vbr` is only "known" because libopus defines it, with
#   entirely different 0-2 semantics.) Native aac's `-q:a` is not a
#   substitute either: measured non-monotonic on pink noise
#   (q=1 -> 107960, q=2 -> 231072, q=5 -> 217529 bps).
#
#   libopus was evaluated and rejected on container grounds, not quality:
#   `-c:a libopus` into .m4v fails outright with
#     [ipod] Could not find tag for codec opus in stream #1,
#            codec not currently supported in container
#   and macOS ships no opus_at system decoder, so QuickTime/Finder preview
#   becomes an unknown.
#
# PORTABILITY
# -----------
#   aac_at is macOS only. That is already moot for this app -- process/
#   hardcodes /opt/homebrew/bin/{ffmpeg,ffprobe,lame}, pinning it to Apple
#   Silicon macOS -- but the portable fallback is:
#       -c:a aac -b:a 192k
#
# NOT AVAILABLE IN THIS BUILD
# ---------------------------
#   `drawtext` is MISSING -- this Homebrew ffmpeg has no libfreetype
#   (`ffmpeg -filters | awk '$2=="drawtext"'` returns nothing). It appears in
#   "process/ffmpeg notes" and will fail immediately if lifted into process/.
#   Every other filter used below and in that notes file is present.
#
set -eu

FFMPEG="${FFMPEG:-/opt/homebrew/bin/ffmpeg}"
IN="${1:?usage: $0 <input-audio-file> [output-dir]}"
OUTDIR="${2:-.}"
mkdir -p "$OUTDIR"

# 1. Red waveform strip over the audio, 1080x120 @ 240fps.
#    (was line 1 of "ffmpeg analyze audio.js")
"$FFMPEG" -stats -itsoffset 00:00:0.050 -i "$IN" \
  -filter_complex "[0:a]aformat=channel_layouts=mono,showwaves=s=1080x120:mode=cline:r=240:colors=red,format=yuv420p[v]" \
  -map "[v]" -map 0:a \
  -c:v libx264 -c:a aac_at -aac_at_mode vbr -q:a 1 \
  "$OUTDIR/waveform-strip.mp4" -y

# 2. Black waveform centered on a white 2560x1440 canvas.
#    (was line 5 of "ffmpeg analyze audio.js" -- note it pinned no docker tag)
"$FFMPEG" -stats -itsoffset 00:00:0.050 -i "$IN" \
  -f lavfi -i "color=s=2560x1440:r=120:color=white" \
  -filter_complex "[0:a]aformat=channel_layouts=mono,showwaves=s=2560x1440:mode=cline:r=30:colors=black[v];[1:v][v]overlay=format=auto:x=(W-w)/2:y=(H-h)/2,format=yuv420p[outv]" \
  -map "[outv]" -map 0:a \
  -c:v libx264 -c:a aac_at -aac_at_mode vbr -q:a 1 -shortest \
  "$OUTDIR/waveform-canvas.mp4" -y

# 3. Transparent (RGBA) waveform overlay as a PNG-in-MOV.
#    (was process/showwaves.js -- no non-free codec, same .js-that-isn't-JS
#    problem.) -c:v png keeps the alpha channel so this can be composited.
"$FFMPEG" -i "$IN" \
  -filter_complex "[0:a]showwaves=s=1920x60:mode=line:colors=white:draw=full,format=rgba[v]" \
  -map "[v]" -map 0:a -c:v png \
  "$OUTDIR/showwaves-overlay.mov" -y

# =====================================================================
# FINAL CLIP RECIPES (beatpack.py, 2026-11-06)
# =====================================================================
# These are what `beatpack.py clips --renderer ffmpeg` runs, printed from
# clip_filtergraph() for a 1920x1080 source. This section is comments only;
# running the script still runs just recipes 1-3 above.
#
# Layout: the 2021 barlitxs look. Flat canvas from the palette, the screen
# recording as a full-width panel at y 760-1300 (scaled to width 1080,
# centre-cropped to 540 high), a 1 px oscilloscope (showwaves p2p) in the
# ink colour, and the title block as a transparent PNG made by gm.
#
# Lessons kept from process/ffmpeg.js and found again here:
#   - `-shortest` does not bound `-stream_loop -1`; bound with `-t`.
#   - a still needs `-loop 1 -framerate 30`, or it becomes a 1-frame video.
#   - NEW: every `-loop 1` image input also needs an INPUT-side `-t`
#     (`-loop 1 -framerate 30 -t 15.238 -i still.png`). Without it the graph
#     never finishes once the audio ends (measured: stuck at 14.6 s of 15.2).
#   - colorkey=black would also remove a dark ink (#1A1A1A), so the scope is
#     drawn white as a mask and alphamerged onto a solid of the ink colour.
#   - showwaves mode=line fills centre-to-sample (thick); p2p is a 1 px trace.
#   - showwaves shows exactly one frame period of audio per frame (33 ms at
#     30 fps); a longer window needs EffectCraft's Audio Waveform.
#
# Title block (gm draws text at the BASELINE even with -gravity NorthEast):
#   gm convert -size 1080x1920 xc:none -gravity NorthEast -font VCR_OSD_MONO_1.001.ttf \
#     -fill '#1A1A1A' -pointsize 90 -draw "text 60,344.8 'HER'" \
#     -pointsize 55 -draw "text 60,419.6 'prod. barlitxs'" ... \
#     (then the same four lines again 6 px right and 40 px down) text.png
#
# A. Screen recording that carries its own audio, colour canvas (coral),
#    vertical scope on the left edge. Inputs: 0 = recording, 1 = text.png.
#    The recording is never cut; LOUDNORM_2ND_PASS is the measured
#    loudnorm=I=-14:TP=-1:LRA=11:measured_*=...:linear=true string.
#
#   ffmpeg -i inbox/<slug>.mov -loop 1 -framerate 30 -t <rec_seconds> -i text.png \
#     -filter_complex "<graph A>" -map "[v]" -map "[aud]" -r 30 \
#     -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -profile:v high \
#     -movflags +faststart -c:a aac_at -b:a 256k -ar 48000 clips/<slug>.mp4
#
# graph A:
#   color=c=0xD4554A:s=1080x1920:r=30:d=20.000[cv];
#   [0:v]fps=30,scale=1080:608,crop=1080:540,setsar=1[fg];
#   [cv][fg]overlay=0:760:shortest=1[base];
#   [0:a]asplit=2[aw][an];
#   [aw]aformat=channel_layouts=mono,showwaves=s=1300x40:mode=p2p:draw=full:rate=30:colors=white,format=gray,transpose=clock[wvm];color=c=0x1A1A1A:s=40x1300:r=30:d=20.000[wvc];[wvc][wvm]alphamerge[wv];
#   [base][wv]overlay=20:300:shortest=1[v1];
#   [1:v]format=rgba[tx];
#   [v1][tx]overlay=0:0:shortest=1,format=yuv420p[v];
#   [an]LOUDNORM_2ND_PASS,aresample=48000[aud]
#
# B. Still fallback, dark canvas (black), horizontal scope at y 1560.
#    Inputs: 0 = still (-loop 1 -framerate 30 -t <loop_s>), 1 = text.png (same),
#    2 = loop WAV; add -t <loop_s> on the output.
#
#   color=c=0x000000:s=1080x1920:r=30:d=15.238[cv];
#   [0:v]fps=30,scale=1080:608,crop=1080:540,setsar=1[fg];
#   [cv][fg]overlay=0:760:shortest=1[base];
#   [2:a]asplit=2[aw][an];
#   [aw]aformat=channel_layouts=mono,showwaves=s=840x40:mode=p2p:draw=full:rate=30:colors=white,format=gray[wvm];color=c=0xE6E6E6:s=840x40:r=30:d=15.238[wvc];[wvc][wvm]alphamerge[wv];
#   [base][wv]overlay=120:1540:shortest=1[v1];
#   [1:v]format=rgba[tx];
#   [v1][tx]overlay=0:0:shortest=1,format=yuv420p[v];
#   [an]LOUDNORM_2ND_PASS,aresample=48000[aud]
