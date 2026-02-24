// Internationalization (i18n) module

export type Language = 'en' | 'tr';

export interface Translations {
    login: {
        title: string;
        subtitle: string;
        tabLogin: string;
        tabRegister: string;
        tabForgot: string;
        licenseKey: string;
        licensePlaceholder: string;
        username: string;
        usernamePlaceholder: string;
        password: string;
        passwordPlaceholder: string;
        email: string;
        emailPlaceholder: string;
        loginButton: string;
        registerButton: string;
        resetButton: string;
        checking: string;
        success: string;
        error: string;
        registerSuccess: string;
        resetSuccess: string;
        forgotLink: string;
        backToLogin: string;
        noAccount: string;
        hasAccount: string;
        poweredBy: string;
    };
    main: {
        title: string;
        subtitle: string;
        logout: string;
        welcome: string;
    };
    scraper: {
        // Keywords
        keywords: string;
        keywordPlaceholder: string;
        keywordHelp: string;
        // Location
        location: string;
        country: string;
        countryPlaceholder: string;
        state: string;
        statePlaceholder: string;
        city: string;
        cityPlaceholder: string;
        selectAllCities: string;
        deselectAll: string;
        selectedCities: string;
        noCountry: string;
        // Controls
        startButton: string;
        stopButton: string;
        exportCSV: string;
        clearResults: string;
        // Options
        options: string;
        fetchDetails: string;
        fetchDetailsHelp: string;
        maxPages: string;
        maxConcurrent: string;
        // Progress
        statusIdle: string;
        statusRunning: string;
        statusStopped: string;
        statusCompleted: string;
        statusError: string;
        processedQueries: string;
        totalResults: string;
        totalQueries: string;
        // Table
        results: string;
        noResults: string;
        columnName: string;
        columnAddress: string;
        columnPhone: string;
        columnRating: string;
        columnReviews: string;
        columnCategory: string;
        columnWebsite: string;
        columnQuery: string;
    };
    settings: {
        title: string;
        // Proxy
        proxyTitle: string;
        proxyMode: string;
        proxyNone: string;
        proxyRotating: string;
        proxySticky: string;
        proxyRotatingUrl: string;
        proxyRotatingPlaceholder: string;
        proxyStickyList: string;
        proxyStickyPlaceholder: string;
        proxyStickyHelp: string;
        // Auto-Save
        autoSaveTitle: string;
        autoSaveMode: string;
        autoSaveOff: string;
        autoSavePerDistrict: string;
        autoSavePerState: string;
        autoSavePerCount: string;
        autoSaveCount: string;
        autoSaveCountHelp: string;
        saveFolder: string;
        selectFolder: string;
        defaultDesktop: string;
        // Filters
        filterTitle: string;
        requirePhone: string;
        requirePhoneHelp: string;
        requireWebsite: string;
        requireWebsiteHelp: string;
        minRating: string;
        minRatingHelp: string;
        minReviews: string;
        minReviewsHelp: string;
        // Actions
        close: string;
    };
    dataTable: {
        searchPlaceholder: string;
        allCities: string;
        hasPhone: string;
        hasWebsite: string;
        sortAsc: string;
        sortDesc: string;
        showingOf: string;
        // Export
        exportTitle: string;
        exportFiltered: string;
        exportAll: string;
        exportColumns: string;
        exportFormat: string;
        exportFileName: string;
        exportButton: string;
        cancel: string;
        // Stats
        avgRating: string;
        withPhone: string;
        withWebsite: string;
    };
    common: {
        required: string;
        error: string;
        success: string;
        loading: string;
        language: string;
    };
}

