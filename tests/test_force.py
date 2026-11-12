"""loops --force: only rows still in loop are re-imported; --reset-progress rewinds clip and
packed rows and reconciles the queue; posted rows are never reset."""
import argparse
import contextlib
import io
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import beatpack as bp  # noqa: E402
from tests.test_concurrency import Base, brow  # noqa: E402


class Force(Base):
    def setUp(self):
        super().setUp()
        self.preview = self.root / "p.wav"
        self.preview.write_bytes(b"x")
        self.clip = self.root / "c.mp4"
        self.clip.write_bytes(b"x")
        rows = []
        for sid, (slug, status, extra) in enumerate([
                ("l", "loop", {}), ("c", "clip", {}), ("k", "packed", {}),
                ("p", "posted", {}), ("hp", "hold", {"held_from": "packed", "hold_reason": "r"}),
                ("hl", "hold", {"held_from": "loop", "hold_reason": "r"})], start=1):
            r = brow(slug, status, **extra)
            r["set_id"] = str(sid)
            r["title"] = "hand"
            if status in ("clip", "packed", "posted") or extra.get("held_from") == "packed":
                r["clip"] = str(self.clip)
                r["clip_kind"] = "canvas:ffmpeg"
            rows.append(r)
        bp.write_csv(self.P["belt"], bp.BELT_COLUMNS, rows)
        bp.write_csv(self.P["queue"], bp.QUEUE_COLUMNS, [
            {"date": "2026-11-07", "slug": s, "clip": str(self.clip), "caption": "c",
             "status": st, "posted_at": ""} for s, st in
            [("c", "queued"), ("k", "queued"), ("p", "posted")]])
        self.ids = {r["slug"]: int(r["set_id"]) for r in rows}
        saved = (bp.open_catalog, bp.load_set, bp.cut_loop)
        bp.open_catalog = lambda c: None
        bp.load_set = lambda con, sid: bp.CatalogSet(sid, f"set{sid}", "", 140.0, 4,
                                                    str(self.preview))

        def cut(cfg, P, cs, slug, src, bars, args, start=None):
            return {"slug": slug, "set_id": str(cs.set_id), "name": cs.name, "title": "fresh",
                    "bpm": "140", "key": "", "bars": "8", "start_s": "9.000",
                    "duration_s": "13.7", "source": str(src), "wav": "new.wav", "mp3": "new.mp3",
                    "clip": "", "clip_kind": "", "status": "loop", "updated": "t", "_tp": ""}
        bp.cut_loop = cut
        self.addCleanup(lambda: [setattr(bp, n, f) for n, f in
                                 zip(("open_catalog", "load_set", "cut_loop"), saved)])

    def loops(self, slug, **kw):
        a = dict(ids=[self.ids[slug]], list=None, bars=None, at_bar=None, at=None, audio=None,
                 force=False, reset_progress=False)
        a.update(kw)
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return bp.cmd_loops(self.cfg, argparse.Namespace(**a))

    def test_plain_force_reimports_loop_only(self):
        self.loops("l", force=True)
        self.assertEqual((self.belt()["l"]["wav"], self.belt()["l"]["title"]), ("new.wav", "hand"))
        for slug in ("c", "k", "p", "hp"):
            before = dict(self.belt()[slug])
            self.loops(slug, force=True)
            self.assertEqual(self.belt()[slug], before, slug)
        self.assertEqual(set(self.queue()), {"c", "k", "p"})

    def test_reset_progress_rewinds_and_reconciles_queue(self):
        self.loops("k", force=True, reset_progress=True)
        b = self.belt()["k"]
        self.assertEqual((b["status"], b["clip"], b["clip_kind"], b["wav"]),
                         ("loop", "", "", "new.wav"))
        self.assertNotIn("k", self.queue())
        self.assertIn("c", self.queue())        # other rows untouched

    def test_posted_is_never_reset(self):
        before = dict(self.belt()["p"])
        self.loops("p", force=True, reset_progress=True)
        self.assertEqual(self.belt()["p"], before)
        self.assertEqual(self.queue()["p"]["status"], "posted")

    def test_held_rows(self):
        self.loops("hl", force=True)                      # held from loop: re-imported, still held
        b = self.belt()["hl"]
        self.assertEqual((b["status"], b["held_from"], b["hold_reason"], b["wav"]),
                         ("hold", "loop", "r", "new.wav"))
        self.loops("hp", force=True)                      # held from packed: needs the flag
        self.assertEqual(self.belt()["hp"]["wav"], "w.wav")
        self.loops("hp", force=True, reset_progress=True)
        b = self.belt()["hp"]
        self.assertEqual((b["status"], b["held_from"], b["clip"]), ("hold", "loop", ""))

    def test_without_force_nothing_changes(self):
        before = self.belt()
        self.loops("l")
        self.assertEqual(self.belt(), before)


if __name__ == "__main__":
    unittest.main()
