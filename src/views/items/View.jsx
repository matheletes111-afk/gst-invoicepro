"use client"
import { useState, useEffect } from 'react'
import { ArrowLeft, Package, Tag, DollarSign, Hash, FileText, Ruler, Calendar } from 'lucide-react'
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
  const [item, setItem] = useState(null)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Get theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('materio-mui-template-mode') || 'light'
      setTheme(savedTheme)
    }
  }, [])

  const loadItem = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/items/${id}`)
      const data = await res.json()

      if (data.item) {
        setItem(data.item)
      }
    } catch (err) {
      console.error('Failed to load item:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadItem()
    }
  }, [id])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading item...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-xl mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Item not found</p>
          <Link
            href="/items"
            className={`px-6 py-3 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Back to Items
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">

        {/* Item Card */}
        <div className={`rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Card Header */}
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Package className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {item.name}
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Item Details
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>
                {item.status === 'A' ? 'Active' : 'Inactive'}
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
                  label="Item ID"
                  value={`#${item.itemId}`}
                />

                <DetailItem
                  theme={theme}
                  icon={<Tag className="w-5 h-5" />}
                  label="Item Code"
                  value={item.code}
                  highlight
                />

                <DetailItem
                  theme={theme}
                  icon={<Package className="w-5 h-5" />}
                  label="Item Type"
                  value={item.itemType}
                />

                <DetailItem
                  theme={theme}
                  icon={<Ruler className="w-5 h-5" />}
                  label="Unit"
                  value={item?.unitObject?.name}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <DetailItem
                  theme={theme}
                  icon={<DollarSign className="w-5 h-5" />}
                  label="Price"
                  value={`₹${item.price.toFixed(2)}`}
                  highlight
                />

                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Created On"
                  value={new Date(item.createdAt).toLocaleDateString()}
                />

                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Last Updated"
                  value={new Date(item.updatedAt).toLocaleDateString()}
                />
              </div>
            </div>

            {/* Description */}
            {item.desc && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Description
                  </h3>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                  <p className="whitespace-pre-wrap">{item.desc}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons at Bottom */}
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">


              <Link href="/items" passHref>
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

            </Box>
          </Grid>
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