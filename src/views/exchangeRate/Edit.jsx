'use client'

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

import Card from "@mui/material/Card"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Link from "next/link"

export default function EditExchangeRate({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currencies, setCurrencies] = useState([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [formData, setFormData] = useState({
    currencyId: "",
    exchangeRate: "",
    date: "",
    status: "A"
  })

  // Load currencies for dropdown
  useEffect(() => {
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

  // Load single exchange rate
  const loadExchangeRate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/exchange-rate/${id}`)
      const data = await res.json()
      if (data.success && data.exchangeRate) {
        const er = data.exchangeRate
        // Format date for input field (YYYY-MM-DD)
        const dateStr = new Date(er.date).toISOString().split('T')[0]
        setFormData({
          currencyId: er.currencyId?.toString() || "",
          exchangeRate: er.exchangeRate?.toString() || "",
          date: dateStr,
          status: er.status || "A"
        })
      } else {
        toast.error(data.error || "Exchange rate not found")
      }
    } catch (err) {
      toast.error("Failed to load exchange rate")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadExchangeRate()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/exchange-rate/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...formData })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Exchange rate updated successfully")
        router.push("/exchange-rate")
      } else {
        toast.error(data.error || "Failed to update exchange rate")
      }
    } catch (err) {
      toast.error("Error updating exchange rate")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Exchange Rate" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading Exchange Rate...</Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={4}>

              {/* Currency */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    name="currencyId"
                    value={formData.currencyId}
                    onChange={handleChange}
                    disabled={loadingCurrencies}
                  >
                    {currencies.map((currency) => (
                      <MenuItem key={currency.currencyId} value={currency.currencyId.toString()}>
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
                  {loading ? "Updating..." : "Update Exchange Rate"}
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
        )}
      </CardContent>
    </Card>
  )
}

