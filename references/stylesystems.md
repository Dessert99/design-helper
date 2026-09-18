# Style systems

## Detect first

Never guess. Run these three at the project root; the result forks five ways.

    ls tailwind.config.* 2>/dev/null
    grep -rlm1 '@tailwind\|^\s*:root' --include='*.css' --include='*.scss' \
      --exclude-dir={node_modules,.next,dist,build} . | head
    grep -o 'styled-components\|@emotion/[a-z]*\|"sass"' package.json | sort -u

**Quote the `--include` globs.** zsh expands them first and dies with
`no matches found`. If the frontend lives in a subfolder (`frontend/`, `apps/web/`),
run them there — the root finds nothing.

## Draw in the system, or on a blank slate

- **Changing something that exists** → use exactly what detection found. Arbitrary
  values make "does this fit ours?" unanswerable and the comparison worthless.
- **New project, or hunting a different direction** → don't bind to existing values.
  They are today's answer, not the right one.
- **Unsure → ask in one line.** "우리 것 안에서 볼까, 백지에서 볼까"

**Always state what it was drawn with** — "프로젝트 유틸리티" · "프로젝트 CSS 변수" ·
"임의값 탐색안". The screen alone can't tell them apart, and it changes how the user
reads every specimen.

## The five forks

### Utility — `tailwind.config.*` · `@tailwind`

Build the CSS with that config and draw with utility classes. Run a watcher alongside
(`npx tailwindcss -w`) or newly written class names silently won't come through.

Blast radius — count the class, then the token behind it:

    grep -rn 'rounded-lg' --include='*.tsx' --include='*.jsx' src/ | wc -l
    grep -n 'borderRadius' tailwind.config.*      # is the value itself being changed?

Changing a config value moves every use of that class. Adding a new class moves nothing.

### CSS variables — `:root { --* }` · `tokens.css` · `theme.css`

`<link>` the file and draw with `var(--x)`. Refresh alone picks up edits.

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

Write the values directly. No silent-failure check needed, and blast radius is
whatever files the change lands in.

## Reporting blast radius

While choosing, one line per specimen:

```
토큰 그대로 · --radius-md 고침 (23곳) · 새 토큰
```

Before applying, the real tally: which files, which lines, which tokens, and what else
moves with them. Then ask the question this exists for — **change the token, or
override just here?** Changing a token is the cheap edit and the expensive decision.
