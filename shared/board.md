# The board

A board is a handful of the project's real parts, drawn in the project's real CSS, used as
one specimen. design-system draws every candidate on it; design-sync draws the code
before and after on it. Both build it the same way.

## Parts

Take them from the code: a page heading with body text, a form row with a label, input
and buttons, a card or table row, the navigation. Three to six parts, with real content.
In a blank project, build a neutral board for the stated purpose with plausible real
content, and say on the sheet that its values were chosen freely (`임의값`).

## One frozen page per section

Project CSS styles `body`, `table` and the like; on the sheet it would restyle the sheet
itself. So the board is its own page, shown in iframes.

- **Each section gets its own folder:** `$WS/<section id>/` holds `board.html` and copies
  of the project's stylesheets (`shared/stylesystems.md`), taken when that section is
  drawn. Later sections, later picks and later re-copies never touch it, so an earlier
  ladder keeps showing what it showed. The body is append-only; so are the boards.
- **Variants by hash.** Each specimen is `<iframe src="<section id>/board.html#<variant>">`.
  A short script in `board.html` reads the hash and applies that variant's overrides as
  custom properties on `:root`. Everything already settled when the section is drawn is
  part of the page itself, not of a variant.
- **Real size.** The iframe has the board's real width, and its height is the board
  page's full height (read it with `check.cjs`, or set it from the page on load). Set the
  section's grid minimum from that width (`shared/sheet.md`, Filling the width). One
  specimen per row is fine.
  A design-ux prototype is the exception: it is a window onto a page that scrolls inside
  it, at a real viewport size (for example 1080 by 700). Mark that iframe `data-window`, so
  `check.cjs` doesn't count its inner scroll as clipping.
- **Values the code writes directly.** A role the project writes as a literal (`14px`,
  `#d0d4d9`) instead of through a token can't move with its token. Give the board an
  override variable for it, and say once in the section description which literals the
  specimens replace (`실물과 다름`, `shared/core.md`). The record keeps those literals as
  places the code bypasses the role (`shared/decisions.md`).
- **Where to look.** A bracket can't point inside an iframe. Name the spots in the
  section description instead (`검색 버튼과 위쪽 메뉴 "주문"`).

## Checking it

`check.cjs --frames` reads `--sel` inside the section's board iframes, and reports a
frame whose board is taller or wider than the iframe as clipped. Add `--a11y` for text,
border and outline contrast (`shared/core.md`, Verify).
