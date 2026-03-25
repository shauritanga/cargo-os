import type { Shipment } from '../types';

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

/** Map a raw API shipment record to the frontend Shipment type */
export function mapShipment(s: Record<string, any>): Shipment {
  return {
    id: String(s.id),
    awbNumber: s.awb_number ?? '',
    type: s.type,
    origin: s.origin,
    originCountry: s.origin_country ?? 'TZ',
    dest: s.dest,
    destCountry: s.dest_country ?? 'TZ',
    customer: s.customer,
    weight: Number(s.weight) || 0,
    mode: s.mode,
    cargoType: s.cargo_type,
    status: s.status,
    eta: new Date(s.eta ?? Date.now()),
    created: new Date(s.created_at ?? Date.now()),
    contact: s.contact ?? '—',
    email: s.email ?? '—',
    phone: s.phone ?? '—',
    notes: s.notes ?? '',
    declaredValue: s.declared_value ?? '—',
    insurance: s.insurance ?? '—',
    pieces: s.pieces ?? 1,
    contents: s.contents ?? '—',
    consignor: s.consignor ?? undefined,
    consignee: s.consignee ?? undefined,
  };
}

/** Fetch all shipments (loads up to 1000 at once for client-side filtering) */
export async function fetchShipments(): Promise<Shipment[]> {
  const res = await fetch('/api/shipments?per_page=1000', { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to fetch shipments');
  const json = await res.json();
  return (json.data ?? json).map(mapShipment);
}

/** PATCH status of a single shipment */
export async function patchShipmentStatus(id: string, status: string): Promise<void> {
  const res = await fetch(`/api/shipments/${id}/status`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}

/** DELETE a single shipment */
export async function deleteShipmentApi(id: string): Promise<void> {
  const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE', headers: HEADERS });
  if (!res.ok) throw new Error('Failed to delete shipment');
}

/** Bulk status update */
export async function bulkUpdateApi(ids: string[], status: string): Promise<void> {
  const res = await fetch('/api/shipments/bulk-update', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) throw new Error('Failed to bulk update');
}

/** Bulk delete */
export async function bulkDeleteApi(ids: string[]): Promise<void> {
  const res = await fetch('/api/shipments/bulk-delete', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Failed to bulk delete');
}
