import type { Shipment, Booking, FleetVehicle, Route, Warehouse, ShipmentStatus, TransportMode, CargoType, VehicleType, FleetStatus, BookingStatus, UrgencyLevel, WarehouseType, WarehouseStatus } from '../types';

// ── Helpers ──────────────────────────────────────────────────────
export function randItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
export function randInt(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }
export function fmtDate(d: Date): string { return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
export function timeAgo(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ── Reference Data ────────────────────────────────────────────────
const STATUSES: ShipmentStatus[] = ['transit', 'delivered', 'pending', 'delayed', 'customs'];
const MODES: TransportMode[] = ['Sea', 'Air', 'Road', 'Rail'];
const CUSTOMERS = ['Siemens AG', 'Amazon Supply', 'Apple Inc.', 'Philips Global', 'Unilever Ltd', 'Tata Consultancy', 'TanzaTrade Co.', 'Boeing Parts', 'Samsung Elec', 'BASF Group', 'DHL Express', 'Reckitt PLC', 'Nestlé SA', 'Volvo Group', 'Maersk Line', 'Cargill Inc', 'Rio Tinto', 'Shell Trading', 'Alibaba Group', 'Toyota Parts'];
const CARGO_TYPES: CargoType[] = ['Electronics', 'General', 'Perishable', 'Hazardous', 'Automotive', 'Textiles', 'Machinery'];
const INCOTERMS = ['FOB', 'CIF', 'DDP', 'EXW', 'DAP', 'FCA', 'CFR'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'KES', 'TZS', 'NGN'];
const BROKERS = ['Global Clearance Ltd', 'FastTrack Customs', 'Apex Brokers', 'Continental Freight Services'];
const DRIVERS = ['Mohamed A.', 'James K.', 'Samuel O.', 'Fatima N.', 'David M.', 'Grace W.'];
const VEHICLES = ['KDA 201K', 'TZ 4892 B', 'LAG 77X', 'NBI 332C', 'ABJ 1120 F', 'JHB 9988 G'];
const HS_CODES = ['8471.30', '8544.42', '8703.23', '8708.99', '9403.20', '6109.10', '8429.51', '3004.90', '2710.19', '8517.12'];

const INTL_ROUTES = [
  { origin: 'Shanghai', originCountry: 'CN', dest: 'Rotterdam', destCountry: 'NL' },
  { origin: 'Dubai', originCountry: 'AE', dest: 'New York', destCountry: 'US' },
  { origin: 'Singapore', originCountry: 'SG', dest: 'Los Angeles', destCountry: 'US' },
  { origin: 'Frankfurt', originCountry: 'DE', dest: 'Chicago', destCountry: 'US' },
  { origin: 'Dar es Salaam', originCountry: 'TZ', dest: 'Mumbai', destCountry: 'IN' },
  { origin: 'Nairobi', originCountry: 'KE', dest: 'London', destCountry: 'GB' },
  { origin: 'Mumbai', originCountry: 'IN', dest: 'Frankfurt', destCountry: 'DE' },
  { origin: 'Lagos', originCountry: 'NG', dest: 'Antwerp', destCountry: 'BE' },
  { origin: 'Manila', originCountry: 'PH', dest: 'Long Beach', destCountry: 'US' },
  { origin: 'Karachi', originCountry: 'PK', dest: 'Amsterdam', destCountry: 'NL' },
];
const LOCAL_ROUTES = [
  { origin: 'Nairobi CBD', originCountry: 'KE', dest: 'Mombasa', destCountry: 'KE' },
  { origin: 'Dar es Salaam', originCountry: 'TZ', dest: 'Arusha', destCountry: 'TZ' },
  { origin: 'Lagos Island', originCountry: 'NG', dest: 'Abuja', destCountry: 'NG' },
  { origin: 'Cape Town', originCountry: 'ZA', dest: 'Johannesburg', destCountry: 'ZA' },
  { origin: 'Accra', originCountry: 'GH', dest: 'Kumasi', destCountry: 'GH' },
  { origin: 'Kampala', originCountry: 'UG', dest: 'Entebbe', destCountry: 'UG' },
  { origin: 'Casablanca', originCountry: 'MA', dest: 'Rabat', destCountry: 'MA' },
];

// ── Shipments ─────────────────────────────────────────────────────
export function genShipments(n = 48): Shipment[] {
  const prefixes = ['SHG', 'DXB', 'SGP', 'RTM', 'NBO', 'MUM', 'DAR', 'ORD', 'TYO', 'KRC'];
  return Array.from({ length: n }, (_, i) => {
    const isIntl = i < Math.floor(n * 0.65);
    const route = isIntl ? randItem(INTL_ROUTES) : randItem(LOCAL_ROUTES);
    const type = isIntl ? 'international' : 'domestic' as const;
    const status: ShipmentStatus = i < 2 ? (i === 0 ? 'delayed' : 'customs') : (isIntl ? randItem(STATUSES) : randItem(['transit', 'delivered', 'pending', 'delayed'] as ShipmentStatus[]));
    const mode: TransportMode = isIntl ? randItem(MODES) : randItem(['Road', 'Rail'] as TransportMode[]);
    const eta = new Date(Date.now() + randInt(-5, 30) * 86400000);
    const created = new Date(Date.now() - randInt(1, 20) * 86400000);

    const base: Shipment = {
      id: `${randItem(prefixes)}-${String(10000 + i).slice(1)}`,
      type,
      origin: route.origin, originCountry: route.originCountry,
      dest: route.dest, destCountry: route.destCountry,
      customer: randItem(CUSTOMERS),
      weight: randInt(200, 15000),
      mode, cargoType: randItem(CARGO_TYPES),
      status, eta, created,
      contact: randItem(['J. Mercer', 'S. Okonkwo', 'L. Chen', 'A. Hassan']),
      email: 'ops@company.com',
      phone: `+${randInt(1, 99)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      notes: '',
      declaredValue: `${randItem(CURRENCIES)} ${(randInt(5, 500) * 1000).toLocaleString()}`,
    };

    if (isIntl) {
      return {
        ...base,
        containers: randInt(1, 8),
        vessel: `${randItem(['MSC', 'CMA CGM', 'Evergreen', 'Yang Ming'])} ${randItem(['Amber', 'Pacific', 'Titan', 'Horizon'])}`,
        port: randItem(['Rotterdam', 'Singapore', 'Shanghai', 'Dubai Port', 'Los Angeles', 'Antwerp', 'Mombasa']),
        incoterm: randItem(INCOTERMS),
        insurance: `$${(randInt(10, 200) * 1000).toLocaleString()}`,
        hsCode: randItem(HS_CODES),
        customsBroker: randItem(BROKERS),
        dutyAmount: `$${(randInt(1, 50) * 1000).toLocaleString()}`,
        blNumber: `BL${randInt(100000, 999999)}`,
        originPort: randItem(['Shanghai Port', 'Dubai Port', 'Singapore Port', 'Lagos Port', 'Mombasa Port']),
      };
    } else {
      return {
        ...base,
        driver: randItem(DRIVERS),
        vehicle: randItem(VEHICLES),
        pickupAddress: `${randInt(1, 999)} ${randItem(['Main St', 'Industrial Rd', 'Commerce Ave', 'Market Ln', 'Port Rd'])}`,
        deliveryAddress: `${randInt(1, 999)} ${randItem(['Central Ave', 'Business Park', 'Warehouse Rd', 'Depot St', 'Trade Zone'])}`,
        deliveryWindow: `${randInt(8, 11)}:00 – ${randInt(13, 17)}:00`,
        distanceKm: randInt(50, 800),
        podRequired: true,
      };
    }
  });
}

// ── Bookings ──────────────────────────────────────────────────────
const BK_CUSTOMERS = ['Horizon Trade Ltd', 'Pacific Rim Co.', 'AlphaGoods GmbH', 'Meridian Imports', 'BlueStar Exports', 'Nova Freight Inc', 'Stellar Commerce', 'Atlas Logistics', 'Caspian Cargo', 'Summit Trade'];
const BK_ROUTES = [['Nairobi', 'London'], ['Dubai', 'Chicago'], ['Shanghai', 'Hamburg'], ['Singapore', 'Rotterdam'], ['Lagos', 'Antwerp'], ['Dar es Salaam', 'Mumbai'], ['Casablanca', 'Barcelona'], ['Jakarta', 'Frankfurt'], ['Manila', 'Long Beach'], ['Karachi', 'Amsterdam']];
const BK_NOTES_POOL = ['Fragile items — handle with care', 'Temperature controlled required', 'Hazardous documentation enclosed', 'Pre-clearance paperwork attached', 'Consolidation with existing booking preferred', 'Express delivery required — client deadline', 'Partial shipment, remainder to follow'];

export function genBookings(n = 22): Booking[] {
  return Array.from({ length: n }, (_, i) => {
    const [orig, dest] = randItem(BK_ROUTES);
    const status: BookingStatus = i < 3 ? 'new' : i < 6 ? 'reviewing' : i < 10 ? 'approved' : i < 16 ? 'converted' : 'rejected';
    const received = new Date(Date.now() - randInt(0, 14) * 86400000);
    const urgency: UrgencyLevel = randItem(['high', 'medium', 'low'] as UrgencyLevel[]);
    return {
      id: `BKG-${String(2000 + i).padStart(5, '0')}`,
      customer: randItem(BK_CUSTOMERS),
      origin: orig, dest,
      mode: randItem(MODES),
      type: randItem(CARGO_TYPES),
      weight: randInt(200, 12000),
      containers: randInt(1, 6),
      urgency,
      status,
      received,
      contact: ['Maria Santos', 'James Okonkwo', 'Li Wei', 'Sara Hassan', 'Tom Müller'][randInt(0, 4)],
      email: `contact@${randItem(BK_CUSTOMERS).toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+${randInt(1, 99)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      message: i % 3 === 0 ? randItem(BK_NOTES_POOL) : '',
      convertedTo: status === 'converted' ? `SHG-0${randInt(1000, 9999)}` : null,
      assignedTo: (status === 'reviewing' || status === 'approved') ? randItem(['Amir K.', 'Sara M.', 'Chen W.']) : null,
      notes: '',
    };
  });
}

// ── Fleet ─────────────────────────────────────────────────────────
const VEHICLE_TYPES: VehicleType[] = ['Truck', 'Ship', 'Aircraft', 'Rail'];
const VEHICLE_MAKES: Record<VehicleType, string[]> = {
  Truck: ['Volvo FH16', 'Mercedes Actros', 'MAN TGX', 'Scania R730', 'DAF XF', 'Iveco S-Way'],
  Ship: ['MSC Gülsün', 'EVER ACE', 'CMA CGM Antoine', 'Yang Ming Witness', 'Maersk Elba'],
  Aircraft: ['Boeing 747F', 'Airbus A330F', 'Boeing 777F', 'MD-11F'],
  Rail: ['Class 66', 'DB Class 185', 'Siemens Vectron', 'GE C44ah'],
};
const DRIVER_NAMES = ['James Okonkwo', 'Maria Santos', 'Li Wei', 'Ahmed Hassan', 'Grace Mwangi', 'David Müller', 'Sara Nakamura', 'Tom Osei', 'Fatima Ali', 'Carlos Diaz'];

export function genFleet(n = 24): FleetVehicle[] {
  return Array.from({ length: n }, (_, i) => {
    const type = VEHICLE_TYPES[i % 4];
    const status: FleetStatus = i < 12 ? 'active' : i < 17 ? 'idle' : i < 22 ? 'maintenance' : 'retired';
    const make = randItem(VEHICLE_MAKES[type]);
    const plate = type === 'Truck'
      ? `T ${randInt(100, 999)} ${randItem(['AAA', 'BBB', 'CCC', 'KDA', 'TZR', 'NBI'])}`
      : type === 'Ship' ? `IMO${randInt(1000000, 9999999)}`
      : type === 'Aircraft' ? `5H-${randItem(['TZA', 'KLA', 'KEN', 'NGA'])}${randInt(10, 99)}`
      : `TZR-${randInt(100, 999)}`;
    return {
      id: `VEH-${String(1000 + i).slice(1)}`,
      type, make, plate,
      driver: status === 'active' ? randItem(DRIVER_NAMES) : '—',
      capacityTons: type === 'Ship' ? randInt(500, 50000) : type === 'Aircraft' ? randInt(20, 150) : type === 'Rail' ? randInt(200, 2000) : randInt(5, 30),
      currentRoute: status === 'active' ? `${randItem(['DAR', 'NBI', 'LGS', 'DXB', 'SGP'])} → ${randItem(['MOM', 'JHB', 'ACC', 'LHR', 'RTM'])}` : '—',
      lastService: new Date(Date.now() - randInt(10, 180) * 86400000),
      nextService: new Date(Date.now() + randInt(5, 90) * 86400000),
      mileage: randInt(10000, 500000),
      fuelType: type === 'Ship' ? 'Bunker Fuel' : type === 'Aircraft' ? 'Jet A-1' : type === 'Rail' ? 'Diesel/Electric' : 'Diesel',
      year: randInt(2010, 2023), status, notes: '',
      base: randItem(['Dar es Salaam', 'Mombasa', 'Nairobi', 'Lagos', 'Dubai']),
    };
  });
}

// ── Routes ────────────────────────────────────────────────────────
export const ROUTE_DATA: Route[] = [
  { origin: 'Shanghai', originC: 'CN', dest: 'Rotterdam', destC: 'NL', mode: 'Sea', type: 'international', status: 'active', avgDays: 28, shipments: 124, freq: 'Weekly', carrier: 'Maersk Line' },
  { origin: 'Dar es Salaam', originC: 'TZ', dest: 'Mumbai', destC: 'IN', mode: 'Sea', type: 'international', status: 'active', avgDays: 12, shipments: 76, freq: 'Bi-weekly', carrier: 'CMA CGM' },
  { origin: 'Nairobi', originC: 'KE', dest: 'London', destC: 'GB', mode: 'Air', type: 'international', status: 'active', avgDays: 1, shipments: 112, freq: 'Daily', carrier: 'Kenya Airways Cargo' },
  { origin: 'Dubai', originC: 'AE', dest: 'New York', destC: 'US', mode: 'Air', type: 'international', status: 'active', avgDays: 2, shipments: 89, freq: 'Daily', carrier: 'Emirates SkyCargo' },
  { origin: 'Lagos', originC: 'NG', dest: 'Antwerp', destC: 'BE', mode: 'Sea', type: 'international', status: 'active', avgDays: 16, shipments: 54, freq: 'Weekly', carrier: 'MSC' },
  { origin: 'Singapore', originC: 'SG', dest: 'Los Angeles', destC: 'US', mode: 'Sea', type: 'international', status: 'active', avgDays: 22, shipments: 61, freq: 'Weekly', carrier: 'Evergreen' },
  { origin: 'Frankfurt', originC: 'DE', dest: 'Chicago', destC: 'US', mode: 'Air', type: 'international', status: 'active', avgDays: 1, shipments: 47, freq: 'Daily', carrier: 'Lufthansa Cargo' },
  { origin: 'Karachi', originC: 'PK', dest: 'Amsterdam', destC: 'NL', mode: 'Sea', type: 'international', status: 'inactive', avgDays: 20, shipments: 0, freq: 'Monthly', carrier: 'Yang Ming' },
  { origin: 'Manila', originC: 'PH', dest: 'Long Beach', destC: 'US', mode: 'Sea', type: 'international', status: 'active', avgDays: 14, shipments: 38, freq: 'Weekly', carrier: 'Hapag-Lloyd' },
  { origin: 'Casablanca', originC: 'MA', dest: 'Barcelona', destC: 'ES', mode: 'Sea', type: 'international', status: 'inactive', avgDays: 3, shipments: 0, freq: 'Monthly', carrier: 'GLD Lines' },
  { origin: 'Dar es Salaam', originC: 'TZ', dest: 'Arusha', destC: 'TZ', mode: 'Road', type: 'domestic', status: 'active', avgDays: 1, shipments: 28, freq: 'Daily', carrier: 'TanzaTruck Co.' },
  { origin: 'Dar es Salaam', originC: 'TZ', dest: 'Mwanza', destC: 'TZ', mode: 'Road', type: 'domestic', status: 'active', avgDays: 2, shipments: 19, freq: 'Daily', carrier: 'Swift Haulage' },
  { origin: 'Dar es Salaam', originC: 'TZ', dest: 'Dodoma', destC: 'TZ', mode: 'Rail', type: 'domestic', status: 'active', avgDays: 1, shipments: 14, freq: 'Weekly', carrier: 'TAZARA Rail' },
  { origin: 'Mwanza', originC: 'TZ', dest: 'Tabora', destC: 'TZ', mode: 'Road', type: 'domestic', status: 'inactive', avgDays: 1, shipments: 0, freq: 'Weekly', carrier: 'Inland Freight' },
  { origin: 'Dar es Salaam', originC: 'TZ', dest: 'Tanga', destC: 'TZ', mode: 'Road', type: 'domestic', status: 'active', avgDays: 1, shipments: 11, freq: 'Daily', carrier: 'Coastal Logistics' },
].map((r, i) => ({ ...r, id: `RT-${String(100 + i).slice(1)}` }));

// ── Warehouses ────────────────────────────────────────────────────
const WH_TYPES: WarehouseType[] = ['General', 'Cold Storage', 'Hazardous', 'Bonded'];
const WH_STATUSES: WarehouseStatus[] = ['operational', 'maintenance', 'closed'];

export function genWarehouses(): Warehouse[] {
  const locations = [
    { name: 'Dar Port Facility A', city: 'Dar es Salaam', country: 'Tanzania' },
    { name: 'Mombasa Transit Hub', city: 'Mombasa', country: 'Kenya' },
    { name: 'Nairobi ICD', city: 'Nairobi', country: 'Kenya' },
    { name: 'Lagos Apapa WH', city: 'Lagos', country: 'Nigeria' },
    { name: 'Dubai Free Zone 1', city: 'Dubai', country: 'UAE' },
    { name: 'Singapore Mega Depot', city: 'Singapore', country: 'Singapore' },
    { name: 'Rotterdam Cold Hub', city: 'Rotterdam', country: 'Netherlands' },
    { name: 'Antwerp Bonded WH', city: 'Antwerp', country: 'Belgium' },
  ];
  return locations.map((loc, i) => {
    const capacity = randInt(2000, 20000);
    const fill = randInt(20, 98);
    return {
      id: `WH-${String(100 + i).slice(1)}`,
      name: loc.name,
      city: loc.city,
      country: loc.country,
      type: WH_TYPES[i % 4],
      capacitySqm: capacity,
      usedSqm: Math.round(capacity * fill / 100),
      activeLoads: randInt(5, 80),
      manager: randItem(['Amir K.', 'Sara M.', 'Chen W.', 'James O.', 'Maria S.']),
      status: i < 6 ? 'operational' : i < 7 ? 'maintenance' : 'closed' as WarehouseStatus,
      phone: `+${randInt(1, 99)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      email: `wh${i + 1}@cargoos.com`,
      address: `${randInt(1, 999)} Port Rd, ${loc.city}`,
      notes: '',
    };
  });
}

// ── Countries & Cities ────────────────────────────────────────────
export const COUNTRIES = [
  { name: 'Afghanistan', code: 'AF' }, { name: 'Albania', code: 'AL' }, { name: 'Algeria', code: 'DZ' }, { name: 'Angola', code: 'AO' },
  { name: 'Argentina', code: 'AR' }, { name: 'Australia', code: 'AU' }, { name: 'Austria', code: 'AT' }, { name: 'Bahrain', code: 'BH' },
  { name: 'Bangladesh', code: 'BD' }, { name: 'Belgium', code: 'BE' }, { name: 'Brazil', code: 'BR' }, { name: 'Cameroon', code: 'CM' },
  { name: 'Canada', code: 'CA' }, { name: 'Chile', code: 'CL' }, { name: 'China', code: 'CN' }, { name: 'Colombia', code: 'CO' },
  { name: 'Democratic Republic of Congo', code: 'CD' }, { name: 'Denmark', code: 'DK' }, { name: 'Egypt', code: 'EG' },
  { name: 'Ethiopia', code: 'ET' }, { name: 'Finland', code: 'FI' }, { name: 'France', code: 'FR' }, { name: 'Germany', code: 'DE' },
  { name: 'Ghana', code: 'GH' }, { name: 'Greece', code: 'GR' }, { name: 'Hong Kong', code: 'HK' }, { name: 'India', code: 'IN' },
  { name: 'Indonesia', code: 'ID' }, { name: 'Iran', code: 'IR' }, { name: 'Iraq', code: 'IQ' }, { name: 'Ireland', code: 'IE' },
  { name: 'Israel', code: 'IL' }, { name: 'Italy', code: 'IT' }, { name: 'Japan', code: 'JP' }, { name: 'Jordan', code: 'JO' },
  { name: 'Kazakhstan', code: 'KZ' }, { name: 'Kenya', code: 'KE' }, { name: 'Kuwait', code: 'KW' }, { name: 'Libya', code: 'LY' },
  { name: 'Malaysia', code: 'MY' }, { name: 'Mexico', code: 'MX' }, { name: 'Morocco', code: 'MA' }, { name: 'Mozambique', code: 'MZ' },
  { name: 'Myanmar', code: 'MM' }, { name: 'Namibia', code: 'NA' }, { name: 'Netherlands', code: 'NL' }, { name: 'New Zealand', code: 'NZ' },
  { name: 'Nigeria', code: 'NG' }, { name: 'Norway', code: 'NO' }, { name: 'Oman', code: 'OM' }, { name: 'Pakistan', code: 'PK' },
  { name: 'Philippines', code: 'PH' }, { name: 'Poland', code: 'PL' }, { name: 'Portugal', code: 'PT' }, { name: 'Qatar', code: 'QA' },
  { name: 'Romania', code: 'RO' }, { name: 'Russia', code: 'RU' }, { name: 'Rwanda', code: 'RW' }, { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Senegal', code: 'SN' }, { name: 'Singapore', code: 'SG' }, { name: 'Somalia', code: 'SO' }, { name: 'South Africa', code: 'ZA' },
  { name: 'South Korea', code: 'KR' }, { name: 'South Sudan', code: 'SS' }, { name: 'Spain', code: 'ES' }, { name: 'Sri Lanka', code: 'LK' },
  { name: 'Sudan', code: 'SD' }, { name: 'Sweden', code: 'SE' }, { name: 'Switzerland', code: 'CH' }, { name: 'Taiwan', code: 'TW' },
  { name: 'Tanzania', code: 'TZ' }, { name: 'Thailand', code: 'TH' }, { name: 'Tunisia', code: 'TN' }, { name: 'Turkey', code: 'TR' },
  { name: 'Uganda', code: 'UG' }, { name: 'Ukraine', code: 'UA' }, { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United Kingdom', code: 'GB' }, { name: 'United States', code: 'US' }, { name: 'Vietnam', code: 'VN' },
  { name: 'Yemen', code: 'YE' }, { name: 'Zambia', code: 'ZM' }, { name: 'Zimbabwe', code: 'ZW' },
];

export const TZ_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma',
  'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Mjini Magharibi', 'Morogoro',
  'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South', 'Pwani', 'Rukwa',
  'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga',
  'Zanzibar North', 'Zanzibar South', 'Zanzibar West',
];

export const WORLD_CITIES = [
  'Abu Dhabi', 'Amsterdam', 'Antwerp', 'Athens', 'Atlanta', 'Auckland', 'Bangkok', 'Barcelona',
  'Beijing', 'Bogotá', 'Brussels', 'Buenos Aires', 'Cairo', 'Cape Town', 'Casablanca',
  'Chicago', 'Colombo', 'Copenhagen', 'Dallas', 'Delhi', 'Dubai', 'Dublin', 'Durban',
  'Felixstowe', 'Frankfurt', 'Hamburg', 'Hanoi', 'Ho Chi Minh City', 'Hong Kong',
  'Houston', 'Istanbul', 'Jakarta', 'Johannesburg', 'Karachi', 'Kuala Lumpur',
  'Lagos', 'Lima', 'Lisbon', 'London', 'Los Angeles', 'Madrid', 'Manila', 'Melbourne',
  'Mexico City', 'Miami', 'Milan', 'Montreal', 'Moscow', 'Mumbai', 'Nairobi',
  'New York', 'Oslo', 'Paris', 'Port Said', 'Rotterdam', 'Santiago', 'São Paulo',
  'Seattle', 'Seoul', 'Shanghai', 'Singapore', 'Stockholm', 'Sydney', 'Tokyo',
  'Toronto', 'Vancouver', 'Vienna', 'Warsaw', 'Yangon', 'Zurich',
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  AE: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Al Ain'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucumán', 'Mar del Plata'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Darwin'],
  BD: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Comilla', 'Mymensingh'],
  BE: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège', 'Namur'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Recife', 'Manaus', 'Porto Alegre'],
  CA: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City'],
  CH: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lugano'],
  CL: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'Viña del Mar', 'Temuco'],
  CN: ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Chengdu', 'Hong Kong', 'Qingdao', 'Ningbo'],
  CO: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
  DE: ['Hamburg', 'Frankfurt', 'Berlin', 'Munich', 'Düsseldorf', 'Cologne', 'Bremen', 'Stuttgart'],
  DK: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Frederiksberg'],
  DZ: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Tlemcen'],
  EG: ['Cairo', 'Alexandria', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Giza'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Las Palmas'],
  ET: ['Addis Ababa', 'Dire Dawa', 'Adama', 'Mekelle', 'Gondar', 'Hawassa'],
  FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nantes', 'Le Havre'],
  GB: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Felixstowe', 'Southampton', 'Bristol'],
  GH: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Cape Coast', 'Tema'],
  GR: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Piraeus', 'Volos'],
  HK: ['Hong Kong', 'Kowloon', 'New Territories'],
  ID: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Makassar', 'Semarang', 'Palembang', 'Denpasar'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur'],
  IQ: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Kirkuk', 'Najaf'],
  IR: ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Bandar Abbas'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Venice', 'Bologna'],
  JP: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Kobe', 'Fukuoka', 'Sapporo', 'Hiroshima'],
  KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi'],
  KR: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gwangju', 'Daejeon', 'Ulsan'],
  KZ: ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Karaganda'],
  LK: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Trincomalee', 'Negombo'],
  MA: ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 'Meknes'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Veracruz', 'Manzanillo'],
  MY: ['Kuala Lumpur', 'George Town', 'Ipoh', 'Johor Bahru', 'Kota Kinabalu', 'Kuching', 'Port Klang'],
  NG: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Apapa', 'Tin Can Island'],
  NL: ['Rotterdam', 'Amsterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen'],
  NO: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø'],
  NZ: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin'],
  OM: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Khasab'],
  PE: ['Lima', 'Callao', 'Arequipa', 'Trujillo', 'Chiclayo', 'Iquitos'],
  PH: ['Manila', 'Cebu City', 'Davao', 'Quezon City', 'Zamboanga', 'Makati'],
  PK: ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar'],
  PL: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Gdynia'],
  PT: ['Lisbon', 'Porto', 'Braga', 'Setúbal', 'Funchal', 'Sines'],
  QA: ['Doha', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Lusail'],
  RO: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Brașov'],
  RU: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Vladivostok', 'Yekaterinburg', 'Vostochny'],
  SA: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Jubail', 'Yanbu'],
  SD: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'El Obeid'],
  SE: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping', 'Helsingborg'],
  SG: ['Singapore'],
  TH: ['Bangkok', 'Chiang Mai', 'Pattaya', 'Hat Yai', 'Phuket', 'Laem Chabang'],
  TN: ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Radès', 'Gabès'],
  TR: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Mersin', 'Trabzon'],
  TW: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hsinchu', 'Keelung'],
  TZ: ['Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma',
    'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Mjini Magharibi', 'Morogoro',
    'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South', 'Pwani', 'Rukwa',
    'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga',
    'Zanzibar North', 'Zanzibar South', 'Zanzibar West'],
  UA: ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Lviv', 'Mariupol', 'Mykolaiv'],
  UG: ['Kampala', 'Entebbe', 'Gulu', 'Lira', 'Mbarara', 'Jinja'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Atlanta', 'Miami',
    'Seattle', 'San Francisco', 'Boston', 'Newark', 'Baltimore', 'Savannah'],
  VN: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Cần Thơ', 'Vung Tau'],
  YE: ['Sana\'a', 'Aden', 'Hodeidah', 'Mukalla', 'Taiz'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'East London', 'Richards Bay'],
  ZM: ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Chipata'],
  ZW: ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Beitbridge'],
};
