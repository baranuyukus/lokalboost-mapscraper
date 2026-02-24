import axios, { AxiosInstance } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import { ipcMain, BrowserWindow, app } from 'electron';
import { writeFileSync } from 'fs';
import { join } from 'path';
import type { Place, ScraperOptions, SelectedLocation, ScraperProgress } from '../../src/types/scraper';

// ============================================
// Google Earth RPC Client
// ============================================

const SEARCH_URL = 'https://www.google.com/earth/rpc/search';
const ENTITY_URL = 'https://www.google.com/earth/rpc/entity';

// 20+ User-Agent — farklı versiyon, OS, dil kombinasyonları
const USER_AGENTS = [
    // Windows variants
    'GoogleEarth/7.3.6.9796(Windows;Microsoft Windows (6.2.9200.0);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.6.9796(Windows;Microsoft Windows (6.2.9200.0);en;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.6.9796(Windows;Microsoft Windows (10.0.19041.0);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.6.9796(Windows;Microsoft Windows (10.0.22000.0);en;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.5.8745(Windows;Microsoft Windows (6.2.9200.0);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.5.8745(Windows;Microsoft Windows (10.0.19041.0);en;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.4.8642(Windows;Microsoft Windows (6.2.9200.0);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.4.8642(Windows;Microsoft Windows (10.0.19041.0);en;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.3.7786(Windows;Microsoft Windows (6.2.9200.0);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.3.7786(Windows;Microsoft Windows (10.0.19041.0);en;kml:2.2;client:Pro;type:default)',
    // Mac variants
    'GoogleEarth/7.3.6.9796(MacOS;Mac OS X (10.15.7);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.6.9796(MacOS;Mac OS X (10.15.7);en;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.6.9796(MacOS;Mac OS X (12.0.0);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.6.9796(MacOS;Mac OS X (13.0.0);en;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.5.8745(MacOS;Mac OS X (10.15.7);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.5.8745(MacOS;Mac OS X (11.0.0);en;kml:2.2;client:Pro;type:default)',
    // Linux variants
    'GoogleEarth/7.3.6.9796(Linux;Ubuntu (20.04);tr;kml:2.2;client:Pro;type:default)',
    'GoogleEarth/7.3.6.9796(Linux;Ubuntu (22.04);en;kml:2.2;client:Pro;type:default)',
    // Free client variants
    'GoogleEarth/7.3.6.9796(Windows;Microsoft Windows (10.0.19041.0);tr;kml:2.2;client:Free;type:default)',
    'GoogleEarth/7.3.6.9796(MacOS;Mac OS X (10.15.7);en;kml:2.2;client:Free;type:default)',
];

// Client versions to rotate
const CLIENT_VERSIONS = ['7.3.6.9796', '7.3.5.8745', '7.3.4.8642', '7.3.3.7786', '7.3.2.5776'];

