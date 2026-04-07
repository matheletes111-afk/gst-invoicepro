"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import CircularProgress from "@mui/material/CircularProgress"
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"

import Link from "next/link"
import { toast } from "sonner"

export default function EditGewog({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const [dzongkhags, setDzongkhags] = useState([])
  const [formData, setFormData] = useState({
    dzongkhagId: "",
    name: "",
    code: "",
    status: "A"
  })

  // Load Dzongkhags (Active only)
  const loadDzongkhags = async () => {
    try {
      const res = await fetch("/api/dzongkhag/active")
      const data = await res.json()
      if (data.success) setDzongkhags(data.dzongkhags)
      else toast.error(data.error || "Failed to load Dzongkhags")
    } catch (err) {
      toast.error("Failed to load Dzongkhags")
    }
  }

  // Load Gewog
  const loadGewog = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gewog/${id}`)
      const data = await res.json()

      if (data.success && data.gewog) {
        setFormData({
          dzongkhagId: data.gewog.dzongkhagId,
          name: data.gewog.name || "",
          code: data.gewog.code || "",
          status: data.gewog.status || "A"
        })
      } else {
        setMessage(data.error || "Gewog not found")
      }
    } catch (err) {
      toast.error("Failed to load Gewog")
      setMessage("Failed to load Gewog.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDzongkhags()
    if (id) loadGewog()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/gewog/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gewogId: id, ...formData })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Gewog updated successfully!")
        router.push("/gewog")
      } else {
        toast.error(data.error || "Failed to update Gewog")
        setMessage(data.error || "Failed to update Gewog")
      }
    } catch (err) {
      toast.error("Error updating Gewog")
      setMessage("Error updating Gewog")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Edit Gewog" />
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading Gewog...
            </Typography>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Grid container spacing={5}>

              {/* Dzongkhag */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Dzongkhag</InputLabel>
                  <Select
                    label="Dzongkhag"
                    name="dzongkhagId"
                    value={formData.dzongkhagId}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="">
                      <em>Select Dzongkhag</em>
                    </MenuItem>
                    {dzongkhags.map(d => (
                      <MenuItem key={d.dzongkhagId} value={d.dzongkhagId}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Gewog Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Gewog Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter Gewog Name"
                  required
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

                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Gewog"}
                  </Button>

                  <Link href="/gewog" passHref>
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