const en: Translations = {
    login: {
        title: 'Google Maps Scraper',
        subtitle: 'Google Maps data extraction tool',
        tabLogin: 'Login',
        tabRegister: 'Register',
        tabForgot: 'Reset Password',
        licenseKey: 'License key',
        licensePlaceholder: 'XXXX-XXXX-XXXX-XXXX',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        email: 'Email',
        emailPlaceholder: 'your@email.com',
        loginButton: 'Login',
        registerButton: 'Create Account',
        resetButton: 'Send Reset Link',
        checking: 'Please wait...',
        success: 'Success! Redirecting...',
        error: 'Error',
        registerSuccess: 'Account created! You can now login.',
        resetSuccess: 'Password reset link sent to your email.',
        forgotLink: 'Forgot password?',
        backToLogin: 'Back to login',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        poweredBy: 'lokalboost.co • v1.0',
    },
    main: {
        title: 'Google Maps Scraper',
        subtitle: 'Data Extraction Tool',
        logout: 'Logout',
        welcome: 'Welcome',
    },
    scraper: {
        keywords: 'Keywords',
        keywordPlaceholder: 'restaurant\ncafe\nhotel',
        keywordHelp: 'One keyword per line',
        location: 'Location',
        country: 'Country',
        countryPlaceholder: 'Select country...',
        state: 'State / Province',
        statePlaceholder: 'Select state...',
        city: 'City / District',
        cityPlaceholder: 'Select cities...',
        selectAllCities: 'Select All',
        deselectAll: 'Deselect All',
        selectedCities: 'selected',
        noCountry: 'Select a country first',
        startButton: 'Start Scraping',
        stopButton: 'Stop',
        exportCSV: 'Export CSV',
        clearResults: 'Clear',
        options: 'Options',
        fetchDetails: 'Fetch Details',
        fetchDetailsHelp: 'Category, hours, website (slower)',
        maxPages: 'Max Pages per Query',
        maxConcurrent: 'Concurrent Requests',
        statusIdle: 'Ready',
        statusRunning: 'Running...',
        statusStopped: 'Stopped',
        statusCompleted: 'Completed',
        statusError: 'Error',
        processedQueries: 'Processed',
        totalResults: 'Results',
        totalQueries: 'queries',
        results: 'Results',
        noResults: 'No results yet. Select location, enter keywords, and start.',
        columnName: 'Name',
        columnAddress: 'Address',
        columnPhone: 'Phone',
        columnRating: 'Rating',
        columnReviews: 'Reviews',
        columnCategory: 'Category',
        columnWebsite: 'Website',
        columnQuery: 'Query',
    },
    settings: {
        title: 'Settings',
        proxyTitle: 'Proxy',
        proxyMode: 'Proxy Mode',
        proxyNone: 'No Proxy',
        proxyRotating: 'Rotating Proxy',
        proxySticky: 'Sticky Proxies',
        proxyRotatingUrl: 'Proxy URL',
        proxyRotatingPlaceholder: 'http://user:pass@host:port',
        proxyStickyList: 'Proxy List',
        proxyStickyPlaceholder: 'http://user:pass@host:port\nOne per line...',
        proxyStickyHelp: 'One proxy per line',
        autoSaveTitle: 'Auto Save',
        autoSaveMode: 'Auto Save Mode',
        autoSaveOff: 'Off',
        autoSavePerDistrict: 'Per District',
        autoSavePerState: 'Per State',
        autoSavePerCount: 'Per Result Count',
        autoSaveCount: 'Save Every',
        autoSaveCountHelp: 'results',
        saveFolder: 'Save Folder',
        selectFolder: 'Select Folder',
        defaultDesktop: 'Desktop (default)',
        filterTitle: 'Data Filters',
        requirePhone: 'Require Phone',
        requirePhoneHelp: 'Skip businesses without phone number',
        requireWebsite: 'Require Website',
        requireWebsiteHelp: 'Skip businesses without website',
        minRating: 'Min Rating',
        minRatingHelp: '0 = disabled',
        minReviews: 'Min Reviews',
        minReviewsHelp: '0 = disabled',
        close: 'Close',
    },
    dataTable: {
        searchPlaceholder: 'Search name, address, phone...',
        allCities: 'All Cities',
        hasPhone: 'Has Phone',
        hasWebsite: 'Has Website',
        sortAsc: 'Sort ascending',
        sortDesc: 'Sort descending',
        showingOf: 'of',
        exportTitle: 'Export Data',
        exportFiltered: 'Export Filtered',
        exportAll: 'Export All',
        exportColumns: 'Columns',
        exportFormat: 'Format',
        exportFileName: 'File Name',
        exportButton: 'Export',
        cancel: 'Cancel',
        avgRating: 'Avg Rating',
        withPhone: 'With Phone',
        withWebsite: 'With Website',
    },
    common: {
        required: 'Required',
        error: 'Error',
        success: 'Success',
        loading: 'Loading...',
        language: 'Language',
    },
};

