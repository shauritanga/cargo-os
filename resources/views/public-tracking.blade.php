<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Shipment</title>
    <style>
        :root {
            --bg-1: #0a1020;
            --bg-2: #0f172a;
            --bg-3: #1a2439;
            --text-1: #e5e7eb;
            --text-2: #c2c7d0;
            --text-3: #9ca3af;
            --border: #2f3f59;
            --border-strong: #40506b;
            --blue: #3b82f6;
            --green: #22c55e;
            --amber: #f59e0b;
            --red: #ef4444;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Inter, "Segoe UI", Roboto, sans-serif;
            background: radial-gradient(circle at 10% 15%, #132442 0%, #0b1222 46%, #050911 100%);
            color: var(--text-1);
            min-height: 100vh;
            padding: 28px 14px;
        }

        .shell {
            max-width: 760px;
            margin: 0 auto;
            background: var(--bg-2);
            border: 1px solid var(--border-strong);
            border-radius: 14px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
            overflow: hidden;
        }

        .header {
            padding: 18px 22px;
            border-bottom: 1px solid var(--border);
        }

        .title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }

        .subtitle {
            margin: 6px 0 0;
            color: var(--text-3);
            font-size: 13px;
        }

        .body {
            padding: 18px 22px 22px;
        }

        form {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            align-items: end;
        }

        .label {
            display: block;
            font-size: 12px;
            color: var(--text-2);
            font-weight: 600;
            margin-bottom: 6px;
        }

        .input {
            width: 100%;
            background: var(--bg-3);
            color: var(--text-1);
            border: 1px solid var(--border-strong);
            border-radius: 7px;
            padding: 10px 12px;
            font: inherit;
            font-size: 14px;
            outline: none;
        }

        .input:focus {
            border-color: var(--blue);
        }

        .input::placeholder {
            color: var(--text-3);
        }

        .btn {
            border: 1px solid transparent;
            border-radius: 7px;
            background: var(--blue);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 14px;
            cursor: pointer;
        }

        .result {
            margin-top: 16px;
            background: var(--bg-3);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 14px;
        }

        .result-head {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        .mono {
            font-family: "DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 14px;
            color: var(--text-1);
            font-weight: 700;
            letter-spacing: 0.02em;
        }

        .status {
            border: 1px solid var(--border);
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .status.pending {
            color: var(--amber);
            border-color: rgba(245, 158, 11, 0.4);
        }

        .status.transit {
            color: var(--blue);
            border-color: rgba(59, 130, 246, 0.4);
        }

        .status.delivered {
            color: var(--green);
            border-color: rgba(34, 197, 94, 0.4);
        }

        .status.delayed,
        .status.customs {
            color: var(--red);
            border-color: rgba(239, 68, 68, 0.4);
        }

        .grid {
            margin-top: 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 14px;
        }

        .item-label {
            font-size: 11px;
            color: var(--text-3);
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .item-value {
            font-size: 13px;
            color: var(--text-2);
        }

        .hint {
            margin-top: 12px;
            color: var(--text-3);
            font-size: 12px;
        }

        .progress-wrap {
            margin-top: 14px;
            border: 1px solid var(--border);
            background: rgba(148, 163, 184, 0.06);
            border-radius: 10px;
            padding: 10px;
        }

        .progress-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 12px;
            color: var(--text-2);
        }

        .progress-track {
            height: 8px;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(148, 163, 184, 0.2);
        }

        .progress-fill {
            height: 100%;
            border-radius: inherit;
            transition: width 0.45s ease;
        }

        .timeline {
            margin-top: 14px;
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px;
            background: rgba(15, 23, 42, 0.55);
        }

        .timeline-title {
            margin: 0 0 10px;
            font-size: 12px;
            color: var(--text-2);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 700;
        }

        .timeline-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 2px;
        }

        .timeline-step {
            min-width: 90px;
            text-align: center;
            color: var(--text-3);
            font-size: 11px;
            line-height: 1.25;
            flex-shrink: 0;
        }

        .timeline-dot {
            width: 22px;
            height: 22px;
            border-radius: 999px;
            margin: 0 auto 6px;
            border: 2px solid var(--border-strong);
            background: transparent;
            position: relative;
        }

        .timeline-step.done {
            color: #86efac;
        }

        .timeline-step.done .timeline-dot {
            border-color: var(--green);
            background: rgba(34, 197, 94, 0.18);
        }

        .timeline-step.active {
            color: #bfdbfe;
            font-weight: 600;
        }

        .timeline-step.active .timeline-dot {
            border-color: var(--blue);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .timeline-step.active .timeline-dot::after {
            content: "";
            position: absolute;
            inset: 6px;
            border-radius: 999px;
            background: var(--blue);
        }

        .timeline-connector {
            margin-top: 10px;
            min-width: 30px;
            height: 2px;
            background: rgba(148, 163, 184, 0.25);
            flex: 1;
            border-radius: 99px;
        }

        .timeline-connector.done {
            background: rgba(34, 197, 94, 0.7);
        }

        .event-list {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 0;
            padding-left: 0;
        }

        .event-item {
            position: relative;
            display: grid;
            grid-template-columns: 28px 1fr;
            gap: 12px;
            align-items: start;
            min-height: 74px;
        }

        .event-item::after {
            content: "";
            position: absolute;
            left: 13px;
            top: 30px;
            bottom: -6px;
            width: 2px;
            background: rgba(148, 163, 184, 0.25);
        }

        .event-item:last-child::after {
            display: none;
        }

        .event-dot {
            width: 18px;
            height: 18px;
            border-radius: 999px;
            margin-top: 2px;
            border: 3px solid var(--green);
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
            background: rgba(15, 23, 42, 0.9);
            position: relative;
            z-index: 1;
        }

        .event-title {
            font-size: 20px;
            line-height: 1.2;
            color: var(--text-1);
            font-weight: 700;
            letter-spacing: -0.01em;
        }

        .event-meta {
            margin-top: 4px;
            font-size: 11.5px;
            color: var(--text-3);
        }

        .event-meta-complete {
            margin-top: 4px;
            font-size: 12px;
            color: #7f8aa3;
            font-weight: 600;
        }

        .event-note {
            margin-top: 4px;
            font-size: 11px;
            color: var(--text-2);
        }

        .event-note.override {
            color: #fcd34d;
        }

        .empty {
            margin-top: 16px;
            border: 1px solid rgba(239, 68, 68, 0.35);
            border-radius: 10px;
            padding: 12px;
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.08);
            font-size: 13px;
        }

        @media (max-width: 720px) {
            form {
                grid-template-columns: 1fr;
            }

            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <div class="shell">
        <div class="header">
            <h1 class="title">Track Shipment</h1>
            <p class="subtitle">Enter your AWB / tracking number to view current shipment status.</p>
        </div>

        <div class="body">
            <form method="GET" action="{{ route('public.tracking.form') }}">
                <div>
                    <label class="label" for="q">AWB / Tracking Number</label>
                    <input class="input" id="q" name="q" value="{{ $query }}" placeholder="e.g. 025500000001" required>
                </div>
                <button class="btn" type="submit">Track</button>
            </form>

            @if ($query !== '' && !$shipment)
            <div class="empty">No shipment found for <strong>{{ $query }}</strong>. Please confirm the tracking number and try again.</div>
            @endif

            @if ($shipment)
            @php
            $status = $shipment->status ?? 'pending';
            $progressMap = [
            'pending' => [
            'percent' => 20,
            'color' => 'var(--amber)',
            ],
            'transit' => [
            'percent' => 60,
            'color' => 'var(--blue)',
            ],
            'customs' => [
            'percent' => 72,
            'color' => 'var(--red)',
            ],
            'delayed' => [
            'percent' => 55,
            'color' => 'var(--red)',
            ],
            'delivered' => [
            'percent' => 100,
            'color' => 'var(--green)',
            ],
            ];

            $fallbackTimelineMap = [
            'pending' => [
            'steps' => ['Order Created', 'Awaiting Pickup', 'In Transit', 'Out for Delivery', 'Delivered'],
            'activeIndex' => 1,
            ],
            'transit' => [
            'steps' => ['Order Created', 'Picked Up', 'In Transit', 'Destination Hub', 'Out for Delivery', 'Delivered'],
            'activeIndex' => 2,
            ],
            'customs' => [
            'steps' => ['Order Created', 'Picked Up', 'In Transit', 'Customs Hold', 'Out for Delivery', 'Delivered'],
            'activeIndex' => 3,
            ],
            'delayed' => [
            'steps' => ['Order Created', 'Picked Up', 'Delay Reported', 'In Transit', 'Out for Delivery', 'Delivered'],
            'activeIndex' => 2,
            ],
            'delivered' => [
            'steps' => ['Order Created', 'Picked Up', 'In Transit', 'Destination Hub', 'Out for Delivery', 'Delivered'],
            'activeIndex' => 5,
            ],
            ];

            $progress = $progressMap[$status] ?? $progressMap['pending'];
            $fallbackTimeline = $fallbackTimelineMap[$status] ?? $fallbackTimelineMap['pending'];
            $events = $shipment->statusEvents ?? collect();
            @endphp
            @php
            $statusLabel = [
            'pending' => 'Pending',
            'transit' => 'In Transit',
            'customs' => 'Customs Hold',
            'delayed' => 'Delayed',
            'delivered' => 'Delivered',
            ];
            @endphp
            <div class="result">
                <div class="result-head">
                    <div class="mono">{{ $shipment->awb_number ?? ('ID-' . $shipment->id) }}</div>
                    <span class="status {{ $shipment->status }}">{{ strtoupper($shipment->status) }}</span>
                </div>

                <div class="grid">
                    <div>
                        <div class="item-label">From</div>
                        <div class="item-value">{{ $shipment->origin }} ({{ $shipment->origin_country ?? 'N/A' }})</div>
                    </div>
                    <div>
                        <div class="item-label">To</div>
                        <div class="item-value">{{ $shipment->dest }} ({{ $shipment->dest_country ?? 'N/A' }})</div>
                    </div>
                    <div>
                        <div class="item-label">Mode</div>
                        <div class="item-value">{{ $shipment->mode }}</div>
                    </div>
                    <div>
                        <div class="item-label">Cargo Type</div>
                        <div class="item-value">{{ $shipment->cargo_type }}</div>
                    </div>
                    <div>
                        <div class="item-label">Last Updated</div>
                        <div class="item-value">{{ optional($shipment->updated_at)->format('d M Y, H:i') }}</div>
                    </div>
                    <div>
                        <div class="item-label">ETA</div>
                        <div class="item-value">{{ $shipment->eta ? $shipment->eta->format('d M Y') : 'N/A' }}</div>
                    </div>
                </div>

                <div class="progress-wrap" aria-label="Shipment progress">
                    <div class="progress-meta">
                        <span>Current Progress</span>
                        <strong>{{ $progress['percent'] }}%</strong>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: {{ $progress['percent'] }}%; background: {{ $progress['color'] }};"></div>
                    </div>
                </div>

                <div class="timeline" aria-label="Shipment timeline">
                    <p class="timeline-title">Timeline</p>
                    @if ($events->count() > 0)
                    <div class="event-list">
                        @foreach ($events->reverse()->values() as $event)
                        <div class="event-item">
                            <div class="event-dot"></div>
                            <div>
                                <div class="event-title">{{ $statusLabel[$event->new_status] ?? ucfirst($event->new_status) }}</div>
                                <div class="event-meta">{{ optional($event->occurred_at)->format('d M Y, H:i') }}</div>
                                <div class="event-meta-complete">Completed</div>
                                @if (!empty($event->reason))
                                <div class="event-note">Reason: {{ $event->reason }}</div>
                                @endif
                                @if (!empty(data_get($event->metadata, 'delivery.recipient_name')))
                                <div class="event-note">Received by: {{ data_get($event->metadata, 'delivery.recipient_name') }}</div>
                                @endif
                                @if (!empty(data_get($event->metadata, 'delivery.recipient_phone')))
                                <div class="event-note">Recipient Phone: {{ data_get($event->metadata, 'delivery.recipient_phone') }}</div>
                                @endif
                                @if ($event->is_override && !empty($event->override_reason))
                                <div class="event-note override">Override: {{ $event->override_reason }}</div>
                                @endif
                            </div>
                        </div>
                        @endforeach
                    </div>
                    @else
                    <div class="timeline-row">
                        @foreach ($fallbackTimeline['steps'] as $index => $step)
                        @php
                        $isDone = $index < $fallbackTimeline['activeIndex'];
                            $isActive=$index===$fallbackTimeline['activeIndex'];
                            @endphp
                            <div class="timeline-step {{ $isDone ? 'done' : ($isActive ? 'active' : '') }}">
                            <div class="timeline-dot"></div>
                            <div>{{ $step }}</div>
                    </div>
                    @if (!$loop->last)
                    <div class="timeline-connector {{ $isDone ? 'done' : '' }}"></div>
                    @endif
                    @endforeach
                </div>
                @endif
            </div>

            <div class="hint">Need help? Contact support with this AWB number.</div>
        </div>
        @endif
    </div>
    </div>
</body>

</html>