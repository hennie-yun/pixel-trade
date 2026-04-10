/**
 * 종목 마스터 관리 + 검색
 *
 * 흐름:
 *  앱 시작 → initStockMaster()
 *    ├─ JSON 캐시 유효(24h 이내) → 파일 로드 → 인메모리
 *    └─ 캐시 없음/만료 → KIS ZIP 다운로드 → 파싱 → JSON 저장 → 인메모리
 *
 *  검색: searchStocks(query)
 *    - 한글 부분 일치 : "삼성" → 삼성전자, 삼성SDI …
 *    - 초성 검색      : "ㅅㅅㅈ" → 삼성전자
 *    - 티커 검색      : "005930" → 삼성전자
 */

import { File, Paths } from 'expo-file-system';
import { fetchKisMasterStocks, StockRecord } from '../services/kisMasterService';

// ─── 타입 ─────────────────────────────────────────────────────
export type StockInfo    = StockRecord;
export type SyncStatus   = 'idle' | 'loading' | 'ok' | 'error';

// ─── 영속 파일 (앱이 재시작해도 유지) ──────────────────────────
const stockFile = new File(Paths.document, 'stock_master.json');
const metaFile  = new File(Paths.document, 'stock_master_meta.json');
const CACHE_TTL_HOURS = 24;

// ─── 런타임 상태 ─────────────────────────────────────────────
let _cache:     StockInfo[] = [];
let _status:    SyncStatus  = 'idle';
let _error:     string | null = null;
const _listeners = new Set<(s: SyncStatus) => void>();

export const getSyncStatus = (): SyncStatus      => _status;
export const getSyncError  = (): string | null   => _error;
export const getStockCount = (): number          => _cache.length;

export function onSyncStatusChange(cb: (s: SyncStatus) => void) {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

function emit(s: SyncStatus, err?: string) {
  _status = s;
  _error  = err ?? null;
  _listeners.forEach((cb) => cb(s));
}

// ─── 캐시 유효성 확인 ────────────────────────────────────────
async function isCacheFresh(): Promise<boolean> {
  try {
    if (!metaFile.exists) return false;
    const meta = JSON.parse(await metaFile.text());
    const diffH = (Date.now() - new Date(meta.lastFetch).getTime()) / 3_600_000;
    return diffH < CACHE_TTL_HOURS;
  } catch {
    return false;
  }
}

// ─── 파일 I/O ────────────────────────────────────────────────
async function loadFromFile(): Promise<StockInfo[]> {
  return JSON.parse(await stockFile.text());
}

function saveToFile(stocks: StockInfo[]): void {
  stockFile.write(JSON.stringify(stocks));
  metaFile.write(
    JSON.stringify({ lastFetch: new Date().toISOString(), count: stocks.length })
  );
}

// ─── 초기화 ───────────────────────────────────────────────────
/**
 * 앱 시작 시 1회 호출 (백그라운드 OK).
 */
export async function initStockMaster(): Promise<void> {
  emit('loading');
  try {
    if (await isCacheFresh()) {
      _cache = await loadFromFile();
      emit('ok');
      return;
    }
    // 다운로드 → 파싱 → 저장
    const stocks = await fetchKisMasterStocks();
    saveToFile(stocks);
    _cache = stocks;
    emit('ok');
  } catch (e: any) {
    // ← 터미널에서 이 줄을 확인하면 정확한 원인을 알 수 있습니다
    console.error('[StockMaster] 로드 실패:', e);
    // 실패 시 이전 캐시라도 사용
    try { _cache = await loadFromFile(); } catch { _cache = []; }
    emit('error', e?.message ?? '알 수 없는 오류');
  }
}

/**
 * 강제 재동기화 (설정 화면 "종목 업데이트" 버튼용).
 * @throws 다운로드/파싱 실패 시 예외
 */
export async function syncStockMaster(): Promise<void> {
  emit('loading');
  const stocks = await fetchKisMasterStocks();
  saveToFile(stocks);
  _cache = stocks;
  emit('ok');
}

// ─── 초성 검색 ────────────────────────────────────────────────
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] as const;

function getChosung(char: string): string {
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return char;
  return CHOSUNG[Math.floor(code / (21 * 28))];
}

function toChosung(text: string): string {
  return text.split('').map(getChosung).join('');
}

function isAllChosung(text: string): boolean {
  return text.length > 0 &&
    text.split('').every((c) => (CHOSUNG as readonly string[]).includes(c));
}

// ─── 검색 ─────────────────────────────────────────────────────
export function searchStocks(query: string, limit = 12): StockInfo[] {
  const q = query.trim();
  if (!q || !_cache.length) return [];

  const qLower   = q.toLowerCase();
  const chosungQ = isAllChosung(q) ? q : null;

  return _cache
    .filter((s) => {
      if (s.ticker.startsWith(q))                              return true;
      if (s.name.toLowerCase().includes(qLower))               return true;
      if (chosungQ && toChosung(s.name).includes(chosungQ))    return true;
      return false;
    })
    .slice(0, limit);
}
