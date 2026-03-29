<?php

namespace App\Services;

use App\Models\Shipment;
use App\Models\ShipmentStatusEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ShipmentLifecycleService
{
    private const TRANSITIONS = [
        'pending' => ['transit', 'delayed'],
        'transit' => ['customs', 'delayed', 'delivered'],
        'customs' => ['transit', 'delayed'],
        'delayed' => ['transit', 'customs'],
        'delivered' => [],
    ];

    public function transition(
        Shipment $shipment,
        string $targetStatus,
        array $context = [],
        ?User $actor = null,
    ): Shipment {
        $currentStatus = (string) $shipment->status;
        $isOverride = (bool) ($context['override'] ?? false);
        $reason = trim((string) ($context['reason'] ?? '')) ?: null;
        $overrideReason = trim((string) ($context['override_reason'] ?? '')) ?: null;
        $occurredAt = !empty($context['occurred_at'])
            ? Carbon::parse((string) $context['occurred_at'])
            : now();
        $recipientName = trim((string) ($context['recipient_name'] ?? '')) ?: null;
        $recipientPhone = trim((string) ($context['recipient_phone'] ?? '')) ?: null;

        if ($targetStatus === 'delivered' && ($recipientName === null || $recipientPhone === null)) {
            throw ValidationException::withMessages([
                'recipient_name' => ['Recipient name and phone are required when marking shipment as delivered.'],
            ]);
        }

        if ($currentStatus === $targetStatus) {
            return $shipment;
        }

        $allowed = self::TRANSITIONS[$currentStatus] ?? [];
        $isValidTransition = in_array($targetStatus, $allowed, true);

        if (!$isValidTransition) {
            if (!$isOverride) {
                throw ValidationException::withMessages([
                    'status' => [
                        sprintf(
                            'Invalid status transition from %s to %s. Allowed: %s',
                            $currentStatus,
                            $targetStatus,
                            $allowed === [] ? 'none' : implode(', ', $allowed),
                        ),
                    ],
                ]);
            }

            if (!$actor || !$actor->hasRole('admin')) {
                throw ValidationException::withMessages([
                    'override' => ['Only admin users can override invalid status transitions.'],
                ]);
            }

            if ($overrideReason === null) {
                throw ValidationException::withMessages([
                    'override_reason' => ['Override reason is required for admin status override.'],
                ]);
            }
        }

        return DB::transaction(function () use (
            $shipment,
            $targetStatus,
            $currentStatus,
            $reason,
            $isOverride,
            $overrideReason,
            $occurredAt,
            $recipientName,
            $recipientPhone,
            $actor,
            $context,
        ) {
            $metadata = is_array($context['metadata'] ?? null) ? $context['metadata'] : [];

            if ($targetStatus === 'delivered') {
                $metadata['delivery'] = [
                    'recipient_name' => $recipientName,
                    'recipient_phone' => $recipientPhone,
                ];
            }

            $shipment->update(['status' => $targetStatus]);

            $event = ShipmentStatusEvent::create([
                'shipment_id' => $shipment->id,
                'previous_status' => $currentStatus,
                'new_status' => $targetStatus,
                'reason' => $reason,
                'is_override' => $isOverride,
                'override_reason' => $overrideReason,
                'metadata' => $metadata === [] ? null : $metadata,
                'triggered_by' => $actor?->id,
                'occurred_at' => $occurredAt,
            ]);

            $this->notifyCustomer($shipment->fresh(), $event);

            return $shipment->fresh();
        });
    }

    public function recordInitialEvent(
        Shipment $shipment,
        ?User $actor = null,
        array $metadata = [],
    ): ShipmentStatusEvent {
        return ShipmentStatusEvent::create([
            'shipment_id' => $shipment->id,
            'previous_status' => null,
            'new_status' => (string) $shipment->status,
            'reason' => 'Shipment created.',
            'is_override' => false,
            'override_reason' => null,
            'metadata' => $metadata === [] ? null : $metadata,
            'triggered_by' => $actor?->id,
            'occurred_at' => $shipment->created_at ?? now(),
        ]);
    }

    public function bulkTransition(
        array $shipmentIds,
        string $targetStatus,
        array $context = [],
        ?User $actor = null,
    ): array {
        $updated = 0;
        $failed = [];

        foreach ($shipmentIds as $shipmentId) {
            $shipment = Shipment::find($shipmentId);

            if (!$shipment) {
                $failed[] = [
                    'id' => $shipmentId,
                    'message' => 'Shipment not found.',
                ];
                continue;
            }

            try {
                $this->transition($shipment, $targetStatus, $context, $actor);
                $updated++;
            } catch (\Throwable $e) {
                $failed[] = [
                    'id' => (string) $shipmentId,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return [
            'updated' => $updated,
            'failed' => $failed,
            'total' => count($shipmentIds),
        ];
    }

    private function notifyCustomer(Shipment $shipment, ShipmentStatusEvent $event): void
    {
        if (empty($shipment->email)) {
            return;
        }

        $recipientName = $shipment->contact ?: $shipment->customer;
        $subject = sprintf('Shipment %s status updated to %s', $shipment->awb_number, strtoupper($event->new_status));

        $lines = [
            sprintf('Dear %s,', $recipientName),
            '',
            sprintf('Your shipment %s status has changed.', $shipment->awb_number),
            sprintf('Previous status: %s', strtoupper((string) $event->previous_status)),
            sprintf('Current status: %s', strtoupper($event->new_status)),
        ];

        if (!empty($event->reason)) {
            $lines[] = sprintf('Reason: %s', $event->reason);
        }

        if ($event->is_override && !empty($event->override_reason)) {
            $lines[] = sprintf('Override note: %s', $event->override_reason);
        }

        $lines[] = '';
        $lines[] = 'Thank you for shipping with us.';

        try {
            Mail::raw(implode("\n", $lines), function ($mail) use ($shipment, $recipientName, $subject) {
                $mail->to($shipment->email, $recipientName)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('Failed to send shipment status email.', [
                'shipment_id' => $shipment->id,
                'email' => $shipment->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
