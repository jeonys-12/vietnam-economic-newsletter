# Vietnam Economy / BCG News

매일 아침 베트남 경제정책·금융시장·BCG 공식공시를 확인하고, Hanwha의 SSSG 지분매각대금 회수 리스크에 영향을 줄 수 있는 이슈를 빠르게 선별하기 위한 내부 모니터링 대시보드입니다.

## SNS 혼합형 모니터링 구조

- YouTube: YouTube Data API로 최근 30일 영상을 GitHub Actions에서 자동수집
- Facebook: 지정 페이지 링크를 표시하고, Meta 승인 토큰과 Page ID가 있으면 게시물을 자동수집
- TikTok: 베트남어 위험 키워드 검색 바로가기
- Zalo: 현지 제보를 브라우저 localStorage에 저장하고 JSON으로 내보내기

### API 상세 오류 표시

YouTube·Facebook API가 실패하면 HTTP 상태뿐 아니라 Google/Meta가 반환한 `reason`과 `message`를 `data/sns.json` 및 대시보드 상태 카드에 표시합니다. Secret 값은 오류 메시지에서 `[REDACTED]`로 마스킹합니다. API 키 앞뒤 공백과 따옴표도 자동 제거합니다.

### GitHub Secrets 설정

GitHub 저장소의 `Settings → Secrets and variables → Actions → New repository secret`에서 설정합니다.

| Secret | 필수 여부 | 내용 |
|---|---|---|
| `YOUTUBE_API_KEY` | YouTube 자동수집에 필요 | Google Cloud에서 YouTube Data API v3를 활성화한 뒤 발급한 API 키 |
| `FACEBOOK_ACCESS_TOKEN` | Facebook API 수집 시 필요 | Meta 앱 심사와 Page Public Content Access를 거친 서버용 토큰 |
| `FACEBOOK_PAGES_JSON` | Facebook API 수집 시 필요 | 승인된 페이지의 이름·URL·Page ID 배열 |

`FACEBOOK_PAGES_JSON` 예시:

```json
[
  {"name":"BCG Land","url":"https://www.facebook.com/example","pageId":"123456789"},
  {"name":"King Crown Thao Dien","url":"https://www.facebook.com/example2","pageId":"987654321"}
]
```

토큰과 API 키는 `app.js`, `sns-app.js` 또는 저장소 파일에 직접 작성하지 않습니다.

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

Zalo 현지 제보는 현재 사용 중인 브라우저에만 저장됩니다. 여러 직원이 함께 사용하려면 향후 Google Forms/Sheets, Microsoft Forms/SharePoint 또는 별도 서버 API 연결이 필요합니다.

## SNS 모니터 위치 변경

`Local SNS Monitor` 영역은 기사·공시 목록 다음, 메인 콘텐츠의 마지막 순서로 표시됩니다.

## SNS 리스크 모니터링

- Facebook: 주민·중개업자·부동산 리뷰·투자자 게시물의 주 모니터링 채널
- TikTok·YouTube: 현장 영상과 장문 분석을 교차 검증하는 보조 채널
- Zalo: 현지 직원·자문사·중개업자·주민 단체방을 통한 인적 정보 채널
- 베트남어 위험 키워드 프리셋과 플랫폼별 공개 검색 바로가기 제공

SNS 게시물은 조기경보 신호로만 취급하고 회사 공시, 거래소, 감독기관, 현지 언론 및 원문서로 교차 검증합니다. 비공개 그룹을 수집하거나 플랫폼의 로그인·API 제한을 우회하지 않습니다.


## 이번 수정 내용

- 대시보드 제목을 `Vietnam Economy / BCG News`로 변경했습니다.
- 상단 브랜드 로고를 텍스트 `H`에서 한화 트라이써클 형태의 SVG 마크로 변경했습니다.
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