function randomUA(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomCV(): string {
    return CLIENT_VERSIONS[Math.floor(Math.random() * CLIENT_VERSIONS.length)];
}

/** Random delay between min-max ms */
function randomDelay(min: number, max: number): Promise<void> {
    return sleep(min + Math.floor(Math.random() * (max - min)));
}

/** Generate a random pseudo-cookie string */
function generatePseudoCookie(): string {
    const rand = (len: number) => Array.from({ length: len }, () => Math.random().toString(36).charAt(2)).join('');
    const nid = Math.floor(Math.random() * 500) + 1;
    return `NID=${nid}=${rand(40)}; 1P_JAR=2026-02-${10 + Math.floor(Math.random() * 18)}-${Math.floor(Math.random() * 24)}; CONSENT=YES+cb.20210${Math.floor(Math.random() * 9)};`;
}

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

// ============================================
// Semaphore
// ============================================

class Semaphore {
    private current = 0;
    private queue: (() => void)[] = [];
    constructor(private max: number) { }
    async acquire(): Promise<void> {
        if (this.current < this.max) { this.current++; return; }
        return new Promise<void>(resolve => this.queue.push(resolve));
    }
    release(): void {
        this.current--;
        const next = this.queue.shift();
        if (next) { this.current++; next(); }
    }
}

// ============================================
// GoogleEarthClient
// ============================================

class GoogleEarthClient {
    private httpClient: AxiosInstance;
    private requestCount = 0;
    private cookie: string;

    constructor(proxy: string | null = null) {
        this.cookie = generatePseudoCookie();
        this.httpClient = axios.create({
            timeout: 30000,
            headers: {
                'User-Agent': randomUA(),
                'Accept': 'application/xml, text/xml, */*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive',
                'DNT': '1',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Cookie': this.cookie,
                'X-Goog-Encode-Response-If-Executable': 'base64',
            },
            ...(proxy ? { proxy: this.parseProxy(proxy) } : {}),
        });
    }

    private parseProxy(proxyStr: string) {
        try {
            const url = new URL(proxyStr);
            return {
                host: url.hostname,
                port: parseInt(url.port),
                protocol: url.protocol.replace(':', ''),
                ...(url.username ? { auth: { username: url.username, password: url.password } } : {}),
            };
        } catch { return undefined; }
    }

    /** Rotate headers for each request to look like different sessions */
    private rotateHeaders() {
        this.requestCount++;

        // Rotate UA every request
        this.httpClient.defaults.headers['User-Agent'] = randomUA();

        // Refresh cookie every 20 requests
        if (this.requestCount % 20 === 0) {
            this.cookie = generatePseudoCookie();
            this.httpClient.defaults.headers['Cookie'] = this.cookie;
        }
    }

    private async fetchWithRetry(url: string, params: Record<string, any>, maxRetries = 6): Promise<string | null> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Rotate headers
                this.rotateHeaders();

                // Random jitter delay between requests (150-500ms normal, more after errors)
                if (attempt === 1) {
                    await randomDelay(100, 400);
                }

                const response = await this.httpClient.get(url, { params, responseType: 'text' });

                if (response.status === 429) {
                    // Rate limited — aggressive backoff with jitter
                    const baseDelay = 5000 * attempt;
                    const jitter = Math.floor(Math.random() * 3000);
                    console.log(`[Scraper] 429 Rate limited, waiting ${(baseDelay + jitter) / 1000}s...`);
                    await sleep(baseDelay + jitter);
                    continue;
                }
                if (response.status === 403) {
                    // Forbidden — likely IP blocked, wait longer
                    console.log(`[Scraper] 403 Forbidden, waiting ${5 * attempt}s...`);
                    await sleep(5000 * attempt);
                    continue;
                }
                if (response.status >= 400) {
                    await sleep(Math.pow(2, attempt) * 1000);
                    continue;
                }

                const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
                if (!text || text.length < 10) { await sleep(1000); continue; }
                return text;
            } catch (err: any) {
                const code = err?.response?.status || err?.code;
                if (code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
                    // Network error — wait and retry
                    console.log(`[Scraper] Network error (${code}), waiting ${3 * attempt}s...`);
                    await sleep(3000 * attempt);
                } else {
                    if (attempt >= maxRetries) return null;
                    await sleep(Math.min(Math.pow(2, attempt) * 1000, 10000));
                }
            }
        }
        return null;
    }

    async search(query: string, start: number, opts?: {
        lat?: number | null; lng?: number | null;
        radius?: string; hl?: string; gl?: string;
    }): Promise<{ places: Place[]; morePlaces: boolean }> {
        const params: Record<string, any> = {
            q: query, start,
            hl: opts?.hl ?? 'en', gl: opts?.gl ?? 'en',
            client: 'earth-client', cv: randomCV(),
            useragent: this.httpClient.defaults.headers['User-Agent'],
            output: 'xml',
        };
        if (opts?.lat && opts?.lng) {
            params.lat = opts.lat;
            params.lng = opts.lng;
            params.radius = opts.radius ?? '5000';
        }
        const xmlData = await this.fetchWithRetry(SEARCH_URL, params);
        return this.parseXml(xmlData);
    }

    async fetchEntityDetails(featureId: string): Promise<Partial<Place> | null> {
        if (!featureId) return null;
        const html = await this.fetchWithRetry(ENTITY_URL, {
            lat: 0, lng: 0, fid: featureId,
            hl: 'tr', gl: 'tr', client: 'earth-client', cv: '7.3.6.9796',
        });
        if (!html) return null;
        return this.parseEntityHtml(html);
    }

    private parseXml(xmlData: string | null): { places: Place[]; morePlaces: boolean } {
        if (!xmlData) return { places: [], morePlaces: false };
        try {
            const parsed = xmlParser.parse(xmlData);
            const omnibox = parsed?.RootElement?.omnibox_content
                ?? parsed?.kml?.Document?.omnibox_content
                ?? parsed?.omnibox_content;
            if (!omnibox) return { places: [], morePlaces: false };

            const morePlaces = omnibox['@_more_place_cards_available'] === 'true';
            let entries = omnibox?.omnibox_entry;
            if (!entries) return { places: [], morePlaces: false };
            if (!Array.isArray(entries)) entries = [entries];

            const places: Place[] = [];
            for (const entry of entries) {
                const card = entry?.place_card;
                if (!card) continue;

                let address: string | null = null;
                if (card.address_line) {
                    const lines = Array.isArray(card.address_line) ? card.address_line : [card.address_line];
                    address = lines.filter(Boolean).join(', ') || null;
                }

                let url: string | null = null;
                if (card.authority_page_link?.url) {
                    let rawUrl = String(card.authority_page_link.url).replace(/&amp;/g, '&');
                    try { url = decodeURIComponent((rawUrl.split('/url?q=').pop() ?? rawUrl).split('&opi=')[0]); }
                    catch { url = rawUrl; }
                }

                const ratingObj = card.rating;
                const rating_score = ratingObj?.['@_num_rating_stars'] ? parseFloat(ratingObj['@_num_rating_stars']) : 0;
                let review_count = 0;
                if (ratingObj?.review_count?.anchor_text) {
                    review_count = parseInt(String(ratingObj.review_count.anchor_text).split(' ')[0].replace(/,/g, '')) || 0;
                }

                places.push({
                    title: card.title ?? '',
                    address,
                    phone_number: card.phone_number ?? null,
                    feature_id: card.feature_id ?? null,
                    url, rating_score, review_count,
                    website: url,  // search sonucundan gelen URL = işletme website'i
                });
            }
            return { places, morePlaces };
        } catch (err: any) {
            console.error(`[Scraper] XML parse error: ${err.message}`);
            return { places: [], morePlaces: false };
        }
    }

    private parseEntityHtml(html: string): Partial<Place> {
        const $ = cheerio.load(html);
        const details: Partial<Place> = {};
        const category = $('span.Qfo35d').text();
        if (category) details.category = category;

        const mapLink = $('div.jK1Lre a[href]').filter(function () {
            return /Google Haritalar|Google Maps/i.test($(this).text());
        });
        if (mapLink.length) {
            const match = (mapLink.attr('href') ?? '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (match) { details.latitude = parseFloat(match[1]); details.longitude = parseFloat(match[2]); }
        }

        const hoursDiv = $('div.I8mXcb');
        if (hoursDiv.length) {
            const hours: string[] = [];
            hoursDiv.find('div.WgFkxc').each(function () {
                const day = $(this).find('div.G8aQO').text();
                const time = $(this).find('div.K8qqBd').text();
                if (day && time) hours.push(`${day}: ${time}`);
            });
            if (hours.length) details.working_hours = hours;
        }

        const websiteLink = $('a').filter(function () { return /Web sitesi|Website|Siteyi ziyaret|Visit site/i.test($(this).text()); });
        if (websiteLink.length) {
            details.website = websiteLink.attr('href') ?? null;
        } else {
            // Fallback: authority_page class'ından bul
            const authorityLink = $('a.authority_page_link, a[data-url], a.ab_button').filter(function () {
                const href = $(this).attr('href') ?? '';
                return href.startsWith('http') && !href.includes('google.com');
            });
            if (authorityLink.length) details.website = authorityLink.first().attr('href') ?? null;
        }

        return details;
    }
}

