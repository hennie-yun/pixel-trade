/**
 * 한국투자증권(KIS) 주식 마스터 파일 서비스
 *
 * 데이터 출처:
 *   KOSPI : https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip
 *   KOSDAQ: https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip
 *
 * 파일 구조 (CP949 고정폭 텍스트):
 *   각 행 = [가변파트] + [고정파트(개행 포함)]
 *     가변파트 [0:9]  → 단축코드 (6자리 숫자)
 *     가변파트 [9:21] → 표준코드 (무시)
 *     가변파트 [21:]  → 한글종목명
 *   고정파트 길이: KOSPI 228자 / KOSDAQ 222자 (개행 포함)
 *
 * 참고: https://github.com/koreainvestment/open-trading-api/blob/main/stocks_info/
 */

// metro 번들러에 iconv-lite 인코딩 테이블 강제 포함
// ⚠️ 이 두 줄 순서 중요: encodings를 먼저 require 해야 cp949가 동작함
// eslint-disable-next-line @typescript-eslint/no-require-imports
const iconvEncodings = require('iconv-lite/encodings');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const iconv = require('iconv-lite');
iconv.encodings = iconvEncodings;

import { File, Paths } from 'expo-file-system';
import JSZip from 'jszip';
import { Buffer } from 'buffer'; // RN Buffer 폴리필 명시적 임포트

// ─── 다운로드 URL ─────────────────────────────────────────────
const KOSPI_URL =
  'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip';
const KOSDAQ_URL =
  'https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip';

/**
 * Python: row[-228:] 는 개행(\n) 포함 228자.
 * JS: split('\n') 후 개행 제거 → -1 → 227 / 221
 */
const KOSPI_TAIL  = 227;
const KOSDAQ_TAIL = 221;

export interface StockRecord {
  ticker: string;          // 단축코드 6자리  e.g. "005930"
  name:   string;          // 한글종목명       e.g. "삼성전자"
  market: 'KOSPI' | 'KOSDAQ';
}

// ─── ZIP 다운로드 → 내부 MST 파일 bytes 추출 ─────────────────
async function downloadAndUnzip(
  url:      string,
  fileName: string,  // 충돌 방지를 위해 명시적 파일명 사용
): Promise<Uint8Array> {
  const destFile = new File(Paths.cache, fileName);

  // 기존 임시 파일 정리
  if (destFile.exists) {
    try { destFile.delete(); } catch { /* 무시 */ }
  }

  await File.downloadFileAsync(url, destFile);

  try {
    const bytes = await destFile.bytes();

    // ZIP 압축 해제
    const zip   = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
    if (!names.length) throw new Error('ZIP 파일이 비어있습니다.');

    return zip.files[names[0]].async('uint8array');
  } finally {
    try { destFile.delete(); } catch { /* 무시 */ }
  }
}

// ─── MST 파싱: CP949 bytes → StockRecord[] ───────────────────
function parseMst(
  bytes:  Uint8Array,
  market: 'KOSPI' | 'KOSDAQ',
  tail:   number,
): StockRecord[] {
  // CP949(EUC-KR) → UTF-8 문자열
  const buf  = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = iconv.decode(buf, 'cp949') as string;

  const results: StockRecord[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    if (line.length <= tail + 21) continue;

    const part1  = line.slice(0, line.length - tail);
    const ticker = part1.slice(0, 9).trim();
    const name   = part1.slice(21).trim();

    if (/^\d{6}$/.test(ticker) && name) {
      results.push({ ticker, name, market });
    }
  }

  return results;
}

// ─── 메인: KOSPI + KOSDAQ 전체 종목 ──────────────────────────
export async function fetchKisMasterStocks(): Promise<StockRecord[]> {
  console.log('[KIS] 종목 마스터 다운로드 시작...');

  const [kospiBytes, kosdaqBytes] = await Promise.all([
    downloadAndUnzip(KOSPI_URL,  'kis_kospi.zip'),
    downloadAndUnzip(KOSDAQ_URL, 'kis_kosdaq.zip'),
  ]);

  const kospi  = parseMst(kospiBytes,  'KOSPI',  KOSPI_TAIL);
  const kosdaq = parseMst(kosdaqBytes, 'KOSDAQ', KOSDAQ_TAIL);

  console.log(`[KIS] 파싱 완료 — KOSPI: ${kospi.length}종목, KOSDAQ: ${kosdaq.length}종목`);

  if (kospi.length === 0 && kosdaq.length === 0) {
    throw new Error('파싱 결과가 0건입니다. tail 오프셋 또는 인코딩을 확인하세요.');
  }

  return [...kospi, ...kosdaq];
}
