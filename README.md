# Vietnam Economy / BCG related news

베트남 경제정책·금융시장·BCG 공식공시를 매일 오전 확인하고, Hanwha의 SSSG 지분매각대금 회수 리스크에 영향을 줄 수 있는 이슈를 빠르게 선별하기 위한 내부 모니터링 대시보드입니다.

## 이번 버전의 변경 방향

- 화면을 단순화하고 가독성을 높였습니다.
- 상단 Hero 영역을 축소하고 제목·목적·최근 업데이트만 표시합니다.
- Today Brief는 BCG 공식공시와 회수 리스크 신호만 표시합니다.
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
