"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "supplierId", direction: "asc" })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [actionMenu, setActionMenu] = useState(null) // { id: supplierId, top, left }

  const getTheme = () => (typeof window !== 'undefined' ? localStorage.getItem('materio-mui-template-mode') || 'light' : 'light')
  const [theme, setTheme] = useState('light')
  useEffect(() => { setTheme(getTheme()) }, [])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
        search
      })

      const res = await fetch(`/api/supplier/list?${params}`)
      const data = await res.json()
      setSuppliers(data.data || [])
      setPagination(prev => ({ ...prev, total: data.total || 0, totalPages: data.totalPages || 0 }))
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [pagination.page, pagination.limit, sortConfig])

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

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.totalPages) setPagination(prev => ({ ...prev, page: newPage })) }
  const handleSearch = (e) => { e.preventDefault(); loadData() }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this Supplier?")) {
      try {
        const res = await fetch(`/api/supplier/list`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supplierId: id })
        })
        const data = await res.json()
        if (res.ok && data.success) { loadData(); toast.success(data.message) }
        else { toast.error(data.error || "Failed to delete supplier") }
      } catch (error) { toast.error("Error deleting supplier") }
    }
  }

  const getSortIcon = (key) => sortConfig.key !== key ? null : sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Supplier Master List</h1>
            <p className="mt-2 text-gray-600">Manage Suppliers</p>
          </div>
          <Link href="/supplier/create" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center">
            <Plus className="w-5 h-5 mr-2" /> Add Supplier
          </Link>
        </div>

        {/* Search */}
        <div className="p-4 bg-white rounded-lg shadow-sm border mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by supplier name, license, tax number, contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-lg"
              />
            </div>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Search className="w-5 h-5 mr-2 inline-block" /> Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="table-list-card-shell bg-white shadow-sm rounded-lg border">
          <div className="table-list-scroll-x rounded-t-lg">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-100 border-b">
                  {[
                    { key: "supplierId", label: "Sl No." },
                    { key: "supplierName", label: "Supplier Name" },
                    { key: "businessLicenseNo", label: "License No" },
                    { key: "taxpayerRegStatus", label: "Tax Reg Status" },
                    { key: "taxpayerRegNo", label: "Tax Reg No" },
                    { key: "contactName", label: "Contact" },
                    { key: "contactPhone", label: "Phone" },
                    { key: "status", label: "Status" },
                    { key: "actions", label: "" }
                  ].map(({ key, label }) => (
                    <th key={key} onClick={() => key !== "actions" && handleSort(key)} className="px-6 py-4 text-left font-semibold cursor-pointer">
                      <div className="flex items-center">{label}{key !== "actions" && getSortIcon(key)}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {suppliers.map(item => (
                  <tr key={item.supplierId} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">#{item.supplierId}</td>
                    <td className="px-6 py-4">{item.supplierName}</td>
                    <td className="px-6 py-4">{item.businessLicenseNo || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold
                        ${item.taxpayerRegStatus === "YES" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {item.taxpayerRegStatus === "YES" ? "Registered" : "Not Registered"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.taxpayerRegNo || '-'}</td>
                    <td className="px-6 py-4">{item.contactName || '-'}</td>
                    <td className="px-6 py-4">{item.contactPhone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold
                        ${item.status === "A" ? "bg-green-100 text-green-700" : item.status === "I" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                        {item.status === "A" ? "Active" : item.status === "I" ? "Inactive" : "Deleted"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          const menuWidth = 160
                          setActionMenu(prev =>
                            prev?.id === item.supplierId
                              ? null
                              : { id: item.supplierId, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                          )
                        }}
                        className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                        aria-label="Actions"
                        aria-expanded={actionMenu?.id === item.supplierId}
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
          <div className="px-6 py-4 border-t rounded-b-lg bg-gray-50 flex justify-between items-center">
            <p>Showing {suppliers.length} of {pagination.total}</p>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-2 border rounded">←</button>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-2 border rounded">→</button>
            </div>
          </div>
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const row = suppliers.find(s => s.supplierId === actionMenu.id)
            if (!row) return null
            const dark = theme === "dark"
            return createPortal(
              <div
                className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
                style={{ top: actionMenu.top, left: actionMenu.left }}
                onClick={e => e.stopPropagation()}
                role="menu"
              >
                <Link
                  href={`/supplier/view/${row.supplierId}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> View
                </Link>
                <Link
                  href={`/supplier/edit/${row.supplierId}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActionMenu(null)
                    handleDelete(row.supplierId)
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700 hover:text-red-400" : "text-gray-700 hover:bg-gray-100 hover:text-red-600"}`}
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" /> Delete
                </button>
              </div>,
              document.body
            )
          })()}

        {/* Rows per page */}
        <div className="mt-4 flex justify-end items-center">
          <span className="mr-3">Rows per page:</span>
          <select value={pagination.limit} onChange={e => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))} className="px-3 py-2 border rounded">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  )
}

