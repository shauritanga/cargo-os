import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import SearchableSelect from "./SearchableSelect";
import AirwaybillPrint from "./AirwaybillPrint";
import type { Shipment, Party } from "../../types";
import { updateShipmentApi } from "../../lib/api";

interface Props {
    onClose: () => void;
    modalMode?: "create" | "edit";
    initialShipment?: Shipment;
    onSaved?: (shipment: Shipment) => void;
}

async function fetchCountries() {
    const res = await fetch("/api/countries");
    return res.json() as Promise<{ id: number; name: string; code: string }[]>;
}

async function fetchCities(code: string): Promise<string[]> {
    if (!code) return [];
    const res = await fetch(`/api/countries/${code}/cities`);
    return res.json();
}

const emptyParty = (): Party => ({
    companyName: "",
    streetAddress: "",
    cityTown: "",
    country: "",
    tel: "",
    email: "",
    contactName: "",
});

function PartyFields({
    title,
    value,
    onChange,
    countryOptions,
}: {
    title: string;
    value: Party;
    onChange: (p: Party) => void;
    countryOptions: { label: string; value: string }[];
}) {
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        fetchCities(value.country).then(setCities);
    }, [value.country]);

    const f =
        (field: keyof Party) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
                        onChange={(code) =>
                            onChange({ ...value, country: code, cityTown: "" })
                        }
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">City / Town</label>
                    <SearchableSelect
                        options={cities.map((c) => ({ label: c, value: c }))}
                        value={value.cityTown}
                        placeholder="Select or type…"
                        searchPlaceholder="Search or type city…"
                        onChange={(_, label) =>
                            onChange({ ...value, cityTown: label })
                        }
                        onFreeType={(v) => onChange({ ...value, cityTown: v })}
                    />
                </div>
            </div>
            {/* Row 2: Company Name | Contact Name */}
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                        className="form-input"
                        placeholder="Company / Organization"
                        value={value.companyName}
                        onChange={f("companyName")}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input
                        className="form-input"
                        placeholder="Full name"
                        value={value.contactName}
                        onChange={f("contactName")}
                    />
                </div>
            </div>
            {/* Row 3: Street Address | Tel */}
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Street Address</label>
                    <input
                        className="form-input"
                        placeholder="Street / area"
                        value={value.streetAddress}
                        onChange={f("streetAddress")}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Tel</label>
                    <input
                        className="form-input"
                        placeholder="+255 700 000 000"
                        value={value.tel}
                        onChange={f("tel")}
                    />
                </div>
            </div>
            {/* Row 4: Email (full width) */}
            <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        className="form-input"
                        type="email"
                        placeholder="email@company.com"
                        value={value.email}
                        onChange={f("email")}
                    />
                </div>
            </div>
        </>
    );
}

