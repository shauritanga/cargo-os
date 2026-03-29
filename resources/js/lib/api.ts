import type {
    AuthUser,
    Booking,
    BookingStatus,
    ManagedUser,
    Permission,
    Role,
    Shipment,
    ShipmentStatusEvent,
} from "../types";

const HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...init,
        headers: {
            ...HEADERS,
            ...(init?.headers ?? {}),
        },
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const data = await response.json();
            message = data?.message ?? message;
        } catch {
            // Keep fallback message for non-JSON responses.
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

function mapRole(raw: Record<string, any>): Role {
    return {
        id: String(raw.id),
        name: String(raw.name),
        description: raw.description ?? null,
        permissions: raw.permissions
            ? (raw.permissions as Record<string, any>[]).map(mapPermission)
            : undefined,
    };
}

function mapPermission(raw: Record<string, any>): Permission {
    return {
        id: String(raw.id),
        key: String(raw.key),
        resource: String(raw.resource),
        action: String(raw.action),
        description: raw.description ?? null,
    };
}

function mapAuthUser(raw: Record<string, any>): AuthUser {
    return {
        id: String(raw.id),
        name: String(raw.name),
        email: String(raw.email),
        isActive: Boolean(raw.is_active),
        roles: (raw.roles ?? []).map(mapRole),
        directPermissions: (raw.direct_permissions ?? []).map(mapPermission),
        effectivePermissions: (raw.effective_permissions ?? []).map(
            (p: unknown) => String(p),
        ),
    };
}

function mapManagedUser(raw: Record<string, any>): ManagedUser {
    return {
        id: String(raw.id),
        name: String(raw.name),
        email: String(raw.email),
        isActive: Boolean(raw.is_active),
        roles: (raw.roles ?? []).map(mapRole),
        directPermissions: (raw.direct_permissions ?? []).map(mapPermission),
        effectivePermissions: (raw.effective_permissions ?? []).map(
            (p: unknown) => String(p),
        ),
    };
}

/** Map a raw API shipment record to the frontend Shipment type */
export function mapShipment(s: Record<string, any>): Shipment {
    return {
        id: String(s.id),
        awbNumber: s.awb_number ?? "",
        type: s.type,
        origin: s.origin,
        originCountry: s.origin_country ?? "TZ",
        dest: s.dest,
        destCountry: s.dest_country ?? "TZ",
        customer: s.customer,
        weight: Number(s.weight) || 0,
        mode: s.mode,
        cargoType: s.cargo_type,
        status: s.status,
        eta: new Date(s.eta ?? Date.now()),
        created: new Date(s.created_at ?? Date.now()),
        contact: s.contact ?? "—",
        email: s.email ?? "—",
        phone: s.phone ?? "—",
        notes: s.notes ?? "",
        declaredValue: s.declared_value ?? "—",
        insurance: s.insurance ?? "—",
        pieces: s.pieces ?? 1,
        contents: s.contents ?? "—",
        consignor: s.consignor ?? undefined,
        consignee: s.consignee ?? undefined,
    };
}

function mapBooking(b: Record<string, any>): Booking {
    return {
        id: String(b.id),
        customer: b.customer,
        origin: b.origin,
        dest: b.dest,
        mode: b.mode,
        type: b.type,
        weight: Number(b.weight) || 0,
        containers: Number(b.containers) || 1,
        urgency: b.urgency,
        status: b.status,
        received: new Date(b.created_at ?? Date.now()),
        contact: b.contact ?? "—",
        email: b.email ?? "—",
        phone: b.phone ?? "—",
        message: b.message ?? "",
        convertedTo: b.converted_to ?? null,
        assignedTo: b.assigned_to ?? null,
        notes: b.notes ?? "",
    };
}

function mapShipmentStatusEvent(raw: Record<string, any>): ShipmentStatusEvent {
    return {
        id: String(raw.id),
        shipment_id: String(raw.shipment_id),
        previous_status: raw.previous_status ?? null,
        new_status: raw.new_status,
        reason: raw.reason ?? null,
        is_override: Boolean(raw.is_override),
        override_reason: raw.override_reason ?? null,
        metadata: (raw.metadata as Record<string, unknown> | null) ?? null,
        triggered_by: raw.triggered_by ? String(raw.triggered_by) : null,
        occurred_at: String(raw.occurred_at),
        created_at: String(raw.created_at),
        updated_at: String(raw.updated_at),
    };
}

/** Fetch all shipments (loads up to 1000 at once for client-side filtering) */
export async function fetchShipments(): Promise<Shipment[]> {
    const json = await apiJson<any>("/api/shipments?per_page=1000");
    return (json.data ?? json).map(mapShipment);
}

export async function fetchBookings(): Promise<Booking[]> {
    const json = await apiJson<any>("/api/bookings?per_page=1000");
    return (json.data ?? json).map(mapBooking);
}

export async function patchBookingStatus(
    id: string,
    status: BookingStatus,
): Promise<Booking> {
    const booking = await apiJson<any>(`/api/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });

    return mapBooking(booking);
}

export async function updateBooking(
    id: string,
    input: Partial<{
        customer: string;
        origin: string;
        dest: string;
        mode: string;
        type: string;
        weight: number;
        containers: number;
        urgency: string;
        contact: string;
        email: string;
        phone: string;
        message: string;
        assigned_to: string | null;
        notes: string;
    }>,
): Promise<Booking> {
    const booking = await apiJson<any>(`/api/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });

    return mapBooking(booking);
}

export async function convertBookingToShipment(id: string): Promise<Booking> {
    const booking = await apiJson<any>(`/api/bookings/${id}/convert`, {
        method: "POST",
    });

    return mapBooking(booking);
}

