# 공통 운영과 예외 처리

[상황 목록으로](../flows.ko.md)

대표 상황에 공통으로 필요한 준비·검증·복구 절차다. 지침과 코드가 다른 부분은 [미정 사항과 구현 차이](limitations.md)에 정리했다.

## 스타일 체계에 맞춰 그리기

프로젝트의 실제 스타일 체계를 먼저 탐지한다. 기존 대상을 수정할 때는 해당 체계의 값을 사용하고, 사용자에게 `프로젝트 유틸리티`, `프로젝트 CSS 변수`, `임의값 탐색안` 중 무엇으로 그렸는지 알린다.

| 체계 | 표본을 만드는 방법 | 영향 범위를 볼 때 주의할 점 |
|---|---|---|
| Tailwind v3 | 프로젝트 config와 입력 CSS를 사용하고, 외부 시트 경로를 CLI의 content 인자로 지정한다. 결과 CSS와 워처 PID는 임시 폴더에 둔다. | 클래스 사용처와 config의 토큰을 함께 확인한다. |
| Tailwind v4 | 임시 폴더의 입력 CSS에서 프로젝트 CSS와 외부 시트 경로를 참조한다. CLI는 프로젝트 Tailwind 버전으로 고정한다. | 클래스와 `@theme` 토큰을 함께 확인한다. CLI를 구할 수 없으면 값을 읽어 CSS 변수로 그리는 대안을 사용하고 이를 알린다. |
| CSS 변수 | 토큰 파일을 연결하고 `var()`로 그린다. | 파생 토큰이 있으면 직접 사용처만 센 숫자가 전체 영향 범위가 아니다. |
| SCSS | 변수값을 읽어 시트의 CSS 변수로 옮긴다. | 실제 코드의 변경은 빌드를 거쳐야 반영된다. |
| CSS-in-JS | 테마값을 읽어 시트의 CSS 변수로 옮긴다. | `theme[key]` 같은 동적 접근은 단순 검색으로 정확히 셀 수 없다. 확인할 수 없는 수치를 표시하지 않는다. |
| 사용할 체계 없음 | 값을 직접 쓴다. | 존재하지 않는 토큰을 바꾸는 것처럼 비용칩을 표시하지 않는다. |

Tailwind 클래스는 표본의 래퍼가 아닌 실제 `.target` 노드들에 적용해야 한다. 래퍼에만 붙이면 후보별 값이 컴포넌트에 도달하지 않을 수 있다. 워처 없이 클래스만 추가하면 빌드 결과에 해당 클래스가 없을 수도 있다.

