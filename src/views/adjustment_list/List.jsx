"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Eye, FileText, Calendar, User, Receipt, MoreVertical } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdjustmentList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [sortConfig, setSortConfig] = useState({
    key: "adjustment_id",
    direction: "desc"
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [actionMenu, setActionMenu] = useState(null) // { id: adjustment_id, top, left }

  const [filters, setFilters] = useState({
    status: "",
    customer_id: "",
    start_date: "",
    end_date: ""
  })

  /* ===================== LOAD DATA ===================== */
  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
        search,
        ...filters
      })

      Object.keys(filters).forEach(k => {
        if (!filters[k]) params.delete(k)
      })

      const res = await fetch(`/api/adjustment/list?${params}`)
      const json = await res.json()

      if (!json.success) throw new Error(json.error)

      setData(json.data || [])
      setPagination(p => ({
        ...p,
        total: json.pagination.total,
        totalPages: json.pagination.totalPages
      }))
    } catch (err) {
      toast.error(err.message || "Failed to load adjustments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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

  /* ===================== SORT ===================== */
  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const sortIcon = key =>
    sortConfig.key === key
      ? sortConfig.direction === "asc"
        ? <ChevronUp className="w-4 h-4 ml-1" />
        : <ChevronDown className="w-4 h-4 ml-1" />
      : null

  /* ===================== HELPERS ===================== */
  const formatCurrency = val =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(val || 0)

  const statusBadge = status => {
    if (status === "A") return "bg-green-100 text-green-700"
    if (status === "IP") return "bg-yellow-100 text-yellow-700"
    return "bg-gray-200 text-gray-700"
  }

  /* ===================== DELETE ===================== */
  const handleDelete = async id => {
    if (!confirm("Delete this adjustment note?")) return
    const res = await fetch(`/api/adjustment/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment_id: id })
    })
    const json = await res.json()
    if (json.success) {
      toast.success("Deleted")
      loadData()
    } else {
      toast.error(json.error)
    }
  }



  const getCustomerName = (customer) => {
    if (!customer) return "N/A"

    if (customer.businessParty)
      return customer.businessParty.businessName

    if (customer.corporationParty)
      return customer.corporationParty.companyName

    if (customer.individualParty)
      return `${customer.individualParty.name} `

    if (customer.governmentAgencyParty)
      return customer.governmentAgencyParty.agencyName

    if (customer.csoParty)
      return customer.csoParty.organizationName

    return "N/A"
  }

  const getCustomerTPN = (customer) => {
    if (!customer) return ""

    return (
      customer.businessParty?.taxPayerRegNo ||
      customer.corporationParty?.taxPayerRegNo ||
      customer.individualParty?.taxPayerRegNo ||
      customer.governmentAgencyParty?.taxPayerRegNo ||
      customer.csoParty?.taxPayerRegNo ||
      ""
    )
  }


  /* ===================== RENDER ===================== */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Adjustment Notes</h1>
          <Link href="/adjustment" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create
          </Link>
        </div>

        {/* SEARCH */}
        <form
          onSubmit={e => {
            e.preventDefault()
            setPagination(p => ({ ...p, page: 1 }))
            loadData()
          }}
          className="flex gap-3 mb-4"
        >
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search note, invoice, customer"
            className="border px-3 py-2 rounded w-full"
          />
          <button className="bg-blue-600 text-white px-5 rounded flex items-center">
            <Search className="w-4 h-4 mr-1" /> Search
          </button>
        </form>

        {/* TABLE */}
        <div className="table-list-card-shell bg-white rounded border">
          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : data.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No adjustments found</div>
          ) : (
            <div className="table-list-scroll-x rounded-t-lg">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    ["adjustment_id", "Sl No."],
                    ["date", "Date"],
                    ["invoice_no", "Invoice"],
                    ["customer_name", "Customer"],
                    ["total_adjustment_amount", "Adjustment Amount"],
                  
                    ["actions", ""]
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => key !== "actions" && handleSort(key)}
                      className="p-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center">
                        {label}
                        {sortIcon(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map(row => (
                  <tr key={row.adjustment_id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">#{row.adjustment_id}</td>

                    <td className="p-3">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      {row.date}
                    </td>

                    <td className="p-3">
                      <Receipt className="inline w-4 h-4 mr-1" />
                      {row.invoice_sales_invoice_no || row.invoice_no}
                    </td>

                    <td className="p-3">
                      <div className="font-medium">
                        {getCustomerName(row.customer)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCustomerTPN(row.customer)}
                      </div>

                      </td>

                      <td className="p-3 font-semibold">
                        {formatCurrency(row.total_adjustment_amount)}
                        <div className="text-xs text-gray-500">
                          Net: {formatCurrency(row.summary?.netAdjustment)}
                        </div>
                      </td>

                     
                      <td className="p-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            const menuWidth = 160
                            setActionMenu(prev =>
                              prev?.id === row.adjustment_id
                                ? null
                                : { id: row.adjustment_id, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                            )
                          }}
                          className="p-2 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          aria-label="Actions"
                          aria-expanded={actionMenu?.id === row.adjustment_id}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {/* PAGINATION */}
          <div className="p-4 flex justify-between items-center border-t rounded-b-lg">
            <div className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </div>

            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 border rounded"
              >
                Prev
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 border rounded"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const row = data.find(r => r.adjustment_id === actionMenu.id)
            if (!row) return null
            return createPortal(
              <div
                className="table-row-actions-dropdown"
                style={{ top: actionMenu.top, left: actionMenu.left }}
                onClick={e => e.stopPropagation()}
                role="menu"
              >
                <Link
                  href={`/adjustment/view/${row.adjustment_id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 shrink-0" /> View
                </Link>
                <Link
                  href={`/api/adjustment/copy_pdf/${row.adjustment_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Receipt className="w-4 h-4 text-blue-600 shrink-0" /> Copy PDF
                </Link>
                {row.status === "IP" && (
                  <Link
                    href={`/adjustment_list/edit/${row.adjustment_id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setActionMenu(null)}
                    role="menuitem"
                  >
                    <Edit className="w-4 h-4 text-blue-600 shrink-0" /> Edit
                  </Link>
                )}
              </div>,
              document.body
            )
          })()}

      </div>
    </div>
  )
}
