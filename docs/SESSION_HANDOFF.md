# SESSION HANDOFF — GA Portal

> **작성일**: 2026-03-17
> **프로젝트 경로**: `E:/GA_World/genral-affair-dash`
> **다음 세션 시작 명령**: "SESSION_HANDOFF.md 읽고 이어서 작업해줘"

---

## 현재 상태 (이번 세션 완료 범위)

### ✅ Phase 1 완료: Foundation 레이어

| 파일 | 설명 |
|------|------|
| `src/types/database.ts` | 전체 DB 타입 정의 (User, Complaint, Asset, EquipmentRequest, TemperatureReading/Complaint, FoundItem, LostItem, Parcel, FacilityRequest, Notification, Announcement) |
| `src/lib/supabase/server.ts` | Supabase SSR 서버 클라이언트 (`@supabase/ssr` 기반) |
| `src/lib/supabase/client.ts` | Supabase 브라우저 클라이언트 |
| `src/lib/utils.ts` | `cn()` + `formatDate()` + `formatDateTime()` + `formatRelativeTime()` |
| `src/middleware.ts` | 인증 가드 — 미인증 시 `/login` 리다이렉트 |
| `src/app/layout.tsx` | 루트 레이아웃 (Pretendard CDN, Sonner Toaster) |
| `src/app/globals.css` | Pretendard CDN import + CSS 변수 (blue-600 primary) |
| `src/app/page.tsx` | `/dashboard`로 리다이렉트 |
| `src/app/(auth)/layout.tsx` | 인증 페이지 공통 레이아웃 |
| `src/app/(auth)/login/page.tsx` | 한국어 로그인 페이지 (Supabase Auth) |
| `src/app/auth/callback/route.ts` | OAuth 코드 교환 핸들러 |
| `src/app/(dashboard)/layout.tsx` | 대시보드 공통 레이아웃 (Sidebar + main) |
| `src/app/(dashboard)/dashboard/page.tsx` | 사용자 대시보드 (`/dashboard`) |
| `src/app/(dashboard)/admin/layout.tsx` | 관리자 라우트 가드 (operator/admin만 허용) |
| `src/components/layout/sidebar.tsx` | 좌측 사이드바 (역할별 네비게이션 + 로그아웃) |
| `src/components/ui/` (15개) | button, card, badge, input, label, textarea, select, dialog, table, tabs, separator, avatar, dropdown-menu, sheet, skeleton |
| `src/shared/constants/strings.ts` | 전체 한국어 UI 문자열 (i18n-ready) |
| `.env.example` | 환경변수 템플릿 |

---

## ❌ Phase 2 미완료: 모듈 구현 (다음 세션 할 일)

각 모듈은 `src/modules/[name]/` 에 액션 + 컴포넌트를 구현해야 함.

### 구현 순서 (병렬로 10개 에이전트 실행 권장)

| # | 모듈 | 사용자 라우트 | 관리자 라우트 | 우선순위 |
|---|------|-------------|-------------|---------|
| A2 | **auth** | - | - | P0 — actions.ts만 (login/logout 이미 완료됨) |
| A3 | **dashboard** | `/dashboard` | `/admin` | P0 — 운영자 대시보드 (`src/app/(dashboard)/admin/page.tsx`) |
| A4 | **lost-found** | `/lost-found` | `/admin/lost-found` | P0 |
| A5 | **equipment** | `/equipment` | `/admin/equipment` | P0 |
| A6 | **temperature** | `/temperature` | `/admin/temperature` | P0 |
| A7 | **complaint** | `/complaint` | `/admin/complaint` | P0 |
| A8 | **parcel** | `/parcel` | `/admin/parcel` | P1 |
| A9 | **facility** | `/facility` | `/admin/facility` | P1 |
| A10 | **notification** | `/notifications` | - | P1 |

---

## 다음 세션 시작 프롬프트

