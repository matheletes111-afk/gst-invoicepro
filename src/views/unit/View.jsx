'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { toast } from "sonner"
import {
  Box,
  Chip,
  Divider,
  Paper
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import InfoIcon from '@mui/icons-material/Info'
import ScheduleIcon from '@mui/icons-material/Schedule'
import Link from 'next/link'

const View = ({ id }) => {
  const router = useRouter()
  const unitId = id

  const [isLoading, setIsLoading] = useState(true)
  const [unit, setUnit] = useState(null)

  // Fetch unit data
  useEffect(() => {
    if (unitId) {
      fetchUnitData()
    }
  }, [unitId])

  const fetchUnitData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/unit/${unitId}`)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (data.success && data.unit) {
        setUnit(data.unit)
      } else {
        toast.error(data.error || "Failed to fetch unit data")
        router.push('/unit')
      }
    } catch (err) {
      console.error("Error fetching unit:", err)
      toast.error("Error fetching unit data")
      router.push('/unit')
    } finally {
      setIsLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status chip
  const getStatusChip = (isDeleted) => {
    return isDeleted === 1 ?
      <Chip label="Deleted" color="error" size="small" /> :
      <Chip label="Active" color="success" size="small" />
  }

  // Show loading spinner
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h6">
              Loading unit details...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Show error if no unit
  if (!unit) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h6" color="error">
              Unit not found
            </Typography>
            <Link href="/unit" passHref>
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
                Close
              </Button>
            </Link>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              Unit Details
            </Typography>
           
          </Box>
        }
      />

      <CardContent>
        {/* Unit Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Unit ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', mt: 1 }}>
                    #{unit.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 1 }}>{unit.status === 'A' ? 'Active' : 'Inactive'}</Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created On
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleIcon fontSize="small" />
                    {formatDate(unit.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleIcon fontSize="small" />
                    {formatDate(unit.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Unit Details */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon /> Unit Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>

          {/* Unit Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Unit Name"
              value={unit.name || 'N/A'}
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
          </Grid>

          {/* Unit Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={unit.description || 'N/A'}
              InputProps={{ readOnly: true }}
              variant="outlined"
              multiline
              rows={4}
            />
          </Grid>
        </Grid>

        {/* Action Buttons at Bottom */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">



            <Link href="/unit" passHref>
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
                Close
              </Button>
            </Link>

          </Box>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default View