// ============================================
// Task & Helpers
// ============================================

interface ScrapeTask {
    query: string;
    label: string;
    lat: number | null;
    lng: number | null;
    radius: string | undefined;
    hl: string;
    gl: string;
    /** Adres filtreleme terimleri (il/ilçe isimleri, lowercase+normalize) */
    filterTerms: string[];
}

/** Türkçe karakterleri normalize et */
function normalizeText(text: string): string {
    return text.toLowerCase()
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
        .replace(/Ç/g, 'c').replace(/Ğ/g, 'g').replace(/İ/g, 'i')
        .replace(/Ö/g, 'o').replace(/Ş/g, 's').replace(/Ü/g, 'u');
}

/** Adresin seçili il/ilçeye ait olup olmadığını kontrol et */
function matchesLocation(address: string | null, filterTerms: string[]): boolean {
    if (!filterTerms.length) return true; // filtre yoksa hepsini kabul et
    if (!address) return false; // adres yoksa reddet
    const normalized = normalizeText(address);
    return filterTerms.some(term => normalized.includes(term));
}

function buildQueryVariants(keyword: string, locName: string): string[] {
    return [
        `${keyword} ${locName}`,
        `${keyword} in ${locName}`,
        `${locName} ${keyword}`,
        `${keyword} near ${locName}`,
        `best ${keyword} ${locName}`,
        `${keyword} around ${locName}`,
    ];
}

