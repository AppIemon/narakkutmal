// UN 승인국 목록 (193개국)
// 각 국가: { name: 한국어이름, initial: 초성, final: 종성(받침) }
// 종성이 없으면 null

// UN 승인국 목록 (193개국)
// 각 국가: { name: 한국어이름, initial: 초성 }
// final 필드는 제거
const UN_COUNTRIES = [
  { name: "가나", initial: "ㄱ" },
  { name: "가봉", initial: "ㄱ" },
  { name: "가이아나", initial: "ㄱ" },
  { name: "감비아", initial: "ㄱ" },
  { name: "과테말라", initial: "ㄱ" },
  { name: "그레나다", initial: "ㄱ" },
  { name: "그리스", initial: "ㄱ" },
  { name: "기니", initial: "ㄱ" },
  { name: "기니비사우", initial: "ㄱ" },
  { name: "나미비아", initial: "ㄴ" },
  { name: "나우루", initial: "ㄴ" },
  { name: "나이지리아", initial: "ㄴ" },
  { name: "남수단", initial: "ㄴ" },
  { name: "남아프리카공화국", initial: "ㄴ" },
  { name: "네덜란드", initial: "ㄴ" },
  { name: "네팔", initial: "ㄴ" },
  { name: "노르웨이", initial: "ㄴ" },
  { name: "뉴질랜드", initial: "ㄴ" },
  { name: "니제르", initial: "ㄴ" },
  { name: "니카라과", initial: "ㄴ" },
  { name: "대한민국", initial: "ㄷ" },
  { name: "덴마크", initial: "ㄷ" },
  { name: "도미니카연방", initial: "ㄷ" },
  { name: "도미니카공화국", initial: "ㄷ" },
  { name: "독일", initial: "ㄷ" },
  { name: "동티모르", initial: "ㄷ" },
  { name: "라오스", initial: "ㄹ" },
  { name: "라이베리아", initial: "ㄹ" },
  { name: "라트비아", initial: "ㄹ" },
  { name: "러시아", initial: "ㄹ" },
  { name: "레바논", initial: "ㄹ" },
  { name: "레소토", initial: "ㄹ" },
  { name: "루마니아", initial: "ㄹ" },
  { name: "룩셈부르크", initial: "ㄹ" },
  { name: "르완다", initial: "ㄹ" },
  { name: "리비아", initial: "ㄹ" },
  { name: "리투아니아", initial: "ㄹ" },
  { name: "리히텐슈타인", initial: "ㄹ" },
  { name: "마다가스카르", initial: "ㅁ" },
  { name: "마셜제도", initial: "ㅁ" },
  { name: "마케도니아", initial: "ㅁ" },
  { name: "말라위", initial: "ㅁ" },
  { name: "말레이시아", initial: "ㅁ" },
  { name: "말리", initial: "ㅁ" },
  { name: "멕시코", initial: "ㅁ" },
  { name: "모나코", initial: "ㅁ" },
  { name: "모로코", initial: "ㅁ" },
  { name: "모리셔스", initial: "ㅁ" },
  { name: "모리타니", initial: "ㅁ" },
  { name: "모잠비크", initial: "ㅁ" },
  { name: "몬테네그로", initial: "ㅁ" },
  { name: "몰도바", initial: "ㅁ" },
  { name: "몰디브", initial: "ㅁ" },
  { name: "몰타", initial: "ㅁ" },
  { name: "몽골", initial: "ㅁ" },
  { name: "미국", initial: "ㅁ" },
  { name: "미얀마", initial: "ㅁ" },
  { name: "미크로네시아", initial: "ㅁ" },
  { name: "바누아투", initial: "ㅂ" },
  { name: "바레인", initial: "ㅂ" },
  { name: "바베이도스", initial: "ㅂ" },
  { name: "바하마", initial: "ㅂ" },
  { name: "방글라데시", initial: "ㅂ" },
  { name: "베냉", initial: "ㅂ" },
  { name: "베네수엘라", initial: "ㅂ" },
  { name: "베트남", initial: "ㅂ" },
  { name: "벨기에", initial: "ㅂ" },
  { name: "벨라루스", initial: "ㅂ" },
  { name: "벨리즈", initial: "ㅂ" },
  { name: "보스니아헤르체고비나", initial: "ㅂ" },
  { name: "보츠와나", initial: "ㅂ" },
  { name: "볼리비아", initial: "ㅂ" },
  { name: "부룬디", initial: "ㅂ" },
  { name: "부르키나파소", initial: "ㅂ" },
  { name: "부탄", initial: "ㅂ" },
  { name: "불가리아", initial: "ㅂ" },
  { name: "브라질", initial: "ㅂ" },
  { name: "브루나이", initial: "ㅂ" },
  { name: "사모아", initial: "ㅅ" },
  { name: "사우디아라비아", initial: "ㅅ" },
  { name: "산마리노", initial: "ㅅ" },
  { name: "상투메프린시페", initial: "ㅅ" },
  { name: "세네갈", initial: "ㅅ" },
  { name: "세르비아", initial: "ㅅ" },
  { name: "세이셸", initial: "ㅅ" },
  { name: "세인트키츠네비스", initial: "ㅅ" },
  { name: "세인트루시아", initial: "ㅅ" },
  { name: "세인트빈센트그레나딘", initial: "ㅅ" },
  { name: "소말리아", initial: "ㅅ" },
  { name: "솔로몬제도", initial: "ㅅ" },
  { name: "수단", initial: "ㅅ" },
  { name: "수리남", initial: "ㅅ" },
  { name: "스리랑카", initial: "ㅅ" },
  { name: "스웨덴", initial: "ㅅ" },
  { name: "스위스", initial: "ㅅ" },
  { name: "스페인", initial: "ㅅ" },
  { name: "슬로바키아", initial: "ㅅ" },
  { name: "슬로베니아", initial: "ㅅ" },
  { name: "시리아", initial: "ㅅ" },
  { name: "시에라리온", initial: "ㅅ" },
  { name: "싱가포르", initial: "ㅅ" },
  { name: "아랍에미리트", initial: "ㅇ" },
  { name: "아르메니아", initial: "ㅇ" },
  { name: "아르헨티나", initial: "ㅇ" },
  { name: "아이슬란드", initial: "ㅇ" },
  { name: "아일랜드", initial: "ㅇ" },
  { name: "아제르바이잔", initial: "ㅇ" },
  { name: "아프가니스탄", initial: "ㅇ" },
  { name: "안도라", initial: "ㅇ" },
  { name: "알바니아", initial: "ㅇ" },
  { name: "알제리", initial: "ㅇ" },
  { name: "앙골라", initial: "ㅇ" },
  { name: "앤티가바부다", initial: "ㅇ" },
  { name: "에리트레아", initial: "ㅇ" },
  { name: "에스와티니", initial: "ㅇ" },
  { name: "에스토니아", initial: "ㅇ" },
  { name: "에콰도르", initial: "ㅇ" },
  { name: "에티오피아", initial: "ㅇ" },
  { name: "엘살바도르", initial: "ㅇ" },
  { name: "영국", initial: "ㅇ" },
  { name: "예멘", initial: "ㅇ" },
  { name: "오만", initial: "ㅇ" },
  { name: "오스트레일리아", initial: "ㅇ" },
  { name: "오스트리아", initial: "ㅇ" },
  { name: "온두라스", initial: "ㅇ" },
  { name: "요르단", initial: "ㅇ" },
  { name: "우간다", initial: "ㅇ" },
  { name: "우루과이", initial: "ㅇ" },
  { name: "우즈베키스탄", initial: "ㅇ" },
  { name: "우크라이나", initial: "ㅇ" },
  { name: "이라크", initial: "ㅇ" },
  { name: "이란", initial: "ㅇ" },
  { name: "이스라엘", initial: "ㅇ" },
  { name: "이집트", initial: "ㅇ" },
  { name: "이탈리아", initial: "ㅇ" },
  { name: "인도", initial: "ㅇ" },
  { name: "인도네시아", initial: "ㅇ" },
  { name: "일본", initial: "ㅇ" },
  { name: "자메이카", initial: "ㅈ" },
  { name: "잠비아", initial: "ㅈ" },
  { name: "적도기니", initial: "ㅈ" },
  { name: "조선민주주의인민공화국", initial: "ㅈ" },
  { name: "조지아", initial: "ㅈ" },
  { name: "중앙아프리카공화국", initial: "ㅈ" },
  { name: "중국", initial: "ㅈ" },
  { name: "지부티", initial: "ㅈ" },
  { name: "짐바브웨", initial: "ㅈ" },
  { name: "차드", initial: "ㅊ" },
  { name: "체코", initial: "ㅊ" },
  { name: "칠레", initial: "ㅊ" },
  { name: "카메룬", initial: "ㅋ" },
  { name: "카보베르데", initial: "ㅋ" },
  { name: "카자흐스탄", initial: "ㅋ" },
  { name: "카타르", initial: "ㅋ" },
  { name: "캄보디아", initial: "ㅋ" },
  { name: "캐나다", initial: "ㅋ" },
  { name: "케냐", initial: "ㅋ" },
  { name: "코모로", initial: "ㅋ" },
  { name: "코스타리카", initial: "ㅋ" },
  { name: "코트디부아르", initial: "ㅋ" },
  { name: "콜롬비아", initial: "ㅋ" },
  { name: "콩고공화국", initial: "ㅋ" },
  { name: "콩고민주공화국", initial: "ㅋ" },
  { name: "쿠바", initial: "ㅋ" },
  { name: "쿠웨이트", initial: "ㅋ" },
  { name: "크로아티아", initial: "ㅋ" },
  { name: "키르기스스탄", initial: "ㅋ" },
  { name: "키리바시", initial: "ㅋ" },
  { name: "키프로스", initial: "ㅋ" },
  { name: "타이", initial: "ㅌ" },
  { name: "타지키스탄", initial: "ㅌ" },
  { name: "탄자니아", initial: "ㅌ" },
  { name: "터키", initial: "ㅌ" },
  { name: "토고", initial: "ㅌ" },
  { name: "통가", initial: "ㅌ" },
  { name: "투르크메니스탄", initial: "ㅌ" },
  { name: "투발루", initial: "ㅌ" },
  { name: "튀니지", initial: "ㅌ" },
  { name: "트리니다드토바고", initial: "ㅌ" },
  { name: "파나마", initial: "ㅍ" },
  { name: "파라과이", initial: "ㅍ" },
  { name: "파키스탄", initial: "ㅍ" },
  { name: "파푸아뉴기니", initial: "ㅍ" },
  { name: "팔라우", initial: "ㅍ" },
  { name: "페루", initial: "ㅍ" },
  { name: "포르투갈", initial: "ㅍ" },
  { name: "폴란드", initial: "ㅍ" },
  { name: "프랑스", initial: "ㅍ" },
  { name: "피지", initial: "ㅍ" },
  { name: "핀란드", initial: "ㅍ" },
  { name: "필리핀", initial: "ㅍ" },
  { name: "헝가리", initial: "ㅎ" }
];

