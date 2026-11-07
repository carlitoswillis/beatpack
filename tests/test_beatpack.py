"""Offline tests: no ffmpeg, gm, catalog or EffectCraft needed."""
import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import beatpack as bp  # noqa: E402


def cfg():
    c = json.loads(json.dumps(bp.DEFAULTS))
    c["font"], c["font_family"] = "/tmp/font.ttf", "VCR OSD Mono"
    return c


class BarMath(unittest.TestCase):
    def test_bar_seconds(self):
        self.assertAlmostEqual(bp.bar_seconds(120), 2.0)
        self.assertAlmostEqual(bp.bar_seconds(180), 4 / 3)
        self.assertAlmostEqual(bp.bar_seconds(120, beats_per_bar=3), 1.5)

    def test_bars_to_seconds(self):
        self.assertAlmostEqual(bp.bars_to_seconds(126, 8), 8 * 4 * 60 / 126)
        self.assertAlmostEqual(bp.bars_to_seconds(180, 8), 10.6666667, places=5)
        with self.assertRaises(ValueError):
            bp.bar_seconds(0)

    def test_loudest_start_on_phrase_grid(self):
        energy = [1] * 8 + [5] * 8 + [2] * 8
        self.assertEqual(bp.loudest_start_bar(energy, 8, step=4), 8)
        self.assertEqual(bp.loudest_start_bar([1, 2, 3], 8), 0)   # shorter than the loop


class Names(unittest.TestCase):
    def test_parse_key(self):
        self.assertEqual(bp.parse_key("ssg 126 Db major"), "Db major")
        self.assertEqual(bp.parse_key("regal 180 bpm a minor"), "A minor")
        self.assertEqual(bp.parse_key("freakin out (prod. barlitxs) 156 bpm D minor"), "D minor")
        self.assertEqual(bp.parse_key("wer VIDEO GAME IRIE:SOAP  Ab major 160 bpm"), "Ab major")
        self.assertEqual(bp.parse_key("Cm loop"), "C minor")
        self.assertEqual(bp.parse_key("522 idea"), "")
        self.assertEqual(bp.parse_key("mockingbird remix"), "")
        self.assertEqual(bp.parse_key("bump"), "")

    def test_slug(self):
        self.assertEqual(bp.slugify("regal 180 bpm a minor"), "regal")
        self.assertEqual(bp.slugify("522 idea Project"), "522-idea")
        self.assertEqual(bp.slugify("yours (prod. barlitxs, mori) 164 bpm B major"), "yours")
        self.assertEqual(bp.slugify("PLZ!!"), "plz")

    def test_title_and_key_line(self):
        self.assertEqual(bp.clean_title("ssg 126 Db major", "126"), "SSG")
        self.assertEqual(bp.clean_title("regal 180 bpm a minor", "180"), "REGAL")
        self.assertEqual(bp.clean_title("522 idea", "180"), "522 IDEA")
        self.assertEqual(bp.key_line("Bb major"), "bb major")
        self.assertEqual(bp.key_short("A minor"), "Amin")
        self.assertEqual(bp.fmt_bpm(126.0), "126")
        self.assertEqual(bp.fmt_bpm(92.5), "92.5")

    def test_title_block_order_and_key_omitted(self):
        c = cfg()
        lines = bp.title_lines(c, "HER", "150", "E minor")
        self.assertEqual([l[0] for l in lines], ["HER", "prod. barlitxs", "150 bpm", "e minor"])
        self.assertEqual(lines[0][1], c["title"]["title_size"])
        self.assertEqual(len(bp.title_lines(c, "X", "150", "")), 3)

    def test_gm_text_strips_quotes(self):
        self.assertEqual(bp.gm_text("it's \"x\""), "its x")