아래를 그대로 붙여넣기:

```
SESSION_HANDOFF.md 읽었어. Phase 2 모듈 구현 시작해줘.
10개 에이전트 병렬로 실행해서 다음을 구현해:

1. 운영자 대시보드 (src/app/(dashboard)/admin/page.tsx)
2. 분실물 모듈 (user: /lost-found, admin: /admin/lost-found)
3. 전산장비 모듈 (user: /equipment, admin: /admin/equipment)
4. 온도 민원 모듈 (user: /temperature, admin: /admin/temperature)
5. 불편사항 모듈 (user: /complaint, admin: /admin/complaint)
6. 택배 모듈 (user: /parcel, admin: /admin/parcel)
7. 시설 수리 모듈 (user: /facility, admin: /admin/facility)
8. 알림 모듈 (user: /notifications)
9. 빌드 검증 (pnpm build)
10. Preview 서버 실행 및 UI 스크린샷 확인
```

---

## 아키텍처 규칙 (에이전트에게 전달할 것)

```
프로젝트: E:/GA_World/genral-affair-dash
프레임워크: Next.js 16 App Router + TypeScript strict
DB: Supabase (PostgreSQL + RLS)
스타일: Tailwind CSS v4 + shadcn/ui (blue-600 primary)
폰트: Pretendard (CDN)
언어: 한국어 UI
디자인: Modern Minimal (Linear 스타일)

공통 임포트:
- 타입: import type { User, Complaint, ... } from '@/types/database'
- Supabase 서버: import { createClient } from '@/lib/supabase/server'
- Supabase 클라이언트: import { createClient } from '@/lib/supabase/client'
- UI: import { Button } from '@/components/ui/button' (등등)
- 유틸: import { cn, formatDate, formatRelativeTime } from '@/lib/utils'
- 상수: import { STRINGS } from '@/shared/constants/strings'
```

---

## 각 모듈 구현 스펙

### 각 모듈 공통 구조
```
src/modules/[name]/
├── actions.ts         # Server Actions (Supabase 쿼리)
└── components/
    ├── [name]-form.tsx      # 사용자 신청 폼
    ├── [name]-list.tsx      # 목록 조회
    └── [name]-detail.tsx    # 상세 보기 (선택)

src/app/(dashboard)/[name]/
└── page.tsx           # 사용자 페이지

src/app/(dashboard)/admin/[name]/
└── page.tsx           # 운영자 관리 페이지
```

### A3: 운영자 대시보드 (`/admin`)
`src/app/(dashboard)/admin/page.tsx`
- 4개 KPI 카드: 미처리 요청 수 / 처리중 / 완료(오늘) / SLA 준수율
- 긴급 요청 목록 (urgency=urgent인 미처리 요청)
- 카테고리별 트렌드 (Recharts BarChart, 최근 7일)
- 담당자별 업무 현황 테이블
- 사용 쿼리: complaints + equipment_requests + facility_requests + lost_items 합산

### A4: 분실물 모듈
**사용자** (`/lost-found`):
- 탭: 분실 신고 / 습득물 신고 / 내 신고 이력
- 분실 신고 폼: item_name, category, lost_floor(1~41), lost_location, description
- 습득물 신고 폼: item_name, category, found_floor, found_location, storage_location
- 내 신고 이력: lost_items + found_items 목록, 상태 배지

**운영자** (`/admin/lost-found`):
- 전체 lost_items + found_items 목록 (필터: 층/상태/카테고리)
- 매칭 처리 버튼 (lost_items.status = 'matched', matched_found_id 설정)
- 층별 현황 보드: 1~41층 세로 바, 층별 신고 건수 색상 강도

### A5: 전산장비 모듈
**사용자** (`/equipment`):
- 요청 유형 선택: 점검/교체/구매/SW구입/네트워크점검
- 요청 폼: title, description, urgency, floor
- 내 요청 이력 목록

