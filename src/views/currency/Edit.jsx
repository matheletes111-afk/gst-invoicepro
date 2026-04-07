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

export default function EditCurrency({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    currencyName: "",
    currencySymbol: "",
    status: "A"
  })

  // Load single currency
  const loadCurrency = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/currency/${id}`)
      const data = await res.json()
      if (data.success && data.currency) {
        const c = data.currency
        setFormData({
          currencyName: c.currencyName || "",
          currencySymbol: c.currencySymbol || "",
          status: c.status || "A"
        })
      } else {
        toast.error(data.error || "Currency not found")
      }
    } catch (err) {
      toast.error("Failed to load currency")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadCurrency()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/currency/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...formData })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Currency updated successfully")
        router.push("/currency")
      } else {
        toast.error(data.error || "Failed to update currency")
      }
    } catch (err) {
      toast.error("Error updating currency")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Currency" />
      <CardContent>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>
              Loading Currency...
            </Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              {/* Currency Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Currency Name"
                  name="currencyName"
                  value={formData.currencyName}
                  onChange={handleChange}
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

              {/* Buttons */}
              <Grid item xs={12}>
                <div className="flex items-center justify-between flex-wrap gap-5">

                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Currency"}
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
        )}

      </CardContent>
    </Card>
  )
}