지침은 프로젝트 안에 비교용 config나 helper CSS를 만들지 않도록 한다. 기존 체계 안에서 볼지 새로운 방향을 탐색할지 불명확하면 측정 조건을 확인한다. 다만 기존 디자인의 방향 재탐색은 [지침 간 범위 차이](limitations.md#방향재탐색)가 있다.

근거: [Style systems — Detect first](../../skills/design-helper/references/stylesystems.md#detect-first), [The five forks](../../skills/design-helper/references/stylesystems.md#the-five-forks), [Feeding the controls](../../skills/design-helper/references/stylesystems.md#feeding-the-controls), [Controls — The utility fork](../../skills/design-helper/references/controls.md#the-utility-fork)

<a id="검증과발견"></a>
## 검증과 발견

표본을 추가할 때 참조한 토큰·변수·유틸리티 이름이 실제로 존재하는지 확인한다. 직접 쓴 값만 쓰는 백지 탐색에는 이름 확인을 생략한다.

Playwright를 사용할 수 있으면 브라우저가 실제 컴포넌트에 최종 적용한 스타일 값(computed style)을 후보별로 읽고, 스크린샷을 열어 배치를 살핀다. 스크린샷만으로 미세한 값 차이를 보장하지 않는다. DOM의 표본 수와 화면에 함께 보이는지도 확인한다. 도구가 없을 때는 지침상 이 두 단계를 조용히 생략하며, 완료했다고 보고하지 않는다.

검증 빈도는 `SKILL.md`와 `liveview.md`의 표현이 다르므로 [미정 사항](limitations.md#검증빈도)에 기록했다. 모션의 시간에 따른 변화는 정지 스크린샷으로 검증할 수 없다.

- 표본이 모두 같아 보이면 잘못된 이름, 래퍼에 붙은 클래스, 다른 CSS에 의한 덮어쓰기를 확인한다.
- 화면에서 실제로 깨진 부분은 비교를 방해하므로 알린다. 관찰하지 않은 색 차이나 수치를 근거처럼 만들지 않는다.
- 그 외의 발견은 한 줄로 한 번만 알린다. 주문받지 않은 새 축을 그리거나 작업을 확장하지 않는다.
- 비교가 한 화면에 들어가지 않으면 지침은 후보 수와 맥락 배치를 함께 다시 보도록 한다. 겹치는 후보를 빼거나 맥락을 분리하되, 사용자가 개수를 정했으면 그 수를 지키고 묶음을 나눈다. 가로 스크롤로 넘기지 않는다.

근거: [SKILL — Verify](../../skills/design-helper/SKILL.md#verify), [Findings](../../skills/design-helper/SKILL.md#findings), [Controls — A ladder that doesn't fit](../../skills/design-helper/references/controls.md#a-ladder-that-doesnt-fit-isnt-a-ladder)

## 서버와 새로고침

시트·서버·빌드 CSS·메모·스크린샷·PID 파일은 모두 프로젝트 밖의 한 임시 작업 폴더에 둔다. 대상이 달라지면 새 시트를 사용한다.

서버는 `127.0.0.1`에 바인딩한다. 기본 포트가 사용 중이면 다른 프로세스를 죽이지 않고 다음 포트를 찾는다. 시트의 HTML 변경을 HEAD 요청으로 감지해 새로고침하고, 새 section이 추가되면 최신 비교로 이동하도록 구성되어 있다. 범위·맥락 정보는 같은 탭의 `sessionStorage`에서 복원한다. 서로 다른 브라우저 탭의 조작 상태까지 자동 동기화하는 구현은 아니다.

시트를 수정하기 전에 서버가 살아 있는지 확인한다. 서버만 종료되고 작업 폴더가 남아 있으면 같은 폴더에서 다시 띄운다. 서버가 없는 상태로 파일만 바꿔 놓고 사용자 화면이 갱신되었다고 보고하지 않는다.

수정 시안을 제시할 때마다 비교 탭을 선택하고 브라우저 창을 앞으로 가져온다. 탭이나 브라우저가 닫혔다면 같은 세션의 시트 URL을 다시 연다. 서버만 종료되었으면 기존 작업 폴더에서 복구한다. 요청 없이 2분이 지나 폴더까지 삭제되었으면 코드와 대화 내용을 바탕으로 새 시안을 만든 뒤 연다. 기존 비교 탭이 있으면 반드시 재사용하고, 탭이 없음을 확인한 경우에만 새로 연다. 새 비교뿐 아니라 기존 구역 수정도 해당 구역으로 이동해 보여준다. 중간 파일 저장이나 대화만 하는 턴에는 포커스를 빼앗지 않는다.

자동 새로고침만으로 화면이 앞으로 왔다고 간주하지 않는다. 탭 확인이나 활성화 도구가 없으면 중복 가능성이 있는 URL 열기로 우회하지 않고 한계와 현재 URL을 알린다. 운영체제 URL 열기는 비교 탭이 없음을 확인한 경우에만 사용한다. 화면 전환을 확인할 수 없으면 확인했다고 보고하지 않는다. 자세한 절차는 [수정 시안 제시](../../skills/design-helper/references/liveview.md#present-every-revision)를 따른다.

근거: [Live view — The workspace](../../skills/design-helper/references/liveview.md#the-workspace), [Present every revision](../../skills/design-helper/references/liveview.md#present-every-revision), [Serve it](../../skills/design-helper/references/liveview.md#serve-it), [The reloader](../../skills/design-helper/references/liveview.md#the-reloader), [After every edit](../../skills/design-helper/references/liveview.md#after-every-edit)

## 도구나 기록이 동작하지 않을 때

`python3`가 없으면 지침은 `file://`로 시트를 열고, 자동 새로고침과 2분 자동 정리가 없다는 것을 한 번 알리도록 한다. 수정할 때마다 브라우저 제어로 다시 불러오거나 파일 URL을 다시 열고, 둘 다 안 되면 수동 새로고침을 부탁한다. 선택은 평소처럼 채팅으로 받는다. 워처를 백그라운드로 두지 않고, 완료 시 직접 정리한다.

선택은 채팅으로 받는다. 사용자가 조작한 창의 문자가 어떤 값을 가리키는지는 실제 사용자 탭에서 확인한다. 별도 탭의 초기값을 선택값으로 추측하지 않는다.

## 일시 중단과 종료

> 사용자: 오늘은 여기까지.

이 말만으로 코드 반영을 승인한 것으로 처리하지 않는다. 같은 임시 폴더가 남아 있을 때 서버를 복구하는 절차는 있지만, 새 세션에서 이전 결정을 자동 복원하는 절차는 없다. [일시 중단의 미정 사항](limitations.md#일시중단)을 참고한다.

사용자가 실제 코드까지 확인하고 완료를 알리면 [반영과 종료 흐름](11.md)에 따라 임시 자원을 정리한다.

아무 말 없이 탭이나 세션이 끝난 경우에는 서버의 idle 감시가 작동한다. 구현은 탭의 존재 자체가 아니라 **마지막 요청 이후 경과 시간**을 본다. 요청이 약 2분 이상 없으면 서버를 닫고 등록된 보조 프로세스에 종료 신호를 보낸 뒤 해당 세션의 임시 폴더 전체를 삭제한다. 시안·메모·스크린샷도 삭제되므로 이후에는 새로 생성해야 한다. 프로젝트 코드와 상위 폴더는 삭제하지 않는다. 따라서 새로고침 요청이 계속 들어오면 사용자가 자리를 비워도 종료되지 않는다.

SIGTERM을 전달하지 않는 래퍼를 통해 시작한 워처는 남을 수 있다. 서버 강제 종료나 충돌로 정리 코드가 실행되지 못한 경우, 파일 삭제까지 보장하지 않는다.

근거: [SKILL — Ending](../../skills/design-helper/SKILL.md#ending), [Live view — It reaps itself](../../skills/design-helper/references/liveview.md#it-reaps-itself), [At the end](../../skills/design-helper/references/liveview.md#at-the-end)