export default function NewShipmentModal({
    onClose,
    modalMode = "create",
    initialShipment,
    onSaved,
}: Props) {
    const { setShipments, showToast, setActivePage, companySettings } =
        useApp();
    const isEdit = modalMode === "edit" && Boolean(initialShipment);
    const [formType, setFormType] = useState<"international" | "domestic">(
        initialShipment?.type ?? "international",
    );

    const [countryOptions, setCountryOptions] = useState<
        { label: string; value: string; code: string }[]
    >([]);

    useEffect(() => {
        fetchCountries().then((data) =>
            setCountryOptions(
                data.map((c) => ({
                    label: c.name,
                    value: c.code,
                    code: c.code,
                })),
            ),
        );
    }, []);

    // Cargo
    const [mode, setMode] = useState<Shipment["mode"]>(
        initialShipment?.mode ?? "Road",
    );
    const [eta, setEta] = useState(
        initialShipment?.eta
            ? initialShipment.eta.toISOString().slice(0, 10)
            : "",
    );
    const [weight, setWeight] = useState(String(initialShipment?.weight ?? ""));
    const [pieces, setPieces] = useState(String(initialShipment?.pieces ?? ""));
    const [contents, setContents] = useState(
        initialShipment?.contents && initialShipment.contents !== "—"
            ? initialShipment.contents
            : "",
    );
    const [cargoType, setCargoType] = useState<Shipment["cargoType"]>(
        initialShipment?.cargoType ?? "General",
    );
    const [declaredValue, setDeclaredValue] = useState(
        initialShipment?.declaredValue && initialShipment.declaredValue !== "—"
            ? initialShipment.declaredValue
            : "",
    );
    const [insurance, setInsurance] = useState(
        initialShipment?.insurance && initialShipment.insurance !== "—"
            ? initialShipment.insurance
            : "",
    );
    const [notes, setNotes] = useState(initialShipment?.notes ?? "");

    // Consignor & Consignee
    const [consignor, setConsignor] = useState<Party>(
        initialShipment?.consignor ?? {
            ...emptyParty(),
            companyName: initialShipment?.customer ?? "",
            cityTown: initialShipment?.origin ?? "",
            country: initialShipment?.originCountry ?? "",
            tel:
                initialShipment?.phone && initialShipment.phone !== "—"
                    ? initialShipment.phone
                    : "",
            email:
                initialShipment?.email && initialShipment.email !== "—"
                    ? initialShipment.email
                    : "",
            contactName:
                initialShipment?.contact && initialShipment.contact !== "—"
                    ? initialShipment.contact
                    : "",
        },
    );
    const [consignee, setConsignee] = useState<Party>(
        initialShipment?.consignee ?? {
            ...emptyParty(),
            cityTown: initialShipment?.dest ?? "",
            country: initialShipment?.destCountry ?? "",
        },
    );

    const [submitting, setSubmitting] = useState(false);
    const [successShipment, setSuccessShipment] = useState<Shipment | null>(
        null,
    );
    const [copied, setCopied] = useState(false);
    const [showPrint, setShowPrint] = useState(false);

    function copyAwb(awb: string) {
        navigator.clipboard.writeText(awb).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    useEffect(() => {
        if (!initialShipment) return;

        setFormType(initialShipment.type);
        setMode(initialShipment.mode);
        setEta(initialShipment.eta.toISOString().slice(0, 10));
        setWeight(String(initialShipment.weight ?? ""));
        setPieces(String(initialShipment.pieces ?? ""));
        setContents(
            initialShipment.contents && initialShipment.contents !== "—"
                ? initialShipment.contents
                : "",
        );
        setCargoType(initialShipment.cargoType ?? "General");
        setDeclaredValue(
            initialShipment.declaredValue &&
                initialShipment.declaredValue !== "—"
                ? initialShipment.declaredValue
                : "",
        );
        setInsurance(
            initialShipment.insurance && initialShipment.insurance !== "—"
                ? initialShipment.insurance
                : "",
        );
        setNotes(initialShipment.notes ?? "");
        setConsignor(
            initialShipment.consignor ?? {
                ...emptyParty(),
                companyName: initialShipment.customer,
                cityTown: initialShipment.origin,
                country: initialShipment.originCountry,
                tel:
                    initialShipment.phone && initialShipment.phone !== "—"
                        ? initialShipment.phone
                        : "",
                email:
                    initialShipment.email && initialShipment.email !== "—"
                        ? initialShipment.email
                        : "",
                contactName:
                    initialShipment.contact && initialShipment.contact !== "—"
                        ? initialShipment.contact
                        : "",
            },
        );
        setConsignee(
            initialShipment.consignee ?? {
                ...emptyParty(),
                cityTown: initialShipment.dest,
                country: initialShipment.destCountry,
            },
        );
    }, [initialShipment]);

    const handleSubmit = async () => {
        const origin = consignor.cityTown.trim();
        const dest = consignee.cityTown.trim();
        const originCountry = consignor.country || "TZ";
        const destCountry = consignee.country || "TZ";

        if (!origin || !dest || !consignor.companyName) {
            alert(
                "Please fill in Consignor/Consignee city and Consignor Company Name.",
            );
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                type: formType,
                origin,
                origin_country: originCountry || "TZ",
                dest,
                dest_country: destCountry || "TZ",
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

            if (isEdit && initialShipment) {
                const updated = await updateShipmentApi(
                    initialShipment.id,
                    payload,
                );
                if (onSaved) {
                    onSaved(updated);
                }
                showToast("Shipment updated", "green");
                onClose();
                return;
            }

            const res = await fetch("/api/shipments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create shipment");
            }

            const saved = await res.json();

            // Map backend response to frontend Shipment type and prepend to list
            const newShipment: Shipment = {
                id: String(saved.id),
                awbNumber: saved.awb_number,
                type: saved.type,
                origin: saved.origin,
                originCountry: saved.origin_country || "TZ",
                dest: saved.dest,
                destCountry: saved.dest_country || "TZ",
                customer: saved.customer,
                weight: saved.weight || 0,
                mode: saved.mode as Shipment["mode"],
                cargoType: saved.cargo_type as Shipment["cargoType"],
                status: saved.status,
                eta: new Date(saved.eta || Date.now()),
                created: new Date(saved.created_at),
                contact: saved.contact || "—",
                email: saved.email || "—",
                phone: saved.phone || "—",
                notes: saved.notes || "",
                declaredValue: saved.declared_value || "—",
                insurance: saved.insurance || "—",
                pieces: saved.pieces || 1,
                contents: saved.contents || "—",
                consignor: saved.consignor,
                consignee: saved.consignee,
            };

            setShipments((prev) => [newShipment, ...prev]);
            setActivePage("shipments");
            setSuccessShipment(newShipment);
        } catch (err: any) {
            showToast(err.message || "Error creating shipment", "red");
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
        <div
            className="modal-overlay open"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`modal shipment-modal${successShipment ? " shipment-modal-compact" : ""}`}
                style={{
                    width: successShipment ? 360 : 640,
                    transition: "width 0.25s ease",
                }}
            >
                <div
                    className="modal-header"
                    style={{
                        padding: successShipment ? "12px 16px" : undefined,
                    }}
                >
                    <span
                        className="modal-title"
                        style={{ fontSize: successShipment ? 13 : undefined }}
                    >
                        {successShipment
                            ? "Shipment Created"
                            : isEdit
                              ? "Edit Shipment"
                              : "New Shipment"}
                    </span>
                    <button className="modal-close" onClick={onClose}>
                        <svg
                            viewBox="0 0 13 13"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        >
                            <path d="M1 1l11 11M12 1L1 12" />
                        </svg>
                    </button>
                </div>

                {/* SUCCESS SCREEN */}
                {successShipment && (
                    <>
                        <div
                            className="modal-body success-screen"
                            style={{
                                padding: "18px 18px 12px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    background: "var(--green-dim)",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ width: 18, height: 18 }}
                                >
                                    <path
                                        d="M20 6L9 17l-5-5"
                                        stroke="var(--green)"
                                        strokeWidth="2.5"
                                    />
                                </svg>
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-1)",
                                }}
                            >
                                Shipment saved successfully.
                            </div>

                            <div
                                style={{
                                    width: "100%",
                                    border: "1px solid var(--border)",
                                    background: "var(--bg-3)",
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-3)",
                                        marginBottom: 4,
                                    }}
                                >
                                    AWB Number
                                </div>
                                <div
                                    style={{
                                        fontSize: 17,
                                        fontWeight: 700,
                                        color: "var(--text-1)",
                                        fontFamily: "monospace",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    {successShipment.awbNumber}
                                </div>
                            </div>
                        </div>

                        <div
                            className="modal-footer"
                            style={{ padding: "10px 16px", gap: 8 }}
                        >
                            <button
                                className="btn"
                                style={{
                                    fontSize: 12,
                                    padding: "6px 12px",
                                    gap: 6,
                                }}
                                onClick={() =>
                                    copyAwb(successShipment.awbNumber ?? "")
                                }
                            >
                                {copied ? "Copied" : "Copy AWB"}
                            </button>
                            <button
                                className="btn primary"
                                style={{
                                    fontSize: 12,
                                    padding: "6px 12px",
                                    gap: 6,
                                }}
                                onClick={() => setShowPrint(true)}
                            >
                                <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    style={{ width: 12, height: 12 }}
                                >
                                    <path d="M4 6V2h8v4" />
                                    <rect
                                        x="2"
                                        y="6"
                                        width="12"
                                        height="7"
                                        rx="1"
                                    />
                                    <path d="M4 10h8M4 13h5" />
                                </svg>
                                Print AWB
                            </button>
                            <button
                                className="btn"
                                style={{ fontSize: 12, padding: "6px 12px" }}
                                onClick={onClose}
                            >
                                Done
                            </button>
                        </div>
                    </>
                )}

                <div
                    className="modal-body"
                    style={{ display: successShipment ? "none" : undefined }}
                >
                    {/* TYPE TOGGLE */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <button
                            className={`btn${formType === "international" ? " primary" : ""}`}
                            style={{ flex: 1, justifyContent: "center" }}
                            onClick={() => {
                                setFormType("international");
                                setMode("Air");
                            }}
                        >
                            🌐 International
                        </button>
                        <button
                            className={`btn${formType === "domestic" ? " primary" : ""}`}
                            style={{ flex: 1, justifyContent: "center" }}
                            onClick={() => {
                                setFormType("domestic");
                                setMode("Road");
                            }}
                        >
                            🏠 Domestic (Tanzania)
                        </button>
                    </div>

                    {/* Transport Mode & ETA — shared for both types */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Transport Mode</label>
                            <select
                                className="form-select"
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                            >
                                <option>Road</option>
                                <option>Air</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">ETA</label>
                            <input
                                className="form-input"
                                type="date"
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* CARGO */}
                    <div className="form-divider">Cargo</div>
                    {/* Row 1: Pieces | Weight | Cargo Type */}
                    <div
                        className="form-row"
                        style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
                    >
                        <div className="form-group">
                            <label className="form-label">Pieces</label>
                            <input
                                className="form-input"
                                type="number"
                                placeholder="e.g. 1"
                                value={pieces}
                                onChange={(e) => setPieces(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Weight (kg)</label>
                            <input
                                className="form-input"
                                type="number"
                                placeholder="e.g. 1500"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cargo Type</label>
                            <select
                                className="form-select"
                                value={cargoType}
                                onChange={(e) => setCargoType(e.target.value)}
                            >
                                {[
                                    "General",
                                    "Electronics",
                                    "Perishable",
                                    "Hazardous",
                                    "Automotive",
                                    "Textiles",
                                    "Machinery",
                                ].map((t) => (
                                    <option key={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Row 2: Contents (full width) */}
                    <div
                        className="form-row"
                        style={{ gridTemplateColumns: "1fr" }}
                    >
                        <div className="form-group">
                            <label className="form-label">
                                Contents / Description
                            </label>
                            <input
                                className="form-input"
                                placeholder="e.g. Box of Books, Electronics, etc."
                                value={contents}
                                onChange={(e) => setContents(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Row 3: Declared Value | Insurance */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Declared Value</label>
                            <input
                                className="form-input"
                                placeholder="e.g. TZS 500,000"
                                value={declaredValue}
                                onChange={(e) =>
                                    setDeclaredValue(e.target.value)
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Insurance</label>
                            <input
                                className="form-input"
                                placeholder="e.g. TZS 5,000,000"
                                value={insurance}
                                onChange={(e) => setInsurance(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* CONSIGNOR */}
                    <PartyFields
                        title="Consignor (Sender)"
                        value={consignor}
                        onChange={setConsignor}
                        countryOptions={countryOptions}
                    />

                    {/* CONSIGNEE */}
                    <PartyFields
                        title="Consignee (Recipient)"
                        value={consignee}
                        onChange={setConsignee}
                        countryOptions={countryOptions}
                    />

                    {/* NOTES */}
                    <div className="form-divider">Special Instructions</div>
                    <div className="form-group">
                        <textarea
                            className="form-textarea"
                            placeholder="Handling instructions, special requirements…"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {!successShipment && (
                    <div className="modal-footer">
                        <button
                            className="btn"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting
                                ? isEdit
                                    ? "Saving…"
                                    : "Creating…"
                                : isEdit
                                  ? "Save Changes"
                                  : "Create Shipment"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
