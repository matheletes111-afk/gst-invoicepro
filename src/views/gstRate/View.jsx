'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Tag,
  Calendar,
  FileText,
  Hash,
  Percent,
} from 'lucide-react'
import Button from '@mui/material/Button'

const View = ({ id }) => {
  const [loading, setLoading] = useState(true)
  const [rate, setRate] = useState(null)
  const [slab, setSlab] = useState(null)
  const [theme, setTheme] = useState('light')

  /* ---------------- Theme ---------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme =
        localStorage.getItem('materio-mui-template-mode') || 'light'
      setTheme(savedTheme)
    }
  }, [])

  /* ---------------- Fetch Data ---------------- */
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gst-rate/${id}`)
      const data = await res.json()

      if (data?.rate) {
        setRate(data.rate)
        setSlab(data.rate.slab)
      }
    } catch (err) {
      console.error('Failed to load GST Rate:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadData()
  }, [id])

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
          }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p
            className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
          >
            Loading GST Rate...
          </p>
        </div>
      </div>
    )
  }

  /* ---------------- Not Found ---------------- */
  if (!rate || !slab) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
          }`}
      >
        <div className="text-center">
          <p
            className={`text-xl mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
          >
            GST Rate not found
          </p>
          <Link href="/gst-rate" passHref>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "red",
                color: "white",
                "&:hover": {
                  backgroundColor: "#cc0000",
                }
              }}
            >
              Close
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  /* ---------------- View ---------------- */
  return (
    <div
      className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}
    >
      <div className="max-w-4xl mx-auto">


        {/* Card */}
        <div
          className={`rounded-xl shadow-sm border ${theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
            }`}
        >
          {/* Header */}
          <div
            className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-lg ${theme === 'dark'
                      ? 'bg-green-900/30'
                      : 'bg-green-100'
                    }`}
                >
                  <Percent
                    className={`w-6 h-6 ${theme === 'dark'
                        ? 'text-green-400'
                        : 'text-green-600'
                      }`}
                  />
                </div>
                <div>
                  <h1
                    className={`text-2xl font-bold ${theme === 'dark'
                        ? 'text-white'
                        : 'text-gray-800'
                      }`}
                  >
                    {slab.slabName}
                  </h1>
                  <p
                    className={`text-sm ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                      }`}
                  >
                    GST Rate & Slab Details
                  </p>
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-sm ${rate.status === 'A'
                    ? theme === 'dark'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-green-100 text-green-800'
                    : theme === 'dark'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-red-100 text-red-800'
                  }`}
              >
                {rate.status === 'A' ? 'Active' : 'Inactive'}
              </div>
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
                  label="Rate ID"
                  value={`#${rate.rateId}`}
                />

                <DetailItem
                  theme={theme}
                  icon={<Percent className="w-5 h-5" />}
                  label="GST Rate"
                  value={`${rate.gstRate}%`}
                  highlight
                />

                <DetailItem
                  theme={theme}
                  icon={<Hash className="w-5 h-5" />}
                  label="Slab ID"
                  value={`#${slab.slabId}`}
                />

                <DetailItem
                  theme={theme}
                  icon={<Tag className="w-5 h-5" />}
                  label="Slab Name"
                  value={slab.slabName}
                  highlight
                />
              </div>

              {/* Right */}
              <div className="space-y-4">
                <DetailItem
                  theme={theme}
                  icon={<Percent className="w-5 h-5" />}
                  label="Start Range"
                  value={slab.startRange}
                />

                <DetailItem
                  theme={theme}
                  icon={<Percent className="w-5 h-5" />}
                  label="End Range"
                  value={slab.endRange}
                />

                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Rate Effective Date"
                  value={new Date(rate.effectiveDate).toLocaleDateString()}
                />

                {(rate.remarks || slab.remarks) && (
                  <DetailItem
                    theme={theme}
                    icon={<FileText className="w-5 h-5" />}
                    label="Remarks"
                    value={rate.remarks || slab.remarks}
                  />
                )}
              </div>
            </div>

          </div>
          <Link href="/gst-rate" passHref>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "red",
                color: "white",
                "&:hover": {
                  backgroundColor: "#cc0000",
                }
              }}
            >
              Close
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}

/* ---------------- Detail Item ---------------- */
const DetailItem = ({ theme, icon, label, value, highlight = false }) => (
  <div className="flex items-start">
    <div
      className={`p-2 rounded-lg mr-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}
    >
      {icon}
    </div>
    <div className="flex-1">
      <div
        className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 ${highlight ? 'font-semibold text-lg' : 'text-base'
          } ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
      >
        {value}
      </div>
    </div>
  </div>
)

export default View
