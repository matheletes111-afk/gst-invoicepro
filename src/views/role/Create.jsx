// src/views/role/Create.jsx
"use client"

import { useState } from "react"
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

const CreateRole = () => {
  const router = useRouter()

  const [formData, setFormData] = useState({
    roleName: "",
    roleDescription: "",
    status: "A"
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

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
      const res = await fetch("/api/role/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Role created successfully.")
        router.push("/role")
      } else {
        toast.error(data.error || "Failed to create role")
        setMessage(data.error || "Failed to create role")
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
      <CardHeader title="Create Role" />
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
                  {loading ? "Saving..." : "Create Role"}
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

export default CreateRole