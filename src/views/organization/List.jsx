// src/views/organization/List.jsx (only the modified parts)

"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Eye, UserPlus, MoreVertical } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { isSuperAdminClient } from "@/lib/authClient"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider,
  Typography,
  CircularProgress
} from "@mui/material"

export default function OrganizationList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [orgTypeFilter, setOrgTypeFilter] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc"
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [actionMenu, setActionMenu] = useState(null) // { id: org id, top, left }

  // Create User Modal State
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState(null)
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)

  // Roles State
  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRoles, setSelectedRoles] = useState({})
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Edit User Modal State
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editUserFormData, setEditUserFormData] = useState({
    name: '',
    email: ''
  })
  const [editingUser, setEditingUser] = useState(false)

  // View Users Modal State
  const [viewUsersModalOpen, setViewUsersModalOpen] = useState(false)
  const [organizationUsers, setOrganizationUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // THEME DETECT
  const getTheme = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("materio-mui-template-mode") || "light"
    }
    return "light"
  }
  const [theme, setTheme] = useState("light")
  useEffect(() => { setTheme(getTheme()) }, [])

  // LOAD LIST
  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
        search,
        orgType: orgTypeFilter
      })

      const res = await fetch(`/api/organization/list?${params}`)
      const data = await res.json()

      setItems(data.organizations || [])
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load available roles
  const loadRoles = async () => {
    setLoadingRoles(true)
    try {
      const res = await fetch('/api/role/list?limit=100&status=A')
      const data = await res.json()
      if (data.success) {
        setAvailableRoles(data.data)
        
        // Initialize selected roles object
        const rolesObj = {}
        data.data.forEach(role => {
          rolesObj[role.id] = false
        })
        setSelectedRoles(rolesObj)
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    loadData()
    loadRoles()
    // Check if user is super admin
    isSuperAdminClient().then(setIsAdmin)
  }, [pagination.page, pagination.limit, sortConfig])

  useEffect(() => {
    function handleClickOutside() { setActionMenu(null) }
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

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadData()
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const res = await fetch(`/api/organization/list`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("Deleted successfully")
        loadData()
      } else {
        toast.error(data.error || "Failed to delete")
      }
    } catch (err) {
      toast.error("Error deleting record")
    }
  }

  // Create User Functions
  const handleOpenCreateUser = (organization) => {
    setSelectedOrganization(organization)
    setUserFormData({ name: '', email: '', password: '' })
    
    // Reset selected roles
    const resetRoles = {}
    availableRoles.forEach(role => {
      resetRoles[role.id] = false
    })
    setSelectedRoles(resetRoles)
    
    setCreateUserModalOpen(true)
  }

  const handleCloseCreateUser = () => {
    setCreateUserModalOpen(false)
    setSelectedOrganization(null)
    setUserFormData({ name: '', email: '', password: '' })
  }

  const handleRoleChange = (roleId) => {
    setSelectedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }))
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    if (!userFormData.email || !userFormData.password) {
      toast.error("Email and password are required")
      return
    }

    // Get selected role IDs as comma-separated string
    const selectedRoleIds = Object.entries(selectedRoles)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)
      .join(',')

    setCreatingUser(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userFormData.name,
          email: userFormData.email,
          password: userFormData.password,
          organizationId: selectedOrganization.id,
          roles: selectedRoleIds
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("User created successfully")
        handleCloseCreateUser()
      } else {
        toast.error(data.error || "Failed to create user")
      }
    } catch (err) {
      toast.error("Error creating user")
      console.error(err)
    } finally {
      setCreatingUser(false)
    }
  }

  // View Users Functions
  const handleOpenViewUsers = async (organization) => {
    setSelectedOrganization(organization)
    setViewUsersModalOpen(true)
    setLoadingUsers(true)

    try {
      const res = await fetch(`/api/organization/${organization.id}/users`)
      const data = await res.json()
      if (data.success) {
        setOrganizationUsers(data.users)
      } else {
        toast.error("Failed to load users")
      }
    } catch (err) {
      toast.error("Error loading users")
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCloseViewUsers = () => {
    setViewUsersModalOpen(false)
    setSelectedOrganization(null)
    setOrganizationUsers([])
  }

  // Edit User Functions
  const handleOpenEditUser = (user) => {
    setSelectedUser(user)
    setEditUserFormData({
      name: user.name || '',
      email: user.email
    })

    // Parse roles and set checkboxes
    const roleIds = user.roles ? user.roles.split(',').map(id => parseInt(id)) : []
    const resetRoles = {}
    availableRoles.forEach(role => {
      resetRoles[role.id] = roleIds.includes(role.id)
    })
    setSelectedRoles(resetRoles)

    setEditUserModalOpen(true)
  }

  const handleCloseEditUser = () => {
    setEditUserModalOpen(false)
    setSelectedUser(null)
    setEditUserFormData({ name: '', email: '' })
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    if (!editUserFormData.email) {
      toast.error("Email is required")
      return
    }

    // Get selected role IDs as comma-separated string
    const selectedRoleIds = Object.entries(selectedRoles)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)
      .join(',')

    setEditingUser(true)

    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          name: editUserFormData.name,
          email: editUserFormData.email,
          roles: selectedRoleIds
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("User updated successfully")
        handleCloseEditUser()
      } else {
        toast.error(data.error || "Failed to update user")
      }
    } catch (err) {
      toast.error("Error updating user")
      console.error(err)
    } finally {
      setEditingUser(false)
    }
  }

  // Get role names from comma-separated IDs
  const getRoleNames = (rolesStr) => {
    if (!rolesStr) return 'No roles'
    const roleIds = rolesStr.split(',').map(id => parseInt(id))
    const roleNames = availableRoles
      .filter(role => roleIds.includes(role.id))
      .map(role => role.roleName)
      .join(', ')
    return roleNames || 'No roles'
  }

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              Organization List
            </h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Manage Business, Government, Corporation, CSO registrations
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/organization/create"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New
            </Link>
          )}
        </div>

        {/* Search + Filter */}
        <div className={`p-4 rounded-lg mb-6 border shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                  theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* ORG TYPE FILTER */}
            <select
              value={orgTypeFilter}
              onChange={(e) => setOrgTypeFilter(e.target.value)}
              className={`px-4 py-3 rounded-lg border ${
                theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
            >
              <option value="">All Types</option>
              <option value="business">Business</option>
              <option value="government">Government</option>
              <option value="corporation">Corporation</option>
              <option value="cso">CSO</option>
            </select>

            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center">
              <Search className="w-5 h-5 mr-2" /> Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className={`table-list-card-shell rounded-lg border shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin h-8 w-8 border-2 border-b-transparent rounded-full border-blue-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-64 flex justify-center items-center text-gray-500">No records found</div>
          ) : (
            <>
              <div className="table-list-scroll-x rounded-t-lg">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className={`${theme === "dark" ? "bg-gray-900 bg-opacity-40" : "bg-gray-100"} border-b`}>
                      {[
                        { key: "id", label: "Sl No.", width: "w-20" },
                        { key: "name", label: "Name", width: "w-64" },
                        { key: "code", label: "Code", width: "w-48" },
                        { key: "orgType", label: "Type", width: "w-32" },
                        { key: "status", label: "Status", width: "w-32" },
                        { key: "users", label: "Users", width: "w-32" },
                        { key: "createdAt", label: "Created", width: "w-40" },
                        { key: "actions", label: "", width: "w-24" },
                      ].map(({ key, label, width }) => (
                        <th
                          key={key}
                          className={`${width} px-6 py-4 text-left font-semibold ${
                            key !== "actions" && key !== "users" ? "cursor-pointer" : ""
                          }`}
                          onClick={() => key !== "actions" && key !== "users" && handleSort(key)}
                        >
                          <div className="flex items-center">
                            {label}
                            {key !== "actions" && key !== "users" && getSortIcon(key)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className={`hover:${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">#{item.id}</td>
                        <td className="px-6 py-4">{item.name}</td>
                        <td className="px-6 py-4">{item.code || "-"}</td>
                        <td className="px-6 py-4 capitalize">{item.orgType}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === "A" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          }`}>
                            {item.status === "A" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenViewUsers(item)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Users
                          </button>
                        </td>
                        <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              const menuWidth = 160
                              setActionMenu(prev =>
                                prev?.id === item.id
                                  ? null
                                  : { id: item.id, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                              )
                            }}
                            className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                            aria-label="Actions"
                            aria-expanded={actionMenu?.id === item.id}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`px-6 py-4 flex justify-between items-center border-t rounded-b-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <div>
                  Showing{" "}
                  <b>{(pagination.page - 1) * pagination.limit + 1}</b> –{" "}
                  <b>{Math.min(pagination.page * pagination.limit, pagination.total)}</b>{" "}
                  of <b>{pagination.total}</b>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="px-3 py-2 border rounded disabled:opacity-40"
                  >
                    ←
                  </button>

                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum
                    if (pagination.page <= 3) pageNum = i + 1
                    else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
                    else pageNum = pagination.page - 2 + i

                    return (
                      <button
                        key={i}
                        className={`px-4 py-2 rounded ${
                          pageNum === pagination.page ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="px-3 py-2 border rounded disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const row = items.find(i => i.id === actionMenu.id)
            if (!row) return null
            const dark = theme === "dark"
            return createPortal(
              <div
                className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
                style={{ top: actionMenu.top, left: actionMenu.left }}
                onClick={e => e.stopPropagation()}
                role="menu"
              >
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenu(null)
                      handleOpenCreateUser(row)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                    role="menuitem"
                  >
                    <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" /> Create User
                  </button>
                )}
                <Link
                  href={`/organization/view/${row.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> View
                </Link>

                {isAdmin && (
                <Link
                  href={`/organization/edit/${row.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Edit
                </Link>
                )}


                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenu(null)
                      handleDelete(row.id)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700 hover:text-red-400" : "text-gray-700 hover:bg-gray-100 hover:text-red-600"}`}
                    role="menuitem"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" /> Delete
                  </button>
                )}
                <Link
                  href={`/organization/user?orgId=${row.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" /> View Users
                </Link>
              </div>,
              document.body
            )
          })()}

        {/* Rows per page */}
        <div className="mt-4 flex justify-end items-center gap-3">
          <span>Rows per page:</span>
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))
            }
            className="px-3 py-2 border rounded"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Create User Modal with Role Checkboxes */}
      <Dialog open={createUserModalOpen} onClose={handleCloseCreateUser} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateUser}>
          <DialogTitle>
            Create User for {selectedOrganization?.name}
          </DialogTitle>
          <DialogContent>
            <div className="flex flex-col gap-4 mt-4">
              <TextField
                fullWidth
                label="Full Name"
                value={userFormData.name}
                onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={userFormData.email}
                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Password"
                type={isPasswordShown ? 'text' : 'password'}
                required
                value={userFormData.password}
                onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setIsPasswordShown(!isPasswordShown)}
                        edge="end"
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              {/* Role Checkboxes */}
              <Paper variant="outlined" className="p-3 mt-2">
                <FormLabel component="legend" className="mb-2 font-semibold">
                  Assign Roles
                </FormLabel>
                {loadingRoles ? (
                  <div className="flex justify-center py-4">
                    <CircularProgress size={24} />
                  </div>
                ) : availableRoles.length > 0 ? (
                  <FormGroup>
                    <div className="grid grid-cols-2 gap-2">
                      {availableRoles.map((role) => (
                        <FormControlLabel
                          key={role.id}
                          control={
                            <Checkbox
                              checked={selectedRoles[role.id] || false}
                              onChange={() => handleRoleChange(role.id)}
                              size="small"
                            />
                          }
                          label={
                            <div>
                              <span className="text-sm font-medium">{role.roleName}</span>
                              {role.roleDescription && (
                                <span className="text-xs text-gray-500 block">
                                  {role.roleDescription}
                                </span>
                              )}
                            </div>
                          }
                        />
                      ))}
                    </div>
                  </FormGroup>
                ) : (
                  <Typography color="textSecondary" className="py-2 text-center">
                    No roles available
                  </Typography>
                )}
              </Paper>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Organization:</strong> {selectedOrganization?.name} ({selectedOrganization?.orgType})
                </p>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateUser} disabled={creatingUser}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editUserModalOpen} onClose={handleCloseEditUser} maxWidth="sm" fullWidth>
        <form onSubmit={handleUpdateUser}>
          <DialogTitle>
            Edit User - {selectedUser?.email}
          </DialogTitle>
          <DialogContent>
            <div className="flex flex-col gap-4 mt-4">
              <TextField
                fullWidth
                label="Full Name"
                value={editUserFormData.name}
                onChange={(e) => setEditUserFormData(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={editUserFormData.email}
                onChange={(e) => setEditUserFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              
              {/* Role Checkboxes for Edit */}
              <Paper variant="outlined" className="p-3 mt-2">
                <FormLabel component="legend" className="mb-2 font-semibold">
                  Assign Roles
                </FormLabel>
                {loadingRoles ? (
                  <div className="flex justify-center py-4">
                    <CircularProgress size={24} />
                  </div>
                ) : availableRoles.length > 0 ? (
                  <FormGroup>
                    <div className="grid grid-cols-2 gap-2">
                      {availableRoles.map((role) => (
                        <FormControlLabel
                          key={role.id}
                          control={
                            <Checkbox
                              checked={selectedRoles[role.id] || false}
                              onChange={() => handleRoleChange(role.id)}
                              size="small"
                            />
                          }
                          label={
                            <div>
                              <span className="text-sm font-medium">{role.roleName}</span>
                              {role.roleDescription && (
                                <span className="text-xs text-gray-500 block">
                                  {role.roleDescription}
                                </span>
                              )}
                            </div>
                          }
                        />
                      ))}
                    </div>
                  </FormGroup>
                ) : (
                  <Typography color="textSecondary" className="py-2 text-center">
                    No roles available
                  </Typography>
                )}
              </Paper>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditUser} disabled={editingUser}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={editingUser}>
              {editingUser ? 'Updating...' : 'Update User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Users Modal */}
      <Dialog open={viewUsersModalOpen} onClose={handleCloseViewUsers} maxWidth="md" fullWidth>
        <DialogTitle>
          Users in {selectedOrganization?.name}
        </DialogTitle>
        <DialogContent>
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <CircularProgress />
            </div>
          ) : organizationUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found in this organization
            </div>
          ) : (
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Email</th>
                    <th className="py-2 text-left">Roles</th>
                    {isAdmin && (
                    <th className="py-2 text-left">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {organizationUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3">{user.name || '-'}</td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {getRoleNames(user.roles).split(', ').map((role, idx) => (
                            role !== 'No roles' && (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {role}
                              </span>
                            )
                          ))}
                          {getRoleNames(user.roles) === 'No roles' && (
                            <span className="text-gray-400">No roles</span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                      <td className="py-3">
                        <button
                          onClick={() => {
                            handleCloseViewUsers()
                            handleOpenEditUser(user)
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewUsers}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}