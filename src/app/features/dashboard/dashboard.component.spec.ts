import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { DashboardComponent } from './dashboard.component';
import { MarketDataService } from '../../core/market-data.service';
import { SUPABASE_CLIENT } from '../../core/supabase.token';

// ─── Market service mock ──────────────────────────────────────────────────────

const mockStocks = signal<any[]>([]);
const mockCurrencies = signal<any[]>([]);
const mockMetals = signal<any[]>([]);
const mockCrypto = signal<any[]>([]);
const mockLoading = signal(false);
const mockError = signal<string | null>(null);

const mkMarket = (connected = false) => ({
  stocks: mockStocks,
  currencies: mockCurrencies,
  metals: mockMetals,
  crypto: mockCrypto,
  loading: mockLoading,
  error: mockError,
  flashingIds: signal<Map<string, 'up' | 'down'>>(new Map()),
  connected,
});

const FIXED_DATE = new Date('2026-01-15T12:00:00.000Z');

const SAMPLE_STOCK = {
  id: 's1', symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ',
  currency: 'USD', price: 213.49, change: 1.23, change_percent: 0.58,
  open: 212.00, previous_close: 212.26, high_24h: 214.50, low_24h: 211.80,
  volume: 54320000, market_cap: 3240000000000, updated_at: '2026-01-15T12:00:00Z',
};

const SAMPLE_STOCK_DOWN = {
  id: 's2', symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ',
  currency: 'USD', price: 248.23, change: -4.50, change_percent: -1.78,
  open: 252.00, previous_close: 252.73, high_24h: 253.00, low_24h: 246.00,
  volume: 89400000, market_cap: 793000000000, updated_at: '2026-01-15T12:00:00Z',
};

const SAMPLE_CRYPTO = {
  id: 'c1', symbol: 'BTC', name: 'Bitcoin', price_usd: 67250.12,
  change_24h: 1234.56, change_percent_24h: 1.87, high_24h: 68100, low_24h: 66800,
  volume_24h: 28500000000, market_cap: 1320000000000, market_cap_rank: 1,
  ath: 73750, ath_date: '2024-03-14T00:00:00Z', updated_at: '2026-01-15T12:00:00Z',
};

const SAMPLE_METAL_TROY = {
  id: 'm1', metal: 'gold', unit: 'troy_oz', currency: 'USD', price: 2320.50,
  change: 8.40, change_percent: 0.36, bid: 2320.00, ask: 2321.00,
  high_24h: 2328.00, low_24h: 2308.00, updated_at: '2026-01-15T12:00:00Z',
};

const SAMPLE_METAL_GRAM = {
  id: 'm2', metal: 'gold', unit: 'gram', currency: 'USD', price: 74.59,
  change: 0.27, change_percent: 0.36, bid: 74.57, ask: 74.61,
  high_24h: 74.86, low_24h: 74.24, updated_at: '2026-01-15T12:00:00Z',
};

