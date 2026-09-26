# 지침의 미정 사항과 구현 차이

[상황 목록으로](../flows.ko.md)

현재 지침과 포함된 코드를 대조한 결과다. 실행 시험 결과가 아니며, 이 문서에서 지적한 지침과 코드는 아직 수정하지 않았다.

## 대표 상황으로 확정하지 않은 흐름

<a id="방향재탐색"></a>
### 기존 디자인에서 새로운 방향을 탐색하기

`stylesystems.md`의 **Draw in the system, or on a blank slate**는 기존 디자인에서 다른 방향을 찾을 때 현재 값을 가운데 둔 좌표 탐색을 지시한다. `sweeping.md`의 **A look exists, but the user wants a different direction**도 같은 방법을 설명한다.

반면 `SKILL.md`의 **An order with no axis in it**은 기존 대상이 없을 때 좌표 탐색 예외를 열고, `controls.md`도 두 축 컨트롤의 예외를 백지 매트릭스로 한정한다. 그래서 기존 디자인이 있을 때 좌표 탐색을 언제 시작하는지 지침끼리 먼저 맞춰야 한다. 대표 예시 03은 대상이 없는 경우로 한정했다.

근거: [Style systems](../../skills/design-helper/references/stylesystems.md#draw-in-the-system-or-on-a-blank-slate), [Sweeping](../../skills/design-helper/references/sweeping.md#a-look-exists-but-the-user-wants-a-different-direction), [SKILL](../../skills/design-helper/SKILL.md#an-order-with-no-axis-in-it), [Controls](../../skills/design-helper/references/controls.md#controls)

### 두 속성의 조합을 함께 비교하고 확정하기

`SKILL.md`와 `sweeping.md`에는 두 축을 행과 열로 분리해 매트릭스로 비교하라는 설명이 있다. 테두리 두께로 행을, 밝기로 열을 나누는 비교가 그 예다.

그러나 단일 축 원칙과 컨트롤의 백지 예외 제한이 함께 존재한다. 좌표 탐색은 채팅으로 출발점을 받으며, 단일 축 선택과 달리 개별 속성 확정으로 취급하지 않는다.

비교용 두 축 매트릭스와 출발점용 매트릭스를 어떻게 구분하고, 무엇을 확정으로 기록할지 정해지기 전에는 두 축 확정의 정상 흐름으로 설명하지 않는다.

근거: [SKILL — Drawing specimens](../../skills/design-helper/SKILL.md#drawing-specimens), [Sweeping — Candidate scales](../../skills/design-helper/references/sweeping.md#candidate-scales), [SKILL — Reading the response](../../skills/design-helper/SKILL.md#reading-the-response), [Controls — The engine](../../skills/design-helper/references/controls.md#the-engine)

## 실행 예제와 지침 사이의 차이

<a id="추가표본문자"></a>
### 같은 작업 단위에 추가한 표본의 문자

지침은 같은 작업 단위 안에서 문자를 재사용하지 않도록 한다. A–E 다음에 추가하는 표본은 F부터 이어져야 한다.

현재 엔진의 `build()`는 section마다 `LET[i]`를 사용하므로 새 section은 다시 A부터 시작한다. section 안에서 화살표 키로 추가한 값은 뒤에 붙지만, 새 사다리를 section으로 추가할 때의 문자 시작 위치 설정은 없다.

근거: [SKILL — Drawing specimens](../../skills/design-helper/SKILL.md#drawing-specimens), [Controls — The engine](../../skills/design-helper/references/controls.md#the-engine)

<a id="느린재생"></a>
### 느린 재생

모션 지침은 `0.25x`를 요구하지만 CSS 예제는 모든 animation/transition duration을 `4s !important`로 덮어쓴다. 이는 각 원래 시간을 네 배로 늘리는 동작이 아니며 duration 후보의 차이를 없앤다. 대표 예시 10은 실제 속도에서 선택하는 흐름으로 제한했다.

근거: [Motion — Three devices](../../skills/design-helper/references/motion.md#three-devices)

### 맥락과 표본 배치

지침은 기본 배경·크기·반복을 함께 열도록 한다. 엔진은 맥락 선택을 `sessionStorage`에서 복원하므로, 새 section에서도 이전의 좁힌 맥락이 이어질 수 있다.

한 축 사다리는 폭을 채우는 격자라 칸이 넘치면 다음 줄로 내려간다. 두 축 매트릭스는 열 수를 고정하고 칸을 줄여 맞추므로, 표본이 칸보다 크면 잘릴 수 있다. 이 경우는 별도 확인이 필요하다.

근거: [Sweeping — Context](../../skills/design-helper/references/sweeping.md#context), [Controls — A ladder that doesn't fit](../../skills/design-helper/references/controls.md#a-ladder-that-doesnt-fit-isnt-a-ladder), [The engine](../../skills/design-helper/references/controls.md#the-engine), [The style](../../skills/design-helper/references/controls.md#the-style)

## 해석을 맞춰야 하는 운영 규칙

<a id="검증빈도"></a>
### 검증 빈도와 브라우저 상태

`SKILL.md`는 computed style과 스크린샷 확인을 작업 단위당 한 번으로 적고, `liveview.md`는 수정할 때마다 검증하도록 적는다. `controls.md`는 창을 옮긴 뒤 다음 턴에 경계를 다시 보도록 한다. 정확한 재검증 주기를 일치시킬 필요가 있다.

같은 URL을 읽는 Playwright 탭과 사용자 탭은 같은 HTML을 받더라도 `sessionStorage`의 창·맥락 상태가 다를 수 있다. 그래서 다른 탭의 스크린샷만으로 사용자가 조작한 지금 상태까지 확인했다고 할 수는 없다.

근거: [SKILL — Verify](../../skills/design-helper/SKILL.md#verify), [Live view — After every edit](../../skills/design-helper/references/liveview.md#after-every-edit), [Controls — The boundary goes stale](../../skills/design-helper/references/controls.md#the-boundary-goes-stale-the-captions-dont)

<a id="일시중단"></a>
### 일시 중단과 다음 세션의 복원

`liveview.md`는 서버만 죽은 경우 같은 작업 폴더를 재사용하도록 하고, 새 세션에서는 새 폴더를 만들도록 한다. 두 설명은 상황이 다르므로 모순은 아니다. 다만 이전 세션의 메모를 찾아 다음 세션으로 가져오는 절차는 정의되어 있지 않다.

요청이 2분 동안 없으면 서버가 임시 폴더까지 삭제한다. 그 전의 서버 복구와 만료 후의 시안 재생성을 구분한다. 삭제된 메모나 시안 이력의 정확한 복원은 보장하지 않으며, 이후에는 프로젝트 코드와 남아 있는 대화를 바탕으로 다시 만든다.

근거: [Live view — It reaps itself](../../skills/design-helper/references/liveview.md#it-reaps-itself), [At the end](../../skills/design-helper/references/liveview.md#at-the-end)
