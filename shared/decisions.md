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
├─ ux-<task>.md       one file per task design-ux decided (`ux-주문취소.md`)
├─ icons.md           the icon set and its concept table (design-brand)
├─ logo.md            the logo and its versions (design-brand)
├─ motion-<moment>.md one file per moment design-motion decided (`motion-대시보드진입.md`)
└─ assets/            the sheet screenshots each decision was made from
   └─ brand/          the chosen logo files (design-brand)
```

One file per area, so changing one area means reading one file. The whole picture is
the checklist in `README.md`.

## `README.md`

The first skill that writes the record creates `README.md`. Its minimal form is the
title, `기반`, `접근성 기준`, `구현 방침` (each `미정` until decided) and a contents list
of the files below it. UX files are listed under `## 과제`, one line each:
`` - `ux-<task>.md`: <task> (<steps settled>) ``; motion files the same way under
`## 움직임`, and `icons.md` and `logo.md` with the area files. design-system adds the sections shown here (목적과 분위기, 출발점
값, 체크리스트, 결정 기록) when it is used; other skills never need them.

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
   A few rows can't be drawn and are settled in conversation, source `대화로 결정`:
   design-system's `목적과 주 사용자`, `분위기` and `동작 접근성 방침`, design-ux's
   `목표와 사용자` and `과제 단계`, design-brand's `바탕`, and design-motion's `순간과 목적`,
   `지금 움직임` and the library in `구현 방침`. Nothing else is.
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

Give exact text for every line, so the main agent writes without deciding anything. Code
inside the block is written as it is in the source: never HTML-escape it (`=>`, not `=&gt;`).
Screenshots are taken from the section that was picked from, before the workspace is
removed.

## A UX file (`ux-<task>.md`)

design-ux writes one per task. Same frontmatter and statuses as an area file.

````markdown
---
status: 초안
decided: 2026-11-25
reopen_when: [취소 정책 변경, 주문 목록 화면 개편]
verify: [완료 조건 시나리오가 끝까지 통과, 키보드만으로 완료]
---

# 주문 취소 처리

## 목표와 사용자
- 사용자: 하루 수십 건의 주문을 처리하는 운영자
- 목표: 취소 요청 주문을 찾아 취소를 확정한다
- 의도 I1. 목록을 떠나지 않고 처리할 수 있어야 한다.

## 과제 단계
1. 취소 요청 주문 찾기 → 2. 내용 확인 → 3. 취소 확정 → 4. 처리됐음을 안다

## 결정
| 단계 | 결정 | 상태 | 출처 |
|---|---|---|---|
| 흐름 | 목록 옆 패널에서 처리, 화면 전환 없음 | 확정 | 시안 B (D1) |
| 상호작용 | 취소는 확인 창 없이 바로, 대신 되돌리기 알림 5초 | 초안 | |
| 상태 | 취소 요청이 없을 때: "처리할 취소 요청이 없습니다" | 보류 | |

## 완료 조건
- 목록에서 시작해 클릭 3번 이내로 취소를 확정하고, 목록 위치가 그대로다.
- Tab과 Enter만으로 같은 과제를 끝낼 수 있다.

## 결정 기록
### D1. 흐름은 B, 목록 옆 패널
- 결정: 사용자, 2026-11-25, 요청 3의 시안 B
- 이유: A와 클릭 수가 같지만 취소 버튼이 숨어 있지 않다. C는 목록 위치를 잃는다.
- 측정: 클릭 2 · 입력 0 · 전환 0 · 목록 위치 유지 · 키보드로 완료
- 단계 띠: `assets/ux-주문취소-d1.png` (정상 상태, 라이트, 폭 1440, 시안 A부터 C)

## 이 문서가 정하지 않는 것
- 버튼과 패널의 색, 글자, 간격 (영역 파일)
````

- **결정** rows follow the seven steps of design-ux; a step not taken is absent or `보류`.
- **완료 조건** are observable and checkable with the same scenario the step strip used.
  They start `초안` and become `확정` when the user confirms them.
- **목표와 사용자** and **과제 단계** carry their own `출처: 대화로 결정, <date>` line.

## Brand files (`icons.md`, `logo.md`)

design-brand writes them. Same frontmatter, statuses and 결정 기록 as an area file; the
step rows replace 역할과 값.

````markdown
---
status: 초안
decided: 2026-11-26
reopen_when: [제품 이름 변경, 주 색 변경]
verify: [16px에서 가장 가는 부분 1px 이상, 상표 검색 (사용자, 아직 안 함)]
---

