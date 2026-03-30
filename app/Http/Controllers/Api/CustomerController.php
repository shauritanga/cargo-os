<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', (string) $request->string('type'));
        }

        if ($request->filled('search')) {
            $q = (string) $request->string('search');
            $query->where(function ($builder) use ($q) {
                $builder->whereRaw('CAST(id AS TEXT) LIKE ?', ["%{$q}%"])
                    ->orWhere('name', 'ilike', "%{$q}%")
                    ->orWhere('contact', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%")
                    ->orWhere('phone', 'ilike', "%{$q}%")
                    ->orWhere('country', 'ilike', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email',
            'phone' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'type' => 'nullable|in:Enterprise,SME,Individual',
            'status' => 'nullable|in:active,inactive',
            'shipments' => 'nullable|integer|min:0',
            'revenue' => 'nullable|numeric|min:0',
            'since' => 'nullable|date',
            'notes' => 'nullable|string|max:3000',
        ]);

        $customer = Customer::create(array_merge([
            'contact' => null,
            'phone' => null,
            'country' => 'Tanzania',
            'type' => 'SME',
            'status' => 'active',
            'shipments' => 0,
            'revenue' => 0,
            'since' => now()->toDateString(),
            'notes' => null,
        ], $validated));

        return response()->json($customer, 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'contact' => 'sometimes|nullable|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:customers,email,' . $customer->id,
            'phone' => 'sometimes|nullable|string|max:50',
            'country' => 'sometimes|nullable|string|max:100',
            'type' => 'sometimes|required|in:Enterprise,SME,Individual',
            'status' => 'sometimes|required|in:active,inactive',
            'shipments' => 'sometimes|nullable|integer|min:0',
            'revenue' => 'sometimes|nullable|numeric|min:0',
            'since' => 'sometimes|nullable|date',
            'notes' => 'sometimes|nullable|string|max:3000',
        ]);

        $customer->update($validated);

        return response()->json($customer->fresh());
    }

    public function destroy(Customer $customer): JsonResponse
    {
        if ($this->hasActiveShipments($customer)) {
            return response()->json([
                'message' => 'Cannot delete customer while it has active shipments. Complete or deliver the shipments first.',
            ], 422);
        }

        $customer->delete();

        return response()->json(['message' => 'Customer deleted']);
    }

    private function hasActiveShipments(Customer $customer): bool
    {
        $activeShipmentStatuses = ['transit', 'pending', 'delayed', 'customs'];

        return Shipment::query()
            ->whereIn('status', $activeShipmentStatuses)
            ->where(function ($query) use ($customer) {
                $query->whereRaw('LOWER(TRIM(customer)) = LOWER(TRIM(?))', [$customer->name]);

                if (!empty($customer->email)) {
                    $query->orWhere('email', 'ilike', $customer->email);
                }
            })
            ->exists();
    }
}
