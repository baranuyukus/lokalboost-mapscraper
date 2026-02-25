/** Tek bir yer/işletme verisi */
export interface Place {
    title: string;
    address: string | null;
    phone_number: string | null;
    feature_id: string | null;
    url: string | null;
    rating_score: number;
    review_count: number;
    query?: string;
    category?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    working_hours?: string[] | null;
    website?: string | null;
}

/** Scraper başlatma seçenekleri */
export interface ScraperOptions {
    keywords: string[];
    locations: SelectedLocation[];
    fetchDetails: boolean;
    maxConcurrent: number;
    maxPages: number;
    /** Seçilen il adı — adres filtreleme için */
    filterState?: string;
    /** Seçilen ülkenin ISO2 kodu (örn: TR, CY, DE) — gl parametresi için */
    countryCode?: string;
    /** Proxy ayarları */
    proxy: ProxyConfig;
    /** Otomatik kayıt ayarları */
    autoSave: AutoSaveConfig;
    /** Veri filtreleme */
    filters: FilterConfig;
}

/** Proxy yapılandırması */
export interface ProxyConfig {
    mode: 'none' | 'rotating' | 'sticky';
    /** Rotating: tek proxy URL */
    rotatingProxy: string;
    /** Sticky: toplu proxy listesi */
    stickyProxies: string[];
}

/** Otomatik kayıt yapılandırması */
export interface AutoSaveConfig {
    mode: 'off' | 'per-district' | 'per-state' | 'per-count';
    /** per-count modunda kaç sonuçta kaydet */
    count: number;
    /** Kayıt klasörü (varsayılan: Desktop) */
    savePath: string;
}

/** Veri filtreleme yapılandırması */
export interface FilterConfig {
    requirePhone: boolean;
    requireWebsite: boolean;
    minRating: number;    // 0 = devre dışı
    minReviews: number;   // 0 = devre dışı
}

/** Tüm uygulama ayarları */
export interface AppSettings {
    proxy: ProxyConfig;
    autoSave: AutoSaveConfig;
    filters: FilterConfig;
    fetchDetails: boolean;
    maxPages: number;
    maxConcurrent: number;
}

/** Seçili lokasyon */
export interface SelectedLocation {
    name: string;
    lat: number;
    lng: number;
}

/** Scraper ilerleme durumu */
export interface ScraperProgress {
    status: 'idle' | 'running' | 'stopped' | 'completed' | 'error';
    currentQuery: string;
    processedQueries: number;
    totalQueries: number;
    totalResults: number;
    message?: string;
}

/** Lokasyon veri tipleri */
export interface CountryOption {
    id: number;
    name: string;
    iso2: string;
    emoji: string;
    stateCount: number;
}

export interface StateOption {
    id: number;
    name: string;
    lat: number;
    lng: number;
    cityCount: number;
}

export interface CityOption {
    id: number;
    name: string;
    lat: number;
    lng: number;
}