# 로고

## 바탕
- 이름: 바른장부 · 하는 일: 작은 가게의 장부 앱 · 성격: 정확함, 믿음직함, 담백함
- 쓰이는 자리: 웹 헤더, 브라우저 탭, 앱 아이콘 · 닮으면 안 되는 브랜드: (사용자가 말한 것)
- 출처: 대화로 결정, 2026-11-26

## 결정
| 단계 | 결정 | 상태 | 출처 |
|---|---|---|---|
| 형식 | 조합형: 헤더는 심볼과 이름, 작은 자리는 심볼만 | 확정 | 시안 D (D1) |
| 서체 | Pretendard ExtraBold (OFL) | 초안 | |

## 파일
| 판 | 파일 | 최소 크기 |
|---|---|---|
| 전체 | `assets/brand/logo.svg` | 높이 20px |
| 심볼 | `assets/brand/logo-mark.svg` | 24px |
| 작은 판 | `assets/brand/logo-small.svg`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | 16px |

## 결정 기록
### D1. 형식은 D, 조합형
- 결정: 사용자, 2026-11-26, 요청 2의 시안 D
- 측정: 16px 흐린 픽셀 8% · 가장 가는 부분 1.6px · 360 헤더 폭 60px
- 판단: 없음
- 스크린샷: `assets/logo-d1.png` (라이트, 폭 1440, 시안 A부터 D)
````

- `icons.md` has the same parts with `## 세트` and `## 개념 표` instead of `## 파일`:

  ```markdown
  ## 세트
  - Lucide 1.81.0 (React: `lucide-react`), 라이선스 ISC
  - 굵기: 세트 기본값 (I3 전까지)

  ## 개념 표
  | 개념 | 아이콘 이름 | 쓰는 곳 |
  |---|---|---|
  | 설정 | `Settings` (`settings`) | 옆 메뉴 "설정" |
  ```

  The name is the component the code imports, then the set's file name. Agents pick icons
  from that table and never draw or import others.
- `verify` keeps the trademark search line until the user says it was done.

## A motion file (`motion-<moment>.md`)

design-motion writes one per moment. Same frontmatter and statuses.

````markdown
---
status: 초안
decided: 2026-11-26
reopen_when: [대시보드 카드 구성 변경, 모션 토큰 변경]
verify: [전체 700ms 이내, transform과 opacity만]
---

# 대시보드 진입

## 순간과 목적
- 순간: 대시보드를 열 때 제목과 카드가 나타남 · 라이브러리: GSAP 3.15
- 목적: 내용이 준비됐음을 알림 · 자주 봄, 생산적
- 출처: 대화로 결정, 2026-11-26

## 결정
| 단계 | 결정 | 상태 | 출처 |
|---|---|---|---|
| 안무 | 제목 먼저, 카드는 0.15초 겹쳐 한꺼번에 | 확정 | 시안 C (D1) |
| 성격 | power2.out | 초안 | |
| 움직임 줄이기 | 투명도만 150ms | 보류 | |

## 사양
| 대상 | 속성 | 시간 | 곡선 | 시작 | 트리거 | 끊길 때 | 줄인 판 |
|---|---|---|---|---|---|---|---|
| 제목 | y 24→0, opacity 0→1 | 400ms | power2.out | 0 | 처음 그릴 때 한 번 | 해당 없음 | opacity만 |
| 카드 | y 24→0, opacity 0→1 | 400ms | power2.out | 150ms, 한꺼번에 | 위와 같음 | 해당 없음 | opacity만 |

## 완료 조건
- 전체 700ms 이내, transform과 opacity만 움직인다.
- (움직임 줄이기를 고르면 그 판의 이동 거리가 여기에 더해진다.)

## 결정 기록
### D1. 안무는 C
- 결정: 사용자, 2026-11-26, 요청 3의 시안 C
- 측정: 전체 550ms · 90% 도달 370ms · 넘침 0px · 동시에 최대 5개
- 판단: 없음
- 프레임 띠: `assets/motion-대시보드진입-d1.png` (라이트, 폭 1440, 시안 A부터 D)

## 기준 코드
(step 7 picked: 10 to 20 lines in the project's library, reference only)
````

- **사양** is the handoff: one row per element or group, filled as steps are picked;
  cells not decided yet read `미정`.
- **완료 조건** are stated so they can be checked after building (length, what moves,
  travel when reduced) and become `확정` when the user confirms them.
