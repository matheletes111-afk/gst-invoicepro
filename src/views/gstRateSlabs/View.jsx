'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Tag, Calendar, FileText, Hash, Percent } from 'lucide-react'
import Link from 'next/link'
// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

import { toast } from "sonner"
import {
  Box,
  Chip,
  Divider,
  Paper
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'

const View = ({ id }) => {
  const [loading, setLoading] = useState(true)
  const [slab, setSlab] = useState(null)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Get theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('materio-mui-template-mode') || 'light'
      setTheme(savedTheme)
    }
  }, [])

  const loadSlab = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gst-rate-slabs-api/${id}`)
      const data = await res.json()

      if (data.slab) {
        setSlab(data.slab)
      }
    } catch (err) {
      console.error('Failed to load GST Slab:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadSlab()
    }
  }, [id])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading GST Slab...</p>
        </div>
      </div>
    )
  }

  if (!slab) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-xl mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>GST Slab not found</p>
          <Link href="/gst-rate-slabs" passHref>
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

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">

        {/* Slab Card */}
        <div className={`rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Card Header */}
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <Percent className={`w-6 h-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {slab.slabName}
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    GST Slab Details
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>
                {slab.status === 'A' ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
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
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Effective Date"
                  value={new Date(slab.effectiveDate).toLocaleDateString()}
                />

                {slab.remarks && (
                  <DetailItem
                    theme={theme}
                    icon={<FileText className="w-5 h-5" />}
                    label="Remarks"
                    value={slab.remarks}
                  />
                )}
              </div>
            </div>

          </div>
          <Link href="/gst-rate-slabs" passHref>
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

// Helper component for detail items
const DetailItem = ({ theme, icon, label, value, highlight = false }) => {
  return (
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
}

export default View
