'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { toast } from "sonner"
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Link from 'next/link'

const Create = () => {
  const router = useRouter()

  // Form State
  const [formData, setFormData] = useState({
    slabName: "",
    startRange: "",
    endRange: "",
    effectiveDate: "",
    remarks: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Submit Handler
  const handleSubmit = async (e) => {
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
      const res = await fetch("/api/gst-rate-slabs-api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        setMessage("GST Slab created successfully!")

        // Clear form
        setFormData({
          slabName: "",
          startRange: "",
          endRange: "",
          effectiveDate: "",
          remarks: "",
          status: "A"
        })
        toast.success("Successfully saved!")
        router.push('/gst-rate-slabs')
      } else {
        setMessage(data.error || "Failed to create GST slab")
        toast.error(data.error || "Failed to create GST slab")
      }
    } catch (err) {
      setMessage("Error: " + err.message)
      toast.error("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create New GST Slab" />
      <CardContent>
        <form onSubmit={handleSubmit}>
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
                placeholder="Any notes..."
                multiline
                rows={3}
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

            {/* Status Message */}
            {message && (
              <Grid item xs={12}>
                <Typography color={message.toLowerCase().includes("success") ? "green" : "red"}>
                  {message}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">
                
                  <Button variant="contained" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Create GST Slab"}
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
      </CardContent>
    </Card>
  )
}

export default Create
