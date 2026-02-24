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
    proxyList?: string[];
    /** Seçilen il adı — adres filtreleme için */
    filterState?: string;
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
