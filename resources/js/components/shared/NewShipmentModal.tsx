import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useApp } from "../../context/AppContext";
import SearchableSelect from "./SearchableSelect";
import AirwaybillPrint from "./AirwaybillPrint";
import type {
    Shipment,
    Party,
    Customer,
    ShipmentDraft,
    ShipmentDraftSourceMode,
} from "../../types";
import {
    fetchCitiesApi,
    fetchCountriesApi,
    fetchCustomers,
    updateShipmentApi,
} from "../../lib/api";

interface Props {
    onClose: () => void;
    modalMode?: "create" | "edit";
    initialShipment?: Shipment;
    onSaved?: (shipment: Shipment) => void;
    initialDraft?: ShipmentDraft;
    onDraftChange?: (draft: ShipmentDraft) => void;
    onResetDraft?: () => void;
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

const createEmptyShipmentDraft = (): ShipmentDraft => ({
    formType: "international",
    mode: "Road",
    eta: "",
    weight: "",
    pieces: "",
    contents: "",
    cargoType: "General",
    declaredValue: "",
    insurance: "",
    notes: "",
    consignorSource: "new",
    consigneeSource: "new",
    selectedConsignorCustomerId: "",
    selectedConsigneeCustomerId: "",
    consignor: emptyParty(),
    consignee: emptyParty(),
    consignorManual: emptyParty(),
    consigneeManual: emptyParty(),
});

function PartySourceSelector({
    mode,
    onChange,
}: {
    mode: ShipmentDraftSourceMode;
    onChange: (mode: ShipmentDraftSourceMode) => void;
}) {
    const options: { value: ShipmentDraftSourceMode; label: string }[] = [
        { value: "existing", label: "Existing Customer" },
        { value: "new", label: "New Customer" },
    ];

    return (
        <div
            className="form-row"
            style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
            {options.map((option) => {
                const checked = mode === option.value;

                return (
                    <label
                        key={option.value}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: `1px solid ${checked ? "var(--blue)" : "var(--border-strong)"}`,
                            background: checked
                                ? "var(--blue-dim)"
                                : "var(--bg-3)",
                            cursor: "pointer",
                            userSelect: "none",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onChange(option.value)}
                            style={{
                                width: 16,
                                height: 16,
                                accentColor: "var(--blue)",
                                cursor: "pointer",
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: checked
                                    ? "var(--blue)"
                                    : "var(--text-1)",
                            }}
                        >
                            {option.label}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}

function PartyFields({
    title,
    value,
    onChange,
    countryOptions,
    showDivider = true,
}: {
    title: string;
    value: Party;
    onChange: (p: Party) => void;
    countryOptions: { label: string; value: string }[];
    showDivider?: boolean;
}) {
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        fetchCitiesApi(value.country)
            .then(setCities)
            .catch(() => setCities([]));
    }, [value.country]);

    const f =
        (field: keyof Party) => (e: ChangeEvent<HTMLInputElement>) =>
            onChange({ ...value, [field]: e.target.value });

    return (
        <>
            {showDivider && <div className="form-divider">{title}</div>}
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
    initialDraft,
    onDraftChange,
    onResetDraft,
}: Props) {
    const { setShipments, showToast, setActivePage, companySettings } =
        useApp();
    const isEdit = modalMode === "edit" && Boolean(initialShipment);
    const createDraft = useMemo(
        () => initialDraft ?? createEmptyShipmentDraft(),
        [initialDraft],
    );
    const initialConsignor = useMemo(
        () =>
            isEdit
                ? (initialShipment?.consignor ?? {
                      ...emptyParty(),
                      companyName: initialShipment?.customer ?? "",
                      cityTown: initialShipment?.origin ?? "",
                      country: initialShipment?.originCountry ?? "",
                      tel:
                          initialShipment?.phone &&
                          initialShipment.phone !== "—"
                              ? initialShipment.phone
                              : "",
                      email:
                          initialShipment?.email &&
                          initialShipment.email !== "—"
                              ? initialShipment.email
                              : "",
                      contactName:
                          initialShipment?.contact &&
                          initialShipment.contact !== "—"
                              ? initialShipment.contact
                              : "",
                  })
                : createDraft.consignor,
        [createDraft.consignor, initialShipment, isEdit],
    );
    const initialConsignee = useMemo(
        () =>
            isEdit
                ? (initialShipment?.consignee ?? {
                      ...emptyParty(),
                      cityTown: initialShipment?.dest ?? "",
                      country: initialShipment?.destCountry ?? "",
                  })
                : createDraft.consignee,
        [createDraft.consignee, initialShipment, isEdit],
    );

    const [formType, setFormType] = useState<"international" | "domestic">(
        isEdit ? (initialShipment?.type ?? "international") : createDraft.formType,
    );

    const [countryOptions, setCountryOptions] = useState<
        { label: string; value: string; code: string }[]
    >([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        Promise.all([fetchCountriesApi(), fetchCustomers()])
            .then(([countries, customerData]) => {
                setCountryOptions(
                    countries.map((country) => ({
                        label: country.name,
                        value: country.code,
                        code: country.code,
                    })),
                );
                setCustomers(customerData);
            })
            .catch(() => {
                setCountryOptions([]);
                setCustomers([]);
            });
    }, []);

    // Cargo
    const [mode, setMode] = useState<Shipment["mode"]>(
        isEdit ? (initialShipment?.mode ?? "Road") : createDraft.mode,
    );
    const [eta, setEta] = useState(
        isEdit
            ? (initialShipment?.eta
                  ? initialShipment.eta.toISOString().slice(0, 10)
                  : "")
            : createDraft.eta,
    );
    const [weight, setWeight] = useState(
        isEdit ? String(initialShipment?.weight ?? "") : createDraft.weight,
    );
    const [pieces, setPieces] = useState(
        isEdit ? String(initialShipment?.pieces ?? "") : createDraft.pieces,
    );
    const [contents, setContents] = useState(
        isEdit
            ? initialShipment?.contents && initialShipment.contents !== "—"
                ? initialShipment.contents
                : ""
            : createDraft.contents,
    );
    const [cargoType, setCargoType] = useState<Shipment["cargoType"]>(
        isEdit ? (initialShipment?.cargoType ?? "General") : createDraft.cargoType,
    );
    const [declaredValue, setDeclaredValue] = useState(
        isEdit
            ? initialShipment?.declaredValue &&
              initialShipment.declaredValue !== "—"
                ? initialShipment.declaredValue
                : ""
            : createDraft.declaredValue,
    );
    const [insurance, setInsurance] = useState(
        isEdit
            ? initialShipment?.insurance && initialShipment.insurance !== "—"
                ? initialShipment.insurance
                : ""
            : createDraft.insurance,
    );
    const [notes, setNotes] = useState(
        isEdit ? (initialShipment?.notes ?? "") : createDraft.notes,
    );

    // Consignor & Consignee
    const [consignorSource, setConsignorSource] =
        useState<ShipmentDraftSourceMode>(
            isEdit ? "new" : createDraft.consignorSource,
        );
    const [consigneeSource, setConsigneeSource] =
        useState<ShipmentDraftSourceMode>(
            isEdit ? "new" : createDraft.consigneeSource,
        );
    const [selectedConsignorCustomerId, setSelectedConsignorCustomerId] =
        useState(isEdit ? "" : createDraft.selectedConsignorCustomerId);
    const [selectedConsigneeCustomerId, setSelectedConsigneeCustomerId] =
        useState(isEdit ? "" : createDraft.selectedConsigneeCustomerId);
    const [consignorManual, setConsignorManual] =
        useState<Party>(isEdit ? initialConsignor : createDraft.consignorManual);
    const [consigneeManual, setConsigneeManual] =
        useState<Party>(isEdit ? initialConsignee : createDraft.consigneeManual);
    const [consignor, setConsignor] = useState<Party>(initialConsignor);
    const [consignee, setConsignee] = useState<Party>(initialConsignee);

    const [submitting, setSubmitting] = useState(false);
    const [successShipment, setSuccessShipment] = useState<Shipment | null>(
        null,
    );
    const [copied, setCopied] = useState(false);
    const [showPrint, setShowPrint] = useState(false);

    const activeCustomers = customers.filter(
        (customer) => customer.status === "active",
    );
    const activeCustomerOptions = activeCustomers.map((customer) => ({
        label: [customer.name, customer.cityTown, customer.country]
            .filter(Boolean)
            .join(" · "),
        value: customer.id,
        code: [customer.phone, customer.email].filter(Boolean).join(" "),
    }));

    const resolveCustomerCountryCode = (customer: Customer): string => {
        if (customer.countryCode) {
            return customer.countryCode;
        }

        const matchedCountry = countryOptions.find(
            (option) =>
                option.label.toLowerCase() === customer.country.toLowerCase(),
        );

        return matchedCountry?.value ?? "";
    };

    const customerToParty = (customer: Customer): Party => ({
        companyName: customer.name,
        streetAddress: customer.streetAddress,
        cityTown: customer.cityTown,
        country: resolveCustomerCountryCode(customer),
        tel: customer.phone,
        email: customer.email,
        contactName: customer.contact,
    });

    const handleConsignorChange = (party: Party) => {
        setConsignor(party);
        if (consignorSource === "new") {
            setConsignorManual(party);
        }
    };

    const handleConsigneeChange = (party: Party) => {
        setConsignee(party);
        if (consigneeSource === "new") {
            setConsigneeManual(party);
        }
    };

    const handleConsignorSourceChange = (
        source: ShipmentDraftSourceMode,
    ) => {
        if (source === consignorSource) return;

        if (source === "existing") {
            setConsignorManual(consignor);
            const selectedCustomer = activeCustomers.find(
                (customer) => customer.id === selectedConsignorCustomerId,
            );
            if (selectedCustomer) {
                setConsignor(customerToParty(selectedCustomer));
            }
        } else {
            setConsignor(consignorManual);
        }

        setConsignorSource(source);
    };

    const handleConsigneeSourceChange = (
        source: ShipmentDraftSourceMode,
    ) => {
        if (source === consigneeSource) return;

        if (source === "existing") {
            setConsigneeManual(consignee);
            const selectedCustomer = activeCustomers.find(
                (customer) => customer.id === selectedConsigneeCustomerId,
            );
            if (selectedCustomer) {
                setConsignee(customerToParty(selectedCustomer));
            }
        } else {
            setConsignee(consigneeManual);
        }

        setConsigneeSource(source);
    };

    function copyAwb(awb: string) {
        navigator.clipboard.writeText(awb).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    useEffect(() => {
        if (!isEdit || !initialShipment) return;

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
        setConsignor(initialConsignor);
        setConsignee(initialConsignee);
        setConsignorManual(initialConsignor);
        setConsigneeManual(initialConsignee);
        setConsignorSource("new");
        setConsigneeSource("new");
        setSelectedConsignorCustomerId("");
        setSelectedConsigneeCustomerId("");
    }, [initialConsignee, initialConsignor, initialShipment, isEdit]);

    useEffect(() => {
        if (isEdit || !onDraftChange || successShipment) {
            return;
        }

        onDraftChange({
            formType,
            mode,
            eta,
            weight,
            pieces,
            contents,
            cargoType,
            declaredValue,
            insurance,
            notes,
            consignorSource,
            consigneeSource,
            selectedConsignorCustomerId,
            selectedConsigneeCustomerId,
            consignor,
            consignee,
            consignorManual,
            consigneeManual,
        });
    }, [
        cargoType,
        consignee,
        consigneeManual,
        consigneeSource,
        consignor,
        consignorManual,
        consignorSource,
        contents,
        declaredValue,
        eta,
        formType,
        insurance,
        isEdit,
        mode,
        notes,
        onDraftChange,
        pieces,
        selectedConsigneeCustomerId,
        selectedConsignorCustomerId,
        successShipment,
        weight,
    ]);

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
            onResetDraft?.();
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
                                onChange={(e) =>
                                    setMode(e.target.value as Shipment["mode"])
                                }
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
                                onChange={(e) =>
                                    setCargoType(
                                        e.target.value as Shipment["cargoType"],
                                    )
                                }
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

                    <div className="form-divider">Consignor (Sender)</div>
                    <PartySourceSelector
                        mode={consignorSource}
                        onChange={handleConsignorSourceChange}
                    />
                    {consignorSource === "existing" && (
                        <div
                            className="form-row"
                            style={{ gridTemplateColumns: "1fr" }}
                        >
                            <div className="form-group">
                                <label className="form-label">
                                    Select registered sender
                                </label>
                                <SearchableSelect
                                    options={activeCustomerOptions}
                                    value={selectedConsignorCustomerId}
                                    placeholder="Search active customers..."
                                    searchPlaceholder="Search name, city, country..."
                                    onChange={(customerId) => {
                                        const selectedCustomer =
                                            activeCustomers.find(
                                                (customer) =>
                                                    customer.id === customerId,
                                            );
                                        setSelectedConsignorCustomerId(
                                            customerId,
                                        );
                                        if (selectedCustomer) {
                                            setConsignor(
                                                customerToParty(
                                                    selectedCustomer,
                                                ),
                                            );
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <PartyFields
                        title="Consignor Details"
                        value={consignor}
                        onChange={handleConsignorChange}
                        countryOptions={countryOptions}
                        showDivider={false}
                    />

                    <div className="form-divider">Consignee (Recipient)</div>
                    <PartySourceSelector
                        mode={consigneeSource}
                        onChange={handleConsigneeSourceChange}
                    />
                    {consigneeSource === "existing" && (
                        <div
                            className="form-row"
                            style={{ gridTemplateColumns: "1fr" }}
                        >
                            <div className="form-group">
                                <label className="form-label">
                                    Select registered receiver
                                </label>
                                <SearchableSelect
                                    options={activeCustomerOptions}
                                    value={selectedConsigneeCustomerId}
                                    placeholder="Search active customers..."
                                    searchPlaceholder="Search name, city, country..."
                                    onChange={(customerId) => {
                                        const selectedCustomer =
                                            activeCustomers.find(
                                                (customer) =>
                                                    customer.id === customerId,
                                            );
                                        setSelectedConsigneeCustomerId(
                                            customerId,
                                        );
                                        if (selectedCustomer) {
                                            setConsignee(
                                                customerToParty(
                                                    selectedCustomer,
                                                ),
                                            );
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <PartyFields
                        title="Consignee Details"
                        value={consignee}
                        onChange={handleConsigneeChange}
                        countryOptions={countryOptions}
                        showDivider={false}
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
