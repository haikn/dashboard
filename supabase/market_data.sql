-- ============================================================
-- Supabase Real-Time Market Data Schema
-- ============================================================
-- Tables
--   stocks           → stock prices (one row per ticker, upserted)
--   currencies       → forex rates  (one row per pair,   upserted)
--   precious_metals  → gold / silver / platinum / palladium
--   crypto           → crypto prices (one row per symbol, upserted)
--   price_ticks      → unified time-series for charts & history
--
-- Features
--   • Row Level Security (RLS) — anyone can read, only service_role can write
--   • Real-time pub/sub via supabase_realtime publication
--   • Indexes for symbol lookups and time-range queries
--   • Idempotent — safe to run multiple times (IF NOT EXISTS)
--   • Upsert-ready — unique constraints on natural keys
-- ============================================================


-- ============================================================
-- 0. HELPER — auto-refresh updated_at on every UPDATE
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 1. STOCKS
-- ============================================================
create table if not exists stocks (
  id              uuid           primary key default gen_random_uuid(),
  symbol          text           not null unique,          -- 'AAPL', 'TSLA'
  name            text           not null,                 -- 'Apple Inc.'
  exchange        text,                                    -- 'NASDAQ', 'NYSE', 'LSE'
  currency        text           not null default 'USD',
  price           numeric(18,4)  not null,
  change          numeric(18,4),                           -- absolute Δ from prev close
  change_percent  numeric(8,4),                            -- % Δ from prev close
  open            numeric(18,4),
  previous_close  numeric(18,4),
  high_24h        numeric(18,4),
  low_24h         numeric(18,4),
  volume          bigint,
  market_cap      numeric(28,2),
  updated_at      timestamptz    not null default now()
);

create index if not exists idx_stocks_symbol   on stocks (symbol);
create index if not exists idx_stocks_exchange on stocks (exchange);
create index if not exists idx_stocks_updated  on stocks (updated_at desc);

create or replace trigger trg_stocks_updated_at
  before update on stocks
  for each row execute function set_updated_at();

alter table stocks enable row level security;
create policy "anon read stocks"      on stocks for select using (true);
create policy "service write stocks"  on stocks for all    using (auth.role() = 'service_role');


-- ============================================================
-- 2. CURRENCIES (Forex)
-- ============================================================
create table if not exists currencies (
  id              uuid           primary key default gen_random_uuid(),
  base_currency   text           not null,                 -- 'USD'
  quote_currency  text           not null,                 -- 'EUR'  →  1 USD = rate EUR
  rate            numeric(18,8)  not null,
  change          numeric(18,8),
  change_percent  numeric(8,4),
  bid             numeric(18,8),
  ask             numeric(18,8),
  high_24h        numeric(18,8),
  low_24h         numeric(18,8),
  updated_at      timestamptz    not null default now(),
  unique (base_currency, quote_currency)
);

create index if not exists idx_currencies_pair    on currencies (base_currency, quote_currency);
create index if not exists idx_currencies_updated on currencies (updated_at desc);

create or replace trigger trg_currencies_updated_at
  before update on currencies
  for each row execute function set_updated_at();

alter table currencies enable row level security;
create policy "anon read currencies"     on currencies for select using (true);
create policy "service write currencies" on currencies for all    using (auth.role() = 'service_role');


-- ============================================================
-- 3. PRECIOUS METALS (Gold, Silver, Platinum, Palladium)
-- ============================================================
create table if not exists precious_metals (
  id              uuid           primary key default gen_random_uuid(),
  metal           text           not null,                 -- 'gold', 'silver', 'platinum', 'palladium'
  unit            text           not null default 'troy_oz', -- 'troy_oz', 'gram', 'kg'
  currency        text           not null default 'USD',
  price           numeric(18,4)  not null,
  change          numeric(18,4),
  change_percent  numeric(8,4),
  bid             numeric(18,4),
  ask             numeric(18,4),
  high_24h        numeric(18,4),
  low_24h         numeric(18,4),
  updated_at      timestamptz    not null default now(),
  unique (metal, unit, currency)
);

create index if not exists idx_metals_metal   on precious_metals (metal);
create index if not exists idx_metals_updated on precious_metals (updated_at desc);

create or replace trigger trg_metals_updated_at
  before update on precious_metals
  for each row execute function set_updated_at();

alter table precious_metals enable row level security;
create policy "anon read metals"     on precious_metals for select using (true);
create policy "service write metals" on precious_metals for all    using (auth.role() = 'service_role');


