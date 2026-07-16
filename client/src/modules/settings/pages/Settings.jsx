import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Plus, X, Users, Settings2, Edit2, Trash2 } from "lucide-react";
import { useSettings } from "../hooks/useSettings";
import { useUsers } from "../hooks/useUsers";
import { settingsSchema } from "../validation/settingsSchema";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Select from "@/components/ui/Select";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("system"); // "system" or "users"
  const { settings, isLoading: isSettingsLoading, isError: isSettingsError, updateSettings, isUpdating } = useSettings();
  const { users, roles, isLoading: isUsersLoading, isError: isUsersError, createUser, updateUser, deleteUser, isMutating } = useUsers();
  const { user: authUser } = useAuth();

  const { showSuccess, showError } = useToast();
  
  // Consistent role options from Create Account page
  const ROLE_OPTIONS = [
    { value: "Workshop-Staff", label: "Workshop Staff (Default)" },
    { value: "Manager", label: "Manager" },
    { value: "Admin", label: "Admin" },
  ];
  
  // Labs Configuration State
  const [labInput, setLabInput] = useState("");
  const [labs, setLabs] = useState([]);

  // User Management State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });

  // Users Form State
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    roleId: "",
    status: "active",
  });

  useEffect(() => {
    if (isSettingsError) {
      showError("Fetch Failed", "Failed to fetch settings from server.");
    }
    if (isUsersError && activeTab === "users") {
      showError("Fetch Failed", "Failed to fetch users or roles.");
    }
  }, [isSettingsError, isUsersError, activeTab, showError]);

  // System Settings Form Hook
  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    reset: resetSettings,
    setValue: setSettingsValue,
    watch,
    formState: { errors: settingsErrors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (settings) {
      resetSettings({
        charityPercentage: settings.charityPercentage,
        currency: settings.currency,
        prefixes: {
          gemstone: settings.prefixes?.gemstone || "GEM",
          lot: settings.prefixes?.lot || "LOT",
          product: settings.prefixes?.product || "PRD",
          invoice: settings.prefixes?.invoice || "INV",
          memo: settings.prefixes?.memo || "MEM",
          jobCard: settings.prefixes?.jobCard || "JOB",
        },
        certificateLabs: settings.certificateLabs || [],
        exchangeRate: settings.exchangeRate || 1.0,
        companyInfo: {
          name: settings.companyInfo?.name || "SR TAKAT",
          address: settings.companyInfo?.address || "",
          phone: settings.companyInfo?.phone || "",
          email: settings.companyInfo?.email || "",
          website: settings.companyInfo?.website || "",
        },
      });
      setLabs(settings.certificateLabs || []);
    }
  }, [settings, resetSettings]);

  const onSettingsSubmit = async (data) => {
    try {
      const payload = { ...data, certificateLabs: labs };
      await updateSettings(payload);
      showSuccess("Settings Saved", "System settings updated successfully!");
    } catch (err) {
      showError("Save Failed", err?.response?.data?.message || "Failed to update settings.");
    }
  };

  const handleAddLab = () => {
    const trimmed = labInput.trim().toUpperCase();
    if (trimmed && !labs.includes(trimmed)) {
      const updated = [...labs, trimmed];
      setLabs(updated);
      setSettingsValue("certificateLabs", updated);
      setLabInput("");
    }
  };

  const handleRemoveLab = (labToRemove) => {
    const updated = labs.filter((l) => l !== labToRemove);
    setLabs(updated);
    setSettingsValue("certificateLabs", updated);
  };

  // User Management Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      roleId: "Workshop-Staff",
      status: "active",
    });
    setUserModalOpen(true);
  };

  const resolveRoleId = (roleLike) => {
    if (!roleLike) return "Workshop-Staff";
    if (typeof roleLike === "string") return roleLike;
    if (typeof roleLike === "object" && (roleLike._id || roleLike.id)) {
      const roleId = roleLike._id || roleLike.id;
      // Map backend IDs to role names for consistency
      const matchingRole = roles.find((r) => r._id === roleId || r.id === roleId);
      return matchingRole?.name || roleLike.name || "Workshop-Staff";
    }
    return "Workshop-Staff";
  };

  const getUserRoleId = (user) => {
    if (!user) return "Workshop-Staff";
    
    const roleName = user.roleName || user.roleId?.name || user.roleId || "";
    if (typeof roleName === "string" && ROLE_OPTIONS.some((r) => r.value === roleName)) {
      return roleName;
    }
    
    if (typeof user.roleId === "object") {
      const name = user.roleId?.name || "";
      if (ROLE_OPTIONS.some((r) => r.value === name)) return name;
    }
    
    return "Workshop-Staff";
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "", // Leave password blank on edit
      phone: user.phone || "",
      roleId: getUserRoleId(user),
      status: user.status || "active",
    });
    setUserModalOpen(true);
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.fullName || !userForm.email || (!editingUser && !userForm.password) || !userForm.roleId) {
      showError("Validation Error", "Please fill in all required fields.");
      return;
    }

    try {
      if (editingUser) {
        const payload = { ...userForm };
        if (!payload.password) delete payload.password; // Do not update password if left blank
        await updateUser({ id: editingUser._id, data: payload });
        showSuccess("User Updated", "User details updated successfully!");
      } else {
        await createUser(userForm);
        showSuccess("User Created", "New user account created successfully!");
      }
      setUserModalOpen(false);
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Failed to process user.");
    }
  };

  const handleDeleteUser = (userId) => {
    setDeleteConfirm({ open: true, id: userId, isLoading: false });
  };

  const handleConfirmDeleteUser = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteUser(deleteConfirm.id);
      showSuccess("User Deactivated", "User account has been deactivated successfully.");
      setDeleteConfirm({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete user.");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const currentUserRoleName = authUser?.roleName || authUser?.roleId?.name || "";
  const isCurrentUserAdmin = currentUserRoleName.toLowerCase() === "admin";
  const currentUserId = authUser?._id;
  const visibleUsers = users.filter((u) => u._id !== currentUserId);
  const currentAdminProfile = isCurrentUserAdmin ? users.find((u) => u._id === currentUserId) : null;

  useEffect(() => {
    if (!userModalOpen || !editingUser) return;

    const nextRoleId = getUserRoleId(editingUser);
    setUserForm((prev) => ({ ...prev, roleId: nextRoleId }));
  }, [userModalOpen, editingUser]);

  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "danger";
      case "inactive":
      default:
        return "neutral";
    }
  };

  const tabClass = (tabId) =>
    `flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
      activeTab === tabId
        ? "border-accent text-accent"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
    }`;

  if (isSettingsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure global parameters, ID prefixes, and manage system users & access roles</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab("system")} className={tabClass("system")}>
          <Settings2 className="h-4.5 w-4.5" /> System Configuration
        </button>
        <button onClick={() => setActiveTab("users")} className={tabClass("users")}>
          <Users className="h-4.5 w-4.5" /> User & Role Management
        </button>
      </div>

      {activeTab === "system" ? (
        <form onSubmit={handleSettingsSubmit(onSettingsSubmit)} className="flex flex-col gap-6" noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General & Financials */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Financials & Parameters</h2>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <Input
                  label="Charity Percentage (%)"
                  type="number"
                  step="0.01"
                  error={settingsErrors.charityPercentage?.message}
                  hint="Configurable here, but each transaction stores the % used at that time. Changing this value does not recalculate historical records."
                  {...registerSettings("charityPercentage")}
                />
                <Input
                  label="Base Currency"
                  error={settingsErrors.currency?.message}
                  {...registerSettings("currency")}
                />
                <Input
                  label="USD Exchange Rate"
                  type="number"
                  step="0.000001"
                  error={settingsErrors.exchangeRate?.message}
                  {...registerSettings("exchangeRate")}
                />

                {/* Lab Certs list */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Certificate Labs (GIA, GRS, SSEF, Gübelin, IGI, Other)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="E.g., GIA, IGI"
                      value={labInput}
                      onChange={(e) => setLabInput(e.target.value)}
                      containerClassName="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLab();
                        }
                      }}
                    />
                    <Button variant="outline" onClick={handleAddLab}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {labs.map((lab) => (
                      <span
                        key={lab}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      >
                        {lab}
                        <button
                          type="button"
                          onClick={() => handleRemoveLab(lab)}
                          className="text-primary hover:text-danger rounded-md cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Sequential ID Prefixes */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">ID Prefix Configuration</h2>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Gemstone"
                  error={settingsErrors.prefixes?.gemstone?.message}
                  {...registerSettings("prefixes.gemstone")}
                />
                <Input
                  label="Gemstone Lot"
                  error={settingsErrors.prefixes?.lot?.message}
                  {...registerSettings("prefixes.lot")}
                />
                <Input
                  label="Product"
                  error={settingsErrors.prefixes?.product?.message}
                  {...registerSettings("prefixes.product")}
                />
                <Input
                  label="Sales Invoice"
                  error={settingsErrors.prefixes?.invoice?.message}
                  {...registerSettings("prefixes.invoice")}
                />
                <Input
                  label="Memo / Consignment"
                  error={settingsErrors.prefixes?.memo?.message}
                  {...registerSettings("prefixes.memo")}
                />
                <Input
                  label="Job Card"
                  error={settingsErrors.prefixes?.jobCard?.message}
                  {...registerSettings("prefixes.jobCard")}
                />
              </CardBody>
            </Card>

            {/* Company Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  error={settingsErrors.companyInfo?.name?.message}
                  {...registerSettings("companyInfo.name")}
                />
                <Input
                  label="Company Email"
                  type="email"
                  error={settingsErrors.companyInfo?.email?.message}
                  {...registerSettings("companyInfo.email")}
                />
                <PhoneInput
                  label="Company Phone"
                  error={settingsErrors.companyInfo?.phone?.message}
                  value={watch("companyInfo.phone") || ""}
                  onChange={(e) => setSettingsValue("companyInfo.phone", e.target.value)}
                />
                <Input
                  label="Company Website"
                  error={settingsErrors.companyInfo?.website?.message}
                  {...registerSettings("companyInfo.website")}
                />
                <Input
                  label="Company Address"
                  containerClassName="md:col-span-2"
                  error={settingsErrors.companyInfo?.address?.message}
                  {...registerSettings("companyInfo.address")}
                />
              </CardBody>
            </Card>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" isLoading={isUpdating} className="w-fit">
              <Save className="h-4 w-4" /> Save Settings
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">System Users</h2>
            <Button onClick={handleOpenAddUser} className="w-fit">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>

          {currentAdminProfile && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{currentAdminProfile.fullName}</h3>
                    <Badge variant="success">Admin</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{currentAdminProfile.email}</p>
                  <p className="mt-1 text-sm text-gray-500">{currentAdminProfile.phone || "—"}</p>
                  <p className="mt-2 text-sm text-gray-500">Role: {currentAdminProfile.roleId?.name || "No Role"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="w-fit" onClick={() => handleOpenEditUser(currentAdminProfile)}>
                    <Edit2 className="h-4 w-4" /> Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DataTable
            headers={["Full Name", "Email", "Phone", "Role", "Status", "Actions"]}
            data={visibleUsers}
            isLoading={isUsersLoading}
            emptyMessage="No system users created."
            renderRow={(u) => (
              <tr key={u._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-sm">
                <td className="px-6 py-4 font-semibold text-gray-950">{u.fullName}</td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4 text-gray-600">{u.phone || "—"}</td>
                <td className="px-6 py-4 font-medium text-primary">{u.roleId?.name || "No Role"}</td>
                <td className="px-6 py-4">
                  <Badge variant={getStatusVariant(u.status)}>{u.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditUser(u)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {u._id !== currentUserId && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />

          {/* Add/Edit User Modal */}
          <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? "Edit User Account" : "Create User Account"}>
            <form onSubmit={handleUserFormSubmit} className="flex flex-col gap-4">
              <Input
                label="Full Name *"
                value={userForm.fullName}
                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                required
              />
              <Input
                label="Email Address *"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
              <Input
                label={editingUser ? "Password (Leave blank to keep current)" : "Password *"}
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required={!editingUser}
              />
              <PhoneInput
                label="Phone Number"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
              <Select
                label="Security Role *"
                value={userForm.roleId || "Workshop-Staff"}
                onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                options={ROLE_OPTIONS}
                required
              />
              <Select
                label="Account Status *"
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "suspended", label: "Suspended" },
                ]}
                required
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={() => setUserModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isMutating}>
                  {editingUser ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User"
        message="This user account will be permanently deleted. All records created by this user will be lost."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={deleteConfirm.isLoading}
        variant="danger"
      />
    </div>
  );
}
