"""Long commands apply row-level updates under a lock instead of rewriting a stale snapshot."""
import argparse
import contextlib
import io
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import beatpack as bp  # noqa: E402
from tests.test_beatpack import cfg  # noqa: E402


def brow(slug, status, **kw):
    d = {c: "" for c in bp.BELT_COLUMNS}
    d.update(slug=slug, name=slug, bpm="140", set_id=str(abs(hash(slug)) % 1000), status=status,
             wav="w.wav", duration_s="2", **kw)
    return d


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.cfg = cfg()
        self.cfg.update(root=self.root, captions=str(self.root / "none.txt"))
        self.P = bp.paths(self.cfg)
        self.saved = (bp.make_text_png, bp.canvas_audio, dict(bp.RENDERERS), bp.probe)
        bp.make_text_png = lambda c, o, j: None
        bp.canvas_audio = lambda c, w, d, out: (out, 2.0)
        bp.probe = lambda c, p: {"duration": 2.0, "width": 1080, "height": 1920,
                                 "has_audio": True, "sample_rate": 48000}
        self.addCleanup(self.restore)

    def restore(self):
        bp.make_text_png, bp.canvas_audio = self.saved[:2]
        bp.probe = self.saved[3]
        bp.RENDERERS.clear()
        bp.RENDERERS.update(self.saved[2])
        self.tmp.cleanup()

    def belt(self):
        return {r["slug"]: r for r in bp.read_csv(self.P["belt"], bp.BELT_COLUMNS)}

    def queue(self):
        return {r["slug"]: r for r in bp.read_csv(self.P["queue"], bp.QUEUE_COLUMNS)}

    def clips(self, **kw):
        args = dict(slugs=[], renderer="ffmpeg", force=False, still=None,
                    audio_from_loop=False, palette=None, viz="osc")
        args.update(kw)
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return bp.cmd_clips(self.cfg, argparse.Namespace(**args))


class LostUpdates(Base):
    def setUp(self):
        super().setUp()
        clip = self.root / "x.mp4"
        clip.write_bytes(b"x")
        self.clip = str(clip)
        bp.write_csv(self.P["belt"], bp.BELT_COLUMNS, [
            brow("a", "loop"), brow("b", "loop"),
            brow("x", "packed", clip=self.clip), brow("y", "packed", clip=self.clip)])
        bp.write_csv(self.P["queue"], bp.QUEUE_COLUMNS, [
            {"date": "2026-11-07", "slug": s, "clip": self.clip, "caption": "c",
             "status": "queued", "posted_at": ""} for s in ("x", "y")])

    def renderer(self, mid):
        def render(c, job):
            job.out.write_bytes(b"mp4")
            if job.slug == "a":
                mid()
        bp.RENDERERS["ffmpeg"] = render

    def test_posted_during_a_render_survives(self):
        self.renderer(lambda: bp.cmd_posted(self.cfg, argparse.Namespace(slug="x", date=None)))
        with contextlib.redirect_stdout(io.StringIO()):
            self.clips()
        b = self.belt()
        self.assertEqual((b["a"]["status"], b["b"]["status"]), ("clip", "clip"))
        self.assertEqual(b["x"]["status"], "posted")
        self.assertEqual(self.queue()["x"]["status"], "posted")

    def test_hold_during_a_render_survives_and_is_reported(self):
        def mid():
            with contextlib.redirect_stdout(io.StringIO()):
                bp.cmd_hold(self.cfg, argparse.Namespace(slug="b", reason=["rights"]))
                bp.cmd_hold(self.cfg, argparse.Namespace(slug="a", reason=["late"]))
        self.renderer(mid)
        rc = self.clips()
        b = self.belt()
        self.assertEqual((b["a"]["status"], b["a"]["held_from"], b["a"]["clip"]),
                         ("hold", "loop", ""))      # held mid-render: result not recorded
        self.assertEqual(b["b"]["status"], "hold")
        self.assertEqual(rc, 1)

    def test_pack_does_not_revert_a_post(self):
        orig = bp.refresh_queue
        calls = []

        def spy(cfg, P, belt, today):
            calls.append(1)
            return orig(cfg, P, belt, today)
        bp.refresh_queue = spy
        self.addCleanup(setattr, bp, "refresh_queue", orig)
        # a post lands between the pack's snapshot and its write
        real_replace = bp.os.replace

        def replace(a, b):
            real_replace(a, b)
            if str(b).endswith(".zip"):
                bp.cmd_posted(self.cfg, argparse.Namespace(slug="x", date=None))
        bp.os.replace = replace
        self.addCleanup(setattr, bp.os, "replace", real_replace)
        with contextlib.redirect_stdout(io.StringIO()):
            bp.cmd_pack(self.cfg, argparse.Namespace(captions=None, caption=None))
        self.assertEqual(self.belt()["x"]["status"], "posted")
        self.assertEqual(self.queue()["x"]["status"], "posted")


class Locking(Base):
    def test_reentrant(self):
        with bp.locked(self.P):
            with bp.locked(self.P):
                pass
        with bp.locked(self.P):
            pass

    def test_other_process_blocks_us(self):
        self.root.mkdir(exist_ok=True)
        code = ("import fcntl,sys,time;f=open(sys.argv[1],'a');fcntl.flock(f,fcntl.LOCK_EX);"
                "print('held',flush=True);time.sleep(0.6)")
        proc = subprocess.Popen([sys.executable, "-c", code, str(self.root / ".belt.lock")],
                                stdout=subprocess.PIPE, text=True)
        self.assertEqual(proc.stdout.readline().strip(), "held")
        t0 = time.time()
        with bp.locked(self.P):
            waited = time.time() - t0
        proc.wait()
        proc.stdout.close()
        self.assertGreater(waited, 0.3)

    def test_threads_exclude_each_other(self):
        order = []

        def worker(tag):
            with bp.locked(self.P):
                order.append(f"in{tag}")
                time.sleep(0.1)
                order.append(f"out{tag}")
        ts = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
        [t.start() for t in ts]
        [t.join() for t in ts]
        for i in range(0, 6, 2):
            self.assertEqual(order[i][2:], order[i + 1][3:])


if __name__ == "__main__":
    unittest.main()
