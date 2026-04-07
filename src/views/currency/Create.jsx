'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// MUI
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import Link from 'next/link'
import { toast } from "sonner"

const CreateCurrency = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    currencyName: "",
    currencySymbol: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.currencyName) {
      toast.error("Currency Name is required")
      setMessage("Currency Name is required")
      return
    }

    if (!formData.currencySymbol) {
      toast.error("Currency Symbol is required")
      setMessage("Currency Symbol is required")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/currency/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Currency Created Successfully!")
        router.push("/currency")
      } else {
        toast.error(data.error)
        setMessage(data.error)
      }
    } catch (err) {
      toast.error(err.message)
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create Currency" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Currency Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Currency Name"
                name="currencyName"
                value={formData.currencyName}
                onChange={handleChange}
                placeholder="USD, INR, EUR..."
              />
            </Grid>

            {/* Currency Symbol */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Currency Symbol"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
                placeholder="$, ₹, €..."
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
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

            {/* Error Message */}
            {message && (
              <Grid item xs={12}>
                <Typography color="red">{message}</Typography>
              </Grid>
            )}

            {/* Buttons */}
            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">

                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Create Currency"}
                </Button>

                <Link href="/currency" passHref>
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

export default CreateCurrency
