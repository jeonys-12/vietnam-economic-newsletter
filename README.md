# Vietnam Economic & BCG Recovery Risk Monitor

베트남 경제정책, 금융시장, 경제뉴스, BCG Group 공식공시를 매일 수집해 Hanwha 회수 리스크 관점으로 정리하는 GitHub Pages 대시보드입니다.

## 이번 버전의 핵심 반영 사항

1. **Today Brief 추가**
   - 24시간 이내 핵심 항목 3개를 첫 화면에서 요약합니다.
   - BCG 공식공시, 긴급 리스크, 일반 정책·경제뉴스를 구분합니다.

2. **BCG Risk Alert 별도 섹션 추가**
   - 선택 기간 내 BCG 관련 고위험 항목을 별도 섹션에 표시합니다.
   - BCG / BCG Land 공식공시는 일반 경제뉴스보다 시각적으로 더 강하게 구분합니다.

3. **일간 / 주간 / 월간 기간 필터 안정화**
   - 일간: 실제 게시일 기준 24시간 이내
   - 주간: 실제 게시일 기준 7일 이내
   - 월간: 실제 게시일 기준 30일 이내
   - `collected_at`은 사용하지 않습니다. 수집시간이 아니라 원문 게시일·공시일 기준으로 분류합니다.

4. **Hanwha 영향도 강조**
   - 기사 카드 하단에 `Hanwha 영향` 영역을 별도 강조 박스로 표시합니다.
   - BCG 회수 리스크 관련 항목은 유동성, 공시 신뢰도, 채권회수 가능성 관점에서 확인하도록 표시합니다.

5. **숫자 점수 축소, 등급 중심 표시**
   - 기존의 큰 Best Score 숫자는 제거했습니다.
   - 중요도 / 출처 / 리스크 등급을 먼저 표시하고, 신뢰도·위험 점수는 작은 보조 정보로만 표시합니다.

6. **BCG 공식공시와 일반 경제뉴스의 시각적 구분 강화**
   - BCG 공식공시: 오렌지 강조 카드
   - BCG 관련 모니터링: 네이비 강조 카드
   - 일반 경제·정책 뉴스: 일반 흰색 카드

## 자동 실행

`.github/workflows/update-news.yml` 기준:

- 매일 07:00 KST 1회 자동 실행
- 수동 실행 가능: GitHub → Actions → Update Vietnam Economic Newsletter → Run workflow
- 수집 범위: 최근 30일, `LOOKBACK_HOURS=720`
- 대시보드 표시 한도: 최대 100개

## 적용 파일

이번 버전에서 주로 변경된 파일:

```text
index.html
style.css
app.js
.github/workflows/update-news.yml
README.md
```

## 배포 방법

```powershell
git status
git add index.html style.css app.js .github/workflows/update-news.yml README.md
git commit -m "Improve dashboard layout with brief alerts and monthly filter"
git push
```

원격 저장소가 최신이라는 오류가 나오면 먼저 아래를 실행하세요.

```powershell
git stash push -u -m "backup before pull"
git pull --rebase origin main
git stash pop
git add index.html style.css app.js .github/workflows/update-news.yml README.md
git commit -m "Improve dashboard layout with brief alerts and monthly filter"
git push
```

## 운영상 주의

- 자동 요약 결과는 내부 검토용입니다.
- 최종 보고 전에는 반드시 공식 원문을 확인해야 합니다.
- BCG / BCG Land 관련 공시는 Hanwha 회수 리스크와의 연결성을 별도로 검토해야 합니다.
