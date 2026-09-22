# DREAM Lab. Homepage

광운대학교 로봇학과 **동적로봇 및 자율조작 연구실(DREAM Lab.)** 홈페이지입니다.
GitHub Pages가 기본 제공하는 Jekyll로 빌드되므로 **별도 빌드 설정 없이 push만 하면 배포**됩니다.

> 콘텐츠(논문, 구성원, 뉴스 …)는 모두 `_data/` 폴더의 YAML 파일에 있습니다.
> HTML을 건드리지 않고 이 파일들만 고치면 사이트가 갱신됩니다.
> GitHub 웹에서 파일을 열고 ✏️(Edit) → Commit 만 해도 1–2분 뒤 반영됩니다.

---

## 무엇을 어디서 고치나요?

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 논문 목록 | `_data/publications.yml` |
| 구성원 (입학·졸업 포함) | `_data/members.yml` |
| 뉴스 | `_data/news.yml` |
| 연구 주제 / 과제 | `_data/research.yml`, `_data/projects.yml` |
| 세미나·행사 | `_data/events.yml` |
| 유튜브 영상 | `_data/videos.yml` |
| 홈 화면 문구, 모집 공고, 연구 분야 | `_data/home.yml` |
| 모집 분야, 지원 방법 | `_data/contact.yml` |
| RO:BIT 페이지 문구 | `_data/robit.yml` |
| 구성원 그룹 제목·순서 | `_data/member_groups.yml` |
| 상단 메뉴 | `_data/navigation.yml` |
| 버튼·제목 등 화면 문구(한/영) | `_data/i18n.yml` |
| 연락처, 주소, 사이트 제목 | `_config.yml` |
| 브랜드 컬러·폰트 | `assets/css/main.css` 맨 위 `:root` |

이미지는 `assets/img/` 아래 폴더(`members/`, `pubs/`, `research/`, `photos/`)에 넣고 YAML에 경로를 적습니다.

---

## 한국어 / 영어

- **영어가 기본**입니다. 영어 페이지는 `/`, 한국어 페이지는 `/ko/` 아래에 있고, 헤더의 **EN | KO** 버튼으로 같은 페이지끼리 오갑니다.
- **데이터 파일 규칙:** 번역이 필요한 필드는 이름 뒤에 `_ko` / `_en` 을 붙입니다.
  한쪽만 적거나 접미사 없이(`text:`) 적으면 두 언어 페이지 모두 그 값을 씁니다.
  ```yaml
  - date: 2026-03-02
    tag: paper
    text_ko: "…" 논문이 **IEEE ICRA 2026**에 채택되었습니다. 🎉
    text_en: Our paper "…" has been accepted to **IEEE ICRA 2026**. 🎉
  ```
- 논문 제목·저자처럼 번역이 필요 없는 값은 그대로 한 번만 적습니다.
- 페이지 제목과 한 줄 소개는 각 페이지 파일(`members.html`, `ko/members.html` …)의 front matter에 있습니다.
  본문 틀은 두 언어가 `_layouts/<페이지>.html` 하나를 같이 씁니다.
- 새 페이지를 만들 때는 영어 파일과 `ko/` 파일을 둘 다 만들어야 언어 전환 버튼이 제대로 연결됩니다.
- `bootcamp/`, `ros2_special_lecture/` 처럼 front matter가 없는 HTML 폴더는 그대로 복사되어 기존 주소 그대로 열립니다.

---

## 논문 추가하기

`_data/publications.yml` **맨 위**에 항목을 추가합니다. (연도별 그룹·필터·검색은 자동)

```yaml
- title: "Paper Title"
  authors: "Dongwoo Son*, Gahyun Oh, Suhan Park†"   # 쉼표로 구분, members.yml 이름과 같으면 자동 굵게
  venue: IEEE RA-L                                 # 표시용 약칭
  venue_full: IEEE Robotics and Automation Letters # (선택) 마우스를 올리면 표시
  year: 2026
  type: journal          # journal | conference | workshop | preprint | thesis
  note: SCIE             # (선택) 작은 배지
  award: Best Paper      # (선택) 금색 배지
  selected: true         # (선택) 홈 화면 Selected Publications에 노출 (최대 3편)
  topics: [physical-ai]  # (선택) Research 페이지 '관련 논문'에 자동 표시 (research.yml의 id)
  image: /assets/img/pubs/son2026paper.gif
  links:
    paper: https://doi.org/...
    arxiv: https://arxiv.org/abs/...
    project: https://...
    code: https://github.com/lab-dream/...
    video: https://youtu.be/...
  bibtex: |              # (선택) 넣으면 BibTeX 버튼/복사 기능이 생깁니다
    @article{...}
```

