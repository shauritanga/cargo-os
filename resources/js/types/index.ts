export type ShipmentStatus =
    | "transit"
    | "delivered"
    | "pending"
    | "delayed"
    | "customs";
export type TransportMode = "Sea" | "Air" | "Road" | "Rail";
export type ShipmentType = "international" | "domestic";
export type CargoType =
    | "General"
    | "Electronics"
    | "Perishable"
    | "Hazardous"
    | "Automotive"
    | "Textiles"
    | "Machinery";

export interface Party {
    companyName: string;
    streetAddress: string;
    cityTown: string;
    country: string;
    tel: string;
    email: string;
    contactName: string;
}

export interface Shipment {
    id: string;
    type: ShipmentType;
    origin: string;
    originCountry: string;
    dest: string;
    destCountry: string;
    customer: string;
    weight: number;
    mode: TransportMode;
    cargoType: CargoType;
    status: ShipmentStatus;
    eta: Date;
    created: Date;
    contact: string;
    email: string;
    phone: string;
    notes: string;
    declaredValue: string;
    // Airwaybill
    awbNumber?: string;
    pieces?: number;
    contents?: string;
    consignor?: Party;
    consignee?: Party;
    // International fields
    containers?: number;
    vessel?: string;
    port?: string;
    incoterm?: string;
    insurance?: string;
    hsCode?: string;
    customsBroker?: string;
    dutyAmount?: string;
    blNumber?: string;
    originPort?: string;
    // Domestic fields
    driver?: string;
    vehicle?: string;
    pickupAddress?: string;
    deliveryAddress?: string;
    deliveryWindow?: string;
    distanceKm?: number;
    podRequired?: boolean;
}

export type BookingStatus =
    | "new"
    | "reviewing"
    | "approved"
    | "converted"
    | "rejected";
export type UrgencyLevel = "high" | "medium" | "low";

export interface Booking {
    id: string;
    customer: string;
    origin: string;
    dest: string;
    mode: TransportMode;
    type: CargoType;
    weight: number;
    containers: number;
    urgency: UrgencyLevel;
    status: BookingStatus;
    received: Date;
    contact: string;
    email: string;
    phone: string;
    message: string;
    convertedTo: string | null;
    assignedTo: string | null;
    notes: string;
}

export type FleetStatus = "active" | "idle" | "maintenance" | "retired";
export type VehicleType = "Truck" | "Ship" | "Aircraft" | "Rail";

export interface FleetVehicle {
    id: string;
    type: VehicleType;
    make: string;
    plate: string;
    driver: string;
    capacityTons: number;
    currentRoute: string;
    lastService: Date;
    nextService: Date;
    mileage: number;
    fuelType: string;
    year: number;
    status: FleetStatus;
    notes: string;
    base: string;
}

export type RouteStatus = "active" | "inactive";

export interface Route {
    id: string;
    origin: string;
    originC: string;
    dest: string;
    destC: string;
    mode: TransportMode;
    type: ShipmentType;
    status: RouteStatus;
    avgDays: number;
    shipments: number;
    freq: string;
    carrier: string;
}

export type WarehouseType = "General" | "Cold Storage" | "Hazardous" | "Bonded";
export type WarehouseStatus = "operational" | "maintenance" | "closed";

export interface Warehouse {
    id: string;
    name: string;
    city: string;
    country: string;
    type: WarehouseType;
    capacitySqm: number;
    usedSqm: number;
    activeLoads: number;
    manager: string;
    status: WarehouseStatus;
    phone: string;
    email: string;
    address: string;
    notes: string;
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    permissions?: Permission[];
}

export interface Permission {
    id: string;
    key: string;
    resource: string;
    action: string;
    description: string | null;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    roles: Role[];
    directPermissions: Permission[];
    effectivePermissions: string[];
}

export interface ManagedUser {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    roles: Role[];
    directPermissions: Permission[];
    effectivePermissions: string[];
}

export type PageId =
    | "dashboard"
    | "shipments"
    | "tracking"
    | "bookings"
    | "fleet"
    | "routes"
    | "warehouses"
    | "customers"
    | "billing"
    | "reports"
    | "settings"
    | "access-control"
    | "placeholder";

export interface Column {
    key: string;
    label: string;
    visible: boolean;
}

export interface TimelineStep {
    label: string;
    done?: boolean;
    active?: boolean;
    pending?: boolean;
    warn?: boolean;
}

export interface ShipmentStatusEvent {
    id: string;
    shipment_id: string;
    previous_status: ShipmentStatus | null;
    new_status: ShipmentStatus;
    reason: string | null;
    is_override: boolean;
    override_reason: string | null;
    metadata: Record<string, unknown> | null;
    triggered_by: string | null;
    occurred_at: string;
    created_at: string;
    updated_at: string;
}
