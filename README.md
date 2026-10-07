# 오늘의 진짜 정보판 — 서울 기온

서울 고정 좌표의 MET Norway 현재 시각 예보 기온을 실제 조회하고 Cloudflare D1에 저장합니다. 실제 개인정보를 수집하지 않으며 원천 API 키가 필요하지 않습니다.

## 실행
Node.js 22.13 이상에서 `npm ci`, `npm run db:generate` (새 스키마가 있는 경우만), `npm run build`를 실행합니다. 로컬 DB에는 README의 Sites starter 안내에 따라 drizzle SQL을 적용하고 `npm start`로 실행합니다. 기존 생성 migration은 다시 생성할 필요가 없습니다.

## 검증
`node scripts/check-board.mjs`, `npx tsc --noEmit`, `npm run build`.
공식 패키지의 SHA-256 검증, 하루 한 행과 ID 유지, 다섯 오류 뒤 105 보존, 복구 후 120 / 2행 / 변화 15, 재시도 중복 방지, KST 자정을 검사합니다.

## 구조
`lib/board-engine.mjs`는 공식 참조 adapter를 ES module로 옮긴 공통 성공/오류 상태 처리입니다. 원본은 `public/assets/t04/`에 그대로 보존합니다. 실제 조회도 공통 정규화 검증·상태 계산을 사용하고 DB의 단일 일별 키와 원자적 batch로 저장합니다. 실패는 일별 성공 행을 수정하지 않습니다. 별도 evidence 테이블은 갱신 전 성공 응답도 보존합니다.
실패 시험은 메모리의 별도 합성 상태에만 적용됩니다. 초기화 버튼은 실제 DB를 수정하지 않습니다.

## 실제 이틀과 플랫폼 영수증
실제 서로 다른 KST 날짜에서 조회해야 합니다. 앱 보존 JSON은 플랫폼의 봉인 `t04_day` 영수증이 아닙니다. 제출 플랫폼에서 정확히 두 영수증을 발급받고 값·출처·원천시각·단위를 보존된 조회 이력과 대조해야 합니다.
앱 자체가 영수증 발급이나 사용자 이름으로 제출을 수행하지 않습니다.

## 소스 전달
`node scripts/export-source.mjs`는 현재 Git commit의 전체 소스를 ZIP으로 공개합니다. ZIP URL에 40자리 commit 식별자가 들어가며 공개 사이트에서 인증 없이 받을 수 있습니다. 생성물은 Git에 재귀적으로 포함하지 않습니다.

## 데이터 원천
https://api.met.no/weatherapi/locationforecast/2.0/documentation

배포 서버에서 Open-Meteo가 429를 반환하여 MET Norway로 변경했습니다. 가장 가까운 예보 시각(최대 3시간 이내)의 air_temperature를 사용하고 celsius를 °C로 정규화합니다. 예보 데이터임을 화면에 표시합니다.
