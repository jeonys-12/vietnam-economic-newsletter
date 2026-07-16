# Vietnam Economy / BCG News

매일 아침 베트남 경제정책·금융시장·BCG 공식공시를 확인하고, Hanwha의 SSSG 지분매각대금 회수 리스크에 영향을 줄 수 있는 이슈를 빠르게 선별하기 위한 내부 모니터링 대시보드입니다.

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
