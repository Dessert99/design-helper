# Design decisions

The project's design decisions live in one place, written as the user picks. Every skill
that reads or records a decision follows this file. The record structure is adapted from
how Astryx (`meta/astryx`, MIT) keeps design intent for agents: only the structure, none
of its values or text.

## Where

- The user gave a Notion link: write under it, a parent page and one child page per
  file below, same names.
- Otherwise: `design-decisions/` at the project root.
- A Notion link but no Notion tool: write `design-decisions/` and say so in one line.

## Structure

```
design-decisions/
├─ README.md          base system, the checklist with status, contents
├─ typography.md      one file per area
├─ color.md
├─ spacing.md
├─ shape.md
├─ <area>.md          more areas as the checklist adds them (layout, motion, components)
└─ assets/            the sheet screenshots each decision was made from
```

One file per area, so changing one area means reading one file. The whole picture is
the checklist in `README.md`.

## `README.md`

````markdown
# 디자인 결정

기반: 없음                       (or `Tailwind 기본값 4.1`, a public base and its version)
출발점: 시안 B, 차분한 방향 (D1)   (the starting point picked on the first sheet)
접근성 기준: WCAG 2.2 AA
구현 방침: 컴포넌트는 Radix Primitives, 직접 만들 때는 HTML 기본 요소 우선

## 목적과 분위기
- 목적: 쇼핑몰 운영자가 주문을 처리하는 관리 화면이다.
- 분위기: 차분하고 단단한 업무 도구다.
- 의도 I1. 숫자가 많은 표를 오래 봐도 피곤하지 않아야 한다.

## 출발점 값 (초안)
| 역할 | 토큰 | 값 | 출처 |
|---|---|---|---|
| 주 색 | `--color-primary` | `#34598f` | 출발점 (D1), 초안 |

## 체크리스트
| 영역 | 항목 | 상태 | 문서 |
|---|---|---|---|
| 기반 | 목적과 분위기 | 확정 | README |
| 글자 | 역할 나누기 | 확정 | typography.md |
| 글자 | 크기 비율 | 초안 | typography.md |
| 색 | 다크 모드 여부 | 보류 | color.md (Q1) |

## 결정 기록
### D1. 출발점은 시안 B
- 결정: 사용자, 2026-11-25, 요청 1의 시안 B
- 이유: ...
- 스크린샷: `assets/base-d1.png` (상태 기본, 라이트, 폭 1440, 출발점 A부터 D)
````

- `기반` is a public system the values are taken from; `출발점` is the direction picked
  on the first sheet. A project may have either, both or neither.
- **목적과 분위기** holds the intents that belong to the whole product. Area intents
  live in each area file.
- **출발점 값 (초안)** holds the values the starting point brought along. Each row leaves
  the table when its own item is picked: the area file takes it, and the row here
  becomes a link (`확정, typography.md D2`). Rows here are drafts, so they are updated
  in place, not archived.
- `README.md` has its own **결정 기록** (D1, D2) for the base-level decisions.

## An area file

````markdown
---
status: 확정
decided: 2026-11-25
base: Tailwind 기본값 4.1
reopen_when: [주 색 변경, 다크 모드 추가]
verify: [본문 글자 대비 4.5:1 이상, 상태 색 대비 3:1 이상]
---

# 색

## 의도
- I1. 상태(성공, 경고, 오류)는 색만이 아니라 아이콘과 글로도 구분돼야 한다.
- I2. 숫자가 많은 표에서도 강조색은 한 화면에 한 곳만 쓴다.

## 역할과 값
| 역할 | 쓰는 곳 | 토큰 | 라이트 / 다크 | 상태 | 출처 |
|---|---|---|---|---|---|
| 주 색 | 주 버튼, 선택된 메뉴 | `--color-accent` | `#0074e2` / `#6d9cfe` | 확정 | 시안 C (D1) |
| 본문 배경 | 페이지 바탕 | `--color-background-body` | 기반 값 | 확정 | 기반 그대로 (D1) |
| 성공 | 상태 칸 "결제 완료" | `--color-success` (새 토큰) | `#2f7d4f` | 초안 | 임의값 |

## 결정 기록
### D1. 주 색은 파랑 계열 C
- 결정: 사용자, 2026-11-25, 요청 3의 시안 C
- 이유: 버튼과 링크에서 대비 4.8:1. A보다 표 안의 숫자와 덜 부딪힘
- 스크린샷: `assets/color-d1.png` (상태 기본, 라이트, 폭 1440, 버튼과 링크의 주 색)

