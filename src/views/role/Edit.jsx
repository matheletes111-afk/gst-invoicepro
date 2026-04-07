// src/views/role/Edit.jsx
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
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material"

import Link from "next/link"
import { toast } from "sonner"

export default function EditRole({ id }) {
  const router = useRouter()

  const [formData, setFormData] = useState({
    roleName: "",
    roleDescription: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState("")

  // Fetch role data
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch(`/api/role/${id}`)
        const data = await res.json()

        if (data.success) {
          setFormData({
            roleName: data.data.roleName,
            roleDescription: data.data.roleDescription || "",
            status: data.data.status
          })
        } else {
          toast.error("Failed to load role")
          router.push("/role")
        }
      } catch (err) {
        toast.error("Error loading role")
        router.push("/role")
      } finally {
        setFetchLoading(false)
      }
    }

    if (id) fetchRole()
  }, [id, router])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.roleName) {
      toast.error("Role Name is required.")
      setMessage("Role Name is required.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/role/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Role updated successfully.")
        router.push("/role")
      } else {
        toast.error(data.error || "Failed to update role")
        setMessage(data.error || "Failed to update role")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
      setMessage("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Edit Role" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                name="roleName"
                value={formData.roleName}
                onChange={handleChange}
                placeholder="Example: Admin, Manager, User"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Description"
                name="roleDescription"
                value={formData.roleDescription}
                onChange={handleChange}
                placeholder="Describe the role responsibilities"
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
                <Typography color="red">{message}</Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <div className="flex items-center justify-between flex-wrap gap-5">
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Role"}
                </Button>

                <Link href="/role" passHref>
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