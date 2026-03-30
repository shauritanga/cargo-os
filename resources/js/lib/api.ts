import type {
    AuditLog,
    AuthUser,
    BillingInvoice,
    Booking,
    BookingStatus,
    Customer,
    FleetVehicle,
    ManagedUser,
    Permission,
    Route,
    Role,
    Shipment,
    ShipmentStatusEvent,
    InvoiceLineItem,
    InvoiceStatus,
    PaginatedAuditLogs,
    Warehouse,
} from "../types";

const HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
};

function isMutationMethod(method?: string): boolean {
    const value = (method ?? "GET").toUpperCase();
    return value !== "GET" && value !== "HEAD";
}

function getCsrfToken(): string | null {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    return token && token.length > 0 ? token : null;
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
    const method = (init?.method ?? "GET").toUpperCase();
    const headers: Record<string, string> = {
        ...HEADERS,
        ...(init?.headers as Record<string, string> | undefined),
    };

    if (isMutationMethod(method)) {
        const csrf = getCsrfToken();
        if (csrf) {
            headers["X-CSRF-TOKEN"] = csrf;
        }
    }

    const response = await fetch(url, {
        credentials: "same-origin",
        ...init,
        method,
        headers,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        if (isJson) {
            try {
                const data = await response.json();
                message = data?.message ?? message;
            } catch {
                // Keep fallback message for malformed JSON responses.
            }
        } else if (response.status === 419) {
            message = "Session expired. Refresh and try signing in again.";
        } else if (response.status === 401) {
            message = "Authentication required. Please sign in again.";
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    if (!isJson) {
        throw new Error("Server returned an unexpected response format.");
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

function mapFleetVehicle(raw: Record<string, any>): FleetVehicle {
    return {
        id: String(raw.id),
        type: raw.type,
        make: raw.make,
        plate: raw.plate,
        driver: raw.driver ?? "—",
        capacityTons: Number(raw.capacity_tons) || 0,
        currentRoute: raw.current_route ?? "—",
        lastService: new Date(raw.last_service ?? Date.now()),
        nextService: new Date(raw.next_service ?? Date.now()),
        mileage: Number(raw.mileage) || 0,
        fuelType: raw.fuel_type ?? "—",
        year: Number(raw.year) || new Date().getFullYear(),
        status: raw.status,
        notes: raw.notes ?? "",
        base: raw.base ?? "—",
    };
}

function mapRoute(raw: Record<string, any>): Route {
    return {
        id: String(raw.id),
        origin: raw.origin,
        originC: raw.origin_c ?? "—",
        dest: raw.dest,
        destC: raw.dest_c ?? "—",
        mode: raw.mode,
        type: raw.type,
        status: raw.status,
        avgDays: Number(raw.avg_days) || 0,
        shipments: Number(raw.shipments) || 0,
        freq: raw.freq ?? "Weekly",
        carrier: raw.carrier ?? "—",
    };
}

function mapWarehouse(raw: Record<string, any>): Warehouse {
    return {
        id: String(raw.id),
        name: raw.name,
        city: raw.city,
        country: raw.country,
        type: raw.type,
        capacitySqm: Number(raw.capacity_sqm) || 0,
        usedSqm: Number(raw.used_sqm) || 0,
        activeLoads: Number(raw.active_loads) || 0,
        manager: raw.manager ?? "—",
        status: raw.status,
        phone: raw.phone ?? "—",
        email: raw.email ?? "—",
        address: raw.address ?? "—",
        notes: raw.notes ?? "",
    };
}

function mapCustomer(raw: Record<string, any>): Customer {
    return {
        id: String(raw.id),
        name: raw.name,
        contact: raw.contact ?? "—",
        email: raw.email ?? "—",
        phone: raw.phone ?? "—",
        country: raw.country ?? "—",
        type: raw.type,
        status: raw.status,
        shipments: Number(raw.shipments) || 0,
        revenue: Number(raw.revenue) || 0,
        since: new Date(raw.since ?? raw.created_at ?? Date.now()),
        notes: raw.notes ?? "",
    };
}

function mapInvoiceLineItems(raw: unknown): InvoiceLineItem[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item) => {
            const row = item as Record<string, unknown>;
            return {
                description: String(row.description ?? ""),
                qty: Number(row.qty ?? 0),
                rate: Number(row.rate ?? 0),
            };
        })
        .filter((item) => item.description.trim().length > 0 && item.qty > 0);
}

function mapBillingInvoice(raw: Record<string, any>): BillingInvoice {
    return {
        id: String(raw.id),
        invoiceNo: raw.invoice_no,
        customer: raw.customer,
        shipmentRef: raw.shipment_ref ?? "—",
        amount: Number(raw.amount) || 0,
        currency: raw.currency ?? "TZS",
        status: (raw.status ?? "draft") as InvoiceStatus,
        issued: new Date(raw.issued ?? raw.created_at ?? Date.now()),
        due: new Date(raw.due ?? Date.now()),
        items: mapInvoiceLineItems(raw.items),
        notes: raw.notes ?? "",
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

function mapAuditLog(raw: Record<string, any>): AuditLog {
    return {
        id: String(raw.id),
        action: String(raw.action ?? "api.unknown"),
        httpMethod: raw.http_method ? String(raw.http_method) : null,
        path: String(raw.path ?? "/"),
        statusCode:
            raw.status_code === null || raw.status_code === undefined
                ? null
                : Number(raw.status_code),
        ipAddress: raw.ip_address ? String(raw.ip_address) : null,
        userAgent: raw.user_agent ? String(raw.user_agent) : null,
        requestData:
            raw.request_data && typeof raw.request_data === "object"
                ? (raw.request_data as Record<string, unknown>)
                : null,
        metadata:
            raw.metadata && typeof raw.metadata === "object"
                ? (raw.metadata as Record<string, unknown>)
                : null,
        createdAt: raw.created_at ? String(raw.created_at) : null,
        user:
            raw.user && typeof raw.user === "object"
                ? {
                      id: String(raw.user.id),
                      name: String(raw.user.name),
                      email: String(raw.user.email),
                  }
                : null,
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

export async function fetchFleet(): Promise<FleetVehicle[]> {
    const json = await apiJson<any>("/api/fleet?per_page=1000");
    return (json.data ?? json).map(mapFleetVehicle);
}

export async function fetchRoutes(): Promise<Route[]> {
    const json = await apiJson<any>("/api/routes?per_page=1000");
    return (json.data ?? json).map(mapRoute);
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
    const json = await apiJson<any>("/api/warehouses?per_page=1000");
    return (json.data ?? json).map(mapWarehouse);
}

export async function fetchCustomers(): Promise<Customer[]> {
    const json = await apiJson<any>("/api/customers?per_page=1000");
    return (json.data ?? json).map(mapCustomer);
}

export async function fetchBillingInvoices(): Promise<BillingInvoice[]> {
    const json = await apiJson<any>("/api/billing/invoices?per_page=1000");
    return (json.data ?? json).map(mapBillingInvoice);
}

export async function createFleetVehicle(input: {
    type: string;
    make: string;
    plate: string;
    driver?: string;
    capacity_tons?: number;
    current_route?: string;
    last_service?: string;
    next_service?: string;
    mileage?: number;
    fuel_type?: string;
    year?: number;
    status?: string;
    notes?: string;
    base?: string;
}): Promise<FleetVehicle> {
    const vehicle = await apiJson<any>("/api/fleet", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return mapFleetVehicle(vehicle);
}

export async function updateFleetVehicle(
    id: string,
    input: Partial<{
        type: string;
        make: string;
        plate: string;
        driver: string;
        capacity_tons: number;
        current_route: string;
        last_service: string;
        next_service: string;
        mileage: number;
        fuel_type: string;
        year: number;
        status: string;
        notes: string;
        base: string;
    }>,
): Promise<FleetVehicle> {
    const vehicle = await apiJson<any>(`/api/fleet/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });

    return mapFleetVehicle(vehicle);
}

export async function deleteFleetVehicle(id: string): Promise<void> {
    await apiJson<void>(`/api/fleet/${id}`, { method: "DELETE" });
}

export async function createRoute(input: {
    origin: string;
    origin_c?: string;
    dest: string;
    dest_c?: string;
    mode: string;
    type: string;
    status?: string;
    avg_days?: number;
    shipments?: number;
    freq?: string;
    carrier?: string;
}): Promise<Route> {
    const route = await apiJson<any>("/api/routes", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return mapRoute(route);
}

export async function updateRoute(
    id: string,
    input: Partial<{
        origin: string;
        origin_c: string;
        dest: string;
        dest_c: string;
        mode: string;
        type: string;
        status: string;
        avg_days: number;
        shipments: number;
        freq: string;
        carrier: string;
    }>,
): Promise<Route> {
    const route = await apiJson<any>(`/api/routes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });

    return mapRoute(route);
}

export async function deleteRoute(id: string): Promise<void> {
    await apiJson<void>(`/api/routes/${id}`, { method: "DELETE" });
}

export async function createWarehouse(input: {
    name: string;
    city: string;
    country?: string;
    type?: string;
    capacity_sqm?: number;
    used_sqm?: number;
    active_loads?: number;
    manager?: string;
    status?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}): Promise<Warehouse> {
    const warehouse = await apiJson<any>("/api/warehouses", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return mapWarehouse(warehouse);
}

export async function updateWarehouse(
    id: string,
    input: Partial<{
        name: string;
        city: string;
        country: string;
        type: string;
        capacity_sqm: number;
        used_sqm: number;
        active_loads: number;
        manager: string;
        status: string;
        phone: string;
        email: string;
        address: string;
        notes: string;
    }>,
): Promise<Warehouse> {
    const warehouse = await apiJson<any>(`/api/warehouses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });

    return mapWarehouse(warehouse);
}

export async function deleteWarehouse(id: string): Promise<void> {
    await apiJson<void>(`/api/warehouses/${id}`, { method: "DELETE" });
}

export async function createCustomer(input: {
    name: string;
    contact?: string;
    email: string;
    phone?: string;
    country?: string;
    type?: string;
    status?: string;
    shipments?: number;
    revenue?: number;
    since?: string;
    notes?: string;
}): Promise<Customer> {
    const customer = await apiJson<any>("/api/customers", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return mapCustomer(customer);
}

export async function updateCustomer(
    id: string,
    input: Partial<{
        name: string;
        contact: string;
        email: string;
        phone: string;
        country: string;
        type: string;
        status: string;
        shipments: number;
        revenue: number;
        since: string;
        notes: string;
    }>,
): Promise<Customer> {
    const customer = await apiJson<any>(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });

    return mapCustomer(customer);
}

export async function deleteCustomer(id: string): Promise<void> {
    await apiJson<void>(`/api/customers/${id}`, { method: "DELETE" });
}

export async function createBillingInvoice(input: {
    customer: string;
    shipment_ref?: string;
    currency?: string;
    status?: InvoiceStatus;
    issued: string;
    due: string;
    items: InvoiceLineItem[];
    notes?: string;
}): Promise<BillingInvoice> {
    const invoice = await apiJson<any>("/api/billing/invoices", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return mapBillingInvoice(invoice);
}

export async function updateBillingInvoice(
    id: string,
    input: Partial<{
        customer: string;
        shipment_ref: string;
        currency: string;
        status: InvoiceStatus;
        issued: string;
        due: string;
        items: InvoiceLineItem[];
        notes: string;
    }>,
): Promise<BillingInvoice> {
    const invoice = await apiJson<any>(`/api/billing/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });

    return mapBillingInvoice(invoice);
}

export async function updateBillingInvoiceStatus(
    id: string,
    status: InvoiceStatus,
): Promise<BillingInvoice> {
    const invoice = await apiJson<any>(`/api/billing/invoices/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });

    return mapBillingInvoice(invoice);
}

export async function deleteBillingInvoice(id: string): Promise<void> {
    await apiJson<void>(`/api/billing/invoices/${id}`, { method: "DELETE" });
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

export async function updateShipmentApi(
    id: string,
    input: Partial<{
        eta: string | null;
        notes: string | null;
        contact: string | null;
        email: string | null;
        phone: string | null;
        declared_value: string | null;
        insurance: string | null;
        pieces: number | null;
        contents: string | null;
    }>,
): Promise<Shipment> {
    const shipment = await apiJson<any>(`/api/shipments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });

    return mapShipment(shipment);
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

export async function fetchAuditLogs(input?: {
    page?: number;
    perPage?: number;
    q?: string;
    method?: string;
    statusCode?: number;
    from?: string;
    to?: string;
}): Promise<PaginatedAuditLogs> {
    const params = new URLSearchParams();

    if (input?.page) params.set("page", String(input.page));
    if (input?.perPage) params.set("per_page", String(input.perPage));
    if (input?.q) params.set("q", input.q);
    if (input?.method) params.set("method", input.method);
    if (input?.statusCode) params.set("status_code", String(input.statusCode));
    if (input?.from) params.set("from", input.from);
    if (input?.to) params.set("to", input.to);

    const query = params.toString();
    const payload = await apiJson<any>(
        `/api/audit-logs${query ? `?${query}` : ""}`,
    );

    return {
        data: (payload.data ?? []).map(mapAuditLog),
        currentPage: Number(payload.current_page ?? 1),
        lastPage: Number(payload.last_page ?? 1),
        total: Number(payload.total ?? 0),
    };
}
