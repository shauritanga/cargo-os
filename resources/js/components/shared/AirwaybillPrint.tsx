import React from 'react';
import type { Shipment } from '../../types';
import { fmtDate } from '../../data/mock';

interface Props {
  shipment: Shipment;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  onClose: () => void;
}

const TEAL       = '#00BCD4';
const TEAL_DARK  = '#006064';
const TEAL_LIGHT = '#e0f7fa';
const LOGO_URL   = '/logo.png';
const AWB_ADDRESS_LINE = '12 Nyerere Road, Dar es Salaam, Tanzania';
const AWB_PHONE_OPS = '+255 756 449 449';
const AWB_PHONE_HQ = '+255 745 000 762';
const AWB_EMAILS = 'info@rtexpress.co.tz / cs@rtexpress.co.tz';

/* ─── Print HTML builder ──────────────────────────────────────────────────── */
function buildPrintHtml(
  shipment: Shipment,
  companyName: string,
  companyAddress: string,
  companyPhone: string,
  companyEmail: string,
): string {
  const con    = shipment.consignor;
  const cee    = shipment.consignee;
  const awbNo  = shipment.awbNumber || shipment.id;
  const date   = fmtDate(shipment.created || new Date());
  const hasIns = !!(shipment.insurance && shipment.insurance !== '—');
  const origin = window.location.origin;
  const barcodeSrc = `${origin}/api/shipments/barcode/${encodeURIComponent(shipment.id)}`;

  const fieldRow = (label: string, value: string) =>
    `<div style="display:flex;padding:3px 10px;border-bottom:1px solid #ddd;min-height:18px">
      <span style="font-size:8px;font-weight:700;color:${TEAL_DARK};text-transform:uppercase;width:90px;flex-shrink:0;padding-top:1px">${label}</span>
      <span style="font-size:10px;color:#111">${value || '—'}</span>
    </div>`;

  const sectionTitle = (title: string) =>
    `<div style="background:${TEAL};-webkit-print-color-adjust:exact;print-color-adjust:exact;color:#fff;font-weight:700;font-size:9px;padding:3px 10px;text-transform:uppercase;letter-spacing:.5px">${title}</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Airwaybill ${awbNo}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:10px; color:#111; background:#fff; }
    .awb { width:720px; border:2px solid #aaa; margin:10px auto; }
    @media print {
      * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
      body { margin:0; }
      .awb { width:100%; border:2px solid #aaa; margin:0; }
      @page { margin:8mm; }
    }
  </style>
</head>
<body>
<div class="awb">

  <!-- HEADER -->
  <div style="display:grid;grid-template-columns:1.5fr 1.15fr 0.75fr;border-bottom:2px solid ${TEAL}">
    <!-- Company info -->
    <div style="padding:10px 12px;font-size:9px;line-height:1.6;border-right:1px solid #aaa;background:#f9f9f9">
      <strong style="font-size:11px;color:#111">${companyName}</strong><br/>
      <span style="color:#555">${AWB_ADDRESS_LINE}</span><br/>
      <span style="color:#555">Phone Operations: ${AWB_PHONE_OPS}</span><br/>
      <span style="color:#555">HQ: ${AWB_PHONE_HQ}</span><br/>
      <span style="color:#555">Email: ${AWB_EMAILS}</span>
    </div>
    <!-- AWB centre -->
    <div style="padding:10px 8px;text-align:center;border-right:1px solid #aaa;background:#fff">
      <div style="font-weight:700;font-size:13px;color:${TEAL_DARK};letter-spacing:1px">Airwaybill</div>
      <div style="margin:5px 0 4px;min-height:76px;display:flex;align-items:center;justify-content:center;padding:0 2px">
        <img src="${barcodeSrc}" alt="Barcode ${awbNo}" style="width:100%;height:72px;object-fit:fill;display:block" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>
        <div style="display:none;font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#aaa">||||||||||||||||||||||||||||||||</div>
      </div>
      <div style="font-weight:700;font-size:20px;letter-spacing:2px;color:#111">${awbNo}</div>
    </div>
    <!-- Logo / brand top-right -->
    <div style="padding:10px 14px;background:${TEAL};-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
      <img src="${origin}${LOGO_URL}" alt="${companyName}" style="height:36px;max-width:130px;object-fit:contain;margin-bottom:5px" onerror="this.style.display='none';document.getElementById('fallback-name').style.display='block'"/>
      <div id="fallback-name" style="display:none;font-size:20px;font-weight:900;color:#fff;letter-spacing:1px">${companyName}</div>
      <div style="font-size:8.5px;color:rgba(255,255,255,.9)">www.rtexpress.co.tz</div>
      <div style="font-size:8.5px;color:rgba(255,255,255,.9)">info@rtexpress.co.tz</div>
    </div>
  </div>

  <!-- ROUTE BAR -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;background:${TEAL_LIGHT};-webkit-print-color-adjust:exact;print-color-adjust:exact;border-bottom:1px solid #aaa">
    ${[
      { label: 'Account No', value: '' },
      { label: 'From',       value: shipment.origin },
      { label: 'To',         value: shipment.dest },
      { label: 'Date',       value: date },
    ].map((item, i) =>
      `<div style="padding:4px 10px;${i < 3 ? 'border-right:1px solid #aaa;' : ''}">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:${TEAL_DARK}">${item.label}</div>
        <div style="font-size:10px;color:#111">${item.value || ''}</div>
      </div>`
    ).join('')}
  </div>

  <!-- CONSIGNOR + CARGO RIGHT -->
  <div style="display:grid;grid-template-columns:1fr 200px;border-bottom:1px solid #aaa">
    <div style="border-right:1px solid #aaa">
      ${sectionTitle('Consignor (Sender)')}
      ${con ? [
        ['Company Name', con.companyName],
        ['Street Address', con.streetAddress],
        ['City / Town', con.cityTown],
        ['Country', con.country],
        ['Tel', con.tel],
        ['Name', con.contactName],
        ['Email', con.email],
      ].map(([l, v]) => fieldRow(l, v)).join('')
        : '<div style="padding:8px 10px;font-size:10px;color:#888">No consignor details</div>'}
    </div>
    <div>
      <div style="border-bottom:1px solid #aaa">
        ${sectionTitle('Pieces &amp; Weight')}
        <div style="display:grid;grid-template-columns:1fr 1fr">
          <div style="padding:5px 8px;border-right:1px solid #aaa">
            <div style="font-size:8px;font-weight:700;color:${TEAL_DARK};text-transform:uppercase">Pieces</div>
            <div style="font-weight:700;font-size:12px;color:#111">${shipment.pieces || '—'}</div>
          </div>
          <div style="padding:5px 8px">
            <div style="font-size:8px;font-weight:700;color:${TEAL_DARK};text-transform:uppercase">Weight</div>
            <div style="font-weight:700;font-size:12px;color:#111">${shipment.weight ? shipment.weight.toLocaleString() + ' kg' : '—'}</div>
          </div>
        </div>
      </div>
      <div style="border-bottom:1px solid #aaa">
        ${sectionTitle('Contents')}
        <div style="padding:5px 8px;font-size:10px;color:#111;min-height:30px">${shipment.contents || '—'}</div>
      </div>
      <div>
        ${sectionTitle('Dimensions')}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:${TEAL_LIGHT};-webkit-print-color-adjust:exact;print-color-adjust:exact">
          ${['L', 'W', 'H'].map((d, i) =>
            `<div style="padding:2px 6px;${i < 2 ? 'border-right:1px solid #aaa;' : ''}text-align:center;font-size:8px;font-weight:700;color:${TEAL_DARK}">${d}</div>`
          ).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;min-height:22px">
          ${[0, 1, 2].map(i =>
            `<div style="padding:3px 6px;${i < 2 ? 'border-right:1px solid #aaa;' : ''}"></div>`
          ).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- CONSIGNEE + SPECIAL RIGHT -->
  <div style="display:grid;grid-template-columns:1fr 200px;border-bottom:1px solid #aaa">
    <div style="border-right:1px solid #aaa">
      ${sectionTitle('Consignee (Recipient)')}
      ${cee ? [
        ['Company Name', cee.companyName],
        ['Street Address', cee.streetAddress],
        ['City / Town', cee.cityTown],
        ['Country', cee.country],
        ['Name', cee.contactName],
        ['Tel', cee.tel],
        ['Email', cee.email],
      ].map(([l, v]) => fieldRow(l, v)).join('')
        : '<div style="padding:8px 10px;font-size:10px;color:#888">No consignee details</div>'}
    </div>
    <div>
      <div style="border-bottom:1px solid #aaa">
        ${sectionTitle('Special Instructions')}
        <div style="padding:5px 8px;font-size:10px;color:#111;min-height:40px">${shipment.notes || '—'}</div>
      </div>
      <div style="border-bottom:1px solid #aaa">
        ${sectionTitle('Declared Value (TZS)')}
        <div style="padding:5px 8px;font-size:10px;color:#111">${shipment.declaredValue || '—'}</div>
      </div>
      <div>
        ${sectionTitle('Insurance (TZS)')}
        <div style="padding:5px 8px;font-size:10px;color:#111">
          <span style="margin-right:14px">YES ${hasIns ? '☑' : '☐'}</span>
          <span>NO ${hasIns ? '☐' : '☑'}</span>
          ${hasIns ? `<div style="margin-top:4px;font-weight:700;color:#111">${shipment.insurance}</div>` : ''}
        </div>
      </div>
    </div>
  </div>

  <!-- RECEIVED -->
  <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #aaa">
    ${['Received by RT Express', 'Received by Consignee'].map((title, bi) =>
      `<div style="padding:6px 10px;${bi === 0 ? 'border-right:1px solid #aaa;' : ''}">
        <div style="background:${TEAL};-webkit-print-color-adjust:exact;print-color-adjust:exact;color:#fff;font-weight:700;font-size:8px;padding:2px 6px;margin-bottom:6px;text-transform:uppercase">${title}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          ${['Date', 'Time', 'Name'].map(col =>
            `<div>
              <div style="font-size:8px;font-weight:700;color:${TEAL_DARK};text-transform:uppercase;border-bottom:1px solid #aaa;padding-bottom:2px">${col}</div>
              <div style="min-height:18px"></div>
            </div>`
          ).join('')}
        </div>
      </div>`
    ).join('')}
  </div>

  <!-- FOOTER -->
  <div style="background:${TEAL};-webkit-print-color-adjust:exact;print-color-adjust:exact;text-align:center;padding:6px">
    <div style="font-size:9px;color:#fff;font-style:italic">RT Express terms and conditions strictly apply, which is available on request</div>
    <div style="font-size:11px;font-weight:700;color:#fff;margin-top:2px">On Time, The First Time</div>
  </div>

</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body>
</html>`;
}

