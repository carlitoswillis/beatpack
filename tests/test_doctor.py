"""doctor: reports belt/queue disagreements and bad clip files, and writes nothing."""
import argparse
import contextlib
import io
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import beatpack as bp  # noqa: E402
from tests.test_concurrency import Base, brow  # noqa: E402


def qrow(slug, clip, status="queued"):
    return {"date": "2026-11-07", "slug": slug, "clip": str(clip), "caption": "c",
            "status": status, "posted_at": ""}


class Doctor(Base):
    def write(self, belt, queue):
        bp.write_csv(self.P["belt"], bp.BELT_COLUMNS, belt)
        bp.write_csv(self.P["queue"], bp.QUEUE_COLUMNS, queue)

    def test_clean_state_is_ok(self):
        good = self.root / "g.mp4"
        good.write_bytes(b"x")
        self.write([brow("a", "packed", clip=str(good)), brow("b", "loop")],
                   [qrow("a", good)])
        self.assertEqual(bp.doctor_findings(self.P), {})

    def test_reports_each_disagreement(self):
        good, empty = self.root / "g.mp4", self.root / "e.mp4"
        good.write_bytes(b"x")
        empty.write_bytes(b"")
        gone = self.root / "gone.mp4"
        (self.root / "clips").mkdir()
        (self.root / "clips" / "z.part.mp4").write_bytes(b"x")
        self.write([
            brow("posted-q", "posted", clip=str(good)),      # queue says queued
            brow("posted-miss", "packed", clip=str(gone)),   # missing file
            brow("empty", "packed", clip=str(empty)),        # zero length
            brow("held", "hold", held_from="packed", clip=str(good)),
            brow("loop-clip", "loop", clip=str(good)),
            brow("unqueued", "packed", clip=str(good)),
        ], [qrow("posted-q", good), qrow("posted-miss", gone), qrow("empty", empty),
            qrow("held", good), qrow("ghost", good), qrow("loop-clip", good, "posted")])
        f = bp.doctor_findings(self.P)
        self.assertEqual(f["belt posted, queue not posted"], ["posted-q"])
        self.assertEqual(f["belt clip file missing"], ["posted-miss"])
        self.assertEqual(f["belt clip file empty"], ["empty"])
        self.assertEqual(f["queued row for a hold belt row"], ["held"])
        self.assertEqual(f["queue row not on the belt"], ["ghost"])
        self.assertEqual(f["belt loop row has a clip"], ["loop-clip"])
        self.assertEqual(f["queue posted, belt not posted"], ["loop-clip"])
        self.assertEqual(f["belt packed, not in queue"], ["unqueued"])
        self.assertEqual(f["leftover partial render"], ["z.part.mp4"])
        self.assertEqual(f["queue clip file missing"], ["posted-miss"])

    def test_read_only(self):
        self.write([brow("a", "loop")], [])
        before = sorted((p.name, p.stat().st_mtime_ns, p.read_bytes()) for p in self.root.iterdir())
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = bp.cmd_doctor(self.cfg, argparse.Namespace(counts=True))
        after = sorted((p.name, p.stat().st_mtime_ns, p.read_bytes()) for p in self.root.iterdir())
        self.assertEqual((rc, before), (0, after))
        self.assertNotIn(".belt.lock", [p.name for p in self.root.iterdir()])


if __name__ == "__main__":
    unittest.main()
