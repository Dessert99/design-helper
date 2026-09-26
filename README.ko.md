# design-helper

[![last commit](https://img.shields.io/github/last-commit/Dessert99/design-helper)](https://github.com/Dessert99/design-helper/commits/main)
[![release](https://img.shields.io/github/v/release/Dessert99/design-helper)](https://github.com/Dessert99/design-helper/releases)

[English](README.md) | [한국어](README.ko.md)

> CSS 값, 레이아웃, 모션을 눈으로 보고 정하게 해 주는 Claude Code 스킬

<!-- 표본 시트 스크린샷 자리 -->

## 왜 만들었나

채팅창에서 "패딩 12px이 나아요, 16px이 나아요?"라고 물으면 대답하기 어렵습니다. 숫자만
보고 모양을 떠올리기 힘들어서, 결국 코드에 넣고 새로고침해 보고 다시 고치게 됩니다.

design-helper는 이걸 말로 묻지 않고 후보를 전부 그려서 브라우저에 나란히 띄웁니다.
사용자는 보고 고르면 됩니다.

이럴 때 씁니다.

- 컴포넌트 테두리를 여러 가지로 바꿔 보고 싶을 때
- 페이지의 기본 레이아웃을 정하고 싶을 때

## 하는 일

한 번 쓰면 이렇게 흘러갑니다.

```
나   카드 그림자 블러를 5가지로 보여줘

     → 프로젝트의 스타일 체계와 지금 카드 값을 읽음
     → 블러만 4 · 8 · 12 · 16 · 24px로 바꾼 카드 A–E를 그려 브라우저에 띄움
       (색, 농도, 위치 같은 나머지는 그대로)
     → 표본마다 값과 비용 표시: 토큰 그대로 · --shadow-md 고침 (23곳) · 새 토큰
     → 표본 아래에 어디서부터 차이가 안 보이는지, 어느 걸 왜 추천하는지 적음

나   C가 나은데 조금 더 진하게

     → C를 기준으로 농도를 바꾼 사다리를 아래에 이어 그림 (F · G · H …)

나   G로 갈게

     → 영향 범위 확인 → 실제 카드 코드에 반영 → 계산된 스타일과 스크린샷으로 확인 → 보고

나   끝났어

     → 서버를 끄고 임시 파일을 지움
```

한 번에 한 속성만 바꾸고 나머지는 그대로 둡니다. 그래서 눈에 보이는 차이는 전부 그 속성
때문입니다. 앞에서 고른 값은 다음 비교에 그대로 깔립니다.

- **값을 옮겨 적을 필요가 없습니다.** 채팅으로 글자만 말하면 코드는 스킬이 고칩니다.
- **시트만 봐도 알 수 있게 씁니다.** 섹션마다 무엇을 정하는지, 어디를 보면 되는지, 어떻게
  답하면 되는지를 먼저 적습니다. 표본에는 값과 비용을 붙이고, 얻고 잃는 게 있으면 그것도
  적습니다. 왼쪽 목차에 요청이 쌓여서 앞의 비교로 바로 돌아갈 수 있습니다.
- **새로고침하지 않아도 됩니다.** 시트가 바뀌면 스킬이 탭을 다시 불러와 앞으로 띄웁니다.
  에이전트가 브라우저를 다룰 수 없으면 그렇다고 말하고 시트 주소를 알려 줍니다.
- **프로젝트에 흔적을 남기지 않습니다.** 시트, 서버, 메모, 스크린샷은 모두 프로젝트 밖 임시
  폴더에 둡니다. 프로젝트에 남는 건 고른 값을 반영한 코드뿐입니다.
- **프로젝트의 스타일 체계로 그립니다.** Tailwind와 CSS 변수는 실제 클래스와 토큰으로
  그립니다. SCSS 변수와 CSS-in-JS 테마는 브라우저가 못 읽으니 값을 읽어서 시트의 CSS
  변수로 옮깁니다. 스타일 체계가 없으면 값을 직접 씁니다.

## 하지 않는 것

- **디자인을 새로 지어내지 않습니다.** 완성된 모습을 만들어 주는 대신 비교할 값의 범위를
  펼칩니다. 표본 아래에 추천과 이유, 얻고 잃는 것을 적긴 하지만 고르는 건 사용자입니다.
- **다음 할 일을 정하지 않습니다.** "다음은 색을 보죠" 같은 제안이나 남은 단계 목록을 내놓지
  않습니다. 다음에 뭘 볼지는 사용자가 정합니다.
- **동작이 맞는지는 확인하지 못합니다.** 포커스 트랩, 키보드 조작, 스크린리더는 눈으로 고를
  수 있는 게 아니라서 다루지 않습니다.
- **애니메이션은 사용자가 보고 정합니다.** 스크린샷에는 멈춘 화면만 찍히기 때문에, 움직임은
  사용자가 브라우저에서 보고 말해 준 대로 정합니다.

## 필요한 것

- [Claude Code](https://claude.com/claude-code) 또는 Codex
- 브라우저
- `python3`: 시트를 띄우고 자동으로 새로고침하는 로컬 서버에 씁니다. 없으면 시트를
  `file://`로 여는데, 이때는 자동 새로고침도 없고 2분 동안 요청이 없을 때 임시 폴더를
  지우는 자동 정리도 없습니다.
- Playwright (선택): 계산된 스타일을 읽고 스크린샷을 찍는 데 씁니다. 없으면 이 확인은
  건너뜁니다.

## 설치

### 플러그인으로 설치 (권장)

이 저장소가 두 에이전트 모두의 플러그인 마켓플레이스입니다.

```sh
# Claude Code: 세션 안에서
/plugin marketplace add Dessert99/design-helper
/plugin install design-helper@design-helper

# Codex: 터미널에서
codex plugin marketplace add Dessert99/design-helper
codex plugin add design-helper@design-helper
```

설치한 뒤 세션을 새로 열어야 스킬이 잡힙니다. 업데이트할 때는 마켓플레이스를 새로 받고
(Claude Code는 `/plugin marketplace update design-helper`, Codex는
`codex plugin marketplace upgrade`) 다시 설치하면 됩니다.

### clone 해서 설치

스킬을 직접 고치고 싶을 때, 예를 들어 [언어를 바꿀 때](#언어-설정) 이렇게 설치합니다.
원하는 곳에 clone 한 뒤, 쓰는 에이전트의 스킬 폴더에 심링크를 겁니다. 심링크는 원본을
가리키기만 하므로 clone을 고치면 바로 반영되고, 따로 맞춰 둘 사본도 생기지 않습니다.

```sh
git clone https://github.com/Dessert99/design-helper.git ~/src/design-helper

ln -sfn ~/src/design-helper/skills/design-helper ~/.claude/skills/design-helper   # Claude Code
ln -sfn ~/src/design-helper/skills/design-helper ~/.codex/skills/design-helper    # Codex
```

두 에이전트 모두 `SKILL.md`의 `description`은 세션을 시작할 때 읽고, 본문과
`references/`는 스킬이 실행될 때 읽습니다. 그래서 본문을 고치면 바로 적용되고,
`description`을 고쳤을 때만 세션을 새로 열면 됩니다.

지우려면 심링크만 지우면 됩니다(`rm ~/.claude/skills/design-helper`). clone은 그대로
남습니다.

## 사용법

UI를 만들거나 고치다가 평소처럼 말하면 됩니다. 이런 말에 스킬이 실행됩니다.

- `버튼 radius 5가지 버전으로 보여줘`
- `A 랑 B 중에 뭐가 나아?`
- `카드 여백 비교해줘`
- `이 헤더 좀 어색한데 어떻게 할까`: 무엇을 바꿀지 아직 모르면 하나씩 물어봅니다.
- `대시보드 레이아웃 잡아줘`: 디자인이 아예 없으면 방향이 크게 다른 조합부터 보여 줍니다.
  여기서 고른 조합은 코드에 넣지 않고 출발점으로만 적어 둔 뒤, 그 위에서 속성을 하나씩
  정합니다.

브라우저에 뜬 표본에는 A · B · C 글자가 붙어 있고, 대답은 채팅으로 합니다.

| 이렇게 말하면 | 이렇게 됩니다 |
|---|---|
| `C로 갈게` · `난 B가 좋아` | 고른 것으로 보고 바로 코드에 반영한 뒤 확인합니다. 빈 화면에서 고른 첫 조합은 출발점으로만 적어 둡니다 |
| `C가 나은데 더 진하게` | 더 비교하고 싶은 것으로 보고 아래에 사다리를 이어 그립니다 |
| `좋네` | 어느 표본인지 되묻습니다 |
| `끝났어` · `됐어` | 서버를 끄고 임시 파일을 정리합니다 |

상황별 예시 대화는 [사용 흐름 모음](docs/flows.ko.md)에 있습니다. 불만은 있는데 뭘 바꿀지
모를 때, hover·focus 같은 상태 비교, 애니메이션 비교, 이미 정한 값 바꾸기 등 11가지
상황을 다룹니다.

## 비슷한 스킬과 비교

2026년 9월에 아래 링크의 커밋을 기준으로 살펴봤습니다. 다른 스킬은 대개 **무엇을 만들지**를
돕고, design-helper는 **이미 정한 것의 값을 얼마로 할지**를 돕습니다. 그래서 서로 대신하기보다
같이 쓰기 좋습니다.

**[frontend-design](https://github.com/anthropics/skills/tree/33375500bcea98d610eb30ce10ac4e59b89c390d/skills/frontend-design)** (Anthropic 공식)
- 하는 일: 에이전트가 디자인 리드처럼 생각하게 해서, 흔한 AI 스타일 대신 과감한 미감을 고르게 합니다.
- 차이: 후보를 그려 비교하는 단계가 없고 에이전트가 취향을 정합니다. design-helper는 후보를 그리고 하나를 추천하지만, 고르는 건 사용자입니다.
- 이럴 때 frontend-design: 빈 화면에서 그럴듯한 첫 디자인을 한 번에 얻고 싶을 때. design-helper는 방향을 지어내지 않습니다.

**[impeccable](https://github.com/pbakaus/impeccable/tree/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8)** (pbakaus)
- 하는 일: 디자인 용어집, 안티패턴 검출 규칙, `audit` · `polish` · `typeset` · `layout` 같은 명령을 줍니다. live 모드에서는 실행 중인 앱에서 요소를 골라 여러 변형을 브라우저에서 넘겨 보고, 마음에 든 변형을 소스에 씁니다. 기존 CSS 토큰과 계산된 스타일을 읽고, 변형마다 조절 슬라이더를 붙일 수도 있습니다.
- 차이: 가장 비슷한 스킬입니다. impeccable은 요소를 통째로 다시 만들어서 여러 속성이 한꺼번에 바뀌고, 변형을 하나씩 넘겨 봅니다. design-helper는 속성 하나만 바꾼 사다리를 한 화면에 나란히 놓고, 표본마다 토큰에 미치는 영향을 적습니다.
- 이럴 때 impeccable: 실제 앱 화면에서 바로 고르고 싶을 때, 디자인 점검과 다듬기를 명령 하나로 돌리고 싶을 때.

**[visual companion](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/brainstorming/visual-companion.md)** (obra/superpowers의 brainstorming 스킬 일부)
- 하는 일: 구현 전에 아이디어를 짜는 단계에서 목업, 다이어그램, 나란히 비교를 브라우저에 띄우고 클릭으로 고르게 합니다. 간격이나 시각적 위계를 다듬을 때도 씁니다.
- 차이: 한 속성만 바꾸는 사다리, 고른 뒤 코드 반영, 반영 후 확인을 정해진 절차로 두지 않습니다. design-helper는 이 셋이 기본입니다.
- 이럴 때 visual companion: 아키텍처 다이어그램처럼 UI가 아닌 것도 그려야 할 때, 구현 전에 방향을 잡을 때.

**[design-shotgun](https://github.com/garrytan/gstack/blob/2a113ae7e623f590095bcaaa0cc581c9a10a6632/design-shotgun/SKILL.md.tmpl)** (garrytan/gstack)
- 하는 일: 이미지 생성으로 서로 다른 시안을 3~8장 만들어 비교 보드에 띄우고, 평가와 메모를 받아 다시 만듭니다. 마음에 들어 한 취향을 기억합니다.
- 차이: 결과물이 코드가 아니라 이미지(PNG)라서 코드 반영은 다른 스킬이 해야 합니다. 이미지 생성 도구도 필요합니다. design-helper는 별도 도구 없이 CSS로 그립니다.
- 이럴 때 design-shotgun: 아직 뭘 원하는지 모르겠고 넓게 여러 방향을 보고 싶을 때.

**design-helper만의 방식**: 한 속성만 바꾼 사다리를 나란히 놓고, 표본마다 영향 범위를 적고, 표본 아래에 얻고 잃는 것과 추천을 보여 주고, 고르면 반영과 확인까지 하고, 작업 파일은 프로젝트 밖에 둡니다.

**design-helper의 약점**: 완성된 디자인 방향을 먼저 내놓지 않고, 안티패턴을 자동으로 찾아 주지 않고, 실제 앱이 아니라 따로 띄운 시트에서 비교하고, 기본 답변이 한국어뿐입니다.

## 언어 설정

지시문은 영어지만 채팅 답변과 비교 시트의 글자는 모두 한국어입니다. 코드, 클래스 이름,
파일 이름, 커밋 메시지는 영어로 씁니다.

다른 언어로 바꾸려면 [clone 해서 설치](#clone-해서-설치)한 뒤 `skills/design-helper/SKILL.md`의
`## Language` 섹션을 고치면 됩니다. 플러그인으로 설치한 파일은 업데이트할 때마다 덮어써지니
고쳐도 남지 않습니다. 지시문 곳곳에 따옴표로 들어간 한국어 문구(`토큰 그대로`, `끝났어` 등)도
같이 바꿔야 합니다.

## 문서

- [`SKILL.md`](skills/design-helper/SKILL.md): 스킬 본체. 작업 단위, 표본 그리는 규칙, 대답 해석, 확인, 마무리
- [`references/`](skills/design-helper/references/): 스킬이 필요할 때 읽는 세부 지침
  - [`clarification.md`](skills/design-helper/references/clarification.md): 요청이 모호할 때 묻는 법
  - [`sweeping.md`](skills/design-helper/references/sweeping.md): 후보 값, 캡션과 추천, 배경·크기 조건, 빈 화면에서 시작하기, 와이어프레임
  - [`sheet.md`](skills/design-helper/references/sheet.md): 시트 페이지의 섹션 안내, 요청 구분선, 목차, 배치, 스타일
  - [`stylesystems.md`](skills/design-helper/references/stylesystems.md): 스타일 체계를 알아내고 체계별로 그리는 법
  - [`controls.md`](skills/design-helper/references/controls.md): 필요할 때만 쓰는 슬라이더와 그 엔진
  - [`motion.md`](skills/design-helper/references/motion.md): 애니메이션 비교
  - [`liveview.md`](skills/design-helper/references/liveview.md): 임시 작업 폴더, 로컬 서버, 브라우저 탭 관리, 정리
- [`docs/flows.ko.md`](docs/flows.ko.md): 상황별 사용 흐름
- [`scripts/bump-version.sh`](scripts/bump-version.sh): 플러그인 매니페스트의 버전을 한 번에 바꾸고 커밋과 태그까지 만드는 스크립트

## 라이선스

[MIT](LICENSE)