/* ─── Preview helpers ─────────────────────────────────────────────────────── */
function PreviewFieldRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', padding: '3px 10px', borderBottom: '1px solid #ddd', minHeight: 20 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: TEAL_DARK, textTransform: 'uppercase', width: 88, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 10, color: '#111' }}>{value || '—'}</span>
    </div>
  );
}

function PreviewSectionTitle({ title }: { title: string }) {
  return (
    <div style={{ background: TEAL, color: '#fff', fontWeight: 700, fontSize: 9, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
      {title}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function AirwaybillPrint({ shipment, companyName, companyAddress = '', companyPhone = '', companyEmail = '', onClose }: Props) {
  const con    = shipment.consignor;
  const cee    = shipment.consignee;
  const awbNo  = shipment.awbNumber || shipment.id;
  const barcodeSrc = `/api/shipments/barcode/${encodeURIComponent(shipment.id)}`;
  const hasIns = !!(shipment.insurance && shipment.insurance !== '—');
  const border = '1px solid #ddd';

  const handlePrint = () => {
    const html = buildPrintHtml(shipment, companyName, companyAddress, companyPhone, companyEmail);
    const w = window.open('', '_blank', 'width=860,height=740,scrollbars=yes');
    if (!w) { alert('Please allow pop-ups to print the airwaybill.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 700, maxHeight: '94vh' }}>
        <div className="modal-header">
          <span className="modal-title">Airwaybill — {awbNo}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn primary" onClick={handlePrint}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 14, height: 14 }}>
                <path d="M4 6V2h8v4M2 6h12a1 1 0 011 1v5a1 1 0 01-1 1h-2v2H4v-2H2a1 1 0 01-1-1V7a1 1 0 011-1z"/>
              </svg>
              Print
            </button>
            <button className="modal-close" onClick={onClose}>
              <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l11 11M12 1L1 12"/></svg>
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div style={{ border: '2px solid #aaa', borderRadius: 4, overflow: 'hidden', fontSize: 11, background: '#fff', color: '#111' }}>

            {/* HEADER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.15fr 0.75fr', borderBottom: `2px solid ${TEAL}` }}>
              {/* Company info */}
              <div style={{ padding: '10px 12px', fontSize: 9, lineHeight: 1.6, borderRight: border, background: '#f9f9f9' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 2 }}>{companyName}</div>
                <div style={{ color: '#555' }}>{AWB_ADDRESS_LINE}</div>
                <div style={{ color: '#555' }}>Phone Operations: {AWB_PHONE_OPS}</div>
                <div style={{ color: '#555' }}>HQ: {AWB_PHONE_HQ}</div>
                <div style={{ color: '#555' }}>Email: {AWB_EMAILS}</div>
              </div>
              {/* AWB centre */}
              <div style={{ padding: '10px 8px', textAlign: 'center', borderRight: border, background: '#fff' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: TEAL_DARK }}>Airwaybill</div>
                <div style={{ margin: '4px 0', minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                  <img
                    src={barcodeSrc}
                    alt={`Barcode ${awbNo}`}
                    style={{ width: '100%', height: 72, objectFit: 'fill', display: 'block' }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const fallback = e.currentTarget.nextSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', fontFamily: 'monospace', letterSpacing: 2, fontSize: 9, color: '#bbb' }}>||||||||||||||||||||||||||||||||</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 2, color: '#111' }}>{awbNo}</div>
              </div>
              {/* Logo — top-right teal */}
              <div style={{ padding: '10px 14px', background: TEAL, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <img
                  src={LOGO_URL}
                  alt={companyName}
                  style={{ height: 36, maxWidth: 130, objectFit: 'contain', marginBottom: 5 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement).style.display = 'block'; }}
                />
                <div style={{ display: 'none', fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: 1 }}>{companyName}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.9)', marginTop: 2 }}>www.rtexpress.co.tz</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.9)' }}>info@rtexpress.co.tz</div>
              </div>
            </div>

            {/* ROUTE BAR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: TEAL_LIGHT, borderBottom: border }}>
              {[
                { label: 'Account No', value: '' },
                { label: 'From',       value: shipment.origin },
                { label: 'To',         value: shipment.dest },
                { label: 'Date',       value: fmtDate(shipment.created || new Date()) },
              ].map((item, i) => (
                <div key={i} style={{ padding: '4px 10px', borderRight: i < 3 ? border : 'none' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: TEAL_DARK }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: '#111' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* CONSIGNOR + CARGO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', borderBottom: border }}>
              <div style={{ borderRight: border }}>
                <PreviewSectionTitle title="Consignor (Sender)" />
                {con
                  ? [['Company Name', con.companyName], ['Street Address', con.streetAddress], ['City / Town', con.cityTown], ['Country', con.country], ['Tel', con.tel], ['Name', con.contactName], ['Email', con.email]]
                      .map(([l, v]) => <PreviewFieldRow key={l} label={l} value={v} />)
                  : <div style={{ padding: '8px 10px', fontSize: 10, color: '#888' }}>No consignor details</div>}
              </div>
              <div>
                <div style={{ borderBottom: border }}>
                  <PreviewSectionTitle title="Pieces & Weight" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ padding: '5px 8px', borderRight: border }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: TEAL_DARK, textTransform: 'uppercase' }}>Pieces</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{shipment.pieces || '—'}</div>
                    </div>
                    <div style={{ padding: '5px 8px' }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: TEAL_DARK, textTransform: 'uppercase' }}>Weight</div>
                      <div style={{ fontWeight: 700, fontSize: 11, color: '#111' }}>{shipment.weight ? shipment.weight.toLocaleString() + ' kg' : '—'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ borderBottom: border }}>
                  <PreviewSectionTitle title="Contents" />
                  <div style={{ padding: '5px 8px', fontSize: 10, color: '#111', minHeight: 30 }}>{shipment.contents || '—'}</div>
                </div>
                <div>
                  <PreviewSectionTitle title="Dimensions" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: TEAL_LIGHT }}>
                    {['L', 'W', 'H'].map((d, i) => (
                      <div key={d} style={{ padding: '2px 6px', borderRight: i < 2 ? border : 'none', textAlign: 'center', fontSize: 8, fontWeight: 700, color: TEAL_DARK }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', minHeight: 20 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ padding: '3px 6px', borderRight: i < 2 ? border : 'none' }} />)}
                  </div>
                </div>
              </div>
            </div>

            {/* CONSIGNEE + SPECIAL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', borderBottom: border }}>
              <div style={{ borderRight: border }}>
                <PreviewSectionTitle title="Consignee (Recipient)" />
                {cee
                  ? [['Company Name', cee.companyName], ['Street Address', cee.streetAddress], ['City / Town', cee.cityTown], ['Country', cee.country], ['Name', cee.contactName], ['Tel', cee.tel], ['Email', cee.email]]
                      .map(([l, v]) => <PreviewFieldRow key={l} label={l} value={v} />)
                  : <div style={{ padding: '8px 10px', fontSize: 10, color: '#888' }}>No consignee details</div>}
              </div>
              <div>
                <div style={{ borderBottom: border }}>
                  <PreviewSectionTitle title="Special Instructions" />
                  <div style={{ padding: '5px 8px', fontSize: 10, color: '#111', minHeight: 40 }}>{shipment.notes || '—'}</div>
                </div>
                <div style={{ borderBottom: border }}>
                  <PreviewSectionTitle title="Declared Value (TZS)" />
                  <div style={{ padding: '5px 8px', fontSize: 10, color: '#111' }}>{shipment.declaredValue || '—'}</div>
                </div>
                <div>
                  <PreviewSectionTitle title="Insurance (TZS)" />
                  <div style={{ padding: '5px 8px', fontSize: 10, color: '#111' }}>
                    <span style={{ marginRight: 12 }}>YES {hasIns ? '☑' : '☐'}</span>
                    <span>NO {hasIns ? '☐' : '☑'}</span>
                    {hasIns && <div style={{ marginTop: 4, fontWeight: 700, color: '#111' }}>{shipment.insurance}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* RECEIVED */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: border }}>
              {['Received by RT Express', 'Received by Consignee'].map((title, bi) => (
                <div key={bi} style={{ padding: '6px 10px', borderRight: bi === 0 ? border : 'none' }}>
                  <div style={{ background: TEAL, color: '#fff', fontWeight: 700, fontSize: 8, padding: '2px 6px', marginBottom: 6, textTransform: 'uppercase' }}>{title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {['Date', 'Time', 'Name'].map(col => (
                      <div key={col}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: TEAL_DARK, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 2 }}>{col}</div>
                        <div style={{ minHeight: 18 }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div style={{ background: TEAL, textAlign: 'center', padding: '6px 10px' }}>
              <div style={{ fontSize: 9, color: '#fff', fontStyle: 'italic' }}>RT Express terms and conditions strictly apply, which is available on request</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginTop: 2 }}>On Time, The First Time</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
