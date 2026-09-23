# 지침의 미정 사항과 구현 차이

[상황 목록으로](../flows.ko.md)

현재 지침과 포함된 코드를 대조한 결과다. 실행 시험 결과가 아니며, 이 문서에서 지적한 지침과 코드는 아직 수정하지 않았다.

## 대표 상황으로 확정하지 않은 흐름

<a id="방향재탐색"></a>
### 기존 디자인에서 새로운 방향을 탐색하기

`stylesystems.md`의 **Draw in the system, or on a blank slate**는 기존 디자인에서 다른 방향을 찾을 때 현재 값을 가운데 둔 좌표 탐색을 지시한다. `sweeping.md`의 **A look exists, but the user wants a different direction**도 같은 방법을 설명한다.

반면 `SKILL.md`의 **An order with no axis in it**은 기존 대상이 없을 때 좌표 탐색 예외를 열고, `controls.md`도 두 축 컨트롤의 예외를 백지 매트릭스로 한정한다. 따라서 기존 디자인이 있는 경우 좌표 탐색을 시작하는 정확한 조건을 먼저 일치시켜야 한다. 대표 예시 03은 대상이 없는 경우로 한정했다.

근거: [Style systems](../../references/stylesystems.md#draw-in-the-system-or-on-a-blank-slate), [Sweeping](../../references/sweeping.md#a-look-exists-but-the-user-wants-a-different-direction), [SKILL](../../SKILL.md#an-order-with-no-axis-in-it), [Controls](../../references/controls.md#controls)

### 두 속성의 조합을 함께 비교하고 확정하기

`SKILL.md`와 `sweeping.md`에는 두 축을 행과 열로 분리해 매트릭스로 비교하라는 설명이 있다. 테두리 두께별로 행을 나누고 밝기별로 열을 나누는 비교가 이에 해당한다.

그러나 단일 축 원칙과 컨트롤의 백지 예외 제한이 함께 존재한다. 현재 엔진은 모든 `kind: 'matrix'`에 `여기서 시작`을 붙이고 `anchor`를 전송한다. 따라서 두 속성의 조합을 골라도 개별 속성의 확정으로 기록되지 않는다.

비교용 두 축 매트릭스와 출발점용 매트릭스를 어떻게 구분하고, 무엇을 확정으로 기록할지 정해지기 전에는 두 축 확정의 정상 흐름으로 설명하지 않는다.

근거: [SKILL — Drawing specimens](../../SKILL.md#drawing-specimens), [Sweeping — Default ladders](../../references/sweeping.md#default-ladders), [Controls — Recording a choice](../../references/controls.md#recording-a-choice), [The engine](../../references/controls.md#the-engine)

## 실행 예제와 지침 사이의 차이

<a id="추가표본문자"></a>
### 같은 작업 단위에 추가한 표본의 문자

지침은 같은 작업 단위 안에서 문자를 재사용하지 않도록 한다. A–E 다음에 추가하는 표본은 F부터 이어져야 한다.

현재 엔진의 `build()`는 section마다 `LET[i]`를 사용하므로 새 section은 다시 A부터 시작한다. section 안에서 화살표 키로 추가한 값은 뒤에 붙지만, 새 사다리를 section으로 추가할 때의 문자 시작 위치 설정은 없다.

근거: [SKILL — Drawing specimens](../../SKILL.md#drawing-specimens), [Controls — The engine](../../references/controls.md#the-engine)

### 핀의 내용 보존

설명은 후보를 핀으로 두고 다른 후보와 비교하도록 한다. 하지만 엔진은 `{ sec, letter }`만 저장하고, 다시 그릴 때 그 문자에 해당하는 현재 표본을 복제한다. 창을 움직여 문자가 가리키는 값이 바뀌면 핀의 내용도 바뀔 수 있다. 선택 당시 값의 고정 사본으로 취급할 수 없다.

근거: [Controls — The pin tray](../../references/controls.md#the-pin-tray), [The engine](../../references/controls.md#the-engine)의 `paintPins()`와 `commit()`

<a id="느린재생"></a>
### 느린 재생

모션 지침은 `0.25x`를 요구하지만 CSS 예제는 모든 animation/transition duration을 `4s !important`로 덮어쓴다. 이는 각 원래 시간을 네 배로 늘리는 동작이 아니며 duration 후보의 차이를 없앤다. 대표 예시 10은 실제 속도에서 선택하는 흐름으로 제한했다.

근거: [Motion — Three devices](../../references/motion.md#three-devices)

### 확정 기록과 화면의 선택 강조

현재 클릭 핸들러는 POST를 기다리지 않고 `.picked`를 붙인다. 요청 실패 시에도 강조가 남을 수 있다. 기록의 근거는 새 서버 기록 또는 명시적인 채팅 선택이며, 화면 강조만으로 기록 성공을 보장하지 않는다.

또한 서버 기록을 에이전트에게 자동 푸시하는 코드가 없다. 지침은 에이전트가 다음 턴 시작 시 파일을 읽도록 한다.

근거: [Controls — The engine](../../references/controls.md#the-engine), [Live view — What the sheet sends back](../../references/liveview.md#what-the-sheet-sends-back)

### 맥락과 표본 배치

지침은 기본 배경·크기·반복을 함께 열고 가로 스크롤 없이 후보를 비교하도록 한다. 엔진은 맥락 선택을 `sessionStorage`에서 복원하므로, 새 section에서도 이전의 좁힌 맥락이 이어질 수 있다. 스타일 예제의 section에는 `overflow-x:auto`가 있어 가로 넘침을 자체적으로 금지하지 않는다. 요구되는 배치는 별도 확인이 필요하다.

근거: [Sweeping — Context](../../references/sweeping.md#context), [Controls — A ladder that doesn't fit](../../references/controls.md#a-ladder-that-doesnt-fit-isnt-a-ladder), [The engine](../../references/controls.md#the-engine), [The style](../../references/controls.md#the-style)

## 해석을 맞춰야 하는 운영 규칙

<a id="검증빈도"></a>
### 검증 빈도와 브라우저 상태

`SKILL.md`는 computed style과 스크린샷 확인을 작업 단위당 한 번으로 적고, `liveview.md`는 수정할 때마다 검증하도록 적는다. `controls.md`는 창을 옮긴 뒤 다음 턴에 경계를 다시 보도록 한다. 정확한 재검증 주기를 일치시킬 필요가 있다.

또한 같은 URL을 읽는 Playwright 탭과 사용자 탭은 같은 HTML을 받더라도 `sessionStorage`의 창·맥락 상태가 다를 수 있다. 별도 탭의 스크린샷만 보고 사용자가 조작한 현재 상태까지 확인했다고 단정할 수 없다.

근거: [SKILL — Verify](../../SKILL.md#verify), [Live view — After every edit](../../references/liveview.md#after-every-edit), [Controls — The boundary goes stale](../../references/controls.md#the-boundary-goes-stale-the-captions-dont)

<a id="일시중단"></a>
### 일시 중단과 다음 세션의 복원

`liveview.md`는 서버만 죽은 경우 같은 작업 폴더를 재사용하도록 하고, 새 세션에서는 새 폴더를 만들도록 한다. 두 설명은 상황이 다르므로 모순은 아니다. 다만 이전 세션의 메모를 찾아 다음 세션으로 가져오는 절차는 정의되어 있지 않다.

따라서 같은 작업 폴더가 남아 있는 세션의 서버 복구와, 새로운 세션에서 이전 결정을 복원하는 기능을 구분한다. 후자는 보장된 기능으로 문서화하지 않는다.

근거: [Live view — It reaps itself](../../references/liveview.md#it-reaps-itself), [At the end](../../references/liveview.md#at-the-end)

<a id="정리범위"></a>
### 종료 시 프로젝트 변경 정리 범위

`SKILL.md`와 `liveview.md`는 마지막에 코드 반영을 허용하면서도 `git status`에 스킬이 만든 것이 없어야 한다고 적는다. 이 문장을 모든 코드 변경에 적용하면 의도한 반영 결과까지 제거하게 된다.

대표 예시 11에서는 정리 대상을 임시 자원으로 해석했다. 반영 코드와 기존 사용자 변경은 보존한다. 원문에서도 정리 대상이 임시 자원임을 명시할 필요가 있다.

근거: [SKILL — The sheet](../../SKILL.md#the-sheet), [Ending](../../SKILL.md#ending), [Live view — The workspace](../../references/liveview.md#the-workspace), [At the end](../../references/liveview.md#at-the-end)
