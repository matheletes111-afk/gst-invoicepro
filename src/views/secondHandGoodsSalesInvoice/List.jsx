"use client"
import { useEffect, useState } from "react"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Download, Eye } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SecondHandGoodsSalesInvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "invoiceId", direction: "desc" })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

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

      const res = await fetch(`/api/second-hand-goods-sales-invoice/list?${params}`)
      const data = await res.json()
      setInvoices(data.data || [])
      setPagination(prev => ({ ...prev, total: data.total || 0, totalPages: data.totalPages || 0 }))
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [pagination.page, pagination.limit, sortConfig])

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.totalPages) setPagination(prev => ({ ...prev, page: newPage })) }
  const handleSearch = (e) => { e.preventDefault(); loadData() }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this Invoice?")) {
      try {
        const res = await fetch(`/api/second-hand-goods-sales-invoice/list`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId: id })
        })
        const data = await res.json()
        if (res.ok && data.success) { loadData(); toast.success(data.message) }
        else { toast.error(data.error || "Failed to delete invoice") }
      } catch (error) { toast.error("Error deleting invoice") }
    }
  }

  const handleDownloadPDF = (invoiceId) => {
    window.open(`/api/second-hand-goods-sales-invoice/${invoiceId}/download`, '_blank')
  }

  const getSortIcon = (key) => sortConfig.key !== key ? null : sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Second Hand Goods Sales Invoice</h1>
            <p className="mt-2 text-gray-600">Manage Invoices</p>
          </div>
          <Link href="/second-hand-goods-sales-invoice/create" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center">
            <Plus className="w-5 h-5 mr-2" /> Create Invoice
          </Link>
        </div>

        {/* Search */}
        <div className="p-4 bg-white rounded-lg shadow-sm border mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number, customer name, or TPN..."
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
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-100 border-b">
                  {[
                    { key: "invoiceId", label: "ID" },
                    { key: "invoiceNo", label: "Invoice No" },
                    { key: "invoiceDate", label: "Date" },
                    { key: "customerName", label: "Customer" },
                    { key: "customerTPN", label: "Customer TPN" },
                    { key: "totalInvoiceValue", label: "Total Amount" },
                    { key: "isOriginal", label: "Type" },
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
                {invoices.map(item => (
                  <tr key={item.invoiceId} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">#{item.invoiceId}</td>
                    <td className="px-6 py-4 font-semibold">{item.invoiceNo}</td>
                    <td className="px-6 py-4">{formatDate(item.invoiceDate)}</td>
                    <td className="px-6 py-4">{item.customerName || '-'}</td>
                    <td className="px-6 py-4">{item.customerTPN || '-'}</td>
                    <td className="px-6 py-4 font-semibold">{item.currency?.currencySymbol || ''}{item.totalInvoiceValue?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold
                        ${item.isOriginal ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {item.isOriginal ? "Original" : "Duplicate"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold
                        ${item.status === "A" ? "bg-green-100 text-green-700" : item.status === "I" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                        {item.status === "A" ? "Active" : item.status === "I" ? "Inactive" : "Deleted"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link href={`/second-hand-goods-sales-invoice/view/${item.invoiceId}`} className="text-blue-600" title="View"><Eye className="w-5 h-5" /></Link>
                        <button onClick={() => handleDownloadPDF(item.invoiceId)} className="text-green-600" title="Download PDF"><Download className="w-5 h-5" /></button>
                        <Link href={`/second-hand-goods-sales-invoice/edit/${item.invoiceId}`} className="text-blue-600" title="Edit"><Edit className="w-5 h-5" /></Link>
                        <button onClick={() => handleDelete(item.invoiceId)} className="text-red-600" title="Delete"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <p>Showing {invoices.length} of {pagination.total}</p>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-2 border rounded">←</button>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-2 border rounded">→</button>
            </div>
          </div>
        </div>

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

