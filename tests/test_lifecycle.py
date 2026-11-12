"""The belt row lifecycle: legal transitions and the fields each may change."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import beatpack as bp  # noqa: E402


def row(status, **kw):
    d = {c: "" for c in bp.BELT_COLUMNS}
    d.update(slug="s", set_id="1", name="s", title="T", bpm="140", status=status, **kw)
    return d


FRESH = {"slug": "s", "set_id": "1", "name": "s", "title": "NEW", "bpm": "141", "key": "",
         "bars": "8", "start_s": "1.000", "duration_s": "3.0", "source": "x", "wav": "w",
         "mp3": "m", "clip": "", "clip_kind": "", "status": "loop", "updated": "t"}


class Lifecycle(unittest.TestCase):
    def test_forward_path(self):
        r = bp.transition(None, "cut", new=FRESH)
        self.assertEqual(r["status"], "loop")
        bp.transition(r, "render", fields={"clip": "c.mp4", "clip_kind": "canvas:x",
                                           "palette": "p", "title": "T", "updated": "t"})
        self.assertEqual(r["status"], "clip")
        bp.transition(r, "pack")
        self.assertEqual(r["status"], "packed")
        bp.transition(r, "post")
        self.assertEqual(r["status"], "posted")

    def test_posted_is_terminal(self):
        for name, kw in [("recut", {"new": FRESH}), ("reset_recut", {"new": FRESH}),
                         ("render", {"fields": {}}), ("pack", {}), ("hold", {})]:
            with self.assertRaises(bp.IllegalTransition, msg=name):
                bp.transition(row("posted"), name, **kw)

    def test_illegal_from_wrong_state(self):
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("loop"), "pack")
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("loop"), "post")
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("hold", held_from="packed"), "render", fields={})
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("clip"), "unhold")
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("clip"), "cut", new=FRESH)

    def test_hold_remembers_and_keeps_held_from(self):
        r = bp.transition(row("packed"), "hold", reason="x")
        self.assertEqual((r["status"], r["held_from"]), ("hold", "packed"))
        bp.transition(r, "hold", reason="y")
        self.assertEqual((r["held_from"], r["hold_reason"]), ("packed", "y"))
        bp.transition(r, "unhold", clip_exists=False)
        self.assertEqual((r["status"], r["held_from"]), ("loop", ""))

    def test_recut_keeps_state_title_and_held_from(self):
        r = bp.transition(row("loop"), "recut", new=FRESH)
        self.assertEqual((r["status"], r["title"], r["bpm"]), ("loop", "T", "141"))
        h = bp.transition(row("hold", held_from="loop", hold_reason="r"), "recut", new=FRESH)
        self.assertEqual((h["status"], h["held_from"], h["hold_reason"]), ("hold", "loop", "r"))
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("hold", held_from="packed"), "recut", new=FRESH)
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("clip", clip="c"), "recut", new=FRESH)

    def test_reset_recut_blanks_clip(self):
        r = bp.transition(row("packed", clip="c.mp4", clip_kind="k"), "reset_recut", new=FRESH)
        self.assertEqual((r["status"], r["clip"], r["clip_kind"]), ("loop", "", ""))
        h = bp.transition(row("hold", held_from="clip", clip="c"), "reset_recut", new=FRESH)
        self.assertEqual((h["status"], h["held_from"], h["clip"]), ("hold", "loop", ""))
        with self.assertRaises(bp.IllegalTransition):
            bp.transition(row("loop"), "reset_recut", new=FRESH)

    def test_fields_outside_the_transition_are_refused(self):
        with self.assertRaises(AssertionError):
            bp.transition(row("clip"), "render", fields={"wav": "other"})


if __name__ == "__main__":
    unittest.main()
