# SNS 자동수집 설정

## 1. YouTube 자동수집

1. Google Cloud Console에서 프로젝트를 생성합니다.
2. `YouTube Data API v3`를 활성화합니다.
3. API 키를 발급하고 필요하면 API 제한을 YouTube Data API v3로 설정합니다.
4. GitHub 저장소에서 `Settings → Secrets and variables → Actions`로 이동합니다.
5. `New repository secret`을 누르고 이름을 `YOUTUBE_API_KEY`로 입력합니다.
6. 값을 저장한 뒤 `Actions → Update Vietnam Economic Newsletter → Run workflow`를 실행합니다.

정상적으로 실행되면 `data/sns.json`의 `channels.youtube.status`가 `active`로 바뀌고 최근 영상이 대시보드에 나타납니다.

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

## 4. Zalo 현지 제보

Zalo 제보는 브라우저 localStorage에 저장됩니다.

- 같은 PC라도 브라우저가 다르면 공유되지 않습니다.
- 브라우저 데이터 삭제 시 사라질 수 있습니다.
- `제보 JSON 내보내기`로 정기 백업하십시오.
- 여러 사람이 함께 등록하려면 별도 공용 폼이나 서버 연결이 필요합니다.
