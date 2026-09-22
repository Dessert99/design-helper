# design-helper

[English](README.md) | [한국어](README.ko.md)

> CSS 값·레이아웃·모션을 글이 아니라 눈으로 정하는 Claude Code 스킬

<!-- 표본 시트 스크린샷 자리 -->

## 왜 필요한가요?

<!-- 채팅창에서 "12px 이 나을까요 16px 이 나을까요" 는 답할 수 없는 질문이라는 것 -->

- ex) 이 컴포넌트의 테두리 변화를 빠르게 보고 싶다.
- ex) 이 페이지의 기본 레이아웃을 정하고 싶아.


## 하는 일

<!-- 설명 대신 한 사이클 트레이스 -->

### 작업 단위 하나

<!-- 주문 하나 = 축 하나 = 사다리 하나 = 결정 하나, 그리고 멈춤 -->
<!-- 단계 목록도 계획도 없음 — 다음에 뭘 볼지는 항상 사용자가 정함 -->

### 안 하는 것

<!-- 디자인을 창작하지 않음 · 작업 계획을 대신 세우지 않음 · 동작의 정확성은 검증 못 함(포커스 트랩·키보드·스크린리더) -->
<!-- 스크린샷은 정지 상태만 — 모션은 사용자 눈에 의존 -->

## 결과물

<!-- HTML 표본 시트는 일회용, 진짜 결과물은 반영된 코드 -->

## 설치

아무 데나 clone 한 뒤, 쓰는 에이전트의 스킬 디렉토리에 심링크를 겁니다. 심링크는
복사본이 아니라 원본을 가리키는 포인터라서, clone 을 고치면 바로 반영되고 따로
동기화할 사본이 생기지 않습니다.

```sh
git clone https://github.com/Dessert99/design-helper.git ~/skills/design-helper

ln -sfn ~/skills/design-helper ~/.claude/skills/design-helper   # Claude Code
ln -sfn ~/skills/design-helper ~/.codex/skills/design-helper    # Codex
```

두 에이전트가 읽는 방식은 같습니다. `SKILL.md` 의 `description` 은 세션이 시작할 때
읽고, 본문과 `references/` 는 스킬이 실제로 동작할 때 읽습니다. 그래서 본문 수정은
곧바로 적용되고, `description` 을 고쳤을 때만 세션을 새로 시작하면 됩니다.

지우려면 심링크만 지우면 됩니다 — `rm ~/.claude/skills/design-helper`. clone 은
그대로 남습니다.

### 언어 설정

<!-- 지시문은 영어, 답변과 화면 문자열은 전부 한국어 -->
<!-- 바꾸려면 SKILL.md 의 ## Language 섹션을 고침 -->

## 문서

<!-- SKILL.md + references/{sweeping,controls,stylesystems,motion,liveview}.md -->

## 라이선스