class Csv(unittest.TestCase):
    def test_round_trip_and_upsert(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "belt.csv"
            rows = [{"slug": "regal", "set_id": "1471", "name": "regal, 180", "status": "loop"}]
            bp.write_csv(p, bp.BELT_COLUMNS, rows)
            back = bp.read_csv(p, bp.BELT_COLUMNS)
            self.assertEqual(back[0]["name"], "regal, 180")
            self.assertEqual(back[0]["clip"], "")
            bp.upsert(back, {"slug": "regal", "status": "clip"})
            bp.upsert(back, {"slug": "ssg", "status": "loop"})
            self.assertEqual([r["status"] for r in back], ["clip", "loop"])
            self.assertEqual(back[0]["set_id"], "1471")

    def test_queue_dates_and_status(self):
        today = dt.date(2026, 11, 6)
        self.assertEqual(bp.next_dates([], 2, today), ["2026-11-07", "2026-11-08"])
        self.assertEqual(bp.next_dates(["2026-11-10"], 1, today), ["2026-11-11"])
        self.assertTrue(bp.status_at_least("packed", "clip"))
        self.assertFalse(bp.status_at_least("loop", "clip"))
        self.assertEqual(bp.caption_for(cfg(), "180", "A minor"), "180 BPM, A minor. Free loop in bio.")
        self.assertEqual(bp.caption_for(cfg(), "180", ""), "180 BPM. Free loop in bio.")


class Captions(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "c.txt"
        self.path.write_text("# note\n\nfirst. {bpm} bpm {key}. free\nsecond, {key}. {bpm} bpm\n")
        self.c = {**cfg(), "captions": str(self.path)}

    def tearDown(self):
        self.tmp.cleanup()

    def test_with_key(self):
        self.assertEqual(bp.caption_for(self.c, "150", "e minor", 0), "first. 150 bpm e minor. free")

    def test_without_key(self):
        self.assertEqual(bp.caption_for(self.c, "150", "", 0), "first. 150 bpm . free".replace(" .", "."))
        self.assertEqual(bp.caption_for(self.c, "150", "", 1), "second. 150 bpm")

    def test_wraps(self):
        self.assertEqual(bp.caption_for(self.c, "1", "k", 2), bp.caption_for(self.c, "1", "k", 0))
        real = {**cfg(), "captions": str(Path(bp.__file__).parent / "captions.txt")}
        self.assertEqual(bp.caption_for(real, "150", "a", 9), bp.caption_for(real, "150", "a", 0))

    def test_hand_pick_lines_never_assigned(self):
        self.path.write_text("plain {bpm}\n? ctx {bpm}\ninvite {bpm}\n")
        got = [bp.caption_for(self.c, "9", "", i) for i in range(4)]
        self.assertEqual(got, ["plain 9", "invite 9", "plain 9", "invite 9"])
        self.assertEqual(bp.hand_captions(self.c), ["ctx {bpm}"])
        real = {**cfg(), "captions": str(Path(bp.__file__).parent / "captions.txt")}
        self.assertEqual(len(bp.load_captions(real)), 9)
        self.assertEqual(len(bp.hand_captions(real)), 5)

    def test_missing_file_falls_back(self):
        c = {**cfg(), "captions": str(Path(self.tmp.name) / "nope.txt")}
        self.assertEqual(bp.caption_for(c, "180", "A minor", 3), "180 BPM, A minor. Free loop in bio.")


class Filtergraph(unittest.TestCase):
    def test_footage_band(self):
        self.assertEqual(bp.footage_geometry(1920, 1080), (608, 540, 900))
        self.assertEqual(bp.footage_geometry(1080, 400), (400, 400, 970))

    def test_palette_rotation(self):
        c = cfg()
        belt = [{"slug": s, "palette": ""} for s in "abc"]
        c["palette_mode"] = "rotate"
        self.assertEqual(bp.pick_palette(c, belt, belt[1])["name"], c["palette"][1]["name"])
        self.assertEqual(bp.pick_palette(c, belt, belt[0], "salmon")["ink"], "#1A1A1A")

    def test_graph_recording(self):
        c = cfg()
        pal = c["palette"][1]                        # coral: vertical line on the left
        box = bp.scope_box(c, pal["line"])
        self.assertTrue(box[4])
        g = bp.clip_filtergraph(src_w=1920, src_h=1080, audio="0:a", loudnorm="loudnorm=I=-14",
                                palette=pal, box=box, bound=20.0)
        self.assertIn("color=c=0xD4554A:s=1080x1920", g)
        self.assertIn("scale=1080:608,crop=1080:540", g)
        self.assertIn("[cv][fg]overlay=0:900", g)
        self.assertIn("[0:a]asplit=2", g)
        self.assertIn("mode=p2p", g)
        self.assertIn("transpose=clock", g)
        self.assertIn("color=c=0x1A1A1A", g)          # scope in the ink colour
        self.assertIn("loudnorm=I=-14,aresample=48000[aud]", g)
        self.assertNotIn("gblur", g)

    def test_graph_still_bottom_strip(self):
        c = cfg()
        pal = c["palette"][0]
        box = bp.scope_box(c, pal["line"])
        g = bp.clip_filtergraph(src_w=1920, src_h=1080, audio="2:a", loudnorm=None, palette=pal,
                                box=box, bound=15.238, viz="strip", strip_input=3)
        self.assertIn("[aw]anullsink;[3:v]format=gray", g)
        self.assertNotIn("transpose", g)
        self.assertIn(f"overlay={box[0]}:{box[1]}", g)
        with self.assertRaises(ValueError):
            bp.viz_chain("nope", "a", "b", box=box, ink="#fff", bound=1)

    def test_loudnorm_second_pass(self):
        m = {"input_i": "-21.2", "input_tp": "-3.8", "input_lra": "1.4",
             "input_thresh": "-31.2", "target_offset": "0.8"}
        f = bp.loudnorm_filter(-14, m)
        self.assertIn("measured_I=-21.2", f)
        self.assertIn("linear=true", f)
        self.assertIsNone(bp.loudnorm_filter(-14, {**m, "input_i": "-inf"}))
        self.assertIsNone(bp.loudnorm_filter(-14, None))


class EffectCraftTemplate(unittest.TestCase):
    def test_fill_template_types_and_flags(self):
        lines = ['{"command":"a","params":{"d":"{{D}}","p":["{{X}}",1]}}',
                 '{"when":"k","command":"b","params":{}}',
                 '{"capture":"audio","note":"n","command":"c","params":{}}', ""]
        cmds = bp.fill_template(lines, {"D": 12.5, "X": [1, 2]}, set())
        self.assertEqual(cmds[0]["params"], {"d": 12.5, "p": [[1, 2], 1]})
        self.assertEqual([c["command"] for c in cmds], ["a", "c"])
        self.assertEqual(bp.capture_index(cmds, "audio"), 1)
        self.assertEqual(len(bp.fill_template(lines, {"D": 1, "X": 0}, {"k"})), 3)
        with self.assertRaises(KeyError):
            bp.fill_template(lines[:1], {}, set())

    def test_repo_template_fills(self):
        c = cfg()
        job = bp.ClipJob("regal", Path("/x/regal.mov"), False, None, None, Path("/w/t.png"),
                         Path("/o/regal.mp4"), "180", "A minor", "REGAL", c["palette"][1])
        vals = bp.effectcraft_values(c, job, 1920, 1080, 20.0)
        tpl = (bp.REPO / "templates" / "osc-9x16.jsonl").read_text().splitlines()
        cmds = bp.fill_template(tpl, vals, {"audio_is_footage", "has_key"})
        self.assertEqual(vals["IMPORTS"], ["/x/regal.mov"])     # the recording is the audio
        self.assertEqual(vals["SCOPE_START"], [40, 300])
        self.assertEqual(vals["INK_RGBA"], [0.102, 0.102, 0.102, 1])
        texts = [c["params"]["text"] for c in cmds if c["command"] == "layer.newText"]
        self.assertEqual(texts.count("prod. barlitxs"), 1)       # printed once by default
        self.assertIn("a minor", texts)
        self.assertNotIn("{{", json.dumps(cmds))
        doubled = bp.fill_template(tpl, vals, {"audio_is_footage", "has_key", "doubled"})
        texts = [c["params"]["text"] for c in doubled if c["command"] == "layer.newText"]
        self.assertEqual(texts.count("prod. barlitxs"), 2)       # double_offset set
        self.assertEqual(texts.count("a minor"), 2)
        no_key = bp.fill_template(tpl, vals, {"audio_is_footage", "doubled"})
        self.assertNotIn("a minor", [c["params"].get("text") for c in no_key])


class TitleAndPaletteDefaults(unittest.TestCase):
    def test_title_draws_once_unless_doubled(self):
        c = cfg()
        lines = bp.title_lines(c, "REGAL", "180", "A minor")
        self.assertEqual(bp.title_draws(c, lines, "#E6E6E6").count("-draw"), 4)
        c["title"]["double_offset"] = [0, 300]
        self.assertEqual(bp.title_draws(c, lines, "#E6E6E6").count("-draw"), 8)

    def test_right_scope_clears_title(self):
        c = cfg()
        x, _, w, _, vertical = bp.scope_box(c, "right")
        self.assertTrue(vertical)
        self.assertEqual(x + w // 2, 1062)
        self.assertEqual(bp.scope_box(c, "left")[0] + w // 2, 40)

    def test_fixed_mode_ignores_stored_hex(self):
        c = cfg()
        belt = [{"slug": "regal", "palette": "#332AE2"}]
        p = bp.pick_palette(c, belt, belt[0])
        self.assertEqual((p["name"], p["bg"], p["line"]), ("near-black", "#0B0B0B", "bottom"))
        self.assertEqual(bp.pick_palette(c, belt, belt[0], "coral")["bg"], "#D4554A")
        self.assertEqual(bp.pick_palette(c, belt, belt[0], "#123456")["bg"], "#123456")
        belt[0]["palette"] = "salmon"                              # a named entry is kept
        self.assertEqual(bp.pick_palette(c, belt, belt[0])["name"], "salmon")
        c["palette_mode"] = "random2021"
        belt[0]["palette"] = "#332AE2"                             # stored roll repeats
        self.assertEqual(bp.pick_palette(c, belt, belt[0])["bg"], "#332AE2")


if __name__ == "__main__":
    unittest.main()


class Palette2021(unittest.TestCase):
    def test_seeded_roll_is_stable_and_in_range(self):
        a, b = bp.palette_2021("regal"), bp.palette_2021("regal")
        self.assertEqual(a, b)
        r, g, bl = (int(a["bg"][i:i + 2], 16) for i in (1, 3, 5))
        in_v1 = 0 <= r <= 255 and 0 <= g <= 130 and 175 <= bl <= 255
        in_v2 = 205 <= r <= 255 and 0 <= g <= 190 and (bl == 0 or 175 <= bl <= 255)
        self.assertTrue(in_v1 or in_v2, a)
        self.assertIn(a["line"], ("left", "right", "bottom"))

    def test_hex_name_round_trips(self):
        p = bp.palette_2021("ssg-126")
        again = bp.pick_palette({"palette": [], "palette_mode": "random2021"}, [], {"palette": p["name"], "slug": "ssg-126"})
        self.assertEqual(again, p)


class LoopFilter(unittest.TestCase):
    def test_limiter_oversampled_before_cut_and_fades(self):
        af = bp.loop_filter(19.2, 12.8, rate=44100, ceiling_db=-1.3)
        parts = af.split(",")
        self.assertEqual(parts[0], "aresample=176400")
        self.assertEqual(parts[1], f"alimiter=limit={10 ** (-1.3 / 20):.6f}:level=0:latency=1")
        self.assertEqual(parts[2], "aresample=44100")
        self.assertEqual(parts[3], "atrim=start=19.200000:duration=12.800000")
        self.assertEqual(parts[-2:], ["afade=t=in:d=0.005", "afade=t=out:st=12.795000:d=0.005"])

    def test_limiter_off_and_gain(self):
        af = bp.loop_filter(0, 10, rate=48000, ceiling_db=None)
        self.assertNotIn("alimiter", af)
        self.assertTrue(af.startswith("atrim=start=0.000000"))
        af = bp.loop_filter(0, 10, rate=48000, ceiling_db=-1.0, gain_db=-3.5)
        self.assertTrue(af.startswith("volume=-3.50dB,aresample=192000,alimiter="))

    def test_limit_clamped_to_alimiter_range(self):
        self.assertIn("limit=0.062500", bp.loop_filter(0, 1, rate=44100, ceiling_db=-40))
        self.assertIn("limit=1.000000", bp.loop_filter(0, 1, rate=44100, ceiling_db=3))

    def test_defaults(self):
        self.assertEqual(bp.DEFAULTS["loop_true_peak_dbtp"], -1.0)
        self.assertIsNone(bp.DEFAULTS["loop_target_lufs"])

    def test_parse_ebur128(self):
        err = ("[Parsed_ebur128_0 @ 0x1] Summary:\n\n  Integrated loudness:\n    I:         -10.0 LUFS\n"
               "    Threshold: -20.1 LUFS\n\n  True peak:\n    Peak:       -1.3 dBFS\n")
        self.assertEqual(bp.parse_ebur128(err), {"lufs": -10.0, "true_peak": -1.3})
        self.assertEqual(bp.parse_ebur128("Peak: -inf dBFS")["true_peak"], float("-inf"))


class Hold(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.cfg = cfg()
        self.cfg.update(root=self.root, captions=str(self.root / "none.txt"))
        clip = self.root / "a.mp4"
        clip.write_bytes(b"x")
        self.clip = str(clip)

        def r(slug, status, **kw):
            d = {c: "" for c in bp.BELT_COLUMNS}
            d.update(slug=slug, name=slug, bpm="140", status=status, **kw)
            return d
        bp.write_csv(self.root / "belt.csv", bp.BELT_COLUMNS, [
            r("keep", "clip", clip=self.clip), r("void", "packed", clip=self.clip),
            r("raw", "loop")])
        bp.write_csv(self.root / "queue.csv", bp.QUEUE_COLUMNS, [
            {"date": "2026-11-07", "slug": "void", "clip": self.clip, "caption": "c",
             "status": "queued", "posted_at": ""}])

    def tearDown(self):
        self.tmp.cleanup()

    def belt(self):
        return {r["slug"]: r for r in bp.read_csv(self.root / "belt.csv", bp.BELT_COLUMNS)}

    def ns(self, **kw):
        import argparse
        return argparse.Namespace(**kw)

    def test_hold_sets_reason_and_drops_queued_row(self):
        bp.cmd_hold(self.cfg, self.ns(slug="void", reason=["vocal", "cut"]))
        b = self.belt()["void"]
        self.assertEqual((b["status"], b["hold_reason"], b["held_from"]), ("hold", "vocal cut", "packed"))
        self.assertEqual(bp.read_csv(self.root / "queue.csv", bp.QUEUE_COLUMNS), [])
        # holding again only changes the reason; held_from survives
        bp.cmd_hold(self.cfg, self.ns(slug="void", reason=["silence"]))
        b = self.belt()["void"]
        self.assertEqual((b["hold_reason"], b["held_from"]), ("silence", "packed"))

    def test_unhold_restores(self):
        bp.cmd_hold(self.cfg, self.ns(slug="void", reason=[]))
        bp.cmd_unhold(self.cfg, self.ns(slug="void"))
        b = self.belt()["void"]
        self.assertEqual((b["status"], b["hold_reason"], b["held_from"]), ("packed", "", ""))
        bp.cmd_hold(self.cfg, self.ns(slug="raw", reason=["x"]))
        bp.cmd_unhold(self.cfg, self.ns(slug="raw"))
        self.assertEqual(self.belt()["raw"]["status"], "loop")

    def test_pack_and_clips_skip_held(self):
        bp.cmd_hold(self.cfg, self.ns(slug="void", reason=["rights"]))
        bp.cmd_hold(self.cfg, self.ns(slug="raw", reason=["rights"]))
        bp.cmd_pack(self.cfg, self.ns(captions=None, caption=None))
        b = self.belt()
        self.assertEqual(b["void"]["status"], "hold")
        self.assertEqual(b["keep"]["status"], "packed")
        q = bp.read_csv(self.root / "queue.csv", bp.QUEUE_COLUMNS)
        self.assertEqual([x["slug"] for x in q], ["keep"])
        import zipfile
        z = next((self.root / "packs").glob("*.zip"))
        self.assertFalse(any("/void/" in n for n in zipfile.ZipFile(z).namelist()))
        # clips --force over everything: the held rows are never handed to a renderer
        called = []
        old = dict(bp.RENDERERS)
        bp.RENDERERS["ffmpeg"] = lambda c, job: called.append(job.slug)
        try:
            bp.cmd_clips(self.cfg, self.ns(slugs=[], renderer="ffmpeg", force=True, still=None,
                                            audio_from_loop=False, palette=None, viz="osc"))
            bp.cmd_clips(self.cfg, self.ns(slugs=["raw"], renderer="ffmpeg", force=True,
                                            still="/x.png", audio_from_loop=False, palette=None,
                                            viz="osc"))
        finally:
            bp.RENDERERS.clear(); bp.RENDERERS.update(old)
        self.assertEqual(called, [])

    def test_job_slugs_and_action_skip_held(self):
        bp.cmd_hold(self.cfg, self.ns(slug="raw", reason=["x"]))
        belt = list(self.belt().values())
        self.assertEqual(bp.job_slugs({"cmd": "clips", "args": ["--force"]}, belt), {"keep", "void"})
        self.assertEqual(bp.job_slugs({"cmd": "clips", "args": ["raw"]}, belt), set())
        self.assertIsNone(bp.next_action(self.belt()["raw"], True, False))

    def test_status_prints_reason(self):
        import io, contextlib
        bp.cmd_hold(self.cfg, self.ns(slug="raw", reason=["unfinished"]))
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            bp.cmd_status(self.cfg, self.ns())
        self.assertIn("hold 1", out.getvalue())
        self.assertRegex(out.getvalue(), r"hold +raw .*\(unfinished\)")
