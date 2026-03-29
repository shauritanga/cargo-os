<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book a Shipment</title>
    <style>
        :root {
            --bg-1: #0a1020;
            --bg-2: #0f172a;
            --bg-3: #1a2439;
            --bg-4: #25334d;
            --text-1: #e5e7eb;
            --text-2: #c2c7d0;
            --text-3: #9ca3af;
            --border: #2f3f59;
            --border-strong: #40506b;
            --blue: #3b82f6;
            --blue-dim: rgba(59, 130, 246, 0.16);
            --green: #22c55e;
            --green-dim: rgba(34, 197, 94, 0.16);
            --red: #ef4444;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Inter, "Segoe UI", Roboto, sans-serif;
            background: radial-gradient(circle at 15% 15%, #132442 0%, #0b1222 45%, #050911 100%);
            color: var(--text-1);
            min-height: 100vh;
            padding: 28px 14px;
        }

        .booking-shell {
            max-width: 760px;
            margin: 0 auto;
            background: var(--bg-2);
            border: 1px solid var(--border-strong);
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
        }

        .booking-header {
            padding: 18px 22px;
            border-bottom: 1px solid var(--border);
        }

        .booking-title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }

        .booking-subtitle {
            margin: 6px 0 0;
            color: var(--text-3);
            font-size: 13px;
        }

        .ok {
            margin: 14px 22px 0;
            padding: 10px 12px;
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 8px;
            background: var(--green-dim);
            color: var(--green);
            font-size: 13px;
            font-weight: 600;
        }

        .stepper {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 4px;
        }

        .step-pill {
            background: var(--bg-3);
            border: 1px solid var(--border);
            color: var(--text-3);
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .step-pill.active {
            border-color: var(--blue);
            color: var(--blue);
            background: var(--blue-dim);
        }

        .wizard-step {
            display: none;
            flex-direction: column;
            gap: 14px;
        }

        .wizard-step.active {
            display: flex;
        }

        form {
            padding: 18px 22px 22px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .form-divider {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-3);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-top: 4px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-2);
        }

        .form-input,
        .form-select,
        .form-textarea {
            width: 100%;
            background: var(--bg-3);
            color: var(--text-1);
            border: 1px solid var(--border-strong);
            border-radius: 7px;
            padding: 9px 12px;
            font: inherit;
            font-size: 13px;
            outline: none;
            transition: border-color .2s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
            border-color: var(--blue);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
            color: var(--text-3);
        }

        .searchable-select {
            position: relative;
        }

        .ss-display {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            background: var(--bg-3);
            border: 1px solid var(--border-strong);
            border-radius: 7px;
            padding: 9px 12px;
            color: var(--text-1);
            font-size: 13px;
            cursor: pointer;
            min-height: 38px;
        }

        .ss-display.open,
        .ss-display:hover {
            border-color: var(--blue);
        }

        .ss-value {
            flex: 1;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .ss-value.placeholder {
            color: var(--text-3);
        }

        .ss-dropdown {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            z-index: 30;
            background: var(--bg-2);
            border: 1px solid var(--border-strong);
            border-radius: 9px;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
            overflow: hidden;
            display: none;
        }

        .ss-dropdown.open {
            display: block;
        }

        .ss-search {
            width: 100%;
            border: 0;
            border-bottom: 1px solid var(--border);
            background: var(--bg-3);
            color: var(--text-1);
            padding: 9px 12px;
            font: inherit;
            font-size: 13px;
            outline: none;
        }

        .ss-search::placeholder {
            color: var(--text-3);
        }

        .ss-list {
            max-height: 180px;
            overflow-y: auto;
            padding: 4px;
        }

        .ss-item {
            border-radius: 6px;
            padding: 8px 10px;
            color: var(--text-2);
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .ss-item:hover {
            background: var(--bg-3);
            color: var(--text-1);
        }

        .ss-item.selected {
            background: var(--blue-dim);
            color: var(--blue);
            font-weight: 600;
        }

        .ss-item-code {
            color: var(--text-3);
            font-size: 11px;
            font-family: "DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .ss-empty {
            padding: 12px;
            color: var(--text-3);
            font-size: 12px;
            text-align: center;
        }

        .form-textarea {
            min-height: 100px;
            resize: vertical;
        }

        .err {
            font-size: 11px;
            color: var(--red);
            margin-top: -2px;
        }

        .hidden {
            display: none;
        }

        .actions {
            margin-top: 4px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        .btn {
            border: 1px solid transparent;
            border-radius: 7px;
            background: var(--blue);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            padding: 9px 14px;
            cursor: pointer;
        }

        .btn:hover {
            filter: brightness(1.06);
        }

        .btn.secondary {
            background: transparent;
            border-color: var(--border-strong);
            color: var(--text-2);
        }

        .info-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(3, 8, 18, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 120;
            padding: 16px;
        }

        .info-modal-overlay.open {
            display: flex;
        }

        .info-modal {
            width: min(420px, 100%);
            background: var(--bg-2);
            border: 1px solid var(--border-strong);
            border-radius: 12px;
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
            overflow: hidden;
        }

        .info-modal-header {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
            font-weight: 700;
            color: var(--text-1);
        }

        .info-modal-body {
            padding: 14px 16px;
            color: var(--text-2);
            font-size: 13px;
            line-height: 1.45;
        }

        .info-modal-actions {
            padding: 12px 16px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: flex-end;
        }

        @media (max-width: 760px) {
            .form-row {
                grid-template-columns: 1fr;
            }

            .booking-title {
                font-size: 18px;
            }
        }
    </style>
</head>

<body>
    <div class="booking-shell">
        <div class="booking-header">
            <h1 class="booking-title">New Booking Request</h1>
            <p class="booking-subtitle">Submit shipment details and our team will review your request shortly.</p>
        </div>

        @if (session('booking_success'))
        <div class="ok">{{ session('booking_success') }}</div>
        @endif

        <form method="POST" action="{{ route('public.booking.submit') }}" id="bookingForm">
            @csrf

            <div class="stepper" id="stepper">
                <div class="step-pill" data-step-pill="1">Step 1: Contact</div>
                <div class="step-pill" data-step-pill="2">Step 2: Route & Cargo</div>
                <div class="step-pill" data-step-pill="3">Step 3: Notes & Submit</div>
            </div>

            <div class="wizard-step" data-step="1">
                <div class="form-divider">Shipment Basics</div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="shipment_type">Shipment Type</label>
                        <select class="form-select" id="shipment_type" name="shipment_type" required>
                            <option value="domestic" @selected(old('shipment_type')==='domestic' )>Domestic</option>
                            <option value="international" @selected(old('shipment_type')==='international' )>International</option>
                        </select>
                        @error('shipment_type') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="mode">Transport Mode</label>
                        <select class="form-select" id="mode" name="mode" required>
                            <option value="Road" @selected(old('mode')==='Road' )>Road</option>
                            <option value="Air" @selected(old('mode')==='Air' )>Air</option>
                        </select>
                        @error('mode') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>

                <div class="form-divider">Consignor (Sender)</div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="company_name">Company Name</label>
                        <input class="form-input" id="company_name" name="company_name" value="{{ old('company_name') }}" required>
                        @error('company_name') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="contact_name">Contact Name</label>
                        <input class="form-input" id="contact_name" name="contact_name" value="{{ old('contact_name') }}" required>
                        @error('contact_name') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="phone">Tel</label>
                        <input class="form-input" id="phone" name="phone" value="{{ old('phone') }}" required>
                        @error('phone') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="email">Email</label>
                        <input class="form-input" type="email" id="email" name="email" value="{{ old('email') }}" required>
                        @error('email') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>
            </div>

            <div class="wizard-step" data-step="2">
                <div class="form-divider">Route</div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="origin_country">Pickup Country</label>
                        <div class="searchable-select" id="origin_country_select"></div>
                        <input type="hidden" id="origin_country" name="origin_country" value="{{ old('origin_country', 'TZ') }}">
                        @error('origin_country') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="origin">Pickup City / Town</label>
                        <div class="searchable-select" id="origin_city_select"></div>
                        <input type="hidden" id="origin" name="origin" value="{{ old('origin') }}" required>
                        @error('origin') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="dest_country">Delivery Country</label>
                        <div class="searchable-select" id="dest_country_select"></div>
                        <input type="hidden" id="dest_country" name="dest_country" value="{{ old('dest_country', 'TZ') }}">
                        @error('dest_country') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="dest">Delivery City / Town</label>
                        <div class="searchable-select" id="dest_city_select"></div>
                        <input type="hidden" id="dest" name="dest" value="{{ old('dest') }}" required>
                        @error('dest') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>

                <div class="form-divider">Cargo</div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="cargo_type">Cargo Type</label>
                        <input class="form-input" id="cargo_type" name="cargo_type" value="{{ old('cargo_type', 'General') }}" required>
                        @error('cargo_type') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="urgency">Urgency</label>
                        <select class="form-select" id="urgency" name="urgency" required>
                            <option value="low" @selected(old('urgency')==='low' )>Low</option>
                            <option value="medium" @selected(old('urgency', 'medium' )==='medium' )>Medium</option>
                            <option value="high" @selected(old('urgency')==='high' )>High</option>
                        </select>
                        @error('urgency') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="pieces">Pieces</label>
                        <input class="form-input" type="number" id="pieces" name="pieces" min="1" value="{{ old('pieces', 1) }}">
                        @error('pieces') <div class="err">{{ $message }}</div> @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="weight">Weight (kg)</label>
                        <input class="form-input" type="number" step="0.01" id="weight" name="weight" min="0" value="{{ old('weight') }}">
                        @error('weight') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="eta">Preferred ETA</label>
                        <input class="form-input" type="date" id="eta" name="eta" value="{{ old('eta') }}">
                        @error('eta') <div class="err">{{ $message }}</div> @enderror
                    </div>
                    <div class="form-group"></div>
                </div>
            </div>

            <div class="wizard-step" data-step="3">
                <div class="form-divider">Special Instructions</div>
                <div class="form-row" style="grid-template-columns: 1fr;">
                    <div class="form-group">
                        <label class="form-label" for="contents">Contents</label>
                        <input class="form-input" id="contents" name="contents" value="{{ old('contents') }}" placeholder="What are you shipping?">
                        @error('contents') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>

                <div class="form-row" style="grid-template-columns: 1fr;">
                    <div class="form-group">
                        <label class="form-label" for="notes">Additional Notes</label>
                        <textarea class="form-textarea" id="notes" name="notes" placeholder="Any special handling requirements?">{{ old('notes') }}</textarea>
                        @error('notes') <div class="err">{{ $message }}</div> @enderror
                    </div>
                </div>
            </div>

            <div class="hidden">
                <label for="website">Website</label>
                <input id="website" name="website" value="{{ old('website') }}" autocomplete="off" tabindex="-1">
            </div>

            <div class="actions">
                <button class="btn secondary" type="button" id="backBtn" style="display: none;">Back</button>
                <button class="btn" type="button" id="nextBtn">Next</button>
                <button class="btn" type="submit" id="submitBtn" style="display: none;">Submit Booking</button>
            </div>
        </form>
    </div>

    <div class="info-modal-overlay" id="infoModalOverlay" role="dialog" aria-modal="true" aria-labelledby="infoModalTitle">
        <div class="info-modal">
            <div class="info-modal-header" id="infoModalTitle">Please Complete Required Field</div>
            <div class="info-modal-body" id="infoModalMessage">Please complete this step before continuing.</div>
            <div class="info-modal-actions">
                <button type="button" class="btn" id="infoModalOkBtn">Okay</button>
            </div>
        </div>
    </div>

    <script>
        const COUNTRY_OPTIONS = @json($countryOptions);

        function createSearchableSelect(config) {
            const {
                container,
                hiddenInput,
                options,
                placeholder,
                searchPlaceholder,
                allowFreeType = false,
                onValueChange,
            } = config;

            let allOptions = [...options];
            let filtered = [...options];
            let open = false;

            const display = document.createElement('button');
            display.type = 'button';
            display.className = 'ss-display';
            display.innerHTML = '<span class="ss-value placeholder"></span><span aria-hidden="true">▾</span>';

            const dropdown = document.createElement('div');
            dropdown.className = 'ss-dropdown';

            const search = document.createElement('input');
            search.className = 'ss-search';
            search.placeholder = searchPlaceholder;

            const list = document.createElement('div');
            list.className = 'ss-list';

            dropdown.appendChild(search);
            dropdown.appendChild(list);
            container.appendChild(display);
            container.appendChild(dropdown);

            function selectedLabel() {
                const found = allOptions.find((o) => o.value === hiddenInput.value);
                return found ? found.label : hiddenInput.value;
            }

            function renderDisplay() {
                const el = display.querySelector('.ss-value');
                const label = selectedLabel();
                if (!label) {
                    el.textContent = placeholder;
                    el.classList.add('placeholder');
                } else {
                    el.textContent = label;
                    el.classList.remove('placeholder');
                }
            }

            function setOpen(v) {
                open = v;
                display.classList.toggle('open', v);
                dropdown.classList.toggle('open', v);
                if (v) {
                    search.value = '';
                    filtered = [...allOptions];
                    renderList();
                    setTimeout(() => search.focus(), 0);
                }
            }

            function choose(value, label = null) {
                hiddenInput.value = value;
                renderDisplay();
                setOpen(false);
                if (onValueChange) {
                    onValueChange(value, label ?? value);
                }
            }

            function renderList() {
                list.innerHTML = '';
                if (!filtered.length && !allowFreeType) {
                    const empty = document.createElement('div');
                    empty.className = 'ss-empty';
                    empty.textContent = 'No results';
                    list.appendChild(empty);
                    return;
                }

                filtered.forEach((opt) => {
                    const item = document.createElement('div');
                    item.className = 'ss-item' + (hiddenInput.value === opt.value ? ' selected' : '');
                    item.innerHTML = `<span>${opt.label}</span>${opt.code ? `<span class="ss-item-code">${opt.code}</span>` : ''}`;
                    item.addEventListener('click', () => choose(opt.value, opt.label));
                    list.appendChild(item);
                });

                if (allowFreeType && search.value.trim()) {
                    const typed = search.value.trim();
                    const freeItem = document.createElement('div');
                    freeItem.className = 'ss-item';
                    freeItem.innerHTML = `<span>Use: ${typed}</span>`;
                    freeItem.addEventListener('click', () => choose(typed, typed));
                    list.appendChild(freeItem);
                }
            }

            display.addEventListener('click', () => setOpen(!open));

            search.addEventListener('input', () => {
                const q = search.value.trim().toLowerCase();
                filtered = allOptions.filter((o) => o.label.toLowerCase().includes(q));
                renderList();
            });

            search.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && allowFreeType && search.value.trim()) {
                    e.preventDefault();
                    choose(search.value.trim(), search.value.trim());
                }
            });

            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    setOpen(false);
                }
            });

            renderDisplay();
            renderList();

            return {
                setOptions(nextOptions) {
                    allOptions = [...nextOptions];
                    filtered = [...allOptions];
                    if (hiddenInput.value && !allOptions.some((o) => o.value === hiddenInput.value) && !allowFreeType) {
                        hiddenInput.value = '';
                    }
                    renderDisplay();
                    renderList();
                },
                clear() {
                    hiddenInput.value = '';
                    renderDisplay();
                    renderList();
                },
            };
        }

        async function fetchCities(code) {
            if (!code) return [];
            try {
                const res = await fetch(`/public/booking/countries/${encodeURIComponent(code)}/cities`, {
                    headers: {
                        'Accept': 'application/json'
                    },
                });
                if (!res.ok) return [];
                const data = await res.json();
                if (!Array.isArray(data)) return [];
                return data.map((name) => ({
                    label: name,
                    value: name
                }));
            } catch {
                return [];
            }
        }

        const originCountryInput = document.getElementById('origin_country');
        const destCountryInput = document.getElementById('dest_country');
        const originInput = document.getElementById('origin');
        const destInput = document.getElementById('dest');

        const originCitySelect = createSearchableSelect({
            container: document.getElementById('origin_city_select'),
            hiddenInput: originInput,
            options: [],
            placeholder: 'Select or type city...',
            searchPlaceholder: 'Search or type city...',
            allowFreeType: true,
        });

        const destCitySelect = createSearchableSelect({
            container: document.getElementById('dest_city_select'),
            hiddenInput: destInput,
            options: [],
            placeholder: 'Select or type city...',
            searchPlaceholder: 'Search or type city...',
            allowFreeType: true,
        });

        async function refreshOriginCities() {
            const options = await fetchCities(originCountryInput.value);
            originCitySelect.setOptions(options);
        }

        async function refreshDestCities() {
            const options = await fetchCities(destCountryInput.value);
            destCitySelect.setOptions(options);
        }

        createSearchableSelect({
            container: document.getElementById('origin_country_select'),
            hiddenInput: originCountryInput,
            options: COUNTRY_OPTIONS,
            placeholder: 'Select country...',
            searchPlaceholder: 'Search country...',
            onValueChange: async () => {
                originCitySelect.clear();
                await refreshOriginCities();
            },
        });

        createSearchableSelect({
            container: document.getElementById('dest_country_select'),
            hiddenInput: destCountryInput,
            options: COUNTRY_OPTIONS,
            placeholder: 'Select country...',
            searchPlaceholder: 'Search country...',
            onValueChange: async () => {
                destCitySelect.clear();
                await refreshDestCities();
            },
        });

        refreshOriginCities();
        refreshDestCities();

        const steps = Array.from(document.querySelectorAll('.wizard-step'));
        const stepPills = Array.from(document.querySelectorAll('[data-step-pill]'));
        const backBtn = document.getElementById('backBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        const infoModalOverlay = document.getElementById('infoModalOverlay');
        const infoModalMessage = document.getElementById('infoModalMessage');
        const infoModalOkBtn = document.getElementById('infoModalOkBtn');
        let currentStep = 1;

        function showInfoModal(message) {
            infoModalMessage.textContent = message;
            infoModalOverlay.classList.add('open');
            setTimeout(() => infoModalOkBtn.focus(), 0);
        }

        function hideInfoModal() {
            infoModalOverlay.classList.remove('open');
        }

        infoModalOkBtn.addEventListener('click', hideInfoModal);
        infoModalOverlay.addEventListener('click', (e) => {
            if (e.target === infoModalOverlay) {
                hideInfoModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && infoModalOverlay.classList.contains('open')) {
                hideInfoModal();
            }
        });

        function setCurrentStep(stepNumber) {
            currentStep = Math.max(1, Math.min(3, stepNumber));

            steps.forEach((stepEl) => {
                const isActive = Number(stepEl.dataset.step) === currentStep;
                stepEl.classList.toggle('active', isActive);
            });

            stepPills.forEach((pill) => {
                pill.classList.toggle('active', Number(pill.dataset.stepPill) === currentStep);
            });

            backBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
            nextBtn.style.display = currentStep === 3 ? 'none' : 'inline-flex';
            submitBtn.style.display = currentStep === 3 ? 'inline-flex' : 'none';
        }

        function validateStep(stepNumber) {
            const activeStep = steps.find((stepEl) => Number(stepEl.dataset.step) === stepNumber);
            if (!activeStep) return true;

            const controls = activeStep.querySelectorAll('input:not([type="hidden"]), select, textarea');
            for (const control of controls) {
                if (!control.checkValidity()) {
                    control.reportValidity();
                    return false;
                }
            }

            if (stepNumber === 2) {
                if (!originInput.value.trim()) {
                    nextBtn.focus();
                    showInfoModal('Please select or type pickup city/town.');
                    return false;
                }
                if (!destInput.value.trim()) {
                    nextBtn.focus();
                    showInfoModal('Please select or type delivery city/town.');
                    return false;
                }
            }

            return true;
        }

        backBtn.addEventListener('click', () => setCurrentStep(currentStep - 1));

        nextBtn.addEventListener('click', () => {
            if (!validateStep(currentStep)) {
                return;
            }
            setCurrentStep(currentStep + 1);
        });

        const firstError = Array.from(document.querySelectorAll('.err')).find((el) => el.textContent && el.textContent.trim().length > 0);
        if (!firstError) {
            setCurrentStep(1);
        } else {
            const stepWithError = firstError.closest('.wizard-step');
            setCurrentStep(stepWithError && stepWithError.dataset.step ? Number(stepWithError.dataset.step) : 1);
        }
    </script>
</body>

</html>