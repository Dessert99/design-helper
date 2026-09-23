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

근거: [Style systems — Detect first](../../references/stylesystems.md#detect-first), [The five forks](../../references/stylesystems.md#the-five-forks), [Feeding the controls](../../references/stylesystems.md#feeding-the-controls), [Controls — The utility fork](../../references/controls.md#the-utility-fork)

<a id="검증과발견"></a>
## 검증과 발견

표본을 추가할 때 참조한 토큰·변수·유틸리티 이름이 실제로 존재하는지 확인한다. 직접 쓴 값만 쓰는 백지 탐색에는 이름 확인을 생략한다.

Playwright를 사용할 수 있으면 브라우저가 실제 컴포넌트에 최종 적용한 스타일 값(computed style)을 후보별로 읽고, 스크린샷을 열어 배치를 살핀다. 스크린샷만으로 미세한 값 차이를 보장하지 않는다. DOM의 표본 수와 화면에 함께 보이는지도 확인한다. 도구가 없을 때는 지침상 이 두 단계를 조용히 생략하며, 완료했다고 보고하지 않는다.

검증 빈도는 `SKILL.md`와 `liveview.md`의 표현이 다르므로 [미정 사항](limitations.md#검증빈도)에 기록했다. 모션의 시간에 따른 변화는 정지 스크린샷으로 검증할 수 없다.

- 표본이 모두 같아 보이면 잘못된 이름, 래퍼에 붙은 클래스, 다른 CSS에 의한 덮어쓰기를 확인한다.
- 화면에서 실제로 깨진 부분은 비교를 방해하므로 알린다. 관찰하지 않은 색 차이나 수치를 근거처럼 만들지 않는다.
- 그 외의 발견은 한 줄로 한 번만 알린다. 주문받지 않은 새 축을 그리거나 작업을 확장하지 않는다.
- 비교가 가로로 넘치면 지침은 후보 수를 줄이기보다 배경·반복·크기 맥락을 분리하도록 한다. 기본 CSS만으로 가로 넘침이 방지되는 것은 아니다.

근거: [SKILL — Verify](../../SKILL.md#verify), [Findings](../../SKILL.md#findings), [Controls — A ladder that doesn't fit](../../references/controls.md#a-ladder-that-doesnt-fit-isnt-a-ladder)

## 서버와 새로고침

시트·서버·빌드 CSS·메모·`state.jsonl`·스크린샷·PID 파일은 모두 프로젝트 밖의 한 임시 작업 폴더에 둔다. 대상이 달라지면 새 시트를 사용한다.

서버는 `127.0.0.1`에 바인딩한다. 기본 포트가 사용 중이면 다른 프로세스를 죽이지 않고 다음 포트를 찾는다. 시트의 HTML 변경을 HEAD 요청으로 감지해 새로고침하고, 새 section이 추가되면 최신 비교로 이동하도록 구성되어 있다. 범위·맥락·핀 정보는 같은 탭의 `sessionStorage`에서 복원한다. 서로 다른 브라우저 탭의 조작 상태까지 자동 동기화하는 구현은 아니다.

시트를 수정하기 전에 서버가 살아 있는지 확인한다. 서버만 종료되고 작업 폴더가 남아 있으면 같은 폴더에서 다시 띄운다. 서버가 없는 상태로 파일만 바꿔 놓고 사용자 화면이 갱신되었다고 보고하지 않는다.

근거: [Live view — The workspace](../../references/liveview.md#the-workspace), [Serve it](../../references/liveview.md#serve-it), [The reloader](../../references/liveview.md#the-reloader), [After every edit](../../references/liveview.md#after-every-edit)

## 도구나 기록이 동작하지 않을 때

`python3`가 없으면 지침은 `file://`로 시트를 열고 수동 새로고침임을 한 번 알리도록 한다. 이 경우 자동 새로고침과 서버에 선택 기록하기는 사용할 수 없으며, 선택은 채팅으로 받는다. 서버의 자동 정리도 없으므로 워처를 백그라운드로 두지 않고 수정 때마다 빌드한다.

확정 버튼의 POST가 실패하면 `기록 실패 — 채팅으로 알려주세요`를 표시한다. 서버 파일에서 기록을 확인하거나 채팅으로 선택을 받아야 한다. 이미 처리한 기록을 다시 확정하거나, 새 기록이 없다는 이유로 승인으로 간주하지 않는다. 현재 엔진은 POST 성공 전에 표본의 선택 강조를 바꾸므로, 강조 표시만으로 기록 성공을 판단하지 않는다.

근거: [Live view — No python3](../../references/liveview.md#no-python3), [It reaps itself](../../references/liveview.md#it-reaps-itself), [Controls — Recording a choice](../../references/controls.md#recording-a-choice), [The engine](../../references/controls.md#the-engine)

## 일시 중단과 종료

> 사용자: 오늘은 여기까지.

이 말만으로 코드 반영을 승인한 것으로 처리하지 않는다. 같은 임시 폴더가 남아 있을 때 서버를 복구하는 절차는 있지만, 새 세션에서 이전 결정을 자동 복원하는 절차는 없다. [일시 중단의 미정 사항](limitations.md#일시중단)을 참고한다.

사용자가 실제 코드까지 확인하고 완료를 알리면 [반영과 종료 흐름](11.md)에 따라 임시 자원을 정리한다.

아무 말 없이 탭이나 세션이 끝난 경우에는 서버의 idle 감시가 작동한다. 구현은 탭의 존재 자체가 아니라 **마지막 요청 이후 경과 시간**을 본다. 요청이 약 10분 이상 없으면 PID 파일의 프로세스에 종료 신호를 보내고 서버도 종료한다. 파일은 남겨 메모가 바로 지워지는 것을 피한다. 따라서 새로고침 요청이 계속 들어오면 사용자가 자리를 비워도 종료되지 않는다.

SIGTERM을 전달하지 않는 래퍼를 통해 시작한 워처는 남을 수 있다. 임시 폴더의 장기 보존이나 OS의 구체적인 삭제 시점도 이 스킬이 보장하지 않는다.

근거: [SKILL — Ending](../../SKILL.md#ending), [Live view — It reaps itself](../../references/liveview.md#it-reaps-itself), [At the end](../../references/liveview.md#at-the-end)
