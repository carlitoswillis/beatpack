"""build_state and the job bookkeeping behind `beatpack serve`. Offline: temp folders only."""
import datetime as dt
import json
import sys
import tempfile
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import beatpack as bp  # noqa: E402


def row(slug, status, **kw):
    r = {c: "" for c in bp.BELT_COLUMNS}
    r.update(slug=slug, name=slug, title=slug.upper(), bpm="140", key="A minor", status=status)
    r.update(kw)
    return r


class BuildState(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.cfg = json.loads(json.dumps(bp.DEFAULTS))
        self.cfg.update(root=root, db=root / "missing.db")
        (root / "inbox").mkdir()
        (root / "clips").mkdir()
        clip = root / "clips" / "regal.mp4"
        clip.write_bytes(b"x")
        (root / "inbox" / "her.mov").write_bytes(b"x")
        self.belt = [
            row("regal", "packed", clip=str(clip)),
            row("her", "loop", palette="coral"),
            row("night", "loop"),
            row("bleed", "posted"),
        ]
        bp.write_csv(root / "belt.csv", bp.BELT_COLUMNS, self.belt)
        bp.write_csv(root / "queue.csv", bp.QUEUE_COLUMNS, [
            {"date": "2026-11-05", "slug": "bleed", "clip": "", "caption": "c",
             "status": "posted", "posted_at": "2026-11-05"},
            {"date": "2026-11-07", "slug": "regal", "clip": str(clip),
             "caption": "140 BPM, A minor. Free loop in bio.", "status": "queued", "posted_at": ""},
        ])

    def tearDown(self):
        self.tmp.cleanup()

    def rows(self, state):
        return {r["slug"]: r for r in state["rows"]}

    def test_status_line_and_rows(self):
        s = bp.build_state(self.cfg, today=dt.date(2026, 11, 6))
        self.assertEqual(s["status_line"], "4 loops, 1 posted, next: regal on 2026-11-07")
        self.assertFalse(s["empty"])
        self.assertEqual(s["next_slug"], "regal")
        r = self.rows(s)
        self.assertEqual(r["regal"]["state"], "queued")
        self.assertEqual(r["regal"]["station"], 2)
        self.assertEqual(r["regal"]["action"]["cmd"], "posted")
        self.assertTrue(r["regal"]["thumb"].startswith("/thumb/regal.jpg?v="))
        self.assertEqual(r["regal"]["key"], "a minor")
        self.assertEqual(r["her"]["action"], {"label": "Render", "cmd": "clips", "args": ["her"]})
        self.assertEqual(r["her"]["color"], "#D4554A")        # named entry kept
        self.assertEqual(r["night"]["state"], "empty")         # waiting for a recording
        self.assertIsNone(r["night"]["action"])
        self.assertFalse(r["night"]["has_recording"])
        self.assertIsNone(r["night"]["thumb"])
        self.assertEqual(r["night"]["color"], "#0B0B0B")       # fixed near-black default
        self.assertEqual(s["rows"][-1]["slug"], "bleed")        # posted sinks to the bottom
        self.assertEqual(r["bleed"]["posted_at"], "2026-11-05")

    def test_rendering_marks_the_touched_rows(self):
        job = {"cmd": "clips", "args": ["--force"], "started": 0}
        r = self.rows(bp.build_state(self.cfg, job=job))
        self.assertTrue(all(x["state"] == "rendering" for x in r.values()))
        self.assertEqual(r["regal"]["target"], 1)
        job = {"cmd": "clips", "args": [], "started": 0}
        r = self.rows(bp.build_state(self.cfg, job=job))
        self.assertEqual({k for k, v in r.items() if v["state"] == "rendering"}, {"her", "night"})
        r = self.rows(bp.build_state(self.cfg, job={"cmd": "posted", "args": ["regal"], "started": 0}))
        self.assertEqual((r["regal"]["state"], r["regal"]["target"]), ("rendering", 3))
        self.assertEqual(r["her"]["state"], "done")

    def test_failed_row_offers_retry(self):
        fails = {"her": {"line": "fail her: her.mov has no audio track.", "cmd": "clips",
                         "args": ["her"]}}
        r = self.rows(bp.build_state(self.cfg, failures=fails))["her"]
        self.assertEqual(r["state"], "failed")
        self.assertEqual(r["target"], 1)
        self.assertEqual(r["action"]["label"], "Retry")
        self.assertIn("no audio", r["error"])

    def test_empty_belt(self):
        (Path(self.tmp.name) / "belt.csv").unlink()
        (Path(self.tmp.name) / "queue.csv").unlink()
        s = bp.build_state(self.cfg)
        self.assertTrue(s["empty"])
        self.assertEqual(s["status_line"], "0 loops, 0 posted")
        self.assertFalse(s["config"]["catalog"])


    def test_worker_runs_cli_path_and_records_failure(self):
        conf = Path(self.tmp.name) / "c.json"
        conf.write_text(json.dumps({"root": self.tmp.name}))
        w = bp.Worker(bp.load_config(str(conf)), str(conf))
        self.assertTrue(w.start("posted", ["night"]))         # night is not queued: exits 1
        for _ in range(200):
            if not w.job:
                break
            time.sleep(0.01)
        self.assertIsNone(w.job)
        self.assertIn("night", w.failures)
        self.assertIn("not in", w.failures["night"]["line"])
        self.assertEqual(w.failures["night"]["args"], ["night"])
        r = self.rows(bp.build_state(w.cfg, failures=w.failures))["night"]
        self.assertEqual((r["state"], r["target"]), ("failed", 3))


class NextAction(unittest.TestCase):
    def test_ladder(self):
        self.assertIsNone(bp.next_action(row("a", "loop"), False, False))
        self.assertEqual(bp.next_action(row("a", "loop"), True, False)["label"], "Render")
        self.assertEqual(bp.next_action(row("a", "clip"), True, False)["label"], "Pack")
        self.assertEqual(bp.next_action(row("a", "packed"), True, False)["label"], "Pack")
        self.assertEqual(bp.next_action(row("a", "packed"), True, True)["label"], "Mark posted")
        self.assertIsNone(bp.next_action(row("a", "posted"), True, True))


class WorkerLog(unittest.TestCase):
    def test_feed_splits_partial_lines(self):
        w = bp.Worker({"root": Path("/nonexistent")}, None)
        w.feed("clip  a")
        w.feed(" done\nfail b: x\n\n")
        self.assertEqual(w.lines_since(0)["lines"], ["clip  a done", "fail b: x"])
        self.assertEqual(w.lines_since(1), {"lines": ["fail b: x"], "next": 2, "running": False})


if __name__ == "__main__":
    unittest.main()
