"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"

import Link from "next/link"
import { toast } from "sonner"

export default function CreateVillage() {
  const router = useRouter()

  const [gewogs, setGewogs] = useState([])
  const [formData, setFormData] = useState({
    gewogId: "",
    name: "",
    code: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Load Gewogs
  useEffect(() => {
    async function loadGewogs() {
      try {
        const res = await fetch("/api/village/create")
        const data = await res.json()
        if (data.success) setGewogs(data.gewogs)
      } catch (err) {
        toast.error("Failed to load Gewogs")
      }
    }
    loadGewogs()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.gewogId) {
      toast.error("Gewog is required.")
      return
    }

    if (!formData.name) {
      toast.error("Village Name is required.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/village/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Village created successfully")
        router.push("/village")
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
      <CardHeader title="Create Village" />
      <CardContent>
        <form onSubmit={handleSubmit}>
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
                >
                  <MenuItem value="">Select Gewog</MenuItem>
                  {gewogs.map(g => (
                    <MenuItem key={g.gewogId} value={g.gewogId}>
                      {g.name}
                    </MenuItem>
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
                placeholder="Enter Village Name"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Village Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter Village Code"
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
                  {loading ? "Saving..." : "Create Village"}
                </Button>

                <Link href="/village" passHref>
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
