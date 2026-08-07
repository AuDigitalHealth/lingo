#!/usr/bin/env python3
"""Changelog tooling shared by CI and the release pipeline.

The [Unreleased] section always carries the full set of Keep a Changelog headings,
even when empty. That is deliberate: the headings act as stable anchors for git's
three-way merge, so two branches adding entries under *different* headings merge
cleanly with no driver at all, and they prompt authors to file an entry in the right
place instead of appending a fresh duplicate heading. See CLAUDE.md.

Commands
--------
release <version> <date>
    Turn [Unreleased] into a released section. Empty headings are dropped (they are
    only useful while entries are being collected) along with the sentinel line.
    Called by the "Prepare and push CHANGELOG.md" task of the Snomio Maven Release
    pipeline, on the gitflow release branch.

new-unreleased
    Insert a fresh, fully seeded [Unreleased] section. Called by the "Add Unreleased
    section to CHANGELOG" task of the same pipeline, after gitflow release-finish.
    Idempotent: does nothing if [Unreleased] is already present.

    These are deliberately two commands rather than one, mirroring the two release
    tasks: the released section belongs on the release branch, while the fresh
    [Unreleased] is added afterwards on the development branch.

check-updated <base-ref>
    Fail if CHANGELOG.md was not modified relative to <base-ref>. Replaces the old
    GitHub Actions changelog-check workflow.

check-duplicates
    Fail if any bullet under [Unreleased] also appears verbatim in an already
    released section. This catches the one way `merge=union` can go wrong: a branch
    open across a release re-resurrects bullets that were released while it was
    open, and because union never conflicts, nothing else would flag it.
"""

import re
import subprocess
import sys

CHANGELOG = "CHANGELOG.md"

HEADINGS = ["Added", "Changed", "Fixed", "Security", "Deprecated", "Removed"]

UNRELEASED_TEMPLATE = "## [Unreleased]\n" + "\n".join(f"### {h}\n" for h in HEADINGS)

RELEASE_HEADING = re.compile(r"^## \[", re.M)
EMPTY_HEADING = re.compile(r"^### [A-Za-z ]+\n(?:[ \t]*\n)*(?=### |\Z)", re.M)
SENTINEL = re.compile(r"^- No updates yet\.[ \t]*\n?", re.M)
BULLET = re.compile(r"^- .*$", re.M)


def read():
    with open(CHANGELOG, encoding="utf-8") as handle:
        return handle.read()


def split_unreleased(text):
    """Return (prefix, unreleased_block, suffix)."""
    start = text.index("## [Unreleased]")
    rest = text[start + len("## [Unreleased]") :]
    match = RELEASE_HEADING.search(rest)
    end = start + len("## [Unreleased]") + (match.start() if match else len(rest))
    return text[:start], text[start:end], text[end:]


def cmd_release(version, date):
    prefix, block, suffix = split_unreleased(read())

    block = block.replace("## [Unreleased]", f"## [{version}] - {date}", 1)
    block = SENTINEL.sub("", block)
    # Repeat: removing one empty heading can leave the previous one empty-looking
    # to the regex only after the first pass, so run to a fixed point.
    while True:
        stripped = EMPTY_HEADING.sub("", block)
        if stripped == block:
            break
        block = stripped

    released = block.rstrip()
    if not BULLET.search(released):
        released += "\n- No user-facing changes."

    with open(CHANGELOG, "w", encoding="utf-8") as handle:
        handle.write(prefix + released + "\n\n" + suffix)
    print(f"CHANGELOG.md: [Unreleased] released as [{version}] - {date}.")


def cmd_new_unreleased():
    text = read()
    if "## [Unreleased]" in text:
        print("CHANGELOG.md already has an [Unreleased] section; nothing to do.")
        return

    # Same anchor the release pipeline used before this script existed: the preamble
    # line listing the section names, immediately above the first release section.
    anchor = re.search(r"^The following sections.*Removed\*\*$", text, re.M)
    if not anchor:
        sys.exit(
            "Could not find the 'The following sections ... **Removed**' preamble "
            "line in CHANGELOG.md; refusing to guess where [Unreleased] belongs."
        )

    insert_at = anchor.end()
    updated = text[:insert_at] + "\n\n" + UNRELEASED_TEMPLATE.rstrip() + "\n" + text[insert_at:]
    with open(CHANGELOG, "w", encoding="utf-8") as handle:
        handle.write(updated)
    print("CHANGELOG.md: fresh [Unreleased] section added.")


def cmd_check_updated(base):
    changed = subprocess.run(
        ["git", "diff", "--name-only", f"{base}", "HEAD", "--", CHANGELOG],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.split()
    if not changed:
        sys.exit(
            f"{CHANGELOG} was not updated in this change.\n"
            "Add an entry under the appropriate heading in [Unreleased]. If this "
            "change genuinely has no user-facing effect, say so in a one-line entry "
            "rather than skipping it."
        )
    print(f"{CHANGELOG} was updated.")


def cmd_check_duplicates():
    text = read()
    _, block, suffix = split_unreleased(text)
    pending = {b.strip() for b in BULLET.findall(block)}
    released = {b.strip() for b in BULLET.findall(suffix)}
    both = sorted(pending & released)
    if both:
        listing = "\n".join(f"  {b[:120]}" for b in both)
        sys.exit(
            "These entries appear under [Unreleased] *and* in an already released "
            f"section:\n{listing}\n\n"
            "This usually means a branch was open across a release and the merge "
            "re-added entries that had already shipped (merge=union never conflicts, "
            "so nothing else flags it). Delete them from [Unreleased]."
        )
    print("No released entries duplicated under [Unreleased].")


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    command, args = argv[1], argv[2:]
    if command == "release":
        if len(args) != 2:
            sys.exit("usage: changelog.py release <version> <date>")
        cmd_release(*args)
    elif command == "new-unreleased":
        cmd_new_unreleased()
    elif command == "check-updated":
        if len(args) != 1:
            sys.exit("usage: changelog.py check-updated <base-ref>")
        cmd_check_updated(*args)
    elif command == "check-duplicates":
        cmd_check_duplicates()
    else:
        sys.exit(f"unknown command: {command}\n{__doc__}")


if __name__ == "__main__":
    main(sys.argv)
