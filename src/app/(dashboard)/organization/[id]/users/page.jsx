// src/app/(dashboard)/organization/[id]/users/page.jsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Edit, Search, Shield, User } from "lucide-react"

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  InputAdornment,
  Chip,
  Avatar,
  Divider
} from "@mui/material"

export default function OrganizationUsersPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.id

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [search, setSearch] = useState("")
  const [organization, setOrganization] = useState(null)

  // Edit User Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: ''
  })
  const [editingUser, setEditingUser] = useState(false)

  // Roles State
  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRoles, setSelectedRoles] = useState({})
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Theme
  const getTheme = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("materio-mui-template-mode") || "light"
    }
    return "light"
  }
  const [theme, setTheme] = useState("light")
  useEffect(() => { setTheme(getTheme()) }, [])

  // Load organization details and users
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load organization details
        const orgRes = await fetch(`/api/organization/${organizationId}`)
        const orgData = await orgRes.json()
        if (orgData.success) {
          setOrganization(orgData.organization)
        }

        // Load users
        await loadUsers()
        
        // Load available roles
        await loadRoles()
      } catch (err) {
        console.error(err)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      loadData()
    }
  }, [organizationId])

  // Load users
  const loadUsers = async () => {
    try {
      const res = await fetch(`/api/organization/${organizationId}/users`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        setFilteredUsers(data.users)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load users")
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
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
    } finally {
      setLoadingRoles(false)
    }
  }

  // Search filter
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [search, users])

  // Get role names from comma-separated IDs
  const getRoleNames = (rolesStr) => {
    if (!rolesStr) return []
    const roleIds = rolesStr.split(',').map(id => parseInt(id))
    return availableRoles
      .filter(role => roleIds.includes(role.id))
      .map(role => role.roleName)
  }

  // Handle edit user
  const handleEditClick = (user) => {
    setSelectedUser(user)
    setEditFormData({
      name: user.name || '',
      email: user.email
    })

    // Parse roles and set checkboxes
    const roleIds = user.roles ? user.roles.split(',').map(id => parseInt(id)) : []
    const rolesObj = {}
    availableRoles.forEach(role => {
      rolesObj[role.id] = roleIds.includes(role.id)
    })
    setSelectedRoles(rolesObj)

    setEditModalOpen(true)
  }

  const handleCloseEdit = () => {
    setEditModalOpen(false)
    setSelectedUser(null)
    setEditFormData({ name: '', email: '' })
  }

  const handleRoleChange = (roleId) => {
    setSelectedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }))
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    if (!editFormData.email) {
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
          name: editFormData.name,
          email: editFormData.email,
          roles: selectedRoleIds
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("User updated successfully")
        handleCloseEdit()
        await loadUsers() // Refresh the list
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark" 
                ? "hover:bg-gray-800 text-gray-300" 
                : "hover:bg-gray-200 text-gray-600"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              User Management
            </h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {organization?.name} - {organization?.orgType}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`p-4 rounded-lg mb-6 border shadow-sm ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                theme === "dark" 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className={`text-center py-16 rounded-lg border ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className={`text-lg font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              No users found
            </h3>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {search ? "Try a different search term" : "This organization has no users yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id} 
                className={`${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
                elevation={1}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className={`${theme === "dark" ? "bg-blue-900" : "bg-blue-100"}`}
                      >
                        <User className={`w-5 h-5 ${
                          theme === "dark" ? "text-blue-300" : "text-blue-600"
                        }`} />
                      </Avatar>
                      <div>
                        <h3 className={`font-semibold ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {user.name || 'No name'}
                        </h3>
                        <p className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <IconButton 
                      size="small"
                      onClick={() => handleEditClick(user)}
                      className={theme === "dark" ? "text-gray-400" : "text-gray-600"}
                    >
                      <Edit className="w-4 h-4" />
                    </IconButton>
                  </div>

                  <Divider className="my-4" />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`w-4 h-4 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`} />
                      <span className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Roles
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getRoleNames(user.roles).length > 0 ? (
                        getRoleNames(user.roles).map((role, idx) => (
                          <Chip
                            key={idx}
                            label={role}
                            size="small"
                            className={theme === "dark" 
                              ? "bg-blue-900 text-blue-300" 
                              : "bg-blue-100 text-blue-700"
                            }
                          />
                        ))
                      ) : (
                        <span className={`text-sm ${
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`}>
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-right">
                    <span className={theme === "dark" ? "text-gray-500" : "text-gray-400"}>
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit User Modal */}
        <Dialog 
          open={editModalOpen} 
          onClose={handleCloseEdit} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            className: theme === "dark" ? "bg-gray-800" : "bg-white"
          }}
        >
          <form onSubmit={handleUpdateUser}>
            <DialogTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
              Edit User
            </DialogTitle>
            <DialogContent>
              <div className="flex flex-col gap-4 mt-4">
                <TextField
                  fullWidth
                  label="Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{
                    className: theme === "dark" ? "text-gray-400" : ""
                  }}
                  InputProps={{
                    className: theme === "dark" ? "text-white" : ""
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{
                    className: theme === "dark" ? "text-gray-400" : ""
                  }}
                  InputProps={{
                    className: theme === "dark" ? "text-white" : ""
                  }}
                />
                
                {/* Role Checkboxes */}
                <Paper 
                  variant="outlined" 
                  className={`p-4 mt-2 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50"
                  }`}
                >
                  <FormLabel 
                    component="legend" 
                    className={`mb-3 font-semibold ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                                sx={{
                                  color: theme === "dark" ? "#9ca3af" : undefined,
                                  '&.Mui-checked': {
                                    color: theme === "dark" ? "#60a5fa" : undefined,
                                  }
                                }}
                              />
                            }
                            label={
                              <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                                {role.roleName}
                              </span>
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
            <DialogActions className="p-4">
              <Button 
                onClick={handleCloseEdit} 
                disabled={editingUser}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={editingUser}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingUser ? 'Updating...' : 'Update User'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </div>
    </div>
  )
}