**운영자** (`/admin/equipment`):
- 요청 대기열 테이블 (필터: 유형/상태/긴급도)
- 상태 변경 드롭다운
- 담당자 배정
- 자산 DB 탭: assets 테이블 목록

### A6: 온도 민원 모듈
**사용자** (`/temperature`):
- 내 층 현재 온도 표시 (temperature_readings에서 최신값)
- 민원 버튼: "덥다 🥵" / "춥다 🥶" (원터치 등록)
- 내 민원 이력

**운영자** (`/admin/temperature`):
- 41층 히트맵 (floor 1~41, 색상: 파랑=춥다 민원 많음, 빨강=덥다 민원 많음)
- 층별 클릭 → 해당 층 민원 목록
- 목표 온도 입력 폼 (temperature_readings INSERT)

### A7: 불편사항 모듈
**사용자** (`/complaint`):
- 건의 폼: category, title, description, is_anonymous 체크박스
- 내 건의 이력: 상태 + 운영자 답변 표시

**운영자** (`/admin/complaint`):
- 전체 건의 목록 (카테고리/상태 필터)
- 건의 상세: 답변 작성 폼, 상태 변경
- 담당자 배정

### A8: 택배 모듈
**사용자** (`/parcel`):
- 내 미수령 택배 카드 목록 (status=stored/notified)
- 수령 확인 버튼 → status='claimed'
- 수령 이력

**운영자** (`/admin/parcel`):
- 택배 입고 등록 폼: recipient_name, carrier, tracking_number, storage_location
- 보관중 택배 목록
- 알림 발송 버튼 (status → notified)
- 미수령 독촉 (reminder_count 증가)

### A9: 시설 수리 모듈
**사용자** (`/facility`):
- 수리 요청 폼: category, floor, location_detail, description, urgency
- 내 요청 이력

**운영자** (`/admin/facility`):
- 수리 요청 대기열
- 외주 배정 (vendor 필드 입력)
- 상태 변경

### A10: 알림 모듈
**공통** (`/notifications`):
- 전체 알림 목록 (최신순)
- 읽음 처리 버튼
- 유형별 아이콘 (택배/요청/온도/건의)

**Sidebar 알림 벨**:
- `src/components/layout/notification-bell.tsx` (client component)
- 미읽음 뱃지 숫자 표시
- 드롭다운으로 최근 5개 표시

---

## 빌드 검증 명령

```bash
cd E:/GA_World/genral-affair-dash
npm run build
# 또는
npx tsc --noEmit  # 타입 체크만
```

---

## 환경변수 설정 안내

`.env.local` 파일 필요 (`.env.example` 참고):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Supabase 프로젝트:
1. supabase.com 접속
2. 새 프로젝트 생성
3. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
4. Project Settings > API에서 URL + anon key 복사

---

## 알려진 이슈 / 주의사항

1. **Radix UI 패키지**: `package.json`에 `@radix-ui/react-dialog`와 `@radix-ui/react-popover`만 있음. 다른 Radix 패키지 필요 시 설치 필요:
   ```bash
   npm install @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-separator @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area
   ```
   또는 현재 `src/components/ui/`의 커스텀 구현(Radix 없이 순수 React state) 사용 유지

2. **Pretendard 폰트**: CDN 방식 사용 중. 오프라인 환경이면 `Apple SD Gothic Neo`, `Malgun Gothic`으로 폴백됨

3. **users 테이블**: Supabase Auth와 별도. 회원가입 시 `auth.users` → `public.users` 연동 트리거가 없음. 로그인 후 profile 없으면 기본값(employee role)으로 처리됨. 프로덕션 전에 트리거 추가 권장

4. **RLS**: 모든 테이블에 RLS 적용됨. 개발 중 Supabase Dashboard에서 RLS 임시 비활성화 가능

---

*Next session: Phase 2 모듈 구현 (9개 에이전트 병렬)*
