"""A render never touches the final clip path until it has succeeded."""
import contextlib
import io
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import beatpack as bp  # noqa: E402
from tests.test_concurrency import Base, brow  # noqa: E402


class Render(Base):
    def setUp(self):
        super().setUp()
        (self.root / "clips").mkdir()
        self.out = self.root / "clips" / "a.mp4"
        self.out.write_bytes(b"GOOD")
        bp.write_csv(self.P["belt"], bp.BELT_COLUMNS, [
            brow("a", "packed", clip=str(self.out), clip_kind="canvas:ffmpeg", title="T")])

    def files(self):
        return sorted(p.name for p in (self.root / "clips").iterdir())

    def test_failure_midfile_keeps_old_clip_and_row(self):
        before = self.belt()["a"]

        def render(c, job):
            job.out.write_bytes(b"TRUNC")
            raise RuntimeError("ffmpeg failed (1)")
        bp.RENDERERS["ffmpeg"] = render
        self.assertEqual(self.clips(force=True), 1)
        self.assertEqual(self.out.read_bytes(), b"GOOD")
        self.assertEqual(self.files(), ["a.mp4"])
        self.assertEqual(self.belt()["a"], before)

    def test_zero_length_or_unplayable_output_is_a_failure(self):
        bp.RENDERERS["ffmpeg"] = lambda c, job: job.out.write_bytes(b"")
        self.assertEqual(self.clips(force=True), 1)
        self.assertEqual((self.out.read_bytes(), self.files()), (b"GOOD", ["a.mp4"]))
        bp.RENDERERS["ffmpeg"] = lambda c, job: job.out.write_bytes(b"junk")
        bp.probe = lambda c, p: {"duration": 0.0, "width": 0, "height": 0,
                                 "has_audio": False, "sample_rate": 0}
        self.assertEqual(self.clips(force=True), 1)
        self.assertEqual((self.out.read_bytes(), self.files()), (b"GOOD", ["a.mp4"]))

    def test_success_replaces_atomically(self):
        bp.RENDERERS["ffmpeg"] = lambda c, job: job.out.write_bytes(b"NEW")
        self.assertEqual(self.clips(force=True), 0)
        self.assertEqual((self.out.read_bytes(), self.files()), (b"NEW", ["a.mp4"]))
        self.assertEqual(self.belt()["a"]["status"], "packed")

    def test_row_held_mid_render_drops_the_result(self):
        def render(c, job):
            job.out.write_bytes(b"NEW")
            with contextlib.redirect_stdout(io.StringIO()):
                import argparse
                bp.cmd_hold(self.cfg, argparse.Namespace(slug="a", reason=["x"]))
        bp.RENDERERS["ffmpeg"] = render
        self.clips(force=True)
        self.assertEqual((self.out.read_bytes(), self.files()), (b"GOOD", ["a.mp4"]))
        self.assertEqual(self.belt()["a"]["status"], "hold")

    def test_loudness_remux_failure_keeps_old_clip(self):
        raw = self.root / "clips" / "a.ec-raw.mp4"
        raw.write_bytes(b"RAW")
        saved = (bp.measure_loudness, bp.run)
        bp.measure_loudness = lambda cfg, a, d: {
            "input_i": "-30.0", "input_tp": "-5.0", "input_lra": "3.0",
            "input_thresh": "-40.0", "target_offset": "0.0"}

        def run(cmd, **kw):
            Path(cmd[-1]).write_bytes(b"HALF")
            raise RuntimeError("ffmpeg failed (1)")
        bp.run = run
        self.addCleanup(lambda: (setattr(bp, "measure_loudness", saved[0]),
                                 setattr(bp, "run", saved[1])))
        with self.assertRaises(RuntimeError):
            bp.finish_loudness(self.cfg, raw, self.out)
        self.assertEqual(self.out.read_bytes(), b"GOOD")
        self.assertNotIn("a.remux.mp4", self.files())


if __name__ == "__main__":
    unittest.main()
