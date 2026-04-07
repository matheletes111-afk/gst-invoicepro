"use client"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Eye, MoreVertical, Upload, Download, X, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import * as XLSX from "xlsx"

export default function ServiceCatalogList() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "service_id", direction: "asc" })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [actionMenu, setActionMenu] = useState(null) // { id: service_id, top, left }

  // Excel Upload States
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

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

      const res = await fetch(`/api/service-catalog/list?${params}`)
      const data = await res.json()
      setServices(data.data || [])
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
    if (confirm("Are you sure you want to delete this Service?")) {
      try {
        const res = await fetch(`/api/service-catalog/list`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service_id: id })
        })
        const data = await res.json()
        if (res.ok && data.success) { loadData(); toast.success(data.message) }
        else { toast.error(data.error || "Failed to delete service") }
      } catch (error) { toast.error("Error deleting service") }
    }
  }

  const getSortIcon = (key) => sortConfig.key !== key ? null : sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />

  // Excel Upload Functions
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      // Convert to structured data
      const headers = jsonData[0]
      const rows = jsonData.slice(1)
      
      const structuredData = rows.map((row, index) => {
        const item = {}
        headers.forEach((header, colIndex) => {
          if (header && row[colIndex] !== undefined) {
            item[header.trim()] = row[colIndex]
          }
        })
        return {
          ...item,
          rowNumber: index + 2
        }
      }).filter(item => Object.keys(item).length > 0)

      setUploadData(structuredData)
      await validateUploadData(structuredData)
    }
    reader.readAsArrayBuffer(file)
  }

  const validateUploadData = async (data) => {
    const errors = []
    
    // Get existing service codes for duplicate checking
    const existingServicesResponse = await fetch('/api/service-catalog/existing-codes')
    const existingServices = await existingServicesResponse.json()
    const existingCodes = existingServices.data || []

    for (let index = 0; index < data.length; index++) {
      const item = data[index]
      const rowErrors = []

      // Required field validation
      if (!item.service_name || item.service_name.trim() === '') {
        rowErrors.push("Service Name is required")
      }
      
      if (!item.service_code || item.service_code.trim() === '') {
        rowErrors.push("Service Code is required")
      } else {
        // Check for duplicate in upload data
        const duplicateInUpload = data.slice(0, index).some(
          otherItem => otherItem.service_code === item.service_code
        )
        if (duplicateInUpload) {
          rowErrors.push("Service Code is duplicate within this file")
        }
        
        // Check for duplicate in existing database (status A or I)
        const duplicateInDb = existingCodes.some(
          existing => existing.service_code === item.service_code && ['A', 'I'].includes(existing.status)
        )
        if (duplicateInDb) {
          rowErrors.push("Service Code already exists in database (Active/Inactive)")
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: item.rowNumber,
          item,
          errors: rowErrors
        })
      }
    }

    setValidationErrors(errors)
  }

  const handleUploadSubmit = async () => {
    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors before uploading")
      return
    }

    if (uploadData.length === 0) {
      toast.error("No data to upload")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Process data
      const processedData = uploadData.map(item => ({
        service_name: String(item.service_name || ''),
        service_code: String(item.service_code || ''),
        service_description: String(item.service_description || ''),
        status: item.status || 'A'
      }))

      // Upload in batches
      const batchSize = 10
      const batches = []
      for (let i = 0; i < processedData.length; i += batchSize) {
        batches.push(processedData.slice(i, i + batchSize))
      }

      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        
        try {
          const response = await fetch('/api/service-catalog/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ services: batch })
          })

          const result = await response.json()
          
          if (response.ok && result.success) {
            successCount += result.createdCount || 0
            errorCount += result.errors?.length || 0
          } else {
            errorCount += batch.length
          }
        } catch (error) {
          errorCount += batch.length
        }

        setUploadProgress(Math.round(((i + 1) / batches.length) * 100))
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} services`)
        loadData()
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} services failed to upload`)
      }

      // Reset and close modal if successful
      if (successCount > 0) {
        setTimeout(() => {
          resetUpload()
          setShowUploadModal(false)
        }, 1500)
      }

    } catch (error) {
      toast.error("Upload failed: " + error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        service_name: "Web Development",
        service_code: "SERV001",
        service_description: "Website development and maintenance",
        status: "A"
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, "service-catalog-template.xlsx")
  }

  const resetUpload = () => {
    setUploadData([])
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Service Catalog List</h1>
            <p className="mt-2 text-gray-600">Manage Services</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md flex items-center"
            >
              <Upload className="w-5 h-5 mr-2" /> Upload Excel
            </button>
            <Link 
              href="/service-cataloge/create" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Service
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white rounded-lg shadow-sm border mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by service name or code..."
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
                    { key: "service_id", label: "Sl No." },
                    { key: "service_name", label: "Service Name" },
                    { key: "service_code", label: "Code" },
                    { key: "service_description", label: "Description" },
                    { key: "status", label: "Status" },
                    { key: "createdAt", label: "Created" },
                    { key: "actions", label: "" }
                  ].map(({ key, label }) => (
                    <th key={key} onClick={() => key !== "actions" && handleSort(key)} className="px-6 py-4 text-left font-semibold cursor-pointer">
                      <div className="flex items-center">{label}{key !== "actions" && getSortIcon(key)}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {services.map(item => (
                  <tr key={item.service_id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">#{item.service_id}</td>
                    <td className="px-6 py-4">{item.service_name}</td>
                    <td className="px-6 py-4">{item.service_code}</td>
                    <td className="px-6 py-4">{item.service_description ? (item.service_description.length > 50 ? `${item.service_description.substring(0, 50)}...` : item.service_description) : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold
                        ${item.status === "A" ? "bg-green-100 text-green-700" : item.status === "I" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                        {item.status === "A" ? "Active" : item.status === "I" ? "Inactive" : "Deleted"}
                      </span>
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
                            prev?.id === item.service_id
                              ? null
                              : { id: item.service_id, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                          )
                        }}
                        className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                        aria-label="Actions"
                        aria-expanded={actionMenu?.id === item.service_id}
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
            <p>Showing {services.length} of {pagination.total}</p>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-2 border rounded">←</button>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-2 border rounded">→</button>
            </div>
          </div>
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const row = services.find(s => s.service_id === actionMenu.id)
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
                  href={`/service-cataloge/view/${row.service_id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> View
                </Link>
                <Link
                  href={`/service-cataloge/edit/${row.service_id}`}
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
                    handleDelete(row.service_id)
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className={`flex justify-between items-center p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                <h2 className="text-xl font-semibold">Upload Service Catalog</h2>
                <p className="mt-1 text-sm text-gray-500">Upload service data via Excel file</p>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Upload Excel File</label>
                <div className={`border-2 border-dashed rounded-lg p-8 text-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                 
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    disabled={isUploading}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-6 py-3 rounded-lg ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium`}
                    disabled={isUploading}
                  >
                    {uploadData.length > 0 ? 'Change File' : 'Select Excel File'}
                  </button>
                  <p className="mt-2 text-sm text-gray-500">Supported formats: .xlsx, .xls, .csv</p>
                  {uploadData.length > 0 && (
                    <p className="mt-2 text-green-600 font-medium">
                      ✓ File loaded: {uploadData.length} records found
                    </p>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <h3 className="font-medium text-red-700">Validation Errors ({validationErrors.length})</h3>
                  </div>
                  <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <div className={`grid grid-cols-12 gap-4 p-3 font-medium border-b ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="col-span-1">Row</div>
                      <div className="col-span-3">Service Code</div>
                      <div className="col-span-8">Errors</div>
                    </div>
                    {validationErrors.map((error, index) => (
                      <div key={index} className={`grid grid-cols-12 gap-4 p-3 border-b ${theme === 'dark' ? 'border-gray-700' : ''}`}>
                        <div className="col-span-1 font-medium">{error.row}</div>
                        <div className="col-span-3">{error.item.service_code || '-'}</div>
                        <div className="col-span-8">
                          {error.errors.map((err, errIndex) => (
                            <div key={errIndex} className="text-red-600 text-sm">{err}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-between items-center p-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-3">
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 border rounded-lg flex items-center"
                  disabled={isUploading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
                {uploadData.length > 0 && (
                  <button
                    onClick={resetUpload}
                    className="px-4 py-2 border rounded-lg"
                    disabled={isUploading}
                  >
                    Clear Data
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 border rounded-lg"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={validationErrors.length > 0 || uploadData.length === 0 || isUploading}
                  className={`px-6 py-2 rounded-lg text-white ${validationErrors.length > 0 || uploadData.length === 0 || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Data'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}