# Stages

## Order

Default: **size → spacing → shape → color.**

Color goes last for a reason, not by taste: **color can't be judged until the area it
fills is settled.** The same value reads as one thing on a 1px border and another
across a filled surface. Settle the geometry, then the skin.

Structure before skin, for the same reason. If the layout is still open, wireframe it
first — `sweeping.md`.

## Default lists

Propose, then get agreement. A list the user gives wins outright.

**Button** — 크기(height) → 여백(padding) → 모서리 → 테두리 → 색 → 상태(hover/focus)

**Card** — 구조(what's in it, in what order) → 여백 → 모서리 → 테두리 → 그림자 →
배경/면 → 타이포 대비 → 상태

**Input** — 크기 → 여백 → 테두리 → 모서리 → 플레이스홀더/라벨 대비 → 상태(focus·error)

**Modal / dialog** — 폭 → 여백 → 모서리 → 그림자 → 배경 가림(overlay) → 진입·퇴장 모션

**List / table** — 행 높이 → 행 구분(선/줄무늬/여백) → 정렬·여백 → 헤더 대비 → 상태(hover/선택)

## Constraint-driven targets

> "황혼 배경에 어울리는 카드를 만들고 싶어"

There's no `현재` and no axis — nothing to sweep yet. Two things change.

**Stage 0 is direction, not a ladder.** Lay out 2–3 composed options and settle the
direction first; only then sweep axes inside it. This is the one place a single
recommendation belongs.

For a dusk card: 유리(backdrop-blur) / 불투명 면 / 윤곽선만.

**The constraint rewrites the rest of the list.** Don't paste the default card list in.
Work out which axes the constraint leaves alive — on a dark background a drop shadow
does nothing, so the list becomes:

```
0  방향      유리 / 불투명 / 윤곽선만
1  띄우기    배경에서 어떻게 떠오르게 할지 — 면 밝기 / backdrop-blur / 윤곽
2  면        불투명도 + blur 강도
3  테두리    두께 · 밝기 · 위쪽만 밝은 그라데이션 여부
4  모서리    radius
5  광        drop-shadow 대신 glow, 또는 둘 다 쓰지 않기
6  안쪽      여백 · 타이포 대비
7  상태      hover · focus
```

## The list is not fixed

Stage 1 regularly reveals a stage nobody listed — the card disappears into the
background and a contrast stage has to go in. A stage also turns out unnecessary and
gets dropped.

Add and drop rows as it happens, and say so in one line when you do. Holding to the
list agreed at the start throws away what the comparison just taught.

## Decision table

Pinned at the top of the file, sticky.

```
┌─ 결정표 ─────────────────────────────────────┐
│ 크기    ③  40px            확정              │
│ 패딩    ⑥  0 16px          확정              │
│ 테두리  ⑪  1px / 12px      확정 (⑧에서 변경)  │
│ 색상    —                   ← 지금 단계        │
│ 상태    —                   대기              │
└──────────────────────────────────────────────┘
```

- One row per stage, in order, including stages not reached yet
- Mark the current stage — the user has to see where they are in a long file
- A revision overwrites the row and notes which specimen it replaced
- **This is the only part of the file that gets rewritten.** Everything else is
  append-only

The table is the record of what's been settled. It is not code, and nothing in it
touches the repo until the final gate.
