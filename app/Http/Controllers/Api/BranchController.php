<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', 50), 200));

        $branches = Branch::query()
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json($branches);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|alpha_dash|unique:branches,code',
            'is_active' => 'sometimes|boolean',
        ]);

        $branch = Branch::query()->create([
            'name' => $validated['name'],
            'code' => strtoupper((string) $validated['code']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return response()->json($branch, 201);
    }

    public function show(Branch $branch): JsonResponse
    {
        return response()->json($branch);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|alpha_dash|unique:branches,code,' . $branch->id,
            'is_active' => 'sometimes|boolean',
        ]);

        if (array_key_exists('code', $validated)) {
            $validated['code'] = strtoupper((string) $validated['code']);
        }

        $branch->update($validated);

        return response()->json($branch->fresh());
    }

    public function destroy(Branch $branch): JsonResponse
    {
        if (strtoupper($branch->code) === Branch::DEFAULT_CODE) {
            return response()->json([
                'message' => 'Default branch cannot be deleted.',
            ], 422);
        }

        $branch->delete();

        return response()->json(['message' => 'Branch deleted.']);
    }
}

