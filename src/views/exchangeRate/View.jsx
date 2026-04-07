'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Tag,
  Calendar,
  Hash,
  Percent
} from 'lucide-react'

// MUI
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

const View = ({ id }) => {
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState(null)
  const [theme, setTheme] = useState('light')

  /* ---------------- Theme ---------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme =
        localStorage.getItem('materio-mui-template-mode') || 'light'
      setTheme(savedTheme)
    }
  }, [])

  /* ---------------- Load Exchange Rate ---------------- */
  const loadExchangeRate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/exchange-rate/${id}`)
      const data = await res.json()

      if (data?.exchangeRate) {
        setExchangeRate(data.exchangeRate)
      }
    } catch (err) {
      console.error('Failed to load Exchange Rate:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadExchangeRate()
  }, [id])

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading Exchange Rate...
          </p>
        </div>
      </div>
    )
  }

  /* ---------------- Not Found ---------------- */
  if (!exchangeRate) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-xl mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Exchange Rate not found
          </p>
          <Link href="/exchange-rate" passHref>
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
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                  <Percent className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Exchange Rate Details
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Currency Exchange Information
                  </p>
                </div>
              </div>

              <Chip
                label={exchangeRate.status === 'A' ? 'Active' : 'Inactive'}
                color={exchangeRate.status === 'A' ? 'success' : 'error'}
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
                  label="Exchange ID"
                  value={`#${exchangeRate.exchangeId}`}
                />

                <DetailItem
                  theme={theme}
                  icon={<Percent className="w-5 h-5" />}
                  label="Exchange Rate"
                  value={exchangeRate.exchangeRate}
                  highlight
                />

                <DetailItem
                  theme={theme}
                  icon={<Tag className="w-5 h-5" />}
                  label="Currency"
                  value={`${exchangeRate.currency.currencyName} (${exchangeRate.currency.currencySymbol})`}
                />
              </div>

              {/* Right */}
              <div className="space-y-4">
                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Exchange Date"
                  value={new Date(exchangeRate.date).toLocaleDateString()}
                />

                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Created At"
                  value={new Date(exchangeRate.createdAt).toLocaleDateString()}
                />

                <DetailItem
                  theme={theme}
                  icon={<Calendar className="w-5 h-5" />}
                  label="Updated At"
                  value={new Date(exchangeRate.updatedAt).toLocaleDateString()}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex ">
            <Link href="/exchange-rate" passHref>
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