-- ============================================================
-- 4. CRYPTO
-- ============================================================
create table if not exists crypto (
  id                  uuid           primary key default gen_random_uuid(),
  symbol              text           not null unique,       -- 'BTC', 'ETH', 'SOL'
  name                text           not null,              -- 'Bitcoin'
  price_usd           numeric(24,8)  not null,
  change_24h          numeric(24,8),                        -- absolute Δ in USD
  change_percent_24h  numeric(8,4),
  high_24h            numeric(24,8),
  low_24h             numeric(24,8),
  volume_24h          numeric(28,2),
  market_cap          numeric(28,2),
  market_cap_rank     integer,
  circulating_supply  numeric(28,4),
  total_supply        numeric(28,4),
  ath                 numeric(24,8),                        -- all-time high
  ath_date            timestamptz,
  updated_at          timestamptz    not null default now()
);

create index if not exists idx_crypto_symbol  on crypto (symbol);
create index if not exists idx_crypto_rank    on crypto (market_cap_rank);
create index if not exists idx_crypto_updated on crypto (updated_at desc);

create or replace trigger trg_crypto_updated_at
  before update on crypto
  for each row execute function set_updated_at();

alter table crypto enable row level security;
create policy "anon read crypto"     on crypto for select using (true);
create policy "service write crypto" on crypto for all    using (auth.role() = 'service_role');


-- ============================================================
-- 5. PRICE TICKS — unified time-series (append-only)
--    Use this for sparklines, candlestick charts, and history.
--    asset_type: 'stock' | 'currency' | 'metal' | 'crypto'
--    symbol:     'AAPL'  | 'USD/EUR'  | 'gold'  | 'BTC'
-- ============================================================
create table if not exists price_ticks (
  id          bigint         generated always as identity primary key,
  asset_type  text           not null,
  symbol      text           not null,
  price       numeric(24,8)  not null,
  volume      numeric(28,2),
  tick_at     timestamptz    not null default now()
);

-- Composite index — most queries are "give me last N ticks for symbol X"
create index if not exists idx_ticks_symbol on price_ticks (symbol, tick_at desc);
create index if not exists idx_ticks_type   on price_ticks (asset_type, tick_at desc);
create index if not exists idx_ticks_at     on price_ticks (tick_at desc);

alter table price_ticks enable row level security;
create policy "anon read ticks"     on price_ticks for select using (true);
create policy "service write ticks" on price_ticks for all    using (auth.role() = 'service_role');


-- ============================================================
-- 6. ENABLE REAL-TIME
--    After these commands the Angular client can subscribe to
--    INSERT / UPDATE / DELETE events on any of these tables.
-- ============================================================
alter publication supabase_realtime add table stocks;
alter publication supabase_realtime add table currencies;
alter publication supabase_realtime add table precious_metals;
alter publication supabase_realtime add table crypto;
alter publication supabase_realtime add table price_ticks;


-- ============================================================
-- 7. SEED DATA — realistic sample rows
--    Remove this section if you prefer to start empty.
-- ============================================================

-- Stocks
insert into stocks (symbol, name, exchange, currency, price, change, change_percent,
                    open, previous_close, high_24h, low_24h, volume, market_cap)
values
  ('AAPL',  'Apple Inc.',         'NASDAQ', 'USD',  213.49,   1.23,  0.58, 212.40, 212.26, 214.50, 211.80,  54320000, 3240000000000),
  ('MSFT',  'Microsoft Corp.',    'NASDAQ', 'USD',  415.32,   2.10,  0.51, 413.00, 413.22, 416.00, 412.50,  21800000, 3090000000000),
  ('GOOGL', 'Alphabet Inc.',      'NASDAQ', 'USD',  175.12,  -0.88, -0.50, 176.00, 176.00, 176.50, 174.30,  18200000, 2180000000000),
  ('NVDA',  'NVIDIA Corp.',       'NASDAQ', 'USD',  875.40,  15.30,  1.78, 862.00, 860.10, 878.00, 861.00,  42600000, 2160000000000),
  ('TSLA',  'Tesla Inc.',         'NASDAQ', 'USD',  248.23,  -4.50, -1.78, 252.00, 252.73, 253.00, 246.00,  89400000,  793000000000),
  ('AMZN',  'Amazon.com Inc.',    'NASDAQ', 'USD',  186.57,   0.97,  0.52, 185.60, 185.60, 187.20, 184.90,  31500000, 1960000000000),
  ('META',  'Meta Platforms Inc.','NASDAQ', 'USD',  521.84,   6.32,  1.23, 516.50, 515.52, 523.10, 515.40,  14200000, 1330000000000),
  ('TSM',   'Taiwan Semiconductor','NYSE',  'USD',  156.30,   1.80,  1.17, 155.00, 154.50, 157.00, 154.50,   8900000,  812000000000),
  ('BABA',  'Alibaba Group',      'NYSE',  'USD',   76.45,  -0.55, -0.71,  77.00,  77.00,  77.50,  76.20,  12300000,   83000000000),
  ('9988.HK','Alibaba (HK)',      'HKEX',  'HKD',  596.00,  -4.50, -0.75, 600.50, 600.50, 602.00, 594.00,  24600000,   83000000000)
