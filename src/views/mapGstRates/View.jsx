'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Tag,
  Calendar,
  FileText,
  Hash,
  Percent
} from 'lucide-react'

// MUI
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

const View = ({ id }) => {
  const [loading, setLoading] = useState(true)
  const [mapping, setMapping] = useState(null)
  const [theme, setTheme] = useState('light')

  /* ---------------- Theme ---------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme =
        localStorage.getItem('materio-mui-template-mode') || 'light'
      setTheme(savedTheme)
    }
  }, [])

  /* ---------------- Load Mapping ---------------- */
  const loadMapping = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/map-gst-rates/${id}`)
      const data = await res.json()

      if (data?.mapping) {
        setMapping(data.mapping)
      }
    } catch (err) {
      console.error('Failed to load GST Mapping:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadMapping()
  }, [id])

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading GST Rate Mapping...
          </p>
        </div>
      </div>
    )
  }

  /* ---------------- Not Found ---------------- */
  if (!mapping) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-xl mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            GST Rate Mapping not found
          </p>
          <Link href="/map-gst-rates" passHref>
            <Button variant="contained" sx={{
                backgroundColor: "red",
                color: "white",
                "&:hover": {
                  backgroundColor: "#cc0000",
                }
              }}>
              Close
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  /* ---------------- View ---------------- */
  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">

        {/* Card */}
        <div className={`rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          
          {/* Header */}
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Percent className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    GST Rate Mapping
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Mapping Details
                  </p>
                </div>
              </div>

              <Chip
                label={mapping.status === 'A' ? 'Active' : 'Inactive'}
                color={mapping.status === 'A' ? 'success' : 'error'}
                variant="outlined"
              />
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left */}
              <div className="space-y-4">
                <DetailItem
                  theme={theme}
                  icon={<Hash className="w-5 h-5" />}
                  label="Mapping ID"
                  value={`#${mapping.mappingId}`}
                />

                <DetailItem
                  theme={theme}
                  icon={<Tag className="w-5 h-5" />}
                  label="Type"
                  value={mapping.type}
                  highlight
                />

                <DetailItem
                  theme={theme}
                  icon={<Tag className="w-5 h-5" />}
                  label="Service / Goods"
                  value={mapping.serviceGoodsName}
                />

                <DetailItem
                  theme={theme}
                  icon={<Percent className="w-5 h-5" />}
                  label="GST Status"
                  value={mapping.gstStatus}
                />
              </div>

              {/* Right */}
              <div className="space-y-4">
                <DetailItem
                  theme={theme}
                  icon={<Percent className="w-5 h-5" />}
                  label="Minimum Value"
                  value={mapping.minimumValue}
                />

                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Created At"
                  value={new Date(mapping.createdAt).toLocaleDateString()}
                />

                {mapping.remarks && (
                  <DetailItem
                    theme={theme}
                    icon={<FileText className="w-5 h-5" />}
                    label="Remarks"
                    value={mapping.remarks}
                  />
                )}
              </div>
            </div>

            {/* Optional Relations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem
                theme={theme}
                icon={<Hash className="w-5 h-5" />}
                label="Mapped Slab"
                value={mapping.slab ? mapping.slab.slabName : 'Not Mapped'}
              />

              <DetailItem
                theme={theme}
                icon={<Percent className="w-5 h-5" />}
                label="Mapped Rate"
                value={mapping.rate ? `${mapping.rate.gstRate}%` : 'Not Mapped'}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex ">
            <Link href="/map-gst-rates" passHref>
              <Button variant="contained" sx={{
                backgroundColor: "red",
                color: "white",
                "&:hover": {
                  backgroundColor: "#cc0000",
                }
              }}>
                Close
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ---------------- Detail Item ---------------- */
const DetailItem = ({ theme, icon, label, value, highlight = false }) => (
  <div className="flex items-start">
    <div className={`p-2 rounded-lg mr-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </div>
      <div className={`mt-1 ${highlight ? 'font-semibold text-lg' : 'text-base'} ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        {value}
      </div>
    </div>
  </div>
)

export default View
