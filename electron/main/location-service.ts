import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================
// Veri Tipleri
// ============================================

interface RawCountry {
    id: number;
    name: string;
    iso2: string;
    emoji: string;
    translations?: Record<string, string>;
    states: RawState[];
}

interface RawState {
    id: number;
    name: string;
    state_code: string;
    latitude: string;
    longitude: string;
    cities: RawCity[];
}

interface RawCity {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
}

export interface CountryInfo {
    id: number;
    name: string;
    iso2: string;
    emoji: string;
    stateCount: number;
}

export interface StateInfo {
    id: number;
    name: string;
    lat: number;
    lng: number;
    cityCount: number;
}

export interface CityInfo {
    id: number;
    name: string;
    lat: number;
    lng: number;
}

// ============================================
// Location Service
// ============================================

class LocationService {
    private data: RawCountry[] = [];
    private loaded = false;

    /** JSON dosyasını yükle */
    load(appPath: string) {
        if (this.loaded) return;

        try {
            // Dosya konumunu kontrol et
            const possiblePaths = [
                join(appPath, 'countries+states+cities.json'),
                join(process.cwd(), 'countries+states+cities.json'),
                join(__dirname, '../../countries+states+cities.json'),
            ];

            let rawData: string | null = null;
            for (const p of possiblePaths) {
                try {
                    rawData = readFileSync(p, 'utf-8');
                    console.log(`[Location] Loaded from: ${p}`);
                    break;
                } catch { /* try next */ }
            }

            if (!rawData) {
                console.error('[Location] countries+states+cities.json not found!');
                return;
            }

            this.data = JSON.parse(rawData);
            this.loaded = true;
            console.log(`[Location] ${this.data.length} countries loaded`);
        } catch (err: any) {
            console.error(`[Location] Load error: ${err.message}`);
        }
    }

    /** IPC handler'ları kayıt et */
    registerHandlers() {
        // Ülke listesi
        ipcMain.handle('location:countries', () => {
            return this.getCountries();
        });

        // Seçili ülkenin illeri
        ipcMain.handle('location:states', (_, countryId: number) => {
            return this.getStates(countryId);
        });

        // Seçili ilin ilçeleri
        ipcMain.handle('location:cities', (_, countryId: number, stateId: number) => {
            return this.getCities(countryId, stateId);
        });

        // Tüm ülke tarama: ülkedeki tüm şehirleri döndür
        ipcMain.handle('location:allCities', (_, countryId: number) => {
            return this.getAllCitiesForCountry(countryId);
        });
    }

    /** Ülke listesi */
    getCountries(): CountryInfo[] {
        return this.data.map(c => ({
            id: c.id,
            name: c.name,
            iso2: c.iso2,
            emoji: c.emoji,
            stateCount: c.states?.length ?? 0,
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    /** İl listesi */
    getStates(countryId: number): StateInfo[] {
        const country = this.data.find(c => c.id === countryId);
        if (!country) return [];

        return (country.states ?? []).map(s => ({
            id: s.id,
            name: s.name,
            lat: parseFloat(s.latitude) || 0,
            lng: parseFloat(s.longitude) || 0,
            cityCount: s.cities?.length ?? 0,
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    /** İlçe listesi */
    getCities(countryId: number, stateId: number): CityInfo[] {
        const country = this.data.find(c => c.id === countryId);
        if (!country) return [];

        const state = country.states?.find(s => s.id === stateId);
        if (!state) return [];

        return (state.cities ?? []).map(c => ({
            id: c.id,
            name: c.name,
            lat: parseFloat(c.latitude) || 0,
            lng: parseFloat(c.longitude) || 0,
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    /** Ülkedeki TÜM illerin şehirlerini döndür (tüm ülke tarama için) */
    getAllCitiesForCountry(countryId: number): { name: string; lat: number; lng: number; stateName: string }[] {
        const country = this.data.find(c => c.id === countryId);
        if (!country) return [];

        const allCities: { name: string; lat: number; lng: number; stateName: string }[] = [];

        for (const state of (country.states ?? [])) {
            // İl merkezini ekle
            const stateLat = parseFloat(state.latitude) || 0;
            const stateLng = parseFloat(state.longitude) || 0;
            if (stateLat && stateLng) {
                allCities.push({ name: state.name, lat: stateLat, lng: stateLng, stateName: state.name });
            }

            // İlçeleri ekle
            for (const city of (state.cities ?? [])) {
                const lat = parseFloat(city.latitude) || 0;
                const lng = parseFloat(city.longitude) || 0;
                if (lat && lng) {
                    allCities.push({ name: city.name, lat, lng, stateName: state.name });
                }
            }
        }

        return allCities;
    }
}

export const locationService = new LocationService();