function jitterCoords(lat: number, lng: number, offset = 0.015): { lat: number; lng: number }[] {
    return [
        { lat, lng },
        { lat: lat + offset, lng },
        { lat: lat - offset, lng },
        { lat, lng: lng + offset },
        { lat, lng: lng - offset },
        { lat: lat + offset, lng: lng + offset },
        { lat: lat - offset, lng: lng - offset },
    ];
}

const SEARCH_RADII = ['2000', '5000', '10000', '20000'];
const SEARCH_LANGS: { hl: string; gl: string }[] = [
    { hl: 'tr', gl: 'tr' },
    { hl: 'en', gl: 'en' },
];

// ============================================
// Scraper Manager
// ============================================

class ScraperManager {
    private win: BrowserWindow | null = null;
    private isRunning = false;
    private shouldStop = false;
    private seenFeatureIds = new Set<string>();
    private seenTitles = new Set<string>();
    private seenPhoneKeys = new Set<string>();  // title+phone dedup
    private totalResults = 0;
    private proxyList: string[] = [];
    private proxyIndex = 0;
    private semaphore!: Semaphore;
    // Auto-save
    private allResults: Place[] = [];
    private lastAutoSaveCount = 0;
    private currentLabel = '';

    setWindow(win: BrowserWindow) { this.win = win; }

    registerHandlers() {
        ipcMain.handle('scraper:start', async (_, options: ScraperOptions) => this.start(options));
        ipcMain.handle('scraper:stop', () => this.stop());
    }

    private async start(options: ScraperOptions) {
        if (this.isRunning) return { success: false, message: 'Scraper zaten çalışıyor' };

        this.isRunning = true;
        this.shouldStop = false;
        this.seenFeatureIds.clear();
        this.seenTitles.clear();
        this.seenPhoneKeys.clear();
        this.totalResults = 0;
        this.allResults = [];
        this.lastAutoSaveCount = 0;
        this.currentLabel = '';

        // Proxy setup
        if (options.proxy.mode === 'rotating' && options.proxy.rotatingProxy) {
            this.proxyList = [options.proxy.rotatingProxy];
        } else if (options.proxy.mode === 'sticky' && options.proxy.stickyProxies.length > 0) {
            this.proxyList = options.proxy.stickyProxies;
        } else {
            this.proxyList = [];
        }
        this.proxyIndex = 0;
        this.semaphore = new Semaphore(options.maxConcurrent);

        const tasks = this.buildTasks(options);
        const totalTasks = tasks.length;

        console.log(`[Scraper] ${options.keywords.length} kw × ${options.locations.length || 1} loc → ${totalTasks} tasks`);

        this.emitProgress({ status: 'running', currentQuery: '', processedQueries: 0, totalQueries: totalTasks, totalResults: 0 });

        try {
            let completed = 0;

            const promises = tasks.map(async (task) => {
                if (this.shouldStop) return;
                await this.semaphore.acquire();
                try {
                    if (this.shouldStop) return;
                    await this.runTask(task, options);
                } finally {
                    this.semaphore.release();
                    completed++;
                    if (completed % 10 === 0 || completed === totalTasks) {
                        this.emitProgress({
                            status: 'running', currentQuery: task.label,
                            processedQueries: completed, totalQueries: totalTasks,
                            totalResults: this.totalResults,
                        });
                    }
                }
            });

            await Promise.all(promises);

            this.emitProgress({
                status: this.shouldStop ? 'stopped' : 'completed',
                currentQuery: '', processedQueries: totalTasks, totalQueries: totalTasks,
                totalResults: this.totalResults,
                message: this.shouldStop ? 'Durduruldu' : `Tamamlandı! ${this.totalResults} sonuç bulundu`,
            });
            this.win?.webContents.send('scraper:complete', { totalResults: this.totalResults });
        } catch (err: any) {
            console.error(`[Scraper] Fatal: ${err.message}`);
            this.emitProgress({
                status: 'error', currentQuery: '', processedQueries: 0,
                totalQueries: totalTasks, totalResults: this.totalResults,
                message: `Hata: ${err.message}`,
            });
        } finally {
            this.isRunning = false;
        }

        return { success: true, totalResults: this.totalResults };
    }

