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
  Divider,
  Chip,
  Avatar,
  IconButton,
  Stack,
  Paper
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import PersonIcon from '@mui/icons-material/Person'
import BadgeIcon from '@mui/icons-material/Badge'
import CorporateFareIcon from '@mui/icons-material/CorporateFare'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import ReceiptIcon from '@mui/icons-material/Receipt'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SecurityIcon from '@mui/icons-material/Security'
import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import ContactMailIcon from '@mui/icons-material/ContactMail'
import Link from 'next/link'

const View = () => {
  const router = useRouter()
  const params = useParams()
  const partyId = params.id

  const [isLoading, setIsLoading] = useState(true)
  const [party, setParty] = useState(null)
  const [details, setDetails] = useState(null)

  // Fetch party data
  useEffect(() => {
    if (partyId) {
      fetchPartyData()
    }
  }, [partyId])

  const fetchPartyData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/party/${partyId}`)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (data.success && data.party) {
        setParty(data.party)
        setDetails(data.party.details || {})
      } else {
        toast.error(data.error || "Failed to fetch party data")
        router.push('/party')
      }
    } catch (err) {
      console.error("Error fetching party:", err)
      toast.error("Error fetching party data")
      router.push('/party')
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

  // Get party type label
  const getPartyTypeLabel = (type) => {
    switch (type) {
      case 'BUSINESS': return 'Business'
      case 'GOVERNMENT_AGENCY': return 'Government Agency'
      case 'CORPORATION': return 'Corporation'
      case 'CSO': return 'Civil Society Organization (CSO)'
      case 'INDIVIDUAL': return 'Individual'
      default: return type
    }
  }

  // Get party type icon
  const getPartyTypeIcon = (type) => {
    switch (type) {
      case 'BUSINESS': return <BusinessIcon />
      case 'GOVERNMENT_AGENCY': return <AccountBalanceIcon />
      case 'CORPORATION': return <CorporateFareIcon />
      case 'CSO': return <SecurityIcon />
      case 'INDIVIDUAL': return <PersonIcon />
      default: return <BusinessIcon />
    }
  }

  // Get status chip
  const getStatusChip = (status) => {
    return status === 'A' ?
      <Chip label="Active" color="success" size="small" /> :
      <Chip label="Inactive" color="error" size="small" />
  }

  // Get tax payer status chip
  const getTaxPayerStatusChip2 = (status) => {
    return status === 'YES' ?
      <Chip label="Registered" color="success" size="small" /> :
      <Chip label="Not Registered" color="default" size="small" />
  }

  // Render business details
  const renderBusinessDetails = () => {
    if (!details) return null

    return (
      <>
        {/* Basic Business Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon /> Business Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="License No"
            value={details.licenseNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Company Registration No"
            value={details.companyRegistrationNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Business License Region"
            value={details.businessLicenseRegion || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {/* Tax Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ReceiptIcon /> Tax Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Status"
            value={(details.taxPayerRegStatus)}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {details.taxPayerRegStatus === 'YES' && (
          <>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Registration No"
                value={details.taxPayerRegNo || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Region"
                value={details.taxPayerRegion || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>
          </>
        )}


        {/* Address Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <LocationOnIcon /> Address Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={details.address || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            multiline
            rows={2}
          />
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ContactPhoneIcon /> Contact Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Email"
            value={details.officeEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Phone"
            value={details.officePhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        {/* Representative Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <PersonIcon /> Representative Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Representative Name"
            value={details.representativeName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Representative Email"
            value={details.representativeEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Representative Phone"
            value={details.representativePhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>
      </>
    )
  }

  // Render government agency details
  const renderGovernmentDetails = () => {
    if (!details) return null

    return (
      <>
        {/* Agency Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon /> Government Agency Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Agency Name"
            value={details.agencyName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {/* Tax Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ReceiptIcon /> Tax Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Status"
            value={(details.taxPayerRegStatus)}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {details.taxPayerRegStatus === 'YES' && (
          <>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Registration No"
                value={details.taxPayerRegNo || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Region"
                value={details.taxPayerRegion || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>
          </>
        )}

        {/* Address Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <LocationOnIcon /> Address Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={details.address || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            multiline
            rows={2}
          />
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ContactPhoneIcon /> Contact Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Email"
            value={details.officeEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Phone"
            value={details.officePhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        {/* Contact Person Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <PersonIcon /> Contact Person Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Person Name"
            value={details.contactName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Email"
            value={details.contactEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Phone"
            value={details.contactPhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>
      </>
    )
  }

  // Render corporation details
  const renderCorporationDetails = () => {
    if (!details) return null

    return (
      <>
        {/* Corporation Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CorporateFareIcon /> Corporation Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Corporation Name"
            value={details.corporationName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {/* Tax Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ReceiptIcon /> Tax Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Status"
            value={(details.taxPayerRegStatus)}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
        {details.taxPayerRegStatus === 'YES' && (
          <>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Registration No"
                value={details.taxPayerRegNo || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Region"
                value={details.taxPayerRegion || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>
          </>
        )}

        {/* Address Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <LocationOnIcon /> Address Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={details.address || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            multiline
            rows={2}
          />
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ContactPhoneIcon /> Contact Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Email"
            value={details.officeEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Phone"
            value={details.officePhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        {/* Contact Person Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <PersonIcon /> Contact Person Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Person Name"
            value={details.contactName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Email"
            value={details.contactEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Phone"
            value={details.contactPhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>
      </>
    )
  }

  // Render CSO details
  const renderCsoDetails = () => {
    if (!details) return null

    return (
      <>
        {/* CSO Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon /> CSO Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="CSO Registration No"
            value={details.csoRegistrationNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {/* Tax Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ReceiptIcon /> Tax Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Status"
            value={(details.taxPayerRegStatus)}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {details.taxPayerRegStatus === 'YES' && (
          <>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Registration No"
                value={details.taxPayerRegNo || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Region"
                value={details.taxPayerRegion || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>
          </>
        )}

        {/* Address Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <LocationOnIcon /> Address Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={details.address || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            multiline
            rows={2}
          />
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ContactPhoneIcon /> Contact Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Email"
            value={details.officeEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Office Phone"
            value={details.officePhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        {/* Contact Person Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <PersonIcon /> Contact Person Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Person Name"
            value={details.contactName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Email"
            value={details.contactEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Contact Phone"
            value={details.contactPhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>
      </>
    )
  }

  // Render individual details
  const renderIndividualDetails = () => {
    if (!details) return null

    return (
      <>
        {/* Individual Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon /> Individual Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CID"
            value={details.cid || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <BadgeIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        {/* Tax Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ReceiptIcon /> Tax Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Status"
            value={(details.taxPayerRegStatus)}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {details.taxPayerRegStatus === 'YES' && (
          <>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Registration No"
                value={details.taxPayerRegNo || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Payer Region"
                value={details.taxPayerRegion || 'N/A'}
                InputProps={{ readOnly: true }}
                variant="outlined"
                disabled={details.taxPayerRegStatus !== 'YES'}
              />
            </Grid>
          </>
        )}

        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
            <ContactPhoneIcon /> Contact Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            value={details.email || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone"
            value={details.phone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              )
            }}
          />
        </Grid>
      </>
    )
  }

  // Render details based on party type
  const renderDetailsByType = () => {
    if (!party) return null

    switch (party.partyType) {
      case "BUSINESS":
        return renderBusinessDetails()
      case "GOVERNMENT_AGENCY":
        return renderGovernmentDetails()
      case "CORPORATION":
        return renderCorporationDetails()
      case "CSO":
        return renderCsoDetails()
      case "INDIVIDUAL":
        return renderIndividualDetails()
      default:
        return null
    }
  }

  // Show loading spinner
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h6">
              Loading party details...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Show error if no party
  if (!party) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h6" color="error">
              Party not found
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/party')}
              sx={{ mt: 2 }}
            >
              Close
            </Button>
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
              Party Details
            </Typography>

          </Box>
        }
      />

      <CardContent>
        {/* Party Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Party Type
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {getPartyTypeIcon(party.partyType)}
                    {getPartyTypeLabel(party.partyType)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 1 }}>{getStatusChip(party.status)}</Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Party ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', mt: 1 }}>
                    #{party.partyId}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created On
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {formatDate(party.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {formatDate(party.updatedAt)}
                  </Typography>
                </Grid>

                {/* <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Is Deleted
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {party.isDeleted === 1 ? 
                      <Chip label="Deleted" color="error" size="small" /> : 
                      <Chip label="Active" color="success" size="small" />
                    }
                  </Box>
                </Grid> */}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Party Details */}
        <Grid container spacing={3}>
          {renderDetailsByType()}
        </Grid>

        {/* Action Buttons at Bottom */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Link href="/party" passHref>
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