# Vietnam Economy / BCG News

매일 아침 베트남 경제정책·금융시장·BCG 공식공시를 확인하고, Hanwha의 SSSG 지분매각대금 회수 리스크에 영향을 줄 수 있는 이슈를 빠르게 선별하기 위한 내부 모니터링 대시보드입니다.

## SNS 혼합형 모니터링 구조

- YouTube: YouTube Data API로 최근 30일 영상 메타데이터를 자동수집하고 OpenAI로 제목을 한글 번역·설명을 한글 요약한 뒤 `Data → YouTube` 카테고리에 일반 기사 카드와 같은 방식으로 표시
- Facebook: 지정 페이지 링크를 표시하고, Meta 승인 토큰과 Page ID가 있으면 게시물을 자동수집
- TikTok: 베트남어 위험 키워드 검색 바로가기
- X: API 비용 없이 기자·금융 전문가·해외 투자자의 최신 공개 게시글 검색 바로가기 제공

### API 상세 오류 표시

YouTube·Facebook API가 실패하면 HTTP 상태와 각 플랫폼이 반환한 상세 메시지를 `data/sns.json`과 GitHub Actions 실행 로그에 기록합니다. Secret 값은 오류 메시지에서 `[REDACTED]`로 마스킹합니다. API 키 앞뒤 공백과 따옴표도 자동 제거합니다. X API는 호출하지 않으므로 요금과 402 오류가 발생하지 않습니다.

### GitHub Secrets 설정

GitHub 저장소의 `Settings → Secrets and variables → Actions → New repository secret`에서 설정합니다.

| Secret | 필수 여부 | 내용 |
|---|---|---|
| `YOUTUBE_API_KEY` | YouTube 자동수집에 필요 | Google Cloud에서 YouTube Data API v3를 활성화한 뒤 발급한 API 키 |
| `OPENAI_API_KEY` | 기사·YouTube 한글 번역 및 요약에 필요 | OpenAI API 키 |
| `FACEBOOK_ACCESS_TOKEN` | Facebook API 수집 시 필요 | Meta 앱 심사와 Page Public Content Access를 거친 서버용 토큰 |
| `FACEBOOK_PAGES_JSON` | Facebook API 수집 시 필요 | 승인된 페이지의 이름·URL·Page ID 배열 |

`FACEBOOK_PAGES_JSON` 예시:

```json
[
  {"name":"BCG Land","url":"https://www.facebook.com/example","pageId":"123456789"},
  {"name":"King Crown Thao Dien","url":"https://www.facebook.com/example2","pageId":"987654321"}
]
```

토큰과 API 키는 `app.js` 또는 저장소 파일에 직접 작성하지 않습니다.

### 로컬 테스트

API 키 없이도 오류 없이 `data/sns.json`을 생성할 수 있습니다.

```powershell
npm install
npm run fetch:sns
python -m http.server 8000
```

YouTube API를 포함해 테스트하려면 PowerShell에서 다음과 같이 실행합니다.

```powershell
$env:YOUTUBE_API_KEY="발급받은_API_키"
npm run fetch:sns
```

X는 별도 Token 없이 대시보드의 `X 최신 게시글 검색` 버튼으로 확인합니다.

## SNS 모니터 위치 변경

`Local SNS Monitor` 영역은 기사·공시 목록 다음, 메인 콘텐츠의 마지막 순서로 표시됩니다.

`Hybrid Collection` 전용 영역은 제거했습니다. YouTube 자동수집 영상은 `data/sns.json`에서 읽어 표준 데이터 형식으로 변환한 뒤 기사·공시 목록에 병합합니다. 기간·카테고리·중요도·출처·검색 필터가 다른 Data 항목과 동일하게 적용됩니다.

YouTube 한글 요약은 YouTube Data API가 제공하는 제목과 영상 설명을 기준으로 생성합니다. 영상 음성이나 전체 자막을 분석한 결과가 아닙니다. OpenAI 처리에 실패한 항목은 한글 안내 문구를 표시하고 `translation_status`와 오류 사유를 `data/sns.json`에 기록합니다.

동화·왕관 이야기·박물관·해외 동명 부동산처럼 King Crown·BCG와 무관한 것으로 확인된 YouTube 채널은 `scripts/sns-sources.js`의 `YOUTUBE_EXCLUDED_CHANNELS`에서 관리합니다. 제외 채널 영상은 번역 전에 차단되며, 과거 수집 파일에 남은 항목도 대시보드에서 표시하지 않습니다.

채널명 비교 시 악센트, 대소문자, 숨은 문자, 특수문자와 연속 공백을 정규화합니다. 특정 오탐 영상은 `YOUTUBE_EXCLUDED_TITLE_PATTERNS`의 원제 패턴으로도 이중 차단합니다.

## SNS 리스크 모니터링

- Facebook: 주민·중개업자·부동산 리뷰·투자자 게시물의 주 모니터링 채널
- TikTok·YouTube: 현장 영상과 장문 분석을 교차 검증하는 보조 채널
- X: 기자·금융 및 기업 전문가·해외 투자자의 영문·베트남어 공개 게시글 보완 채널
- 베트남어 위험 키워드 프리셋과 플랫폼별 공개 검색 바로가기 제공

