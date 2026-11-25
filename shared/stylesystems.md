# Style systems

## Detect first

Inspect the target's package and stylesheet together. In a monorepo, use the target's
frontend root, not an unrelated root package. Batch these reads with the component:

    rg --files -g 'package.json' -g '*tailwind*' -g '*.css' -g '*.scss' -g '*theme*' -g '*tokens*' -g '!node_modules' -g '!dist' -g '!build'
    rg -n 'tailwindcss|styled-components|@emotion/|sass' package.json

Read matching imports, token definitions and theme scope. Detect Tailwind's major version
from the installed package or lockfile, not config-file presence: v4 can keep a config.
Reuse this result until the target or dependencies change. Only read the matching fork.

## Draw in the system, or on a blank slate

- **Changing something that exists** → use exactly what detection found. Arbitrary
  values make "does this fit ours?" unanswerable and the comparison worthless. This
  holds for layout and position questions too: draw the real screen in its real styles.
  A gray skeleton only on an explicit request (`skills/design-helper/references/sweeping.md#structure-and-layout`).
- **New project, or hunting a different direction** → don't bind to existing values.
  They are today's answer, not the right one. Open it with the coordinate sweep in
  `skills/design-helper/references/sweeping.md` — on a new project from the middle of the scale, and when
  hunting a direction with today's value in the centre cell.
- **Unsure → ask in one line.** "우리 것 안에서 볼까, 백지에서 볼까"

**Always state what it was drawn with** — "프로젝트 유틸리티" · "프로젝트 CSS 변수" ·
"임의값 탐색안". The screen alone can't tell them apart, and it changes how the user
reads every specimen.

## The five forks

### Utility — Tailwind

The sheet lives in `$WS`, outside the project, so the project's `content` scan never
sees it. The fix is a flag or an entry file **in `$WS`** — never a second config in
the project. `tailwind.config.sheet.ts`, a copy with `content` extended, anything of
the kind: that is the file that gets left behind, and it is not needed.

Build into `$WS/sheet.css`, `<link>` that from the sheet, and keep the build running as
a watcher for the session so classes written into the sheet show on the next poll. Run
from the project root so `npx` finds the project's own Tailwind. Which command depends
on the version:

**v3**: the installed major version is 3. The CLI takes the
sheet's path as a flag, so the project config is used as is:

    npx tailwindcss -c tailwind.config.ts -i src/index.css \
      --content "$WS/sheet.html" -o "$WS/sheet.css" -w >/dev/null 2>&1 &
    echo $! > "$WS/tailwind.pid"

`-i` is the file detection found `@tailwind` in. `--content` replaces the config's list
for this build only, so just the sheet is scanned.

**v4**: the installed major version is 4. Write an entry file in
`$WS` that pulls the project's stylesheet in by absolute path and points the scanner at
`$WS`:

    V=$(node -p "require('./node_modules/tailwindcss/package.json').version")
    cat > "$WS/sheet.in.css" <<EOF
    @import "$PWD/src/app.css";
    @source "$WS";
    EOF
    npx "@tailwindcss/cli@$V" -i "$WS/sheet.in.css" -o "$WS/sheet.css" -w >/dev/null 2>&1 &
    echo $! > "$WS/tailwind.pid"

`$PWD/src/app.css` is the file detection found the import in. Everything it declares —
`@theme`, `@source`, `@config` — comes along with it.

**Pin the version, because the CLI is usually not installed.** Most v4 projects build
through `@tailwindcss/postcss` and never depend on `@tailwindcss/cli`, so `npx` fetches
it over the network — and unpinned it fetches `latest`, which can differ from what the
project compiles with. Pinning to the project's own `tailwindcss` version makes the
sheet and the app agree.

No network and no cached CLI → **the utility fork is unavailable.** Fall back to reading
the values out of `@theme` and drawing with CSS variables, and say which it was: the
screen can't tell them apart and `프로젝트 유틸리티` would no longer be true.

Blast radius — count the class, then the token behind it:

    grep -rn 'rounded-lg' --include='*.tsx' --include='*.jsx' src/ | wc -l
    grep -n 'borderRadius' tailwind.config.*      # v3: is the value itself being changed?
    grep -n '\-\-radius-lg' src/app.css           # v4: same question, in @theme

Changing a config value moves every use of that class. Adding a new class moves nothing.

### CSS variables — `:root { --* }` · `tokens.css` · `theme.css`

Copy the stylesheets the target uses into `$WS` (the token file and the files that
style the target's markup) and link their served relative URLs, then draw with
`var(--x)`. Stylesheets that style `body`, `table` or other bare elements restyle the
sheet itself: put specimens that need them in their own page inside an `<iframe>`
(design-system's board does this) rather than rewriting the rules by hand. A filesystem path in `<link href>` is not served by this workspace server.
Carry referenced imports, fonts and images into `$WS` with working relative paths too.
Preserve the theme selector on the specimen root. Mark missing assets as `실물과 다름`.
The copies do not follow project edits: copy again after a `반영 완료:` that touched them.

Blast radius:

    grep -rn 'var(--radius-md)' --include='*.css' --include='*.tsx' . | wc -l
    grep -rn '\-\-radius-md' tokens.css            # is it derived from another token?

Watch for chained tokens — `--radius-card: var(--radius-md)` means the count above is
only the direct uses.

### SCSS variables — `*.scss` · `_variables.scss`

Read the values and carry them into the specimen file as CSS variables. SCSS variables
are compile-time, so the browser never sees them.

Blast radius: `grep -rn '\$radius-md' --include='*.scss' . | wc -l`. Note that SCSS
also resolves at build time, so a change needs a rebuild before it shows anywhere.

### CSS-in-JS — `styled-components` · `@emotion` · `theme.ts`

Unusable in static HTML. Read the theme object's values and carry them over as CSS
variables for the specimen file.

Blast radius: `grep -rn 'theme.radius.md\|radius\[.md.\]' src/ | wc -l`. Interpolated
access (`theme[key]`) won't grep — say so rather than reporting a count you can't stand
behind.

### Blank slate — nothing found

Write values directly. Skip name lookup only; invalid values and overrides still need
computed-style checks. Blast radius is whatever files the change lands in.