const tr: Translations = {
    login: {
        title: 'Google Maps Scraper',
        subtitle: 'Google Maps veri çekme aracı',
        tabLogin: 'Giriş',
        tabRegister: 'Kayıt Ol',
        tabForgot: 'Şifre Sıfırla',
        licenseKey: 'Lisans anahtarı',
        licensePlaceholder: 'XXXX-XXXX-XXXX-XXXX',
        username: 'Kullanıcı adı',
        usernamePlaceholder: 'Kullanıcı adınızı girin',
        password: 'Şifre',
        passwordPlaceholder: 'Şifrenizi girin',
        email: 'E-posta',
        emailPlaceholder: 'email@adresiniz.com',
        loginButton: 'Giriş Yap',
        registerButton: 'Hesap Oluştur',
        resetButton: 'Sıfırlama Linki Gönder',
        checking: 'Lütfen bekleyin...',
        success: 'Başarılı! Yönlendiriliyor...',
        error: 'Hata',
        registerSuccess: 'Hesap oluşturuldu! Şimdi giriş yapabilirsiniz.',
        resetSuccess: 'Şifre sıfırlama linki e-postanıza gönderildi.',
        forgotLink: 'Şifremi unuttum',
        backToLogin: 'Giriş ekranına dön',
        noAccount: 'Hesabınız yok mu?',
        hasAccount: 'Zaten hesabınız var mı?',
        poweredBy: 'lokalboost.co • v1.0',
    },
    main: {
        title: 'Google Maps Scraper',
        subtitle: 'Veri Çekme Aracı',
        logout: 'Çıkış',
        welcome: 'Hoş geldiniz',
    },
    scraper: {
        keywords: 'Anahtar Kelimeler',
        keywordPlaceholder: 'restoran\nkafe\notel',
        keywordHelp: 'Her satıra bir kelime',
        location: 'Konum',
        country: 'Ülke',
        countryPlaceholder: 'Ülke seçin...',
        state: 'İl / Eyalet',
        statePlaceholder: 'İl seçin...',
        city: 'İlçe / Şehir',
        cityPlaceholder: 'İlçe seçin...',
        selectAllCities: 'Tümünü Seç',
        deselectAll: 'Temizle',
        selectedCities: 'seçili',
        noCountry: 'Önce ülke seçin',
        startButton: 'Taramayı Başlat',
        stopButton: 'Durdur',
        exportCSV: 'CSV İndir',
        clearResults: 'Temizle',
        options: 'Seçenekler',
        fetchDetails: 'Detay Bilgisi Çek',
        fetchDetailsHelp: 'Kategori, saatler, website (yavaş)',
        maxPages: 'Sorgu Başına Maks. Sayfa',
        maxConcurrent: 'Eşzamanlı İstek',
        statusIdle: 'Hazır',
        statusRunning: 'Çalışıyor...',
        statusStopped: 'Durduruldu',
        statusCompleted: 'Tamamlandı',
        statusError: 'Hata',
        processedQueries: 'İşlenen',
        totalResults: 'Sonuç',
        totalQueries: 'sorgu',
        results: 'Sonuçlar',
        noResults: 'Henüz sonuç yok. Konum seçin, anahtar kelime girin ve başlatın.',
        columnName: 'İsim',
        columnAddress: 'Adres',
        columnPhone: 'Telefon',
        columnRating: 'Puan',
        columnReviews: 'Yorum',
        columnCategory: 'Kategori',
        columnWebsite: 'Website',
        columnQuery: 'Sorgu',
    },
    settings: {
        title: 'Ayarlar',
        proxyTitle: 'Proxy',
        proxyMode: 'Proxy Modu',
        proxyNone: 'Proxy Yok',
        proxyRotating: 'Rotating Proxy',
        proxySticky: 'Sticky Proxy',
        proxyRotatingUrl: 'Proxy URL',
        proxyRotatingPlaceholder: 'http://kullanıcı:şifre@host:port',
        proxyStickyList: 'Proxy Listesi',
        proxyStickyPlaceholder: 'http://kullanıcı:şifre@host:port\nHer satıra bir tane...',
        proxyStickyHelp: 'Her satıra bir proxy',
        autoSaveTitle: 'Otomatik Kayıt',
        autoSaveMode: 'Kayıt Modu',
        autoSaveOff: 'Kapalı',
        autoSavePerDistrict: 'Her İlçede',
        autoSavePerState: 'Her İlde',
        autoSavePerCount: 'Sonuç Sayısına Göre',
        autoSaveCount: 'Her',
        autoSaveCountHelp: 'sonuçta kaydet',
        saveFolder: 'Kayıt Klasörü',
        selectFolder: 'Klasör Seç',
        defaultDesktop: 'Masaüstü (varsayılan)',
        filterTitle: 'Veri Filtreleri',
        requirePhone: 'Telefon Zorunlu',
        requirePhoneHelp: 'Telefon numarası olmayan işletmeleri atla',
        requireWebsite: 'Website Zorunlu',
        requireWebsiteHelp: 'Website olmayan işletmeleri atla',
        minRating: 'Min Puan',
        minRatingHelp: '0 = devre dışı',
        minReviews: 'Min Yorum',
        minReviewsHelp: '0 = devre dışı',
        close: 'Kapat',
    },
    dataTable: {
        searchPlaceholder: 'İsim, adres, telefon ara...',
        allCities: 'Tüm Şehirler',
        hasPhone: 'Telefonu Var',
        hasWebsite: 'Website\'i Var',
        sortAsc: 'Artan sırala',
        sortDesc: 'Azalan sırala',
        showingOf: '/',
        exportTitle: 'Veriyi Dışa Aktar',
        exportFiltered: 'Filtrelenmişi Aktar',
        exportAll: 'Tümünü Aktar',
        exportColumns: 'Sütunlar',
        exportFormat: 'Format',
        exportFileName: 'Dosya Adı',
        exportButton: 'Dışa Aktar',
        cancel: 'İptal',
        avgRating: 'Ort. Puan',
        withPhone: 'Telefonlu',
        withWebsite: 'Websiteli',
    },
    common: {
        required: 'Zorunlu',
        error: 'Hata',
        success: 'Başarılı',
        loading: 'Yükleniyor...',
        language: 'Dil',
    },
};

export const translations: Record<Language, Translations> = { en, tr };
export const getTranslations = (lang: Language): Translations => translations[lang];