SNS 게시물은 조기경보 신호로만 취급하고 회사 공시, 거래소, 감독기관, 현지 언론 및 원문서로 교차 검증합니다. 비공개 그룹을 수집하거나 플랫폼의 로그인·API 제한을 우회하지 않습니다.


## 이번 수정 내용

- 기사·YouTube 카드에 `제외` 버튼을 추가했습니다. 제외 즉시 현재 브라우저의 `localStorage`에서 숨기며 `제외 관리`에서 복원할 수 있습니다.
- `즉시 제외 + GitHub 요청`은 토큰을 노출하지 않고 사전 작성된 GitHub Issue 화면을 엽니다. Issue를 제출하면 Actions가 자동 실행되어 다음 배포부터 모든 기기에서 제외됩니다.
- 열린 `[모니터링 제외]` Issue 중 저장소 소유자·협업자가 작성한 요청만 신뢰합니다. Issue를 닫으면 다음 Actions 배포에서 다시 포함됩니다.
- 영구 규칙은 기사 URL, YouTube 영상 ID, 출처, YouTube 채널, 키워드 범위를 지원하며 번역·요약 전에 적용됩니다.
- `#top` 주소로 직접 접속해도 sticky 헤더가 Hero 제목을 가리지 않도록 앵커 여백과 초기 스크롤 위치를 보정했습니다.
- 상단 바로가기·내비게이션·기간·필터·SNS 검색 버튼에 브랜드 색상, 테두리, 그림자와 키보드 포커스 표시를 강화했습니다.
- 대시보드 제목을 `Vietnam Economy / BCG News`로 변경했습니다.
- 상단 브랜드 로고를 텍스트 `H`에서 한화 트라이써클 형태의 SVG 마크로 변경했습니다.

## 모니터링 제외 기능 설정

1. GitHub 저장소의 `Settings → General → Features`에서 `Issues`를 활성화합니다.
2. 대시보드 카드의 `제외`를 누르고 제외 범위를 선택합니다.
3. `즉시 제외 + GitHub 요청`을 누르면 해당 브라우저에서는 바로 사라지고 GitHub Issue 작성 화면이 열립니다.
4. GitHub에서 `Submit new issue`를 눌러야 영구 제외 요청이 완료됩니다.
5. 제외 Issue가 등록되거나 닫히면 GitHub Actions가 자동으로 다시 배포합니다.

관리자가 코드로 직접 제외하려면 `data/exclusions.manual.json`의 `rules`에 규칙을 추가할 수 있습니다. 자동 동기화 결과는 `data/exclusions.json`에 생성됩니다. 웹페이지 코드에는 GitHub PAT나 API 토큰을 넣지 마십시오.
- 외부 이미지 파일 없이 `index.html`과 `style.css`만으로 로고가 표시되도록 구성했습니다.

## 이번 버전의 변경 방향

- 화면을 단순화하고 가독성을 높였습니다.
- 상단 Hero 영역을 축소하고 제목·목적·최근 업데이트만 표시합니다.
- Today Brief 섹션을 제거하고, BCG 관련 주요 리스크는 BCG Risk Alert에서 확인하도록 단순화했습니다.
- BCG Risk Alert는 선택 기간 내 고위험 신호만 별도로 표시합니다.
- 기사 카드는 큰 숫자 점수를 제거하고, 중요도·출처·리스크 등급 중심으로 표시합니다.
- BCG 공식공시, BCG 관련 자료, 일반 경제뉴스를 시각적으로 구분합니다.
- 일간 24시간 / 주간 7일 / 월간 30일 필터는 실제 게시일 기준으로 적용합니다.

## 적용 파일

```text
index.html
style.css
app.js
README.md
.github/workflows/update-news.yml
```

## GitHub 업로드

```powershell
git status
git add index.html style.css app.js README.md .github/workflows/update-news.yml
git commit -m "Simplify dashboard layout for readability"
git push
```

`fetch first` 오류가 나오면 아래 순서로 처리하세요.

```powershell
git stash push -u -m "backup before pull"
git pull --rebase origin main
git stash pop
git add index.html style.css app.js README.md .github/workflows/update-news.yml
git commit -m "Simplify dashboard layout for readability"
git push
```

## GitHub Actions

- 매일 오전 7시 KST 1회 실행
- 최근 30일 데이터 수집
- 최대 100개 표시
- GitHub Pages 배포


## Layout update

- 기간 선택 버튼은 BCG Risk Alert 섹션 위에 배치됩니다.
- 일간 베스트 / 주간 베스트 / 월간 추세 선택값은 BCG Risk Alert와 기사·공시 목록에 동시에 적용됩니다.


## Latest UI update

- Dashboard title changed to `Vietnam Economy / BCG News` and displayed on one line in the hero area.
- Header logo replaced with the attached Hanwha tri-circle image file at `assets/hanwha-tricircle.png`.


## Latest UI update - Today Brief removed

- Today Brief box has been removed from the dashboard.
- Header navigation no longer includes the Today Brief anchor.
- BCG official disclosures and recovery risk signals are handled through the BCG Risk Alert and article/disclosure list sections.


## Layout update

The summary metrics cards (전체 / 일간 / 주간 / 월간 / 긴급 / BCG) are placed below the source criteria section.
