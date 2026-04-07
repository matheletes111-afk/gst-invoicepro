// src/views/role/List.jsx
"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, MoreVertical, Shield } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function RoleList() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({
    key: "roleName",
    direction: "asc"
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [actionMenu, setActionMenu] = useState(null) // { id: roleId, top, left } | null

  /* THEME */
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

  /* LOAD DATA */
  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
        search
      })

      const res = await fetch(`/api/role/list?${params}`)
      const data = await res.json()

      setRoles(data.data || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }))
    } catch (err) {
      console.error(err)
      toast.error("Failed to load roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.page, pagination.limit, sortConfig])

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

  /* SORT */
  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const getSortIcon = key => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "asc"
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />
  }

  /* SEARCH */
  const handleSearch = e => {
    e.preventDefault()
    setPagination(p => ({ ...p, page: 1 }))
    loadData()
  }

  /* DELETE */
  const handleDelete = async id => {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      const res = await fetch(`/api/role/list`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: id })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        loadData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Error deleting role")
    }
  }

  /* STATUS */
  const statusUI = status => {
    if (status === "A") return "bg-green-100 text-green-700"
    if (status === "I") return "bg-orange-100 text-orange-700"
    return "bg-gray-200 text-gray-700"
  }

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              Role Management
            </h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-2`}>
              Manage roles and their permissions
            </p>
          </div>

          <Link
            href="/role/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Role
          </Link>
        </div>

        {/* SEARCH */}
        <div className={`p-4 rounded-lg mb-6 shadow-sm border ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search role..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border outline-none"
              />
            </div>

            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center">
              <Search className="w-5 h-5 mr-2" /> Search
            </button>
          </form>
        </div>

        {/* TABLE */}
        <div className={`table-list-card-shell rounded-lg shadow-sm border ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No roles found
            </div>
          ) : (
            <>
              <div className="table-list-scroll-x rounded-t-lg">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className={`border-b ${
                      theme === "dark" ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50"
                    }`}>
                      {[
                        { key: "id", label: "ID" },
                        { key: "roleName", label: "Role Name" },
                        { key: "roleDescription", label: "Description" },
                        { key: "status", label: "Status" },
                        { key: "permissions", label: "Permissions" },
                        { key: "actions", label: "" }
                      ].map(col => (
                        <th
                          key={col.key}
                          onClick={() => col.key !== "actions" && col.key !== "permissions" && handleSort(col.key)}
                          className={`px-6 py-4 text-left font-semibold ${
                            col.key !== "actions" && col.key !== "permissions" && "cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center">
                            {col.label}
                            {getSortIcon(col.key)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {roles.map(role => (
                      <tr key={role.id} className={`hover:${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                      } transition-colors`}>
                        <td className="px-6 py-4">#{role.id}</td>
                        <td className="px-6 py-4 font-medium">{role.roleName}</td>
                        <td className="px-6 py-4">{role.roleDescription || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusUI(role.status)}`}>
                            {role.status === "A" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/role/permissions/${role.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Configure ({role._count?.permissions || 0})</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              const menuWidth = 160
                              setActionMenu(prev =>
                                prev?.id === role.id
                                  ? null
                                  : {
                                      id: role.id,
                                      top: rect.bottom + 4,
                                      left: Math.max(8, rect.right - menuWidth),
                                    }
                              )
                            }}
                            className={`p-2 rounded-lg transition-colors ${theme === "dark"
                              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            }`}
                            aria-label="Actions"
                            aria-expanded={actionMenu?.id === role.id}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className={`px-6 py-4 border-t flex justify-between items-center rounded-b-lg ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}>
                <p className="text-sm">
                  Showing {pagination.page} of {pagination.totalPages} pages | Total {pagination.total} roles
                </p>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 border rounded disabled:opacity-50"
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
            const role = roles.find(r => r.id === actionMenu.id)
            if (!role) return null
            const dark = theme === "dark"
            return createPortal(
              <div
                className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
                style={{ top: actionMenu.top, left: actionMenu.left }}
                onClick={e => e.stopPropagation()}
                role="menu"
              >
                <Link
                  href={`/role/edit/${role.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  Edit
                </Link>
                <Link
                  href={`/role/permissions/${role.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  Permissions
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActionMenu(null)
                    handleDelete(role.id)
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700 hover:text-red-400" : "text-gray-700 hover:bg-gray-100 hover:text-red-600"}`}
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  Delete
                </button>
              </div>,
              document.body
            )
          })()}

        {/* ROWS PER PAGE */}
        <div className="mt-4 flex justify-end">
          <select
            value={pagination.limit}
            onChange={e => setPagination(p => ({ ...p, limit: +e.target.value, page: 1 }))}
            className="px-3 py-2 border rounded"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
  )
}