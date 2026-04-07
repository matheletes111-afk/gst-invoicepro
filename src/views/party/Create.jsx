'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Import Form Components
import RenderBusinessForm from './renderForm/RenderBusinessForm'
import RenderGovernmentForm from './renderForm/RenderGovernmentForm'
import RenderCorporationForm from './renderForm/RenderCorporationForm'
import RenderCsoForm from './renderForm/RenderCsoForm'
import RenderIndividualForm from './renderForm/RenderIndividualForm'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { toast } from "sonner"
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormHelperText
} from '@mui/material'
import Link from 'next/link'

// Party Type Options
const PARTY_TYPES = [
  { value: "", label: "Select Party Type", disabled: true },
  { value: "BUSINESS", label: "Business" },
  { value: "GOVERNMENT_AGENCY", label: "Government Agency" },
  { value: "CORPORATION", label: "Corporation" },
  { value: "CSO", label: "Civil Society Organization (CSO)" },
  { value: "INDIVIDUAL", label: "Individual" }
]

const Create = ({ onSuccess }) => {
  const router = useRouter()

  // Main Form State
  const [formData, setFormData] = useState({
    partyType: "",
    status: "A"
  })

  // Type-specific form data
  const [businessDetails, setBusinessDetails] = useState({
    licenseNo: "",
    companyRegistrationNo: "",
    businessLicenseRegion: "",
    taxPayerRegStatus: "NO",
    taxPayerRegNo: "",
    taxPayerRegion: "",
    address: "",
    officeEmail: "",
    officePhone: "",
    representativeName: "",
    representativeEmail: "",
    representativePhone: ""
  })

  const [governmentDetails, setGovernmentDetails] = useState({
    agencyName: "",
    taxPayerRegStatus: "NO",
    taxPayerRegNo: "",
    taxPayerRegion: "",
    address: "",
    officeEmail: "",
    officePhone: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  })

  const [corporationDetails, setCorporationDetails] = useState({
    corporationName: "",
    taxPayerRegStatus: "NO",
    taxPayerRegNo: "",
    taxPayerRegion: "",
    address: "",
    officeEmail: "",
    officePhone: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  })

  const [csoDetails, setCsoDetails] = useState({
    csoRegistrationNo: "",
    taxPayerRegStatus: "NO",
    taxPayerRegNo: "",
    taxPayerRegion: "",
    address: "",
    officeEmail: "",
    officePhone: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  })

  const [individualDetails, setIndividualDetails] = useState({
    cid: "",
    taxPayerRegStatus: "NO",
    taxPayerRegNo: "",
    taxPayerRegion: "",
    email: "",
    phone: ""
  })

  const [loading, setLoading] = useState(false)

  // Handle Party Type Change
  const handlePartyTypeChange = (e) => {
    setFormData({
      ...formData,
      partyType: e.target.value
    })
  }

  // Handle Business Details Change
  const handleBusinessChange = (e) => {
    setBusinessDetails({
      ...businessDetails,
      [e.target.name]: e.target.value
    })
  }

  // Handle Government Details Change
  const handleGovernmentChange = (e) => {
    setGovernmentDetails({
      ...governmentDetails,
      [e.target.name]: e.target.value
    })
  }

  // Handle Corporation Details Change
  const handleCorporationChange = (e) => {
    setCorporationDetails({
      ...corporationDetails,
      [e.target.name]: e.target.value
    })
  }

  // Handle CSO Details Change
  const handleCsoChange = (e) => {
    setCsoDetails({
      ...csoDetails,
      [e.target.name]: e.target.value
    })
  }

  // Handle Individual Details Change
  const handleIndividualChange = (e) => {
    setIndividualDetails({
      ...individualDetails,
      [e.target.name]: e.target.value
    })
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare payload based on party type
      let payload = {
        partyType: formData.partyType,
        status: formData.status
      }

      // Add type-specific details and common fields
      switch (formData.partyType) {
        case "BUSINESS":
          payload = {
            ...payload,
            ...businessDetails,
            contactName: businessDetails.representativeName,
            contactEmail: businessDetails.representativeEmail,
            contactPhone: businessDetails.representativePhone
          }
          break

        case "GOVERNMENT_AGENCY":
          payload = {
            ...payload,
            ...governmentDetails
          }
          break

        case "CORPORATION":
          payload = {
            ...payload,
            ...corporationDetails
          }
          break

        case "CSO":
          payload = {
            ...payload,
            ...csoDetails
          }
          break

        case "INDIVIDUAL":
          payload = {
            ...payload,
            ...individualDetails,
            officeEmail: individualDetails.email,
            officePhone: individualDetails.phone
          }
          break
      }

      const res = await fetch("/api/party/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Party created successfully!")
        
        if (typeof onSuccess === 'function') {
          onSuccess()
        } else {
          router.push('/party')
        }
      } else {
        toast.error(data.error || "Failed to create party")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Render form based on party type
  const renderFormByType = () => {
    switch (formData.partyType) {
      case "BUSINESS":
        return (
          <RenderBusinessForm
            businessDetails={businessDetails}
            handleBusinessChange={handleBusinessChange}
          />
        )
      case "GOVERNMENT_AGENCY":
        return (
          <RenderGovernmentForm
            governmentDetails={governmentDetails}
            handleGovernmentChange={handleGovernmentChange}
          />
        )
      case "CORPORATION":
        return (
          <RenderCorporationForm
            corporationDetails={corporationDetails}
            handleCorporationChange={handleCorporationChange}
          />
        )
      case "CSO":
        return (
          <RenderCsoForm
            csoDetails={csoDetails}
            handleCsoChange={handleCsoChange}
          />
        )
      case "INDIVIDUAL":
        return (
          <RenderIndividualForm
            individualDetails={individualDetails}
            handleIndividualChange={handleIndividualChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader title="Create New Party" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            {/* Party Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Party Type</InputLabel>
                <Select
                  label="Party Type"
                  name="partyType"
                  value={formData.partyType}
                  onChange={handlePartyTypeChange}
                >
                  {PARTY_TYPES.map((type) => (
                    <MenuItem
                      key={type.value}
                      value={type.value}
                      disabled={type.disabled}
                    >
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select the type of party to display relevant fields
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Conditional Form Rendering */}
            {formData.partyType && renderFormByType()}

            {/* Status Field (only show when party type is selected) */}
            {formData.partyType && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="A">Active</MenuItem>
                    <MenuItem value="I">Inactive</MenuItem>
                  </Select>
                  <FormHelperText>Initial status of the party</FormHelperText>
                </FormControl>
              </Grid>
            )}

            {/* Action Buttons */}
            {formData.partyType && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center">


                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    size="large"
                  >
                    {loading ? "Creating..." : "Create Party"}
                  </Button>

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
                      Cancel
                    </Button>
                  </Link>
                </Box>
              </Grid>
            )}
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default Create