/** PATCH status of a single shipment */
export async function patchShipmentStatus(
    id: string,
    status: string,
    options?: {
        reason?: string;
        override?: boolean;
        overrideReason?: string;
        occurredAt?: string;
        recipientName?: string;
        recipientPhone?: string;
    },
): Promise<void> {
    await apiJson<void>(`/api/shipments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
            status,
            reason: options?.reason,
            override: options?.override,
            override_reason: options?.overrideReason,
            occurred_at: options?.occurredAt,
            recipient_name: options?.recipientName,
            recipient_phone: options?.recipientPhone,
        }),
    });
}

/** DELETE a single shipment */
export async function deleteShipmentApi(id: string): Promise<void> {
    await apiJson<void>(`/api/shipments/${id}`, { method: "DELETE" });
}

/** Bulk status update */
export async function bulkUpdateApi(
    ids: string[],
    status: string,
    options?: {
        reason?: string;
        override?: boolean;
        overrideReason?: string;
        occurredAt?: string;
        recipientName?: string;
        recipientPhone?: string;
    },
): Promise<void> {
    await apiJson<void>("/api/shipments/bulk-update", {
        method: "POST",
        body: JSON.stringify({
            ids,
            status,
            reason: options?.reason,
            override: options?.override,
            override_reason: options?.overrideReason,
            occurred_at: options?.occurredAt,
            recipient_name: options?.recipientName,
            recipient_phone: options?.recipientPhone,
        }),
    });
}

export async function fetchShipmentEvents(
    id: string,
): Promise<ShipmentStatusEvent[]> {
    const events = await apiJson<Record<string, any>[]>(
        `/api/shipments/${id}/events`,
    );
    return events.map(mapShipmentStatusEvent);
}

/** Bulk delete */
export async function bulkDeleteApi(ids: string[]): Promise<void> {
    await apiJson<void>("/api/shipments/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
    });
}

export async function loginApi(
    email: string,
    password: string,
    remember: boolean,
): Promise<AuthUser> {
    const payload = await apiJson<{ user: Record<string, any> }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember }),
    });

    return mapAuthUser(payload.user);
}

export async function meApi(): Promise<AuthUser> {
    const payload = await apiJson<{ user: Record<string, any> }>("/api/me");
    return mapAuthUser(payload.user);
}

export async function logoutApi(): Promise<void> {
    await apiJson<void>("/api/logout", { method: "POST" });
}

export async function fetchRoles(): Promise<Role[]> {
    const payload = await apiJson<any>("/api/roles?per_page=500");
    return (payload.data ?? payload).map(mapRole);
}

export async function createRole(input: {
    name: string;
    description?: string;
}): Promise<Role> {
    const role = await apiJson<any>("/api/roles", {
        method: "POST",
        body: JSON.stringify(input),
    });
    return mapRole(role);
}

export async function updateRole(
    id: string,
    input: { name: string; description?: string },
): Promise<Role> {
    const role = await apiJson<any>(`/api/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
    return mapRole(role);
}

export async function deleteRole(id: string): Promise<void> {
    await apiJson<void>(`/api/roles/${id}`, { method: "DELETE" });
}

export async function assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
): Promise<void> {
    await apiJson<void>(`/api/roles/${roleId}/permissions`, {
        method: "POST",
        body: JSON.stringify({
            permission_ids: permissionIds.map((id) => Number(id)),
        }),
    });
}

export async function fetchPermissions(): Promise<Permission[]> {
    const payload = await apiJson<any>("/api/permissions?per_page=1000");
    return (payload.data ?? payload).map(mapPermission);
}

export async function createPermission(input: {
    resource: string;
    action: string;
    description?: string;
}): Promise<Permission> {
    const permission = await apiJson<any>("/api/permissions", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return mapPermission(permission);
}

export async function updatePermission(
    id: string,
    input: { resource: string; action: string; description?: string },
): Promise<Permission> {
    const permission = await apiJson<any>(`/api/permissions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });

    return mapPermission(permission);
}

export async function deletePermission(id: string): Promise<void> {
    await apiJson<void>(`/api/permissions/${id}`, { method: "DELETE" });
}

export async function fetchManagedUsers(): Promise<ManagedUser[]> {
    const payload = await apiJson<any>("/api/users?per_page=500");
    return (payload.data ?? payload).map(mapManagedUser);
}

export async function createManagedUser(input: {
    name: string;
    email: string;
    password: string;
    isActive?: boolean;
}): Promise<ManagedUser> {
    const user = await apiJson<any>("/api/users", {
        method: "POST",
        body: JSON.stringify({
            name: input.name,
            email: input.email,
            password: input.password,
            is_active: input.isActive ?? true,
        }),
    });

    return mapManagedUser(user);
}

export async function updateManagedUser(
    id: string,
    input: {
        name: string;
        email: string;
        password?: string;
        isActive?: boolean;
    },
): Promise<ManagedUser> {
    const user = await apiJson<any>(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            name: input.name,
            email: input.email,
            password: input.password,
            is_active: input.isActive,
        }),
    });

    return mapManagedUser(user);
}

export async function assignRolesToUser(
    userId: string,
    roleIds: string[],
): Promise<ManagedUser> {
    const user = await apiJson<any>(`/api/users/${userId}/roles`, {
        method: "POST",
        body: JSON.stringify({ role_ids: roleIds.map((id) => Number(id)) }),
    });

    return mapManagedUser(user);
}

export async function assignDirectPermissionsToUser(
    userId: string,
    permissionIds: string[],
): Promise<ManagedUser> {
    const user = await apiJson<any>(`/api/users/${userId}/permissions`, {
        method: "POST",
        body: JSON.stringify({
            permission_ids: permissionIds.map((id) => Number(id)),
        }),
    });

    return mapManagedUser(user);
}