### BibTeX로 한 번에 추가

Google Scholar의 "인용 → BibTeX"를 그대로 쓸 수 있습니다.

```bash
pbpaste | python3 tools/bib2yml.py            # 변환 결과만 출력 (복사해서 붙여 넣기)
python3 tools/bib2yml.py paper.bib --prepend  # publications.yml 맨 위에 바로 추가
```

저자 이름 형식 변환(`Park, Suhan` → `Suhan Park`), 주요 학회·저널 약칭, DOI/arXiv 링크를 자동으로 채웁니다.
결과의 `venue`, `type`, `image` 는 한 번 확인해 주세요.

---

## 구성원 추가 / 졸업 처리

`_data/members.yml`에 항목을 추가합니다.

```yaml
- name: Gildong Hong          # 논문 저자 표기와 똑같이
  name_ko: 홍길동
  group: graduate             # professor | graduate | undergraduate | alumni
  program: M.S.               # (선택) M.S. / Ph.D. / M.S.–Ph.D.
  photo: /assets/img/members/gildong-hong.jpg   # 세로 3:4 권장, 없으면 이니셜 이미지
  interests: [Imitation Learning, Manipulation]
  github: https://github.com/...
  email: ...
  since: 2026
```

졸업하면 `group: alumni` 로 바꾸고 `graduated: 2027`, `now: Samsung Electronics` 처럼 적어 주세요.
그룹 제목이나 순서(예: Researchers 그룹 추가)는 `_data/member_groups.yml`에서 바꿉니다.
한국어 페이지에는 `name_ko`가, 영어 페이지에는 `name`이 크게 표시됩니다.

## 뉴스 추가

```yaml
- date: 2026-03-02
  tag: paper        # paper | grant | member | award | event | media | etc
  text_ko: "..." 논문이 **IEEE ICRA 2026**에 채택되었습니다. 🎉 [링크](https://...)
  text_en: Our paper "..." has been accepted to **IEEE ICRA 2026**. 🎉 [Link](https://...)
```

날짜순 자동 정렬이라 어디에 넣어도 됩니다. 홈 화면에는 최근 6개가 나옵니다.

> 💡 YAML 팁: 콜론(`:`)이나 `#`이 들어간 문장은 큰따옴표로 감싸세요. 들여쓰기는 스페이스 2칸입니다.
> 홈 화면 공지에서 사이트 내부 페이지로 링크할 때는 `contact/` 처럼 상대 경로로 적으면 한/영 페이지 모두에서 맞게 연결됩니다.

---

## 배포 (GitHub Pages)

`main` 브랜치에 push하면 GitHub Pages가 자동으로 빌드·배포합니다 (1–2분).
별도 빌드 설정이나 GitHub Actions는 필요 없습니다.

### 도메인

사이트는 연구실 도메인으로도 연결됩니다. 도메인·DNS 관련 설정은 관리자만 다룹니다.

---

## 로컬에서 미리보기

```bash
bundle install
bundle exec jekyll serve      # → http://localhost:4000 (파일 저장 시 자동 갱신)
```

- `_config.yml`을 고쳤을 때만 서버를 재시작하면 됩니다.
- Ruby 3.x를 권장합니다.

## 구조

```
_config.yml        사이트 설정, 연락처
_data/             ← 콘텐츠 (여기만 고치면 됨)
_includes/         재사용 조각 (논문 한 편, 뉴스 한 줄, 영상 카드, tr.html = 한/영 필드 선택)
_layouts/          공통 틀 (default: 헤더/푸터, page: 서브페이지 머리) + 페이지별 본문 (home, members …)
assets/css/        스타일 (브랜드 컬러는 :root 변수)
assets/js/         메뉴, 논문 필터·검색, 영상 클릭 재생, BibTeX 복사
assets/img/        로고, 파비콘, 사진
tools/bib2yml.py   BibTeX → YAML 변환기
*.html             영어 페이지 — 기본 (front matter만: 제목·소개·주소)
ko/*.html          한국어 페이지 (같은 레이아웃을 한국어로)
```

브랜드: 버건디 `#6F1A2D`(VI) · 다크 와인 `#2A0C14` · 샴페인 골드 `#C8AD7F` · 아이보리 `#F8F5EF` · 스톤 `#716760`, 폰트: 큰 제목 Noto Serif Display, 작은 이탤릭 Source Serif 4, 본문·한글 Pretendard.
로고 파일 자체의 골드(`#FFC000`)는 VI 그대로 두었습니다.
