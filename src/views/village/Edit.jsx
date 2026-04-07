'use client'

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
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
import Link from "next/link"

export default function EditVillage({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const [gewogs, setGewogs] = useState([])
  const [formData, setFormData] = useState({
    gewogId: "",
    name: "",
    code: "",
    status: "A"
  })

  // Load Gewogs (Active + Inactive)
  const loadGewogs = async () => {
    try {
      const res = await fetch("/api/village/create")
      const data = await res.json()
      if (data.success) setGewogs(data.gewogs)
    } catch {
      toast.error("Failed to load Gewogs")
    }
  }

  // Load Village
  const loadVillage = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/village/${id}`)
      const data = await res.json()
      if (data.success && data.village) {
        setFormData({
          gewogId: data.village.gewogId,
          name: data.village.name || "",
          code: data.village.code || "",
          status: data.village.status || "A"
        })
      } else {
        setMessage(data.error || "Village not found")
      }
    } catch {
      toast.error("Failed to load Village")
      setMessage("Failed to load Village")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGewogs()
    if (id) loadVillage()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/village/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId: id, ...formData })
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Village updated successfully!")
        router.push("/village")
      } else {
        toast.error(data.error)
        setMessage(data.error)
      }

    } catch {
      toast.error("Error updating Village")
      setMessage("Error updating Village")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Village" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography variant="body2" style={{ marginTop: 12 }}>
              Loading Village...
            </Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              {/* Gewog */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Gewog</InputLabel>
                  <Select
                    label="Gewog"
                    name="gewogId"
                    value={formData.gewogId}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value=""><em>Select Gewog</em></MenuItem>
                    {gewogs.map(g => (
                      <MenuItem key={g.gewogId} value={g.gewogId}>{g.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Village Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Village Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter Village Name"
                />
              </Grid>

              {/* Code */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Code (Optional)"
                  name="code"
                  value={formData.code}
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

              {/* Message */}
              {message && (
                <Grid item xs={12}>
                  <Typography color="red">{message}</Typography>
                </Grid>
              )}

              {/* Buttons */}
              <Grid item xs={12}>
                <div className="flex items-center justify-between flex-wrap gap-5">
                  <Button variant="contained" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Village"}
                  </Button>

                  <Link href="/village" passHref>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "red",
                        color: "white",
                        "&:hover": { backgroundColor: "#cc0000" }
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
