'use client'

// React Imports
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import CircularProgress from "@mui/material/CircularProgress"
import { toast } from "sonner"
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Link from 'next/link'

export default function Edit({ id }) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState({
    slabName: "",
    startRange: "",
    endRange: "",
    effectiveDate: "",
    remarks: "",
    status: "A"
  })

  const loadSlab = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gst-rate-slabs-api/${id}`)
      const data = await res.json()

      if (data.slab) {
        setFormData({
          slabName: data.slab.slabName || "",
          startRange: data.slab.startRange || "",
          endRange: data.slab.endRange || "",
          effectiveDate: data.slab.effectiveDate ? data.slab.effectiveDate.split('T')[0] : "",
          remarks: data.slab.remarks || "",
          status: data.slab.status || "A"
        })
      } else {
        setMessage("GST Slab not found.")
      }
    } catch (err) {
      toast.error("Failed to load GST Slab")
      setMessage("Failed to load GST Slab.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadSlab()
  }, [id])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    setMessage("")

    // Basic validation: ensure numeric and start < end
    const start = parseFloat(formData.startRange)
    const end = parseFloat(formData.endRange)

    if (isNaN(start) || isNaN(end)) {
      const errMsg = "Start Range and End Range must be valid numbers."
      setMessage(errMsg)
      toast.error(errMsg)
      return
    }

    if (start >= end) {
      const errMsg = "Start Range must be less than End Range."
      setMessage(errMsg)
      toast.error(errMsg)
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/gst-rate-slabs-api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...formData
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("GST Slab updated successfully!")
        router.push("/gst-rate-slabs")
      } else {
        toast.error(data.error || "Failed to update GST Slab")
      }
    } catch (err) {
      toast.error("Error updating GST Slab")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit GST Slab" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography variant="body2" style={{ marginTop: 12 }}>
              Loading GST Slab...
            </Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Slab Name"
                  name="slabName"
                  value={formData.slabName}
                  onChange={handleChange}
                  placeholder="GST 5%, GST 12%, etc."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Range"
                  name="startRange"
                  type="number"
                  value={formData.startRange}
                  onChange={handleChange}
                  placeholder="0"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Range"
                  name="endRange"
                  type="number"
                  value={formData.endRange}
                  onChange={handleChange}
                  placeholder="1000"
                />
              </Grid>

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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="Any notes..."
                />
              </Grid>

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

              {message && (
                <Grid item xs={12}>
                  <Typography color="red">{message}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                 <div className="flex items-center justify-between flex-wrap gap-5">
                 
                  <Button variant="contained" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update GST Slab"}
                  </Button>

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
