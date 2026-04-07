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

export default function Edit({ id }) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    slabId: "",
    gstRate: "",
    effectiveDate: "",
    remarks: "",
    status: "A"
  })
  const [slabs, setSlabs] = useState([])
  const [message, setMessage] = useState("")

  // Load all slabs
  const loadSlabs = async () => {
    try {
      const res = await fetch("/api/gst-rate/slabs")
      const data = await res.json()
      if (data.success) setSlabs(data.slabs || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Load single GST rate
  const loadRate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gst-rate/${id}`)
      const data = await res.json()
      if (data.success && data.rate) {
        const r = data.rate
        setFormData({
          slabId: r.slabId || "",
          gstRate: r.gstRate,
          effectiveDate: r.effectiveDate?.split("T")[0] || "",
          remarks: r.remarks || "",
          status: r.status
        })
      } else {
        toast.error(data.error || "GST Rate not found")
      }
    } catch (err) {
      toast.error("Failed to load GST Rate")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlabs()
    if (id) loadRate()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    if (!formData.slabId) {
      toast.error("Please select a Slab")
      setMessage("Please select a Slab")
      setLoading(false)
      return
    }

    if (!formData.gstRate || isNaN(formData.gstRate)) {
      toast.error("GST Rate must be a valid number")
      setMessage("GST Rate must be a valid number")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/gst-rate/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...formData })
      })
      const data = await res.json()

      if (data.success) {
        toast.success("GST Rate updated successfully")
        router.push("/gst-rate")
      } else {
        toast.error(data.error || "Failed to update GST Rate")
        setMessage(data.error || "Failed to update GST Rate")
      }
    } catch (err) {
      toast.error("Error updating GST Rate")
      setMessage("Error updating GST Rate")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit GST Rate" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading GST Rate...</Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              {/* Slab */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select GST Slab</InputLabel>
                  <Select
                    name="slabId"
                    value={formData.slabId}
                    onChange={handleChange}
                  >
                    <MenuItem value="">
                      <em>Select Slab</em>
                    </MenuItem>
                    {slabs.map(s => (
                      <MenuItem key={s.slabId} value={s.slabId}>{s.slabName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* GST Rate */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="GST Rate (%)"
                  name="gstRate"
                  type="number"
                  value={formData.gstRate}
                  onChange={handleChange}
                />
              </Grid>

              {/* Effective Date */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Effective Date"
                  name="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Remarks */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  multiline
                  rows={3}
                  value={formData.remarks}
                  onChange={handleChange}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12}>
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

              {/* Status Message */}
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
                    {loading ? "Updating..." : "Update GST Rate"}
                  </Button>

                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "red",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#cc0000",
                      }
                    }}
                    onClick={() => router.push("/gst-rate")}
                  >
                    Cancel
                  </Button>
                </div>
              </Grid>

            </Grid>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
