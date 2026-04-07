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

const CreateGewog = () => {
  const router = useRouter()

  const [dzongkhags, setDzongkhags] = useState([])
  const [formData, setFormData] = useState({
    dzongkhagId: "",
    name: "",
    code: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Fetch active Dzongkhags
  useEffect(() => {
    async function loadDzongkhags() {
      try {
        const res = await fetch(
          "/api/dzongkhag/list?search=&page=1&limit=100&sortBy=name&sortDir=asc"
        )
        const data = await res.json()
        if (data.success) {
          setDzongkhags(data.data.filter(d => d.status === "A"))
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadDzongkhags()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.dzongkhagId) {
      toast.error("Dzongkhag is required.")
      setMessage("Dzongkhag is required.")
      return
    }

    if (!formData.name) {
      toast.error("Gewog Name is required.")
      setMessage("Gewog Name is required.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/gewog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Gewog created successfully.")
        router.push("/gewog")
      } else {
        toast.error(data.error || "Failed to create Gewog")
        setMessage(data.error || "Failed to create Gewog")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
      setMessage("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Create Gewog" />
      <CardContent>
        <form onSubmit={handleSubmit}>
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
                >
                  <MenuItem value="">Select Dzongkhag</MenuItem>
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
                placeholder="Example: Thimphu Gewog"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Gewog Code"
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
                  {loading ? "Saving..." : "Create Gewog"}
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
      </CardContent>
    </Card>
  )
}

export default CreateGewog
