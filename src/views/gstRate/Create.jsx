'use client'

import { useEffect, useState } from 'react'
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

import { toast } from "sonner"

export default function CreateGstRate() {
  const router = useRouter()

  const [slabs, setSlabs] = useState([])

  const [formData, setFormData] = useState({
    slabId: "",
    gstRate: "",
    effectiveDate: "",
    remarks: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Fetch Active Slabs for dropdown
  useEffect(() => {
    fetch("/api/gst-rate/slabs")
      .then(res => res.json())
      .then(data => {
        if (data.success) setSlabs(data.slabs)
      })
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    if (!formData.slabId) {
      toast.error("Please select a Slab")
      setMessage("Please select a Slab")
      return
    }

    if (!formData.gstRate || isNaN(formData.gstRate)) {
      toast.error("GST Rate must be a valid number")
      setMessage("GST Rate must be a valid number")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/gst-rate/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("GST Rate Created Successfully!")

        setFormData({
          slabId: "",
          gstRate: "",
          effectiveDate: "",
          remarks: "",
          status: "A"
        })

        router.push("/gst-rate")
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
      <CardHeader title="Create New GST Rate" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>

            {/* Slab Dropdown */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select GST Slab</InputLabel>
                <Select
                  label="Select GST Slab"
                  name="slabId"
                  value={formData.slabId}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Select Slab</em>
                  </MenuItem>
                  {slabs.map((slab) => (
                    <MenuItem key={slab.slabId} value={slab.slabId}>
                      {slab.slabName} ({slab.startRange} - {slab.endRange})
                    </MenuItem>
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
                placeholder="18"
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
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Notes..."
                multiline
                rows={3}
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
                  <MenuItem value="D">Deleted</MenuItem>
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
                  {loading ? "Saving..." : "Create GST Rate"}
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
      </CardContent>
    </Card>
  )
}