const SAMPLE_CURRENCY = {
  id: 'fx1', base_currency: 'USD', quote_currency: 'EUR', rate: 0.92450,
  change: 0.00120, change_percent: 0.13, bid: 0.92440, ask: 0.92460,
  high_24h: 0.92600, low_24h: 0.92100, updated_at: '2026-01-15T12:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────

describe('DashboardComponent — market data panels', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  async function setup(connected = false) {
    mockStocks.set([]);
    mockCurrencies.set([]);
    mockMetals.set([]);
    mockCrypto.set([]);
    mockLoading.set(false);
    mockError.set(null);
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SUPABASE_CLIENT, useValue: null },
        { provide: MarketDataService, useValue: mkMarket(connected) },
        { provide: Date, useValue: FIXED_DATE },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => localStorage.clear());

  // ─── Creation & structure ─────────────────────────────────────────────────

  it('should create the component', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should render the dashboard title in an h1', async () => {
    await setup();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Market');
  });

  it('should render exactly 4 market panels by default', async () => {
    await setup();
    const panels = fixture.nativeElement.querySelectorAll('.app-panel');
    expect(panels.length).toBe(4);
  });

  it('should render panel drag-handle titles for all 4 asset classes', async () => {
    await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Stocks');
    expect(text).toContain('Currencies');
    expect(text).toContain('Precious Metals');
    expect(text).toContain('Cryptocurrency');
  });

  // ─── Connection states ────────────────────────────────────────────────────

  it('should show offline message when Supabase is not connected', async () => {
    await setup(false);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Configure Supabase credentials');
  });

  it('should NOT show offline message when connected', async () => {
    await setup(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Configure Supabase credentials');
  });

  it('should render skeleton placeholders when connected and loading', async () => {
    await setup(true);
    mockLoading.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const skeletons = el.querySelectorAll('.skeleton-table, .skeleton-metals');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show error message when connected but fetch failed', async () => {
    await setup(true);
    mockError.set('Connection timeout');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Connection timeout');
  });

  // ─── Stocks panel ─────────────────────────────────────────────────────────

  it('should render a stock row from the stocks signal', async () => {
    await setup(true);
    mockStocks.set([SAMPLE_STOCK]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('AAPL');
    expect(el.textContent).toContain('Apple Inc.');
  });

  it('should apply .price-up for a positive change_percent', async () => {
    await setup(true);
    mockStocks.set([SAMPLE_STOCK]); // change_percent: 0.58
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.price-up');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should apply .price-down for a negative change_percent', async () => {
    await setup(true);
    mockStocks.set([SAMPLE_STOCK_DOWN]); // change_percent: -1.78
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.price-down');
    expect(cells.length).toBeGreaterThan(0);
  });

  // ─── Currencies panel ─────────────────────────────────────────────────────

  it('should render a currency pair from the currencies signal', async () => {
    await setup(true);
    mockCurrencies.set([SAMPLE_CURRENCY]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('USD/EUR');
  });

  // ─── Metals panel ─────────────────────────────────────────────────────────

  it('should render only troy_oz metals in the metals panel', async () => {
    await setup(true);
    mockMetals.set([SAMPLE_METAL_TROY, SAMPLE_METAL_GRAM]); // gram row must be filtered
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.metal-card');
    expect(cards.length).toBe(1);
  });

  it('should display gold price in the metals panel', async () => {
    await setup(true);
    mockMetals.set([SAMPLE_METAL_TROY]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Gold');
  });

  // ─── Crypto panel ─────────────────────────────────────────────────────────

  it('should render a crypto row from the crypto signal', async () => {
    await setup(true);
    mockCrypto.set([SAMPLE_CRYPTO]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('BTC');
    expect(el.textContent).toContain('Bitcoin');
  });

  // ─── fmtCap helper ────────────────────────────────────────────────────────

  it('fmtCap formats trillions correctly', async () => {
    await setup();
    expect((component as any).fmtCap(1_320_000_000_000)).toBe('$1.32T');
  });

  it('fmtCap formats billions correctly', async () => {
    await setup();
    expect((component as any).fmtCap(82_000_000_000)).toBe('$82.00B');
  });

  it('fmtCap formats millions correctly', async () => {
    await setup();
    expect((component as any).fmtCap(5_200_000)).toBe('$5.20M');
  });

  it('fmtCap returns "—" for null', async () => {
    await setup();
    expect((component as any).fmtCap(null)).toBe('—');
  });

  // ─── fmtVol helper ────────────────────────────────────────────────────────

  it('fmtVol formats billions correctly', async () => {
    await setup();
    expect((component as any).fmtVol(28_500_000_000)).toBe('28.50B');
  });

  it('fmtVol formats millions correctly', async () => {
    await setup();
    expect((component as any).fmtVol(380_000_000)).toBe('380.00M');
  });

  it('fmtVol returns "—" for null', async () => {
    await setup();
    expect((component as any).fmtVol(null)).toBe('—');
  });

  // ─── Widget zone ──────────────────────────────────────────────────────────

  it('should show the empty-state message when no widgets are loaded', async () => {
    await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No widgets on the dashboard yet');
  });

  it('should expose only "welcome" and "activity" widget types in the toolbar', async () => {
    await setup();
    const btns = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.widget-toolbar__btn:not(.widget-toolbar__btn--reset)',
    );
    // One button per type in widgetTypes
    expect(btns.length).toBe(2);
  });
});
