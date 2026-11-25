# 지침의 미정 사항과 구현 차이

[상황 목록으로](../flows.ko.md)

아직 판단이 필요한 흐름과 검증의 한계를 정리했다. 아래 항목은 해결된 것으로 보지 않는다.

## 대표 상황으로 확정하지 않은 흐름

<a id="방향재탐색"></a>
### 기존 디자인에서 새로운 방향을 탐색하기

`stylesystems.md`의 **Draw in the system, or on a blank slate**는 기존 디자인에서 다른 방향을 찾을 때 현재 값을 가운데 둔 좌표 탐색을 지시한다. `sweeping.md`의 **A look exists, but the user wants a different direction**도 같은 방법을 설명한다.

반면 `worker.md`의 **An order with no axis in it**은 기존 대상이 없을 때 좌표 탐색 예외를 열고, `controls.md`도 두 축 컨트롤의 예외를 백지 매트릭스로 한정한다. 그래서 기존 디자인이 있을 때 좌표 탐색을 언제 시작하는지 지침끼리 먼저 맞춰야 한다. 대표 예시 03은 대상이 없는 경우로 한정했다.

근거: [Style systems](../../shared/stylesystems.md#draw-in-the-system-or-on-a-blank-slate), [Sweeping](../../skills/design-helper/references/sweeping.md#a-look-exists-but-the-user-wants-a-different-direction), [worker](../../skills/design-helper/worker.md#an-order-with-no-axis-in-it), [Controls](../../shared/controls.md#optional-controls-not-the-default-sheet)

### 두 속성의 조합을 함께 비교하고 확정하기

`worker.md`와 `sweeping.md`에는 두 축을 행과 열로 분리해 매트릭스로 비교하라는 설명이 있다. 테두리 두께로 행을, 밝기로 열을 나누는 비교가 그 예다.

그러나 단일 축 원칙과 컨트롤의 백지 예외 제한이 함께 존재한다. 좌표 탐색은 채팅으로 출발점을 받으며, 단일 축 선택과 달리 개별 속성 확정으로 취급하지 않는다.

비교용 두 축 매트릭스와 출발점용 매트릭스를 어떻게 구분하고, 무엇을 확정으로 기록할지 정해지기 전에는 두 축 확정의 정상 흐름으로 설명하지 않는다.

근거: [worker: Drawing specimens](../../skills/design-helper/worker.md#drawing-specimens), [Sweeping — Candidate scales](../../skills/design-helper/references/sweeping.md#candidate-scales), [worker: Reading the response](../../skills/design-helper/worker.md#reading-the-response)

## 실행 예제와 지침 사이의 차이

### 맥락과 표본 배치

검증 스크립트는 프레임 내부의 넘침과 잘림을 확인한다. 하지만 그림자처럼 요소 경계 밖으로 그려지는 효과는 사진으로 봐야 한다. 첫 맥락의 프레임 수와 사용자 창 크기도 함께 확인한다.

시트 전용 이름을 붙여 클래스와 변수 충돌을 줄였다. 전역 reset과 상속까지 완전히 격리하지는 않는다. 실제 프로젝트와 동일한 모습인지는 별도 확인이 필요하다.

근거: [Sweeping — Context](../../skills/design-helper/references/sweeping.md#context), [Sweeping: A ladder that doesn't fit](../../skills/design-helper/references/sweeping.md#a-ladder-that-doesnt-fit-isnt-a-ladder)

## 해석을 맞춰야 하는 운영 규칙

<a id="브라우저상태"></a>
### 브라우저 상태

같은 URL을 읽는 Playwright 탭과 사용자 탭은 같은 HTML을 받더라도 `sessionStorage`의 창·맥락 상태가 다를 수 있다. 그래서 다른 탭의 스크린샷만으로 사용자가 조작한 지금 상태까지 확인했다고 할 수는 없다.

근거: [Controls: Choosing in chat](../../shared/controls.md#choosing-in-chat)

<a id="일시중단"></a>
### 일시 중단과 다음 세션의 복원

`liveview.md`는 서버만 죽은 경우 같은 작업 폴더를 재사용하도록 하고, 새 세션에서는 새 폴더를 만들도록 한다. 두 설명은 상황이 다르므로 모순은 아니다. 다만 이전 세션의 메모를 찾아 다음 세션으로 가져오는 절차는 정의되어 있지 않다.

브라우저로 시트를 연 뒤 요청이 30분 동안 없으면 서버가 임시 폴더까지 삭제한다. 브라우저가 한 번도 열지 않은 시트는 4시간 뒤에 정리한다. 그 전의 서버 복구와 만료 후의 시안 재생성을 구분한다. 삭제된 시안은 복구하지 않는다. 이후에는 새 요청에 필요한 시안만 새 페이지에 그리고, 메모는 대화에 남은 확정값으로 다시 적는다.

근거: [Live view — It reaps itself](../../shared/liveview.md#it-reaps-itself), [At the end](../../shared/liveview.md#at-the-end)
