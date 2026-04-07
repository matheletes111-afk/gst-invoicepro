'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// MUI
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Link from 'next/link'

import { toast } from "sonner"

const Create = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    currencyId: "",
    exchangeRate: "",
    date: "",
    status: "A"
  })

  const [currencies, setCurrencies] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)

  useEffect(() => {
    // Load currencies for dropdown
    async function loadCurrencies() {
      try {
        const res = await fetch('/api/currency/list?limit=1000')
        const data = await res.json()
        if (data.success) {
          setCurrencies(data.rates || [])
        }
      } catch (error) {
        console.error("Error loading currencies:", error)
      } finally {
        setLoadingCurrencies(false)
      }
    }
    loadCurrencies()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.currencyId) {
      toast.error("Currency is required")
      return
    }

    if (!formData.exchangeRate || parseFloat(formData.exchangeRate) <= 0) {
      toast.error("Valid Exchange Rate is required")
      return
    }

    if (!formData.date) {
      toast.error("Date is required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/exchange-rate/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Exchange Rate Created Successfully!")

        setFormData({
          currencyId: "",
          exchangeRate: "",
          date: "",
          status: "A"
        })

        router.push("/exchange-rate")
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create New Exchange Rate" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Currency */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  label="Currency"
                  name="currencyId"
                  value={formData.currencyId}
                  onChange={handleChange}
                  disabled={loadingCurrencies}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency.currencyId} value={currency.currencyId}>
                      {currency.currencyName} ({currency.currencySymbol})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Exchange Rate */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exchange Rate"
                name="exchangeRate"
                type="number"
                value={formData.exchangeRate}
                onChange={handleChange}
                placeholder="0.0000"
                inputProps={{ step: "0.0001", min: "0" }}
              />
            </Grid>

            {/* Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="A">Active</MenuItem>
                  <MenuItem value="I">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">


                <Button variant="contained" type="submit" disabled={loading || loadingCurrencies}>
                  {loading ? "Saving..." : "Create Exchange Rate"}
                </Button>

                <Link href="/exchange-rate" passHref>
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
                    Cancel
                  </Button>
                </Link>
              </div>
            </Grid>

          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default Create

