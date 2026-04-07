"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function List() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "asc"
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [actionMenu, setActionMenu] = useState(null) // { id, top, left }

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

      const res = await fetch(`/api/unit/list?${params}`)
      const data = await res.json()

      setUnits(data.units || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }))
    } catch (error) {
      console.error("Error loading units:", error)
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

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const handleSearch = e => {
    e.preventDefault()
    loadData()
  }

  const handleDelete = async id => {
    if (!confirm("Are you sure you want to delete this Unit?")) return

    try {
      const res = await fetch(`/api/unit/list`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        loadData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error(error)
      toast.error("Error deleting unit")
    }
  }

  const getSortIcon = key => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              Units List
            </h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-2`}>
              Manage your Unit master data
            </p>
          </div>

          <Link
            href="/unit/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Unit
          </Link>
        </div>

        {/* Search */}
        <div
          className={`p-4 rounded-lg mb-6 shadow-sm border ${theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
            }`}
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
              />
              <input
                type="text"
                placeholder="Search unit by name or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border outline-none ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
              />
            </div>

            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center">
              <Search className="w-5 h-5 mr-2" /> Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div
          className={`table-list-card-shell rounded-lg shadow-sm border ${theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
            }`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
            </div>
          ) : units.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-lg`}>
                No units found
              </p>
            </div>
          ) : (
            <>
              <div className="table-list-scroll-x rounded-t-lg">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr
                    className={`border-b ${theme === "dark"
                        ? "border-gray-700 bg-gray-900/50"
                        : "border-gray-200 bg-gray-50"
                      }`}
                  >
                    {[
                      { key: "id", label: "Sl No." },
                      { key: "name", label: "Unit Name" },
                      { key: "description", label: "Description" },
                      { key: "status", label: "Status" },
                      { key: "createdAt", label: "Created" },
                      { key: "actions", label: "" }
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => key !== "actions" && handleSort(key)}
                        className={`px-6 py-4 text-left text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                          } ${key !== "actions" ? "cursor-pointer" : ""}`}
                      >
                        <div className="flex items-center">
                          {label}
                          {key !== "actions" && getSortIcon(key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {units.map(unit => (
                    <tr
                      key={unit.id}
                      className={`hover:${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                        } transition-colors`}
                    >
                      <td className="px-6 py-4">#{unit.id}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={unit.name}>
                        {unit.name}
                      </td>

                      <td className="px-6 py-4 max-w-sm truncate" title={unit.description}>
                        {unit.description}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-full
                               ${unit.status === 'A'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                            }
                                 `}
                        >
                          {unit.status === 'A' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(unit.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            const menuWidth = 160
                            setActionMenu(prev =>
                              prev?.id === unit.id
                                ? null
                                : { id: unit.id, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                            )
                          }}
                          className={`p-2 rounded-lg transition-colors ${theme === "dark"
                            ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            }`}
                          aria-label="Actions"
                          aria-expanded={actionMenu?.id === unit.id}
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
              <div
                className={`px-6 py-4 border-t rounded-b-lg flex justify-between items-center ${theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
              >
                  <p
                    className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    Showing {pagination.page} of {pagination.totalPages}
                  </p>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 border rounded"
                    >
                      ←
                    </button>

                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2 border rounded"
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
            const unitRow = units.find(u => u.id === actionMenu.id)
            if (!unitRow) return null
            const dark = theme === "dark"
            return createPortal(
              <div
                className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
                style={{ top: actionMenu.top, left: actionMenu.left }}
                onClick={e => e.stopPropagation()}
                role="menu"
              >
                <Link
                  href={`/unit/view/${unitRow.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  View
                </Link>
                <Link
                  href={`/unit/edit/${unitRow.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActionMenu(null)
                    handleDelete(unitRow.id)
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

        {/* Rows per page */}
        <div className="mt-4 flex justify-end">
          <select
            value={pagination.limit}
            onChange={e =>
              setPagination(prev => ({ ...prev, limit: +e.target.value, page: 1 }))
            }
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
