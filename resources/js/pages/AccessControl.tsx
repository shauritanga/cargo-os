import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    assignBranchToUser,
    assignDirectPermissionsToUser,
    assignPermissionsToRole,
    assignRolesToUser,
    createManagedUser,
    createRole,
    fetchBranches,
    fetchManagedUsers,
    fetchPermissions,
    fetchRoles,
    updateManagedUser,
} from "../lib/api";
import type { Branch, ManagedUser, Permission, Role } from "../types";
import { useApp } from "../context/AppContext";

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
        if (!b.has(item)) return false;
    }
    return true;
}

export default function AccessControl() {
    const { showToast } = useApp();

    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDescription, setNewRoleDescription] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserBranchId, setNewUserBranchId] = useState("");

    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<
        "setup" | "user-access" | "role-permissions"
    >("setup");

    const [userSearch, setUserSearch] = useState("");
    const [userBranchFilter, setUserBranchFilter] = useState("all");
    const [selectedUserBranchId, setSelectedUserBranchId] = useState("");

    const [savingUserBranch, setSavingUserBranch] = useState(false);
    const [savingRolePermissions, setSavingRolePermissions] = useState(false);
    const [savingUserRoles, setSavingUserRoles] = useState(false);
    const [savingUserPermissions, setSavingUserPermissions] = useState(false);

    const [draftRolePermissionIds, setDraftRolePermissionIds] = useState<
        Set<string>
    >(new Set());
    const [draftUserRoleIds, setDraftUserRoleIds] = useState<Set<string>>(
        new Set(),
    );
    const [draftUserDirectPermissionIds, setDraftUserDirectPermissionIds] =
        useState<Set<string>>(new Set());

    const loadAll = async () => {
        setLoading(true);
        try {
            const [roleData, permissionData, userData, branchData] =
                await Promise.all([
                    fetchRoles(),
                    fetchPermissions(),
                    fetchManagedUsers(),
                    fetchBranches(),
                ]);

            setRoles(roleData);
            setPermissions(permissionData);
            setUsers(userData);
            setBranches(branchData);

            if (!selectedRoleId && roleData[0]) setSelectedRoleId(roleData[0].id);
            if (!selectedUserId && userData[0]) setSelectedUserId(userData[0].id);
            if (!newUserBranchId) {
                const firstActiveBranch = branchData.find((b) => b.isActive);
                if (firstActiveBranch) setNewUserBranchId(firstActiveBranch.id);
            }
        } catch (e: any) {
            showToast(e?.message ?? "Failed to load RBAC data", "red");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedRole = useMemo(
        () => roles.find((role) => role.id === selectedRoleId) ?? null,
        [roles, selectedRoleId],
    );

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId) ?? null,
        [users, selectedUserId],
    );

    useEffect(() => {
        if (!selectedRole) {
            setDraftRolePermissionIds(new Set());
            return;
        }
        setDraftRolePermissionIds(
            new Set((selectedRole.permissions ?? []).map((permission) => permission.id)),
        );
    }, [selectedRole]);

    useEffect(() => {
        if (!selectedUser) {
            setDraftUserRoleIds(new Set());
            setDraftUserDirectPermissionIds(new Set());
            setSelectedUserBranchId("");
            return;
        }
        setDraftUserRoleIds(new Set((selectedUser.roles ?? []).map((role) => role.id)));
        setDraftUserDirectPermissionIds(
            new Set(
                (selectedUser.directPermissions ?? []).map(
                    (permission) => permission.id,
                ),
            ),
        );
        setSelectedUserBranchId(selectedUser.branch?.id ?? "");
    }, [selectedUser]);

    const activeBranches = useMemo(
        () => branches.filter((branch) => branch.isActive),
        [branches],
    );

    const filteredUsers = useMemo(() => {
        const query = userSearch.trim().toLowerCase();
        return users.filter((user) => {
            if (
                userBranchFilter !== "all" &&
                (user.branch?.id ?? "") !== userBranchFilter
            ) {
                return false;
            }
            if (!query) return true;
            const branchCode = user.branch?.code ?? "";
            return `${user.name} ${user.email} ${branchCode}`
                .toLowerCase()
                .includes(query);
        });
    }, [users, userSearch, userBranchFilter]);

    const baselineRolePermissionIds = useMemo(
        () =>
            new Set(
                (selectedRole?.permissions ?? []).map((permission) => permission.id),
            ),
        [selectedRole],
    );
    const rolePermissionsDirty = !areSetsEqual(
        draftRolePermissionIds,
        baselineRolePermissionIds,
    );

    const baselineUserRoleIds = useMemo(
        () => new Set((selectedUser?.roles ?? []).map((role) => role.id)),
        [selectedUser],
    );
    const baselineUserDirectPermissionIds = useMemo(
        () =>
            new Set(
                (selectedUser?.directPermissions ?? []).map((permission) => permission.id),
            ),
        [selectedUser],
    );
    const userRolesDirty = !areSetsEqual(draftUserRoleIds, baselineUserRoleIds);
    const userPermissionsDirty = !areSetsEqual(
        draftUserDirectPermissionIds,
        baselineUserDirectPermissionIds,
    );
    const userBranchDirty =
        selectedUser !== null &&
        (selectedUser.branch?.id ?? "") !== selectedUserBranchId;

    const createRoleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newRoleName.trim()) return;

        try {
            const created = await createRole({
                name: newRoleName.trim(),
                description: newRoleDescription.trim() || undefined,
            });

            setRoles((prev) =>
                [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setNewRoleName("");
            setNewRoleDescription("");
            setSelectedRoleId(created.id);
            showToast("Role created", "green");
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to create role", "red");
        }
    };

    const createUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (
            !newUserName.trim() ||
            !newUserEmail.trim() ||
            newUserPassword.length < 12 ||
            !newUserBranchId
        ) {
            return;
        }

        try {
            const created = await createManagedUser({
                name: newUserName.trim(),
                email: newUserEmail.trim(),
                password: newUserPassword,
                isActive: true,
                branchId: newUserBranchId,
            });

            setUsers((prev) =>
                [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setNewUserName("");
            setNewUserEmail("");
            setNewUserPassword("");
            setSelectedUserId(created.id);
            showToast("User created", "green");
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to create user", "red");
        }
    };

    const toggleUserActive = async (user: ManagedUser) => {
        try {
            const updated = await updateManagedUser(user.id, {
                name: user.name,
                email: user.email,
                isActive: !user.isActive,
            });

            setUsers((prev) =>
                prev.map((candidate) =>
                    candidate.id === updated.id ? updated : candidate,
                ),
            );
            showToast(
                updated.isActive ? "User activated" : "User deactivated",
                "green",
            );
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update user", "red");
        }
    };

    const saveSelectedUserBranch = async () => {
        if (!selectedUser || !selectedUserBranchId || !userBranchDirty) return;
        setSavingUserBranch(true);
        try {
            const updated = await assignBranchToUser(
                selectedUser.id,
                selectedUserBranchId,
            );
            setUsers((prev) =>
                prev.map((candidate) =>
                    candidate.id === updated.id ? updated : candidate,
                ),
            );
            showToast(
                `Branch changed to ${updated.branch?.code ?? "N/A"}`,
                "green",
            );
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update user branch", "red");
        } finally {
            setSavingUserBranch(false);
        }
    };

    const saveRolePermissions = async () => {
        if (!selectedRole || !rolePermissionsDirty) return;
        setSavingRolePermissions(true);
        try {
            await assignPermissionsToRole(
                selectedRole.id,
                Array.from(draftRolePermissionIds),
            );
            showToast("Role permissions updated", "green");
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update role permissions", "red");
        } finally {
            setSavingRolePermissions(false);
        }
    };

    const saveUserRoles = async () => {
        if (!selectedUser || !userRolesDirty) return;
        setSavingUserRoles(true);
        try {
            await assignRolesToUser(selectedUser.id, Array.from(draftUserRoleIds));
            showToast("User roles updated", "green");
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update user roles", "red");
        } finally {
            setSavingUserRoles(false);
        }
    };

    const saveUserDirectPermissions = async () => {
        if (!selectedUser || !userPermissionsDirty) return;
        setSavingUserPermissions(true);
        try {
            await assignDirectPermissionsToUser(
                selectedUser.id,
                Array.from(draftUserDirectPermissionIds),
            );
            showToast("Direct permissions updated", "green");
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update direct permissions", "red");
        } finally {
            setSavingUserPermissions(false);
        }
    };

    if (loading) {
        return (
            <div className="content">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Access Control</div>
                            <div className="card-subtitle">
                                Loading users, branches, roles and permissions...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content">
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Access Control</div>
                        <div className="card-subtitle">
                            Manage user branch membership and global RBAC safely.
                        </div>
                    </div>
                </div>
                <div className="chart-wrap" style={{ display: "grid", gap: 12 }}>
                    <div className="filter-tabs access-tabs" style={{ width: "fit-content" }}>
                        <div
                            className={`filter-tab${activeTab === "setup" ? " active" : ""}`}
                            onClick={() => setActiveTab("setup")}
                        >
                            Setup
                        </div>
                        <div
                            className={`filter-tab${activeTab === "user-access" ? " active" : ""}`}
                            onClick={() => setActiveTab("user-access")}
                        >
                            User Access
                        </div>
                        <div
                            className={`filter-tab${activeTab === "role-permissions" ? " active" : ""}`}
                            onClick={() => setActiveTab("role-permissions")}
                        >
                            Role Permissions
                        </div>
                    </div>

                    {activeTab === "setup" && (
                        <div className="ac-grid-two">
                            <form onSubmit={createUserSubmit} className="card ac-inner-card">
                                <div className="form-section-label">Create User</div>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-input"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        minLength={12}
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Branch</label>
                                    <select
                                        className="form-select"
                                        value={newUserBranchId}
                                        onChange={(e) => setNewUserBranchId(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            Select branch
                                        </option>
                                        {activeBranches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name} ({branch.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button className="btn primary" type="submit" style={{ marginTop: 8 }}>
                                    Create User
                                </button>
                            </form>

                            <form onSubmit={createRoleSubmit} className="card ac-inner-card">
                                <div className="form-section-label">Create Role</div>
                                <div className="form-group">
                                    <label className="form-label">Role Name</label>
                                    <input
                                        className="form-input"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="operator"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input
                                        className="form-input"
                                        value={newRoleDescription}
                                        onChange={(e) => setNewRoleDescription(e.target.value)}
                                    />
                                </div>
                                <button className="btn primary" type="submit" style={{ marginTop: 8 }}>
                                    Create Role
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {activeTab === "user-access" && (
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Users</div>
                            <div className="card-subtitle">
                                Assign branch, roles and direct permissions with staged save.
                            </div>
                        </div>
                    </div>
                    <div className="chart-wrap" style={{ display: "grid", gap: 12 }}>
                        <div className="ac-user-toolbar">
                            <div className="search-wrap" style={{ maxWidth: 320 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="M20 20l-3.5-3.5" />
                                </svg>
                                <input
                                    placeholder="Search users by name, email, branch"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="form-select"
                                value={userBranchFilter}
                                onChange={(e) => setUserBranchFilter(e.target.value)}
                                style={{ width: 220 }}
                            >
                                <option value="all">All Branches</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} ({branch.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select User</label>
                            <select
                                className="form-select"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                {filteredUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email}) [{user.branch?.code ?? "N/A"}]
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedUser && (
                            <>
                                <div className="ac-summary-grid">
                                    <div className="card ac-inner-card">
                                        <div className="form-section-label">User Summary</div>
                                        <div className="ac-summary-row">
                                            <span className={`badge ${selectedUser.isActive ? "approved" : "rejected"}`}>
                                                {selectedUser.isActive ? "Active" : "Inactive"}
                                            </span>
                                            <span className="badge customs">
                                                Branch: {selectedUser.branch?.code ?? "N/A"}
                                            </span>
                                        </div>
                                        <div className="ac-summary-meta">
                                            <div>Roles: {selectedUser.roles.length}</div>
                                            <div>
                                                Direct Permissions: {selectedUser.directPermissions.length}
                                            </div>
                                        </div>
                                        <button
                                            className="btn"
                                            type="button"
                                            onClick={() => toggleUserActive(selectedUser)}
                                        >
                                            {selectedUser.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                    </div>

                                    <div className="card ac-inner-card">
                                        <div className="form-section-label">Branch Assignment</div>
                                        <div className="form-group">
                                            <label className="form-label">Branch</label>
                                            <select
                                                className="form-select"
                                                value={selectedUserBranchId}
                                                onChange={(e) => setSelectedUserBranchId(e.target.value)}
                                            >
                                                {activeBranches.map((branch) => (
                                                    <option key={branch.id} value={branch.id}>
                                                        {branch.name} ({branch.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="ac-actions">
                                            <button
                                                type="button"
                                                className="btn primary"
                                                onClick={() => void saveSelectedUserBranch()}
                                                disabled={!userBranchDirty || savingUserBranch}
                                            >
                                                {savingUserBranch ? "Saving..." : "Save Branch"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card ac-inner-card">
                                    <div className="ac-head-row">
                                        <div className="form-section-label">Roles</div>
                                        <div className="ac-actions">
                                            <button
                                                type="button"
                                                className="btn"
                                                onClick={() =>
                                                    setDraftUserRoleIds(
                                                        new Set(
                                                            (selectedUser.roles ?? []).map(
                                                                (role) => role.id,
                                                            ),
                                                        ),
                                                    )
                                                }
                                                disabled={!userRolesDirty || savingUserRoles}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="btn primary"
                                                onClick={() => void saveUserRoles()}
                                                disabled={!userRolesDirty || savingUserRoles}
                                            >
                                                {savingUserRoles ? "Saving..." : "Save Roles"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rbac-checkbox-grid">
                                        {roles.map((role) => {
                                            const checked = draftUserRoleIds.has(role.id);
                                            return (
                                                <label key={role.id} className="rbac-checkbox" style={{ padding: "4px 0" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const next = new Set(draftUserRoleIds);
                                                            if (e.target.checked) next.add(role.id);
                                                            else next.delete(role.id);
                                                            setDraftUserRoleIds(next);
                                                        }}
                                                        disabled={savingUserRoles}
                                                    />
                                                    <span>{role.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="card ac-inner-card">
                                    <div className="ac-head-row">
                                        <div className="form-section-label">Direct Permissions</div>
                                        <div className="ac-actions">
                                            <button
                                                type="button"
                                                className="btn"
                                                onClick={() =>
                                                    setDraftUserDirectPermissionIds(
                                                        new Set(
                                                            (
                                                                selectedUser.directPermissions ?? []
                                                            ).map((permission) => permission.id),
                                                        ),
                                                    )
                                                }
                                                disabled={!userPermissionsDirty || savingUserPermissions}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="btn primary"
                                                onClick={() => void saveUserDirectPermissions()}
                                                disabled={!userPermissionsDirty || savingUserPermissions}
                                            >
                                                {savingUserPermissions
                                                    ? "Saving..."
                                                    : "Save Permissions"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rbac-checkbox-grid">
                                        {permissions.map((permission) => {
                                            const checked = draftUserDirectPermissionIds.has(
                                                permission.id,
                                            );
                                            return (
                                                <label
                                                    key={permission.id}
                                                    className="rbac-checkbox"
                                                    style={{ padding: "4px 0" }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const next = new Set(
                                                                draftUserDirectPermissionIds,
                                                            );
                                                            if (e.target.checked)
                                                                next.add(permission.id);
                                                            else
                                                                next.delete(permission.id);
                                                            setDraftUserDirectPermissionIds(next);
                                                        }}
                                                        disabled={savingUserPermissions}
                                                    />
                                                    <span>{permission.key}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "role-permissions" && (
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Roles & Permissions</div>
                            <div className="card-subtitle">
                                Global RBAC. Stage changes before saving.
                            </div>
                        </div>
                    </div>
                    <div className="chart-wrap" style={{ display: "grid", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Select Role</label>
                            <select
                                className="form-select"
                                value={selectedRoleId}
                                onChange={(e) => setSelectedRoleId(e.target.value)}
                            >
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedRole && (
                            <div className="card ac-inner-card">
                                <div className="ac-head-row">
                                    <div className="form-section-label">Permissions</div>
                                    <div className="ac-actions">
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() =>
                                                setDraftRolePermissionIds(
                                                    new Set(
                                                        (
                                                            selectedRole.permissions ?? []
                                                        ).map((permission) => permission.id),
                                                    ),
                                                )
                                            }
                                            disabled={!rolePermissionsDirty || savingRolePermissions}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn primary"
                                            onClick={() => void saveRolePermissions()}
                                            disabled={!rolePermissionsDirty || savingRolePermissions}
                                        >
                                            {savingRolePermissions
                                                ? "Saving..."
                                                : "Save Permissions"}
                                        </button>
                                    </div>
                                </div>

                                <div className="rbac-checkbox-grid">
                                    {permissions.map((permission) => {
                                        const checked = draftRolePermissionIds.has(
                                            permission.id,
                                        );
                                        return (
                                            <label
                                                key={permission.id}
                                                className="rbac-checkbox"
                                                style={{ padding: "4px 0" }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        const next = new Set(
                                                            draftRolePermissionIds,
                                                        );
                                                        if (e.target.checked)
                                                            next.add(permission.id);
                                                        else next.delete(permission.id);
                                                        setDraftRolePermissionIds(next);
                                                    }}
                                                    disabled={savingRolePermissions}
                                                />
                                                <span>{permission.key}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
