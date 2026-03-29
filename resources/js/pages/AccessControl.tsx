import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    assignDirectPermissionsToUser,
    assignPermissionsToRole,
    assignRolesToUser,
    createManagedUser,
    createRole,
    fetchManagedUsers,
    fetchPermissions,
    fetchRoles,
    updateManagedUser,
} from "../lib/api";
import type { ManagedUser, Permission, Role } from "../types";
import { useApp } from "../context/AppContext";

export default function AccessControl() {
    const { showToast } = useApp();

    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<ManagedUser[]>([]);

    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDescription, setNewRoleDescription] = useState("");

    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");

    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const [savingRolePermissions, setSavingRolePermissions] = useState(false);
    const [savingUserRoles, setSavingUserRoles] = useState(false);
    const [savingUserPermissions, setSavingUserPermissions] = useState(false);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [roleData, permissionData, userData] = await Promise.all([
                fetchRoles(),
                fetchPermissions(),
                fetchManagedUsers(),
            ]);

            setRoles(roleData);
            setPermissions(permissionData);
            setUsers(userData);

            if (!selectedRoleId && roleData[0])
                setSelectedRoleId(roleData[0].id);
            if (!selectedUserId && userData[0])
                setSelectedUserId(userData[0].id);
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

    const selectedRolePermissionIds = useMemo(() => {
        return new Set(
            (selectedRole?.permissions ?? []).map(
                (permission) => permission.id,
            ),
        );
    }, [selectedRole]);

    const selectedUserRoleIds = useMemo(() => {
        return new Set((selectedUser?.roles ?? []).map((role) => role.id));
    }, [selectedUser]);

    const selectedUserDirectPermissionIds = useMemo(() => {
        return new Set(
            (selectedUser?.directPermissions ?? []).map(
                (permission) => permission.id,
            ),
        );
    }, [selectedUser]);

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
            newUserPassword.length < 8
        )
            return;

        try {
            const created = await createManagedUser({
                name: newUserName.trim(),
                email: newUserEmail.trim(),
                password: newUserPassword,
                isActive: true,
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

    const saveRolePermissions = async (permissionIds: string[]) => {
        if (!selectedRole) return;

        setSavingRolePermissions(true);
        try {
            await assignPermissionsToRole(selectedRole.id, permissionIds);
            showToast("Role permissions updated", "green");
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update role permissions", "red");
        } finally {
            setSavingRolePermissions(false);
        }
    };

    const saveUserRoles = async (roleIds: string[]) => {
        if (!selectedUser) return;

        setSavingUserRoles(true);
        try {
            await assignRolesToUser(selectedUser.id, roleIds);
            showToast("User roles updated", "green");
            await loadAll();
        } catch (e: any) {
            showToast(e?.message ?? "Failed to update user roles", "red");
        } finally {
            setSavingUserRoles(false);
        }
    };

    const saveUserDirectPermissions = async (permissionIds: string[]) => {
        if (!selectedUser) return;

        setSavingUserPermissions(true);
        try {
            await assignDirectPermissionsToUser(selectedUser.id, permissionIds);
            showToast("Direct permissions updated", "green");
            await loadAll();
        } catch (e: any) {
            showToast(
                e?.message ?? "Failed to update direct permissions",
                "red",
            );
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
                                Loading users, roles and permissions...
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
                            Manage users, roles, and explicit CRUD permissions.
                        </div>
                    </div>
                </div>
                <div
                    className="chart-wrap"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                    }}
                >
                    <form
                        onSubmit={createUserSubmit}
                        className="card"
                        style={{ padding: 12 }}
                    >
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
                                onChange={(e) =>
                                    setNewUserEmail(e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                minLength={8}
                                value={newUserPassword}
                                onChange={(e) =>
                                    setNewUserPassword(e.target.value)
                                }
                                required
                            />
                        </div>
                        <button className="btn primary" type="submit">
                            Create User
                        </button>
                    </form>

                    <form
                        onSubmit={createRoleSubmit}
                        className="card"
                        style={{ padding: 12 }}
                    >
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
                                onChange={(e) =>
                                    setNewRoleDescription(e.target.value)
                                }
                            />
                        </div>
                        <button className="btn primary" type="submit">
                            Create Role
                        </button>
                    </form>
                </div>
            </div>

            <div className="two-col" style={{ alignItems: "start" }}>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Users</div>
                            <div className="card-subtitle">
                                Assign roles and direct permissions.
                            </div>
                        </div>
                    </div>
                    <div className="chart-wrap">
                        <div className="form-group">
                            <label className="form-label">Select User</label>
                            <select
                                className="form-select"
                                value={selectedUserId}
                                onChange={(e) =>
                                    setSelectedUserId(e.target.value)
                                }
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedUser && (
                            <>
                                <div
                                    style={{
                                        margin: "8px 0 12px",
                                        display: "flex",
                                        gap: 8,
                                    }}
                                >
                                    <span
                                        className={`badge ${selectedUser.isActive ? "approved" : "rejected"}`}
                                    >
                                        {selectedUser.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                    <button
                                        className="btn"
                                        type="button"
                                        onClick={() =>
                                            toggleUserActive(selectedUser)
                                        }
                                    >
                                        {selectedUser.isActive
                                            ? "Deactivate"
                                            : "Activate"}
                                    </button>
                                </div>

                                <div className="form-section-label">Roles</div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(2, minmax(0, 1fr))",
                                        gap: 6,
                                        marginBottom: 10,
                                    }}
                                >
                                    {roles.map((role) => {
                                        const checked = selectedUserRoleIds.has(
                                            role.id,
                                        );
                                        return (
                                            <label
                                                key={role.id}
                                                className="login-checkbox"
                                                style={{ padding: "4px 0" }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        const next = new Set(
                                                            selectedUserRoleIds,
                                                        );
                                                        if (e.target.checked)
                                                            next.add(role.id);
                                                        else
                                                            next.delete(
                                                                role.id,
                                                            );
                                                        void saveUserRoles(
                                                            Array.from(next),
                                                        );
                                                    }}
                                                    disabled={savingUserRoles}
                                                />
                                                <span>{role.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                <div className="form-section-label">
                                    Direct Permissions
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(2, minmax(0, 1fr))",
                                        gap: 6,
                                    }}
                                >
                                    {permissions.map((permission) => {
                                        const checked =
                                            selectedUserDirectPermissionIds.has(
                                                permission.id,
                                            );
                                        return (
                                            <label
                                                key={permission.id}
                                                className="login-checkbox"
                                                style={{ padding: "4px 0" }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        const next = new Set(
                                                            selectedUserDirectPermissionIds,
                                                        );
                                                        if (e.target.checked)
                                                            next.add(
                                                                permission.id,
                                                            );
                                                        else
                                                            next.delete(
                                                                permission.id,
                                                            );
                                                        void saveUserDirectPermissions(
                                                            Array.from(next),
                                                        );
                                                    }}
                                                    disabled={
                                                        savingUserPermissions
                                                    }
                                                />
                                                <span>{permission.key}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">
                                Roles & Permissions
                            </div>
                            <div className="card-subtitle">
                                Assign explicit CRUD permissions to selected
                                role.
                            </div>
                        </div>
                    </div>
                    <div className="chart-wrap">
                        <div className="form-group">
                            <label className="form-label">Select Role</label>
                            <select
                                className="form-select"
                                value={selectedRoleId}
                                onChange={(e) =>
                                    setSelectedRoleId(e.target.value)
                                }
                            >
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedRole && (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
                                    gap: 6,
                                }}
                            >
                                {permissions.map((permission) => {
                                    const checked =
                                        selectedRolePermissionIds.has(
                                            permission.id,
                                        );
                                    return (
                                        <label
                                            key={permission.id}
                                            className="login-checkbox"
                                            style={{ padding: "4px 0" }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                    const next = new Set(
                                                        selectedRolePermissionIds,
                                                    );
                                                    if (e.target.checked)
                                                        next.add(permission.id);
                                                    else
                                                        next.delete(
                                                            permission.id,
                                                        );
                                                    void saveRolePermissions(
                                                        Array.from(next),
                                                    );
                                                }}
                                                disabled={savingRolePermissions}
                                            />
                                            <span>{permission.key}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
