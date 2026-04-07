"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function List() {
  const [slabs, setSlabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({
    key: "slabId",
    direction: "asc"
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [actionMenu, setActionMenu] = useState(null) // { id: slabId, top, left }

  const getTheme = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('materio-mui-template-mode') || 'light'
    }
    return 'light'
  }

  const [theme, setTheme] = useState('light')
  useEffect(() => {
    setTheme(getTheme())
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
        search: search
      })

      const res = await fetch(`/api/gst-rate-slabs-api/list?${params}`)
      const data = await res.json()

      setSlabs(data.slabs || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }))
    } catch (error) {
      console.error("Error loading data:", error)
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

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadData()
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this GST slab?")) {
      try {
        const res = await fetch(`/api/gst-rate-slabs-api/list`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slabId: id })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          loadData();
          toast.success(data.message);
        } else {
          toast.error(data.error || "Failed to delete slab");
        }
      } catch (error) {
        console.error("Error deleting slab:", error);
        toast.error("Error deleting slab");
      }
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "asc" ?
      <ChevronUp className="w-4 h-4" /> :
      <ChevronDown className="w-4 h-4" />
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              GST Slabs List
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your GST slab rates
            </p>
          </div>

          <Link
            href="/gst-rate-slabs/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Slab
          </Link>
        </div>

        {/* Search */}
        <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search by slab name, remarks or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'} outline-none transition-colors`}
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`table-list-card-shell rounded-lg shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : slabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-8">
              <div className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No GST slabs found
              </div>
              {search && (
                <button onClick={() => setSearch("")} className="text-blue-600 hover:text-blue-800 font-medium">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-list-scroll-x rounded-t-lg">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                      {[
                        { key: "slabId", label: "Sl No.", width: "w-24" },
                        { key: "slabName", label: "Slab Name", width: "w-64" },
                        { key: "startRange", label: "Start Range", width: "w-32" },
                        { key: "endRange", label: "End Range", width: "w-32" },
                        { key: "effectiveDate", label: "Effective Date", width: "w-40" },
                        { key: "remarks", label: "Remarks", width: "w-64" },
                        { key: "status", label: "Status", width: "w-32" },
                        { key: "createdAt", label: "Created", width: "w-40" },
                        { key: "actions", label: "", width: "w-24" }
                      ].map(({ key, label, width }) => (
                        <th
                          key={key}
                          className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} ${width} ${key !== 'actions' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                          onClick={() => key !== "actions" && handleSort(key)}
                        >
                          <div className="flex items-center">
                            {label}
                            {key !== "actions" && getSortIcon(key)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {slabs.map((slab) => (
                      <tr key={slab.slabId} className={`hover:${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">#{slab.slabId}</td>
                        <td className="px-6 py-4">{slab.slabName}</td>
                        <td className="px-6 py-4">{slab.startRange}</td>
                        <td className="px-6 py-4">{slab.endRange}</td>
                        <td className="px-6 py-4">{new Date(slab.effectiveDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{slab.remarks}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full
                            ${slab.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {slab.status === 'A' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">{new Date(slab.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              const menuWidth = 160
                              setActionMenu(prev =>
                                prev?.id === slab.slabId
                                  ? null
                                  : { id: slab.slabId, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                              )
                            }}
                            className={`p-2 rounded-lg transition-colors ${theme === "dark"
                              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              }`}
                            aria-label="Actions"
                            aria-expanded={actionMenu?.id === slab.slabId}
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
              <div className={`px-6 py-4 border-t rounded-b-lg ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className={`text-sm mb-4 md:mb-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                    <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> slabs
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className={`p-2 rounded-lg ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-40' : 'border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40'} border disabled:cursor-not-allowed`}>←</button>
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        let pageNum
                        if (pagination.totalPages <= 5) pageNum = i + 1
                        else if (pagination.page <= 3) pageNum = i + 1
                        else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i
                        else pageNum = pagination.page - 2 + i
                        return (
                          <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-10 h-10 rounded-lg font-medium ${pagination.page === pageNum ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}`}>{pageNum}</button>
                        )
                      })}
                    </div>
                    <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className={`p-2 rounded-lg ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-40' : 'border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40'} border disabled:cursor-not-allowed`}>→</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const row = slabs.find(s => s.slabId === actionMenu.id)
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
                  href={`/gst-rate-slabs/view/${row.slabId}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  View
                </Link>
                <Link
                  href={`/gst-rate-slabs/edit/${row.slabId}`}
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
                    handleDelete(row.slabId)
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
        <div className="mt-4 flex items-center justify-end">
          <span className={`text-sm mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Rows per page:</span>
          <select value={pagination.limit} onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))} className={`px-3 py-2 rounded-lg border text-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
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
