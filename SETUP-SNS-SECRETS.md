# SNS 자동수집 설정

## 1. YouTube 자동수집

1. Google Cloud Console에서 프로젝트를 생성합니다.
2. `YouTube Data API v3`를 활성화합니다.
3. API 키를 발급하고 필요하면 API 제한을 YouTube Data API v3로 설정합니다.
4. GitHub 저장소에서 `Settings → Secrets and variables → Actions`로 이동합니다.
5. `New repository secret`을 누르고 이름을 `YOUTUBE_API_KEY`로 입력합니다.
6. 값을 저장한 뒤 `Actions → Update Vietnam Economic Newsletter → Run workflow`를 실행합니다.

정상적으로 실행되면 `data/sns.json`의 `channels.youtube.status`가 `active`로 바뀌고 최근 영상이 대시보드에 나타납니다.

실패하면 대시보드 YouTube 상태 카드에 다음처럼 상세 원인이 표시됩니다.

```text
7/7개 검색 실패 · 400 Bad Request [keyInvalid]: API key not valid. Please pass a valid API key.
```

대표적인 `reason`은 `keyInvalid`, `accessNotConfigured`, `quotaExceeded`, `forbidden`입니다. 상세 메시지에 따라 API 키 재등록, YouTube Data API v3 활성화, 키 제한 또는 할당량을 확인하십시오.

## 2. Facebook 지정 페이지

Facebook 게시물 API 수집은 Meta 앱 심사와 Page Public Content Access 승인이 필요합니다. 승인 전에는 지정 페이지 바로가기만 표시됩니다.

승인 후 다음 Secrets를 설정합니다.

- `FACEBOOK_ACCESS_TOKEN`: 승인받은 서버용 액세스 토큰
- `FACEBOOK_PAGES_JSON`: 페이지 정보 배열

```json
[
  {
    "name": "BCG Land",
    "url": "https://www.facebook.com/confirmed-page-url",
    "pageId": "CONFIRMED_NUMERIC_PAGE_ID"
  }
]
```

Page ID와 URL은 반드시 Meta에서 확인한 값만 사용합니다. 토큰은 저장소 파일에 작성하지 않습니다.

## 3. TikTok

TikTok은 대시보드의 베트남어 검색어 버튼으로 검색합니다. 일반 기업용 범용 공개게시물 검색 API를 전제로 하지 않습니다.

## 4. X 무료 공개 검색

X 유료 API는 사용하지 않습니다. `X_BEARER_TOKEN`을 등록할 필요가 없으며, GitHub Actions에서도 X API를 호출하지 않습니다.

대시보드에서 검색어를 선택하거나 입력한 뒤 `X 최신 게시글 검색`을 누르면 X의 최신 공개 검색 화면이 열립니다. X의 정책에 따라 로그인 화면이 나타날 수 있습니다.
