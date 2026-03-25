import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SearchableSelect from './SearchableSelect';
import { TZ_REGIONS, randInt, randItem } from '../../data/mock';
import type { Shipment } from '../../types';

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

export default function NewShipmentModal({ onClose }: Props) {
  const { setShipments, showToast, setActivePage } = useApp();
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
  const [mode, setMode] = useState('Sea');
  const [eta, setEta] = useState('');
  const [customer, setCustomer] = useState('');
  const [weight, setWeight] = useState('');
  const [cargoType, setCargoType] = useState('General');
  const [declaredValue, setDeclaredValue] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  // International
  const [incoterm, setIncoterm] = useState('FOB');
  const [containers, setContainers] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [insurance, setInsurance] = useState('');
  const [broker, setBroker] = useState('');
  const [blNumber, setBlNumber] = useState('');
  // Domestic
  const [driver, setDriver] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [distance, setDistance] = useState('');
  const [window_, setWindow] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');

  const cityToOption = (c: string) => ({ label: c, value: c });

  const handleSubmit = () => {
    if (!origin || !dest || !customer) {
      alert('Please fill in Origin, Destination, and Customer.');
      return;
    }
    const etaDate = eta ? new Date(eta) : new Date(Date.now() + randInt(5, 30) * 86400000);
    const prefixes = formType === 'international' ? ['SHG', 'DXB', 'SGP', 'RTM', 'INT'] : ['DOM', 'LOC', 'TZ', 'DAR', 'NBI'];
    const base: Shipment = {
      id: `${randItem(prefixes)}-${String(Date.now()).slice(-5)}`,
      type: formType,
      origin, originCountry: originCountry || 'TZ',
      dest, destCountry: destCountry || 'TZ',
      customer,
      weight: parseInt(weight) || randInt(200, 5000),
      mode: mode as Shipment['mode'],
      cargoType: cargoType as Shipment['cargoType'],
      status: 'pending',
      eta: etaDate,
      created: new Date(),
      contact: contact || '—',
      email: email || '—',
      phone: phone || '—',
      notes,
      declaredValue: declaredValue || '—',
    };

    const newShipment: Shipment = formType === 'international'
      ? { ...base, containers: parseInt(containers) || 1, incoterm, hsCode: hsCode || '—', insurance: insurance || '—', customsBroker: broker || '—', blNumber: blNumber || '—', vessel: 'TBD', port: 'TBD', originPort: 'TBD', dutyAmount: '—' }
      : { ...base, driver: driver || '—', vehicle: vehicle || '—', distanceKm: parseInt(distance) || 0, deliveryWindow: window_ || '—', pickupAddress: pickup || '—', deliveryAddress: delivery || '—', podRequired: true };

    setShipments(prev => [newShipment, ...prev]);
    showToast('Shipment created successfully', 'green');
    setActivePage('shipments');
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 600, maxHeight: '92vh' }}>
        <div className="modal-header">
          <span className="modal-title">New Shipment</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l11 11M12 1L1 12"/></svg>
          </button>
        </div>

        <div className="modal-body">
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

          <div className="form-divider">Route</div>

          <div className="form-row">
            {formType === 'international' && (
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
            )}
            <div className="form-group">
              <label className="form-label">{formType === 'domestic' ? 'Origin Region' : 'Origin City'}</label>
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
            {formType === 'international' && (
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
            )}
            <div className="form-group">
              <label className="form-label">{formType === 'domestic' ? 'Destination Region' : 'Destination City'}</label>
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
              <input className="form-input" type="date" value={eta} onChange={e => setEta(e.target.value)}/>
            </div>
          </div>

          <div className="form-divider">Cargo</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Customer</label><input className="form-input" placeholder="Company name" value={customer} onChange={e => setCustomer(e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" placeholder="e.g. 1500" value={weight} onChange={e => setWeight(e.target.value)}/></div>
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={cargoType} onChange={e => setCargoType(e.target.value)}>
                {['General','Electronics','Perishable','Hazardous','Automotive','Textiles','Machinery'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Declared Value</label><input className="form-input" placeholder="e.g. USD 50,000" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)}/></div>
          </div>

          {formType === 'international' && (
            <>
              <div className="form-divider">International Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Incoterm</label>
                  <select className="form-select" value={incoterm} onChange={e => setIncoterm(e.target.value)}>
                    {['FOB','CIF','DDP','EXW','DAP','FCA','CFR'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Containers</label><input className="form-input" type="number" placeholder="e.g. 2" value={containers} onChange={e => setContainers(e.target.value)}/></div>
                <div className="form-group"><label className="form-label">HS Code</label><input className="form-input" placeholder="e.g. 8471.30" value={hsCode} onChange={e => setHsCode(e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Insurance</label><input className="form-input" placeholder="e.g. $50,000" value={insurance} onChange={e => setInsurance(e.target.value)}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Customs Broker</label><input className="form-input" placeholder="Broker name" value={broker} onChange={e => setBroker(e.target.value)}/></div>
                <div className="form-group"><label className="form-label">B/L Number</label><input className="form-input" placeholder="e.g. BL123456" value={blNumber} onChange={e => setBlNumber(e.target.value)}/></div>
              </div>
            </>
          )}

          {formType === 'domestic' && (
            <>
              <div className="form-divider">Domestic Details</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Driver</label><input className="form-input" placeholder="Driver name" value={driver} onChange={e => setDriver(e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Vehicle Plate</label><input className="form-input" placeholder="e.g. T 201 BCD" value={vehicle} onChange={e => setVehicle(e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Distance (km)</label><input className="form-input" type="number" placeholder="e.g. 450" value={distance} onChange={e => setDistance(e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Delivery Window</label><input className="form-input" placeholder="09:00 – 14:00" value={window_} onChange={e => setWindow(e.target.value)}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Pickup Address</label><input className="form-input" placeholder="Street / area" value={pickup} onChange={e => setPickup(e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Delivery Address</label><input className="form-input" placeholder="Street / area" value={delivery} onChange={e => setDelivery(e.target.value)}/></div>
              </div>
            </>
          )}

          <div className="form-divider">Contact</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Contact Name</label><input className="form-input" placeholder="Full name" value={contact} onChange={e => setContact(e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="email@company.com" value={email} onChange={e => setEmail(e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="+255 712 000000" value={phone} onChange={e => setPhone(e.target.value)}/></div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Handling instructions, special requirements…" value={notes} onChange={e => setNotes(e.target.value)}/>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleSubmit}>Create Shipment</button>
        </div>
      </div>
    </div>
  );
}