    /** Flat task listesi oluştur — her task = tek bir paginated arama */
    private buildTasks(options: ScraperOptions): ScrapeTask[] {
        const tasks: ScrapeTask[] = [];

        // Filtre terimleri: seçilen il + tüm lokasyon isimleri
        const buildFilterTerms = (locName?: string): string[] => {
            const terms: string[] = [];
            if (options.filterState) terms.push(normalizeText(options.filterState));
            if (locName) terms.push(normalizeText(locName));
            return terms;
        };

        for (const keyword of options.keywords) {
            if (options.locations.length === 0) {
                tasks.push({ query: keyword, label: keyword, lat: null, lng: null, radius: undefined, hl: 'en', gl: 'en', filterTerms: [] });
                continue;
            }

            for (const loc of options.locations) {
                const label = `${keyword} ${loc.name}`;
                const filterTerms = buildFilterTerms(loc.name);

                // 1) Metin varyasyonları (koordinatsız)
                for (const v of buildQueryVariants(keyword, loc.name)) {
                    tasks.push({ query: v, label, lat: null, lng: null, radius: undefined, hl: 'en', gl: 'en', filterTerms });
                }

                // 2) Koordinatlı: radius × dil × jitter
                const jitters = jitterCoords(loc.lat, loc.lng);
                for (const lang of SEARCH_LANGS) {
                    for (const radius of SEARCH_RADII) {
                        for (const point of jitters) {
                            tasks.push({
                                query: keyword, label,
                                lat: point.lat, lng: point.lng,
                                radius, hl: lang.hl, gl: lang.gl, filterTerms,
                            });
                        }
                    }
                }
            }
        }

        return tasks;
    }

    /** Tek bir flat task = paginated arama */
    private async runTask(task: ScrapeTask, options: ScraperOptions) {
        const client = new GoogleEarthClient(this.getNextProxy());
        let morePlaces = true;
        let start = 0;
        let retries = 0;
        let pageCount = 0;
        let emptyStreak = 0;

        while (morePlaces && retries < 3 && pageCount < options.maxPages) {
            if (this.shouldStop) return;

            try {
                const result = await client.search(task.query, start, {
                    lat: task.lat, lng: task.lng,
                    radius: task.radius, hl: task.hl, gl: task.gl,
                });
                pageCount++;

                if (!result.places.length) {
                    emptyStreak++;
                    retries++;
                    if (emptyStreak >= 2) break;
                    continue;
                }

                emptyStreak = 0;
                retries = 0;
                start += result.places.length;
                morePlaces = result.morePlaces;

                const unique = result.places.filter(p => {
                    // Feature ID dedup
                    if (p.feature_id) {
                        if (this.seenFeatureIds.has(p.feature_id)) return false;
                        this.seenFeatureIds.add(p.feature_id);
                    }
                    // Title+Address dedup
                    const key = `${p.title}|${p.address}`;
                    if (this.seenTitles.has(key)) return false;
                    this.seenTitles.add(key);
                    // Title+Phone dedup (güçlendirilmiş)
                    if (p.phone_number) {
                        const phoneKey = `${p.title}|${p.phone_number}`;
                        if (this.seenPhoneKeys.has(phoneKey)) return false;
                        this.seenPhoneKeys.add(phoneKey);
                    }
                    return true;
                });

                // Adres filtreleme — seçilen il/ilçeyle eşleşmeyen sonuçları at
                const filtered = task.filterTerms.length > 0
                    ? unique.filter(p => matchesLocation(p.address, task.filterTerms))
                    : unique;

                // Veri filtreleme (requirePhone, requireWebsite, minRating, minReviews)
                const qualityFiltered = filtered.filter(p => {
                    if (options.filters.requirePhone && !p.phone_number) return false;
                    if (options.filters.requireWebsite && !p.website) return false;
                    if (options.filters.minRating > 0 && p.rating_score < options.filters.minRating) return false;
                    if (options.filters.minReviews > 0 && p.review_count < options.filters.minReviews) return false;
                    return true;
                });

                if (!qualityFiltered.length) {
                    if (pageCount >= 3) break;
                    continue;
                }

                if (options.fetchDetails) {
                    await Promise.all(qualityFiltered.map(async (p) => {
                        if (!p.feature_id) return;
                        try {
                            const d = await client.fetchEntityDetails(p.feature_id);
                            if (d) Object.assign(p, d);
                        } catch { }
                    }));
                }

                for (const place of qualityFiltered) {
                    place.query = task.label;
                    this.totalResults++;
                    this.allResults.push(place);
                    this.win?.webContents.send('scraper:data', place);
                }

                // Auto-save kontrolü
                this.checkAutoSave(options, task.label);

                await sleep(120);
            } catch {
                retries++;
                if (retries >= 3) break;
                await sleep(800);
            }
        }
    }