// 국가 이름으로 검색
function findCountry(name) {
  return UN_COUNTRIES.find(c => c.name === name);
}

// 초성으로 시작하는 국가 찾기
function findCountriesByInitial(initial) {
  return UN_COUNTRIES.filter(c => c.initial === initial);
}

// 종성으로 시작하는 국가 찾기 (받침이 있는 경우)
function findCountriesByFinal(final) {
  if (!final) return [];
  return UN_COUNTRIES.filter(c => c.final === final);
}
// 사용 가능한 국가 목록 반환 (이미 사용된 국가 제외)
function getAvailableCountries(usedCountries, lastCountry) {
  if (!lastCountry) {
    // 첫 번째 국가는 아무거나 가능
    return UN_COUNTRIES.filter(c => !usedCountries.includes(c.name));
  }
  
  const last = findCountry(lastCountry);
  if (!last) return [];

  // 마지막 글자의 초성 계산
  const nextInitial = getLastCharInitial(last.name);
  
  if (!nextInitial) return [];

  // 초성으로 시작하는 국가 찾기
  return UN_COUNTRIES.filter(c => 
    c.initial === nextInitial && !usedCountries.includes(c.name)
  );
}

// 마지막 글자의 초성 추출
function getLastCharInitial(countryName) {
  const lastChar = countryName[countryName.length - 1];
  const charCode = lastChar.charCodeAt(0);
  if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
    const initialIndex = Math.floor((charCode - 0xAC00) / 588);
    const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    return initials[initialIndex];
  }
  return null;
}

module.exports = {
  UN_COUNTRIES,
  findCountry,
  findCountriesByInitial,
  getAvailableCountries,
  getLastCharInitial
};