on conflict (symbol) do update set
  price          = excluded.price,
  change         = excluded.change,
  change_percent = excluded.change_percent,
  updated_at     = now();

-- Currencies
insert into currencies (base_currency, quote_currency, rate, change, change_percent, bid, ask, high_24h, low_24h)
values
  ('USD', 'EUR',  0.92450000,  0.00120000,  0.13,  0.92440000,  0.92460000,  0.92600000,  0.92100000),
  ('USD', 'GBP',  0.79230000, -0.00050000, -0.06,  0.79220000,  0.79240000,  0.79400000,  0.79100000),
  ('USD', 'JPY', 149.85000000,  0.32000000,  0.21, 149.84000000, 149.86000000, 150.10000000, 149.30000000),
  ('USD', 'CHF',  0.90120000,  0.00080000,  0.09,  0.90110000,  0.90130000,  0.90250000,  0.89980000),
  ('USD', 'AUD',  1.52340000, -0.00220000, -0.14,  1.52330000,  1.52350000,  1.52700000,  1.52100000),
  ('USD', 'CAD',  1.35670000,  0.00150000,  0.11,  1.35660000,  1.35680000,  1.35850000,  1.35400000),
  ('USD', 'CNY',  7.23500000,  0.01200000,  0.17,  7.23490000,  7.23510000,  7.24200000,  7.22800000),
  ('USD', 'SGD',  1.34560000,  0.00090000,  0.07,  1.34550000,  1.34570000,  1.34700000,  1.34400000),
  ('USD', 'HKD',  7.82300000,  0.00100000,  0.01,  7.82290000,  7.82310000,  7.82500000,  7.82000000),
  ('EUR', 'USD',  1.08170000, -0.00140000, -0.13,  1.08160000,  1.08180000,  1.08350000,  1.08000000),
  ('EUR', 'GBP',  0.85720000,  0.00030000,  0.04,  0.85710000,  0.85730000,  0.85850000,  0.85600000),
  ('GBP', 'USD',  1.26220000,  0.00080000,  0.06,  1.26210000,  1.26230000,  1.26450000,  1.26000000)
on conflict (base_currency, quote_currency) do update set
  rate           = excluded.rate,
  change         = excluded.change,
  change_percent = excluded.change_percent,
  bid            = excluded.bid,
  ask            = excluded.ask,
  updated_at     = now();

-- Precious Metals
insert into precious_metals (metal, unit, currency, price, change, change_percent, bid, ask, high_24h, low_24h)
values
  ('gold',      'troy_oz', 'USD', 2320.50,   8.40,  0.36, 2320.00, 2321.00, 2328.00, 2308.00),
  ('gold',      'gram',    'USD',   74.59,   0.27,  0.36,   74.57,   74.61,   74.86,   74.24),
  ('silver',    'troy_oz', 'USD',   27.34,   0.22,  0.81,   27.32,   27.36,   27.55,   27.10),
  ('silver',    'gram',    'USD',    0.879,  0.007,  0.81,   0.878,   0.880,   0.885,   0.871),
  ('platinum',  'troy_oz', 'USD',  962.00,  -3.50, -0.36,  961.50,  962.50,  968.00,  958.00),
  ('palladium', 'troy_oz', 'USD', 1020.00,  12.00,  1.19, 1019.00, 1021.00, 1025.00, 1005.00)
on conflict (metal, unit, currency) do update set
  price          = excluded.price,
  change         = excluded.change,
  change_percent = excluded.change_percent,
  bid            = excluded.bid,
  ask            = excluded.ask,
  updated_at     = now();

-- Crypto
insert into crypto (symbol, name, price_usd, change_24h, change_percent_24h,
                    high_24h, low_24h, volume_24h, market_cap, market_cap_rank,
                    circulating_supply, total_supply, ath, ath_date)
