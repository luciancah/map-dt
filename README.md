## 기능

- 배경 지도 이미지 업로드
- 지도 캔버스에서 사각형 및 폴리곤 그리기와 편집
- 사각형 레이어를 폴리곤으로 변환
- 레이어 선택, 이름 변경, 표시/숨김, 순서 변경, 삭제
- 픽셀-실제거리 대응을 위한 스케일 패널
- 레이어 색상/투명도 렌더링 지원
- 편집 모드(`select`, `rectangle`, `polygon`) 및 마우스 오버 위치별 커서 동작

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui 기반 UI 컴포넌트
- Vitest + Testing Library

## 프로젝트 구조

- `src/app/page.tsx`: 페이지 구성 및 상태 오케스트레이션
- `src/components/MapCanvas.tsx`: 캔버스 렌더링 및 상호작용
- `src/components/LayerListPanel.tsx`: 레이어 목록 패널
- `src/components/ScalePanel.tsx`: 해상도/그리드 설정 패널
- `src/hooks/useMapImageUploader.ts`: 지도 업로드 처리
- `src/hooks/useMapScale.ts`: 축척 상태 및 계산 로직
- `src/hooks/useRectLayerEditor.ts`: 편집기 핵심 상태/상호작용 로직
- `src/lib/map-editor/*`: 기하 계산, 축척 계산, 색상 처리, 편집 규칙
- `src/test/setup.ts`: Vitest 환경 셋업
- `vitest.config.ts`: 테스트 실행기 설정

## 로컬 실행 준비

```bash
cd /path/to/pg-map-twin
npm install
```

## 개발

```bash
npm run dev
```

브라우저에서 <http://localhost:3000>에 접속합니다.

## 빌드

```bash
npm run build
```

## 테스트

```bash
npm run test
```

CI 모드로 한 번만 실행하려면:

```bash
npm run test:run
```

## 동작 기준

- 지도 이미지의 원본 크기를 유지한 채, 화면에 맞춰 표시 크기만 축소/확대해 사용합니다.
- 기하 계산은 지도 좌표계를 기준으로 수행되며 경계 범위를 벗어나지 않도록 제한됩니다.
- 핵심 편집 기능은 별도 백엔드 없이 동작합니다.

## 스크립트

- `npm run dev`: Next.js 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: ESLint 실행
- `npm run test`: Vitest 실행(감시 모드)
- `npm run test:run`: Vitest 단일 실행
