// src/app/user/page.jsx
"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import { isSuperAdminClient } from "@/lib/authClient"
import { toast } from "sonner"
import {
  Search,
  Edit,
  User,
  Shield,
  ArrowLeft,
  Mail,
  MoreVertical,
  RefreshCw,
  X,
  Save,
  Loader2
} from "lucide-react"

export default function UserListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get("orgId")

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const [actionMenu, setActionMenu] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(null)
  /** Sync id for update — avoids null in URL when React state lags */
  const editingUserIdRef = useRef(null)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: "", email: "" })
  const [editingUser, setEditingUser] = useState(false)

  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRoles, setSelectedRoles] = useState({})
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)


  useEffect(() => {
    // Check if user is super admin
    isSuperAdminClient().then(setIsAdmin)
  }, [])

  const getTheme = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("materio-mui-template-mode") || "light"
    }
    return "light"
  }

  const [theme, setTheme] = useState("light")
  useEffect(() => {
    setTheme(getTheme())
  }, [])

  const searchRef = useRef(search)
  searchRef.current = search

  const loadUsers = async pageOverride => {
    if (!organizationId) return
    const page = pageOverride !== undefined ? pageOverride : pagination.page
    setLoading(true)
    try {
      const res = await fetch(
        `/api/user/organization/${organizationId}/users?` +
          new URLSearchParams({
            page: String(page),
            limit: String(pagination.limit),
            search: searchRef.current
          }),
        { credentials: "include", cache: "no-store" }
      )
      const data = await res.json()

      if (data.success) {
        setUsers(data.users || [])
        setPagination(prev => ({
          ...prev,
          page,
          total: data.pagination?.total ?? 0,
          totalPages: data.pagination?.totalPages ?? 0
        }))
      } else {
        toast.error("Failed to load users")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error loading users")
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    setLoadingRoles(true)
    try {
      const res = await fetch("/api/role/list?limit=100&status=A", {
        credentials: "include",
        cache: "no-store"
      })
      const data = await res.json()
      if (data.success) {
        setAvailableRoles(data.data || [])
      }
    } catch (err) {
      console.error("Failed to load roles:", err)
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    if (!organizationId) {
      setError("Organization ID is required")
      setLoading(false)
      return
    }
    setError("")
    loadRoles()
  }, [organizationId])

  useEffect(() => {
    if (!organizationId) return
    loadUsers()
  }, [organizationId, pagination.page, pagination.limit])

  const handleSearch = e => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadUsers(1)
  }

  const handleRefresh = async () => {
    await loadUsers()
    toast.success("User list refreshed")
  }

  const handleMenuButton = (e, userId) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const menuWidth = 160
    setSelectedUserId(userId)
    setActionMenu(prev =>
      prev?.id === userId
        ? null
        : { id: userId, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
    )
  }

  useEffect(() => {
    function handleClickOutside() {
      setActionMenu(null)
    }
    if (actionMenu != null) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [actionMenu])

  useEffect(() => {
    if (actionMenu == null) return
    const close = () => setActionMenu(null)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [actionMenu])

  const openEditModal = async userId => {
    if (userId == null || userId === "") return
    const numericId = typeof userId === "number" ? userId : parseInt(String(userId), 10)
    if (!Number.isFinite(numericId)) {
      toast.error("Invalid user")
      return
    }
    editingUserIdRef.current = numericId
    setSelectedUserId(numericId)
    setActionMenu(null)
    try {
      const res = await fetch(`/api/user/${numericId}`, { credentials: "include", cache: "no-store" })
      const data = await res.json()

      if (data.success) {
        const resolvedId = data.user?.id ?? numericId
        editingUserIdRef.current = resolvedId
        setSelectedUserId(resolvedId)
        setEditFormData({
          name: data.user.name || "",
          email: data.user.email
        })

        const roleIds = data.user.roles ? data.user.roles.split(",").map(id => parseInt(id, 10)) : []
        const rolesObj = {}
        availableRoles.forEach(role => {
          rolesObj[role.id] = roleIds.includes(role.id)
        })
        setSelectedRoles(rolesObj)

        setEditModalOpen(true)
      } else {
        editingUserIdRef.current = null
        toast.error("Failed to load user details")
      }
    } catch (err) {
      console.error(err)
      editingUserIdRef.current = null
      toast.error("Error loading user details")
    }
  }

  const handleModalClose = () => {
    setEditModalOpen(false)
    setEditFormData({ name: "", email: "" })
    editingUserIdRef.current = null
    setSelectedUserId(null)
  }

  const handleRoleChange = roleId => {
    setSelectedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }))
  }

  const handleSelectAllRoles = () => {
    const allSelected = {}
    availableRoles.forEach(role => {
      allSelected[role.id] = true
    })
    setSelectedRoles(allSelected)
  }

  const handleClearAllRoles = () => {
    const allCleared = {}
    availableRoles.forEach(role => {
      allCleared[role.id] = false
    })
    setSelectedRoles(allCleared)
  }

  const handleUpdateUser = async e => {
    e.preventDefault()

    if (!editFormData.email) {
      toast.error("Email is required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editFormData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    const selectedRoleIds = Object.entries(selectedRoles)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id)
      .join(",")

    const userIdForUpdate = editingUserIdRef.current ?? selectedUserId
    if (userIdForUpdate == null || userIdForUpdate === "") {
      toast.error("Missing user. Close and open Edit again.")
      return
    }

    setEditingUser(true)

    try {
      const res = await fetch(`/api/user/${userIdForUpdate}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          roles: selectedRoleIds
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("User updated successfully")
        handleModalClose()
        await loadUsers()
      } else {
        toast.error(data.error || "Failed to update user")
      }
    } catch {
      toast.error("Error updating user")
    } finally {
      setEditingUser(false)
    }
  }

  const getRoleNames = rolesStr => {
    if (!rolesStr) return []
    const roleIds = rolesStr.split(",").map(id => parseInt(id, 10))
    return availableRoles.filter(role => roleIds.includes(role.id)).map(role => role.roleName)
  }

  const getSelectedRoleCount = () => Object.values(selectedRoles).filter(Boolean).length

  const dark = theme === "dark"
  const shell = `min-h-screen p-6 ${dark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`

  if (loading && !users.length && !error) {
    return (
      <div className={shell}>
        <div className="max-w-7xl mx-auto flex justify-center items-center min-h-[40vh]">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={shell}>
        <div className="max-w-2xl mx-auto p-6">
          <div
            className={`p-4 rounded-lg border mb-4 ${dark ? "bg-red-900/30 border-red-800 text-red-200" : "bg-red-50 border-red-200 text-red-800"}`}
          >
            {error}
          </div>
          <button
            type="button"
            onClick={() => router.push("/organization")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
          >
            Go to Organizations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={shell}>
      <div className="max-w-7xl mx-auto">
        {/* Header — matches unit list */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors shrink-0 ${dark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-200 text-gray-600"}`}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${dark ? "text-white" : "text-gray-800"}`}>
                Users
              </h1>
              <p className={`mt-2 ${dark ? "text-gray-400" : "text-gray-600"}`}>
                Manage users for organization ID {organizationId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-md border transition-colors ${
              dark
                ? "border-gray-600 text-gray-200 hover:bg-gray-800"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Search — same pattern as unit list */}
        <div
          className={`p-4 rounded-lg mb-6 shadow-sm border ${
            dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${dark ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border outline-none ${
                  dark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" /> Search
            </button>
          </form>
        </div>

        {/* Table card — unit list shell */}
        <div
          className={`table-list-card-shell rounded-lg shadow-sm border ${
            dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <User className={`w-16 h-16 mb-4 ${dark ? "text-gray-500" : "text-gray-400"}`} />
              <p className={`text-lg font-medium ${dark ? "text-gray-200" : "text-gray-800"}`}>
                No users found
              </p>
              <p className={`mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                {search ? "Try a different search term" : "No users in this organization"}
              </p>
            </div>
          ) : (
            <>
              <div className="table-list-scroll-x rounded-t-lg">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr
                      className={`border-b ${
                        dark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {["Sl No.", "Name", "Email", "Roles", "Created", ""].map((label, i) => (
                        <th
                          key={label || i}
                          className={`px-6 py-4 text-left text-sm font-semibold ${
                            dark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => {
                      const roleNames = getRoleNames(u.roles)
                      const rowNum = (pagination.page - 1) * pagination.limit + idx + 1
                      return (
                        <tr
                          key={u.id}
                          className={`border-b transition-colors ${
                            dark ? "border-gray-700/80 hover:bg-gray-700/50" : "border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-6 py-4 text-gray-500">#{rowNum}</td>
                          <td className={`px-6 py-4 font-medium max-w-[200px] truncate ${dark ? "text-white" : "text-gray-900"}`} title={u.name || ""}>
                            {u.name || "—"}
                          </td>
                          <td className={`px-6 py-4 max-w-[240px] truncate ${dark ? "text-white" : "text-black"}`} title={u.email}>
                            {u.email}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {roleNames.length === 0 ? (
                                <span className={dark ? "text-gray-500" : "text-gray-400"}>—</span>
                              ) : (
                                <>
                                  {roleNames.slice(0, 3).map((name, j) => (
                                    <span
                                      key={j}
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        dark ? "bg-blue-900/60 text-blue-200" : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {name}
                                    </span>
                                  ))}
                                  {roleNames.length > 3 && (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        dark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
                                      }`}
                                    >
                                      +{roleNames.length - 3}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${dark ? "text-white" : "text-black"}`}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={e => handleMenuButton(e, u.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                dark
                                  ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              }`}
                              aria-label="Actions"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div
                className={`px-6 py-4 border-t rounded-b-lg flex flex-wrap justify-between items-center gap-3 ${
                  dark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
                  Showing {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total}{" "}
                  total
                </p>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <select
            value={pagination.limit}
            onChange={e =>
              setPagination(prev => ({ ...prev, limit: +e.target.value, page: 1 }))
            }
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Portal action menu — unit list pattern */}
      {actionMenu != null &&
        typeof document !== "undefined" &&
        (() => {
          const row = users.find(u => u.id === actionMenu.id)
          if (!row) return null
          return createPortal(
            <div
              className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
              style={{ top: actionMenu.top, left: actionMenu.left }}
              onClick={e => e.stopPropagation()}
              role="menu"
            >
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${
                  dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => openEditModal(actionMenu.id)}
                role="menuitem"
              >
                <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                Edit user
              </button>
            </div>,
            document.body
          )
        })()}

      {/* Edit modal — Tailwind, same visual language as list */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={handleModalClose}
        >
          <div
            className={`w-full max-w-lg rounded-xl shadow-xl border max-h-[90vh] overflow-y-auto ${
              dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleUpdateUser}>
              <div
                className={`flex items-center justify-between px-6 py-4 border-b ${
                  dark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                  Edit user
                </h2>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className={`p-2 rounded-lg ${dark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
                    Full name
                  </label>
                  <div className="relative">
                    <User
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? "text-gray-500" : "text-gray-400"}`}
                    />
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none text-sm ${
                        dark
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Name"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? "text-gray-500" : "text-gray-400"}`}
                    />
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none text-sm ${
                        dark
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-4 ${dark ? "bg-gray-900/40 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${dark ? "text-gray-400" : "text-gray-600"}`} />
                      <span className={`text-sm font-semibold ${dark ? "text-gray-200" : "text-gray-800"}`}>
                        Assign roles
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllRoles}
                        disabled={loadingRoles}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllRoles}
                        disabled={loadingRoles}
                        className="text-xs font-semibold text-gray-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {loadingRoles ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : availableRoles.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                        {availableRoles.map(role => (
                          <label
                            key={role.id}
                            className={`flex items-center gap-2 cursor-pointer text-sm rounded px-2 py-1.5 ${
                              dark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedRoles[role.id]}
                              onChange={() => handleRoleChange(role.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={dark ? "text-gray-200" : "text-gray-800"}>{role.roleName}</span>
                          </label>
                        ))}
                      </div>
                      <p className={`text-xs mt-3 text-right ${dark ? "text-gray-500" : "text-gray-500"}`}>
                        {getSelectedRoleCount()} role(s) selected
                      </p>
                    </>
                  ) : (
                    <p className={`text-sm text-center py-2 ${dark ? "text-gray-500" : "text-gray-500"}`}>
                      No roles available
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex justify-end gap-3 px-6 py-4 border-t ${
                  dark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={editingUser}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
                    dark
                      ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                      : "border-gray-300 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingUser}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  {editingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingUser ? "Saving…" : "Update user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
