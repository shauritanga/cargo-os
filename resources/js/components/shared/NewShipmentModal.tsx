import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SearchableSelect from './SearchableSelect';
import AirwaybillPrint from './AirwaybillPrint';
import { TZ_REGIONS } from '../../data/mock';
import type { Shipment, Party } from '../../types';

interface Props {
  onClose: () => void;
}

async function fetchCountries() {
  const res = await fetch('/api/countries');
  return res.json() as Promise<{ id: number; name: string; code: string }[]>;
}

async function fetchCities(code: string): Promise<string[]> {
  if (!code) return [];
  const res = await fetch(`/api/countries/${code}/cities`);
  return res.json();
}

const emptyParty = (): Party => ({
  companyName: '', streetAddress: '', cityTown: '', country: '', tel: '', email: '', contactName: '',
});

function PartyFields({ title, value, onChange, countryOptions }: {
  title: string;
  value: Party;
  onChange: (p: Party) => void;
  countryOptions: { label: string; value: string }[];
}) {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchCities(value.country).then(setCities);
  }, [value.country]);

  const f = (field: keyof Party) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <>
      <div className="form-divider">{title}</div>
      {/* Row 1: Country | City/Town — searchable selects */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Country</label>
          <SearchableSelect
            options={countryOptions}
            value={value.country}
            placeholder="Select country…"
            searchPlaceholder="Search country…"
            onChange={code => onChange({ ...value, country: code, cityTown: '' })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">City / Town</label>
          <SearchableSelect
            options={cities.map(c => ({ label: c, value: c }))}
            value={value.cityTown}
            placeholder="Select or type…"
            searchPlaceholder="Search or type city…"
            onChange={(_, label) => onChange({ ...value, cityTown: label })}
            onFreeType={v => onChange({ ...value, cityTown: v })}
          />
        </div>
      </div>
      {/* Row 2: Company Name | Contact Name */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input className="form-input" placeholder="Company / Organization" value={value.companyName} onChange={f('companyName')} />
        </div>
        <div className="form-group">
          <label className="form-label">Contact Name</label>
          <input className="form-input" placeholder="Full name" value={value.contactName} onChange={f('contactName')} />
        </div>
      </div>
      {/* Row 3: Street Address | Tel */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Street Address</label>
          <input className="form-input" placeholder="Street / area" value={value.streetAddress} onChange={f('streetAddress')} />
        </div>
        <div className="form-group">
          <label className="form-label">Tel</label>
          <input className="form-input" placeholder="+255 700 000 000" value={value.tel} onChange={f('tel')} />
        </div>
      </div>
      {/* Row 4: Email (full width) */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="email@company.com" value={value.email} onChange={f('email')} />
        </div>
      </div>
    </>
  );
}

export default function NewShipmentModal({ onClose }: Props) {
  const { setShipments, showToast, setActivePage, companySettings } = useApp();
  const [formType, setFormType] = useState<'international' | 'domestic'>('international');
  const [originCountry, setOriginCountry] = useState('');
  const [destCountry, setDestCountry] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');

  const [countryOptions, setCountryOptions] = useState<{ label: string; value: string; code: string }[]>([]);
  const [originCities, setOriginCities] = useState<string[]>([]);
  const [destCities, setDestCities] = useState<string[]>([]);

  useEffect(() => {
    fetchCountries().then(data =>
      setCountryOptions(data.map(c => ({ label: c.name, value: c.code, code: c.code })))
    );
  }, []);

  useEffect(() => {
    if (formType === 'domestic') { setOriginCities(TZ_REGIONS); return; }
    fetchCities(originCountry).then(setOriginCities);
  }, [originCountry, formType]);

  useEffect(() => {
    if (formType === 'domestic') { setDestCities(TZ_REGIONS); return; }
    fetchCities(destCountry).then(setDestCities);
  }, [destCountry, formType]);

  // Cargo
  const [mode, setMode] = useState('Sea');
  const [eta, setEta] = useState('');
  const [weight, setWeight] = useState('');
  const [pieces, setPieces] = useState('');
  const [contents, setContents] = useState('');
  const [cargoType, setCargoType] = useState('General');
  const [declaredValue, setDeclaredValue] = useState('');
  const [insurance, setInsurance] = useState('');
  const [notes, setNotes] = useState('');

  // Consignor & Consignee
  const [consignor, setConsignor] = useState<Party>(emptyParty());
  const [consignee, setConsignee] = useState<Party>(emptyParty());

  const [submitting, setSubmitting] = useState(false);
  const [successShipment, setSuccessShipment] = useState<Shipment | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const cityToOption = (c: string) => ({ label: c, value: c });

  function copyAwb(awb: string) {
    navigator.clipboard.writeText(awb).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const handleSubmit = async () => {
    if (!origin || !dest || !consignor.companyName) {
      alert('Please fill in Origin, Destination, and Consignor Company Name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: formType,
        origin,
        origin_country: originCountry || 'TZ',
        dest,
        dest_country: destCountry || 'TZ',
        customer: consignor.companyName,
        weight: parseFloat(weight) || null,
        mode,
        cargo_type: cargoType,
        eta: eta || null,
        contact: consignor.contactName || null,
        email: consignor.email || null,
        phone: consignor.tel || null,
        notes: notes || null,
        declared_value: declaredValue || null,
        insurance: insurance || null,
        pieces: parseInt(pieces) || 1,
        contents: contents || null,
        consignor,
        consignee,
      };

      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create shipment');
      }

      const saved = await res.json();

      // Map backend response to frontend Shipment type and prepend to list
      const newShipment: Shipment = {
        id: String(saved.id),
        awbNumber: saved.awb_number,
        type: saved.type,
        origin: saved.origin,
        originCountry: saved.origin_country || 'TZ',
        dest: saved.dest,
        destCountry: saved.dest_country || 'TZ',
        customer: saved.customer,
        weight: saved.weight || 0,
        mode: saved.mode as Shipment['mode'],
        cargoType: saved.cargo_type as Shipment['cargoType'],
        status: saved.status,
        eta: new Date(saved.eta || Date.now()),
        created: new Date(saved.created_at),
        contact: saved.contact || '—',
        email: saved.email || '—',
        phone: saved.phone || '—',
        notes: saved.notes || '',
        declaredValue: saved.declared_value || '—',
        insurance: saved.insurance || '—',
        pieces: saved.pieces || 1,
        contents: saved.contents || '—',
        consignor: saved.consignor,
        consignee: saved.consignee,
      };

      setShipments(prev => [newShipment, ...prev]);
      setActivePage('shipments');
      setSuccessShipment(newShipment);
    } catch (err: any) {
      showToast(err.message || 'Error creating shipment', 'red');
    } finally {
      setSubmitting(false);
    }
  };

  if (showPrint && successShipment) {
    return (
      <AirwaybillPrint
        shipment={successShipment}
        companyName={companySettings.name}
        companyAddress={companySettings.address}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: successShipment ? 360 : 640, maxHeight: '92vh', transition: 'width 0.25s ease' }}>
        <div className="modal-header" style={{ padding: successShipment ? '12px 16px' : undefined }}>
          <span className="modal-title" style={{ fontSize: successShipment ? 13 : undefined }}>
            {successShipment ? 'Shipment Confirmed' : 'New Shipment'}
          </span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l11 11M12 1L1 12"/></svg>
          </button>
        </div>

        {/* SUCCESS SCREEN */}
        {successShipment && (
          <>
            <div className="modal-body success-screen" style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

              {/* Animated check circle */}
              <div className="success-check-circle" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--green-dim)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                  <path className="success-check-path" d="M20 6L9 17l-5-5" stroke="var(--green)" strokeWidth="2.5" />
                </svg>
              </div>

              {/* Label */}
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Shipment Created</div>

              {/* AWB Number */}
              <div className="success-awb" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {successShipment.awbNumber}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Airwaybill Number</div>
              </div>

              {/* Copy button */}
              <button className="btn primary success-copy-btn" style={{ gap: 6, marginBottom: 14, fontSize: 11, padding: '6px 14px' }} onClick={() => copyAwb(successShipment.awbNumber ?? '')}>
                {copied ? (
                  <><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 11, height: 11 }}><path d="M2 8l4 4 8-8"/></svg>Copied!</>
                ) : (
                  <><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 11, height: 11 }}><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2"/></svg>Copy AWB</>
                )}
              </button>

              {/* Summary card */}
              <div className="success-summary" style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'left' }}>
                {/* From → To */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 1 }}>From</div>
                    <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{successShipment.consignor?.companyName || successShipment.customer}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{successShipment.origin}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" style={{ width: 13, height: 13, flexShrink: 0 }}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 1 }}>To</div>
                    <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{successShipment.consignee?.companyName || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{successShipment.dest}</div>
                  </div>
                </div>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  {[
                    { label: 'Mode',   value: successShipment.mode },
                    { label: 'Pieces', value: successShipment.pieces ?? '—' },
                    { label: 'Weight', value: successShipment.weight ? `${successShipment.weight} kg` : '—' },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{item.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', marginTop: 1 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '10px 16px' }}>
              <button className="btn" style={{ fontSize: 12, padding: '6px 14px' }} onClick={onClose}>Close</button>
              <button className="btn primary" style={{ fontSize: 12, padding: '6px 14px', gap: 6 }} onClick={() => setShowPrint(true)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 12, height: 12 }}><path d="M4 6V2h8v4"/><rect x="2" y="6" width="12" height="7" rx="1"/><path d="M4 10h8M4 13h5"/></svg>
                Print Airwaybill
              </button>
            </div>
          </>
        )}

        <div className="modal-body" style={{ display: successShipment ? 'none' : undefined }}>
          {/* TYPE TOGGLE */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <button
              className={`btn${formType === 'international' ? ' primary' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setFormType('international'); setMode('Sea'); }}
            >🌐 International</button>
            <button
              className={`btn${formType === 'domestic' ? ' primary' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setFormType('domestic'); setMode('Road'); setOriginCountry('TZ'); setDestCountry('TZ'); }}
            >🏠 Domestic (Tanzania)</button>
          </div>

          {/* ROUTE */}
          <div className="form-divider">Route</div>

          {formType === 'international' ? (
            <>
              {/* International: Country | City per row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Origin Country</label>
                  <SearchableSelect
                    options={countryOptions}
                    value={originCountry}
                    placeholder="Select country…"
                    searchPlaceholder="Search country…"
                    onChange={v => { setOriginCountry(v); setOrigin(''); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Origin City</label>
                  <SearchableSelect
                    options={originCities.map(cityToOption)}
                    value={origin}
                    placeholder="Select or type…"
                    searchPlaceholder="Search or type city…"
                    onChange={(_, label) => setOrigin(label)}
                    onFreeType={v => setOrigin(v)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Destination Country</label>
                  <SearchableSelect
                    options={countryOptions}
                    value={destCountry}
                    placeholder="Select country…"
                    searchPlaceholder="Search country…"
                    onChange={v => { setDestCountry(v); setDest(''); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination City</label>
                  <SearchableSelect
                    options={destCities.map(cityToOption)}
                    value={dest}
                    placeholder="Select or type…"
                    searchPlaceholder="Search or type city…"
                    onChange={(_, label) => setDest(label)}
                    onFreeType={v => setDest(v)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Domestic: Origin Region | Destination Region side by side */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Origin Region</label>
                  <SearchableSelect
                    options={originCities.map(cityToOption)}
                    value={origin}
                    placeholder="Select or type…"
                    searchPlaceholder="Search region…"
                    onChange={(_, label) => setOrigin(label)}
                    onFreeType={v => setOrigin(v)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Region</label>
                  <SearchableSelect
                    options={destCities.map(cityToOption)}
                    value={dest}
                    placeholder="Select or type…"
                    searchPlaceholder="Search region…"
                    onChange={(_, label) => setDest(label)}
                    onFreeType={v => setDest(v)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Transport Mode & ETA — shared for both types */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Transport Mode</label>
              <select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>
                {formType === 'international' ? (
                  <><option>Sea</option><option>Air</option><option>Road</option><option>Rail</option></>
                ) : (
                  <><option>Road</option><option>Rail</option></>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ETA</label>
              <input className="form-input" type="date" value={eta} onChange={e => setEta(e.target.value)} />
            </div>
          </div>

          {/* CARGO */}
          <div className="form-divider">Cargo</div>
          {/* Row 1: Pieces | Weight | Cargo Type */}
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" placeholder="e.g. 1" value={pieces} onChange={e => setPieces(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" placeholder="e.g. 1500" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={cargoType} onChange={e => setCargoType(e.target.value)}>
                {['General', 'Electronics', 'Perishable', 'Hazardous', 'Automotive', 'Textiles', 'Machinery'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {/* Row 2: Contents (full width) */}
          <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label className="form-label">Contents / Description</label>
              <input className="form-input" placeholder="e.g. Box of Books, Electronics, etc." value={contents} onChange={e => setContents(e.target.value)} />
            </div>
          </div>
          {/* Row 3: Declared Value | Insurance */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Declared Value</label>
              <input className="form-input" placeholder="e.g. TZS 500,000" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Insurance</label>
              <input className="form-input" placeholder="e.g. TZS 5,000,000" value={insurance} onChange={e => setInsurance(e.target.value)} />
            </div>
          </div>

          {/* CONSIGNOR */}
          <PartyFields title="Consignor (Sender)" value={consignor} onChange={setConsignor} countryOptions={countryOptions} />

          {/* CONSIGNEE */}
          <PartyFields title="Consignee (Recipient)" value={consignee} onChange={setConsignee} countryOptions={countryOptions} />

          {/* NOTES */}
          <div className="form-divider">Special Instructions</div>
          <div className="form-group">
            <textarea className="form-textarea" placeholder="Handling instructions, special requirements…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {!successShipment && (
          <div className="modal-footer">
            <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="btn primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Shipment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