    private stop() {
        if (!this.isRunning) return { success: false, message: 'Scraper çalışmıyor' };
        this.shouldStop = true;
        return { success: true };
    }

    private emitProgress(p: ScraperProgress) {
        this.win?.webContents.send('scraper:progress', p);
    }

    private getNextProxy(): string | null {
        if (!this.proxyList.length) return null;
        const proxy = this.proxyList[this.proxyIndex];
        this.proxyIndex = (this.proxyIndex + 1) % this.proxyList.length;
        return proxy;
    }

    /** Auto-save kontrolü ve CSV yazma */
    private checkAutoSave(options: ScraperOptions, label: string) {
        if (options.autoSave.mode === 'off') return;

        let shouldSave = false;
        let suffix = '';

        if (options.autoSave.mode === 'per-count') {
            const threshold = options.autoSave.count || 5000;
            if (this.allResults.length - this.lastAutoSaveCount >= threshold) {
                shouldSave = true;
                suffix = `_${this.allResults.length}`;
            }
        } else if (options.autoSave.mode === 'per-district' || options.autoSave.mode === 'per-state') {
            // Label değiştiğinde kaydet (ilçe/il değişimi)
            if (this.currentLabel && this.currentLabel !== label && this.allResults.length > this.lastAutoSaveCount) {
                shouldSave = true;
                suffix = `_${normalizeText(this.currentLabel).replace(/\s+/g, '_')}`;
            }
        }

        this.currentLabel = label;

        if (shouldSave) {
            this.saveCSV(suffix);
            this.lastAutoSaveCount = this.allResults.length;
        }
    }

    /** CSV dosyası kaydet */
    private saveCSV(suffix: string = '') {
        try {
            const date = new Date().toISOString().slice(0, 10);
            const fileName = `scraper_${date}${suffix}.csv`;
            const savePath = join(app.getPath('desktop'), fileName);

            const headers = ['Name', 'Address', 'Phone', 'Rating', 'Reviews', 'Category', 'Website', 'URL', 'Query'];
            const rows = this.allResults.map(p => [
                p.title, p.address ?? '', p.phone_number ?? '', p.rating_score?.toString(),
                p.review_count?.toString(), p.category ?? '', p.website ?? '', p.url ?? '', p.query ?? '',
            ]);
            const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
            writeFileSync(savePath, '\ufeff' + csv, 'utf-8');

            console.log(`[AutoSave] ${this.allResults.length} results saved to ${savePath}`);
            this.win?.webContents.send('scraper:autosave', { path: savePath, count: this.allResults.length });
        } catch (err: any) {
            console.error(`[AutoSave] Error: ${err.message}`);
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const scraperManager = new ScraperManager();