values
  ('BTC',  'Bitcoin',        67250.12345678,  1234.56789,  1.87, 68100.00000000, 66800.00000000, 28500000000, 1320000000000,  1,  19700000.0000,   21000000.0000,    73750.00000000, '2024-03-14 00:00:00+00'),
  ('ETH',  'Ethereum',        3520.45678901,    65.12345,  1.88,  3560.00000000,  3470.00000000, 14200000000,  423000000000,  2, 120100000.0000,           null,     4868.00000000, '2021-11-10 00:00:00+00'),
  ('USDT', 'Tether',             1.00012345,     0.00012,  0.01,     1.00100000,     0.99900000, 48000000000,   86000000000,  3, 86000000000.0000, 86000000000.0000,    1.32000000, '2018-07-24 00:00:00+00'),
  ('BNB',  'BNB',              598.23456789,     8.45678,  1.43,   602.00000000,   588.00000000,  1850000000,   87000000000,  4, 145000000.0000,  200000000.0000,      686.31000000, '2021-05-10 00:00:00+00'),
  ('SOL',  'Solana',           178.56789012,     3.12345,  1.78,   180.00000000,   174.00000000,  3200000000,   82000000000,  5, 460000000.0000,           null,      259.96000000, '2021-11-06 00:00:00+00'),
  ('XRP',  'XRP',                0.52345678,     0.00678,  1.31,     0.53000000,     0.51000000,  1500000000,   29000000000,  6, 55500000000.0000, 100000000000.0000,    3.40000000, '2018-01-07 00:00:00+00'),
  ('USDC', 'USD Coin',            1.00008000,     0.00008,  0.01,     1.00100000,     0.99900000, 12000000000,   33000000000,  7, 33000000000.0000, 33000000000.0000,    1.17000000, '2019-10-24 00:00:00+00'),
  ('ADA',  'Cardano',             0.48234567,     0.00456,  0.96,     0.48600000,     0.47600000,   420000000,   17000000000,  8, 35000000000.0000, 45000000000.0000,    3.10000000, '2021-09-02 00:00:00+00'),
  ('AVAX', 'Avalanche',          38.56789012,     0.78901,  2.09,    39.20000000,    37.80000000,   520000000,   16000000000,  9, 410000000.0000,   720000000.0000,     146.22000000, '2021-11-21 00:00:00+00'),
  ('DOGE', 'Dogecoin',            0.16789012,     0.00234,  1.41,     0.16900000,     0.16500000,   850000000,   24000000000, 10, 144000000000.0000,         null,       0.74000000, '2021-05-08 00:00:00+00'),
  ('LINK', 'Chainlink',          14.98765432,     0.23456,  1.59,    15.20000000,    14.70000000,   380000000,    8800000000, 11, 587000000.0000,  1000000000.0000,      52.70000000, '2021-05-10 00:00:00+00'),
  ('DOT',  'Polkadot',            7.23456789,     0.10234,  1.43,     7.32000000,     7.10000000,   280000000,    9100000000, 12, 1260000000.0000,          null,       54.98000000, '2021-11-04 00:00:00+00')
on conflict (symbol) do update set
  price_usd          = excluded.price_usd,
  change_24h         = excluded.change_24h,
  change_percent_24h = excluded.change_percent_24h,
  high_24h           = excluded.high_24h,
  low_24h            = excluded.low_24h,
  volume_24h         = excluded.volume_24h,
  market_cap         = excluded.market_cap,
  market_cap_rank    = excluded.market_cap_rank,
  updated_at         = now();


-- ============================================================
-- 8. HOW TO PUSH LIVE DATA (examples)
-- ============================================================
-- From your backend / Supabase Edge Function, use the service role key and UPSERT:
--
-- STOCKS — upsert a tick:
--   insert into stocks (symbol, name, exchange, currency, price, change, change_percent, ...)
--   values ('AAPL', 'Apple Inc.', 'NASDAQ', 'USD', 214.05, 1.79, 0.84, ...)
--   on conflict (symbol) do update set
--     price = excluded.price, change = excluded.change, change_percent = excluded.change_percent;
--
-- CURRENCIES — upsert a rate:
--   insert into currencies (base_currency, quote_currency, rate, change, change_percent, ...)
--   values ('USD', 'EUR', 0.9251, 0.0006, 0.07, ...)
--   on conflict (base_currency, quote_currency) do update set rate = excluded.rate, ...;
--
-- PRICE TICKS — append a historical point (for charts):
--   insert into price_ticks (asset_type, symbol, price, volume)
--   values ('stock', 'AAPL', 214.05, 12500);
--
-- From Angular client side (anon read-only):
--   supabase.from('stocks').select('*').order('symbol')
--   supabase.channel('market').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stocks' }, handler).subscribe()
-- ============================================================
