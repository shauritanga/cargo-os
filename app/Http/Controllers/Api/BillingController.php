<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::query()->orderByDesc('issued')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('search')) {
            $q = (string) $request->string('search');
            $query->where(function ($builder) use ($q) {
                $builder->where('invoice_no', 'like', "%{$q}%")
                    ->orWhere('customer', 'like', "%{$q}%")
                    ->orWhere('shipment_ref', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 50)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer' => 'required|string|max:255',
            'shipment_ref' => 'nullable|string|max:255',
            'currency' => 'nullable|string|max:10',
            'status' => 'nullable|in:paid,pending,overdue,draft',
            'issued' => 'required|date',
            'due' => 'required|date|after_or_equal:issued',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.rate' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
        ]);
        $user = $request->user();
        $branchId = $user?->isAdmin()
            ? Branch::resolveDefaultId()
            : (int) ($user?->branch_id ?? Branch::resolveDefaultId());

        $invoice = Invoice::create([
            'branch_id' => $branchId,
            'invoice_no' => $this->nextInvoiceNumber(),
            'customer' => $validated['customer'],
            'shipment_ref' => $validated['shipment_ref'] ?? null,
            'currency' => strtoupper((string) ($validated['currency'] ?? 'TZS')),
            'status' => $validated['status'] ?? 'draft',
            'issued' => $validated['issued'],
            'due' => $validated['due'],
            'items' => $validated['items'],
            'amount' => $this->calculateAmount($validated['items']),
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($invoice, 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json($invoice);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'customer' => 'sometimes|required|string|max:255',
            'shipment_ref' => 'sometimes|nullable|string|max:255',
            'currency' => 'sometimes|nullable|string|max:10',
            'status' => 'sometimes|required|in:paid,pending,overdue,draft',
            'issued' => 'sometimes|required|date',
            'due' => 'sometimes|required|date',
            'items' => 'sometimes|required|array|min:1',
            'items.*.description' => 'required_with:items|string|max:500',
            'items.*.qty' => 'required_with:items|numeric|min:0.01',
            'items.*.rate' => 'required_with:items|numeric|min:0',
            'notes' => 'sometimes|nullable|string|max:5000',
        ]);

        if (isset($validated['currency'])) {
            $validated['currency'] = strtoupper((string) $validated['currency']);
        }

        if (isset($validated['items'])) {
            $validated['amount'] = $this->calculateAmount($validated['items']);
        }

        $invoice->update($validated);

        return response()->json($invoice->fresh());
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted']);
    }

    public function updateStatus(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:paid,pending,overdue,draft',
        ]);

        $invoice->update(['status' => $validated['status']]);

        return response()->json($invoice->fresh());
    }

    private function calculateAmount(array $items): float
    {
        $total = 0.0;

        foreach ($items as $item) {
            $qty = (float) ($item['qty'] ?? 0);
            $rate = (float) ($item['rate'] ?? 0);
            $total += $qty * $rate;
        }

        return round($total, 2);
    }

    private function nextInvoiceNumber(): string
    {
        $year = now()->format('Y');

        $last = Invoice::query()
            ->where('invoice_no', 'like', "INV-{$year}-%")
            ->orderByDesc('id')
            ->first();

        if (!$last) {
            return "INV-{$year}-0001";
        }

        $parts = explode('-', $last->invoice_no);
        $seq = isset($parts[2]) ? (int) $parts[2] + 1 : 1;

        return sprintf('INV-%s-%04d', $year, $seq);
    }
}