## 열린 질문
- Q1. 다크 모드를 지원할지

## 이 문서가 정하지 않는 것
- 컴포넌트별 색 조합 (컴포넌트 문서)
````

- Frontmatter keys stay English so agents read them reliably; values and body are Korean.
- **상태** is the value's status. A role settled by a role split while its value is
  still open is a row with `초안`: the role exists, the value doesn't yet. Only `확정`
  rows reach the code (design-sync).
- **쓰는 곳** names where the role appears in the product, in the screen's words. design-sync
  uses it to find code that bypasses the role.
- `status` of the file is the lowest status among its rows: one `초안` row keeps the
  file `초안`. Each checklist row in `README.md` carries its own status.
- **New tokens** follow the project's naming pattern (`--color-text` → `--color-success`)
  and read `(새 토큰)` in the table and `새 토큰 --color-success` in the caption's cost
  slot. The name rides on the role pick; it needs no sheet of its own.
- **의도** sentences say what must hold. No numbers. Numbers live in **역할과 값**.
- **출처** is one of: `기반 그대로`, `시안 <letter> (D<n>)`, `<import source> <version>`
  (picked as a specimen, so it also names its D), `출발점 (D<n>), 초안`,
  `현재 코드 (초안)`, `임의값` (a draft drawn freely), `대화로 결정` (only for the rows
  rule 1 exempts).
- **결정 기록** entries are numbered per file (D1, D2) and never renumbered.
- A screenshot line names state, mode, width and the decision it shows.

## Status

| status | meaning |
|---|---|
| `초안` | proposed or imported, not yet seen and picked |
| `확정` | the user picked it on a sheet; it governs every later drawing and the code |
| `보류` | deliberately left open; listed as a question |
| `보관` | replaced; kept with a link to what replaced it |
| `해당 없음` | checklist rows only: this project doesn't need the item |

## Rules

1. **Settled only after seen.** A value becomes `확정` only when the user picks it from
   specimens drawn on a sheet. A value the user states directly (`버튼은 8px로 둥글게`) is
   drawn, with the current value or its neighbours beside it, and stays `초안` until
   picked. The same holds for choosing a base, revising, and reverting.
   Three rows can't be drawn and are settled in conversation, source `대화로 결정`:
   `목적과 주 사용자`, `분위기`, and `동작 접근성 방침`. Nothing else is.
2. **One way to settle.** Code already using a value, silence, or an earlier mention is
   never a decision.
3. **Revise by archiving.** The old entry becomes `보관` with a link to the new one, and
   the new one links back. Nothing is deleted.
4. **Role names.** Use the project's existing token names first, then names the user
   chose, then the default roles in the skill's checklist. Renaming or adding a role is
   a checklist item like any other.
5. **Roles before values.** In each area, settle the roles, then each role's value.
6. **The record wins over the code.** Where code and a `확정` row differ, report it as a
   finding; never change either on your own. A project with no record starts by
   importing its current code values as `초안`, source `현재 코드 (초안)`.
7. **Bases don't drift.** A base is recorded with its version and never follows upstream
   by itself. Moving to a new version is a new decision under rule 1.
8. **Reopen chain.** After a change, find other files whose `reopen_when` matches it and
   tell the user in one line. Redraw them only when asked, under rule 1.

## Recording: `기록 지시:`

The worker never writes the record. On a pick it ends its final message with this block,
after the Korean report to the user. The main agent writes it (`shared/main.md`).

    기록 지시:
    - 문서: design-decisions/color.md
    - 상태: 확정 (D2)
    - 역할과 값: 표면 | `--color-background-surface` | `#fafafa` / 기반 값 | 시안 B (D2)
    - 결정 기록: D2. 표면은 B. 결정: 사용자, 2026-11-25, 요청 4의 시안 B. 이유: ...
    - 보관: (revising only) D1 → 보관, D2와 서로 링크
    - 스크린샷: $WS/r4-1.png → design-decisions/assets/color-d2.png (상태 기본, 라이트, 폭 1440, 표면과 카드)
    - 체크리스트: 색 | 표면 | 확정
    - 다시 볼 곳: shape.md (reopen_when: 표면 변경)

One pick may touch several files, and one reply may hold several picks. Repeat the
`- 문서:` line for each file and list that file's lines under it. A file that doesn't
exist yet gets its full text instead of lines (`- 내용: 아래 전문 그대로`), followed by
the text in a fenced block.

Give exact text for every line, so the main agent writes without deciding anything.
Screenshots are taken from the section that was picked from, before the workspace is
removed.
