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


class Filtergraph(unittest.TestCase):
    def test_footage_band(self):
        self.assertEqual(bp.footage_geometry(1920, 1080), (608, 540, 760))
        self.assertEqual(bp.footage_geometry(1080, 400), (400, 400, 830))

    def test_palette_rotation(self):
        c = cfg()
        belt = [{"slug": s, "palette": ""} for s in "abc"]
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
        self.assertIn("[cv][fg]overlay=0:760", g)
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
        self.assertEqual(texts.count("prod. barlitxs"), 2)       # printed twice
        self.assertIn("a minor", texts)
        self.assertNotIn("{{", json.dumps(cmds))


if __name__ == "__main__":
    unittest.main()
