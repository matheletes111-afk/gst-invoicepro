'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

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

const EditParty = () => {
  const router = useRouter()
  const params = useParams()
  const partyId = params.id

  // Main Form State
  const [formData, setFormData] = useState({
    partyType: "",
    status: "A"
  })

  // Type-specific form data
  const [businessDetails, setBusinessDetails] = useState({
    licenseNo: "",
    businessName: "",
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
    csoName: "",
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
    name: "",
    taxPayerRegStatus: "NO",
    taxPayerRegNo: "",
    taxPayerRegion: "",
    email: "",
    phone: ""
  })

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Fetch party data on component mount
  useEffect(() => {
    if (partyId) {
      fetchPartyData()
    }
  }, [partyId])

  // Fetch party data from API
  const fetchPartyData = async () => {
    try {
      setFetching(true)
      const res = await fetch(`/api/party/${partyId}`)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("API Response:", data) // Debug log

      if (data.success && data.party) {
        const party = data.party
        const details = party.details

        // console.log("Party data:", party) // Debug log
        // console.log("Details data:", details) // Debug log

        // Set main form data
        setFormData({
          partyType: party.partyType || "",
          status: party.status || "A"
        })

        // Set type-specific details based on party type
        switch (party.partyType) {
          case "BUSINESS":
            if (details) {
              setBusinessDetails({
                licenseNo: details.licenseNo || "",
                companyRegistrationNo: details.companyRegistrationNo || "",
                businessName: details.businessName || "",
                businessLicenseRegion: details.businessLicenseRegion || "",
                taxPayerRegStatus: details.taxPayerRegStatus || "NO",
                taxPayerRegNo: details.taxPayerRegNo || "",
                taxPayerRegion: details.taxPayerRegion || "",
                address: details.address || "",
                officeEmail: details.officeEmail || "",
                officePhone: details.officePhone || "",
                representativeName: details.representativeName || "",
                representativeEmail: details.representativeEmail || "",
                representativePhone: details.representativePhone || ""
              })
            }
            break

          case "GOVERNMENT_AGENCY":
            if (details) {
              setGovernmentDetails({
                agencyName: details.agencyName || "",
                taxPayerRegStatus: details.taxPayerRegStatus || "NO",
                taxPayerRegNo: details.taxPayerRegNo || "",
                taxPayerRegion: details.taxPayerRegion || "",
                address: details.address || "",
                officeEmail: details.officeEmail || "",
                officePhone: details.officePhone || "",
                contactName: details.contactName || "",
                contactEmail: details.contactEmail || "",
                contactPhone: details.contactPhone || ""
              })
            }
            break

          case "CORPORATION":
            if (details) {
              setCorporationDetails({
                corporationName: details.corporationName || "",
                taxPayerRegStatus: details.taxPayerRegStatus || "NO",
                taxPayerRegNo: details.taxPayerRegNo || "",
                taxPayerRegion: details.taxPayerRegion || "",
                address: details.address || "",
                officeEmail: details.officeEmail || "",
                officePhone: details.officePhone || "",
                contactName: details.contactName || "",
                contactEmail: details.contactEmail || "",
                contactPhone: details.contactPhone || ""
              })
            }
            break

          case "CSO":
            if (details) {
              setCsoDetails({
                csoRegistrationNo: details.csoRegistrationNo || "",
                csoName: details.csoName || "",
                taxPayerRegStatus: details.taxPayerRegStatus || "NO",
                taxPayerRegNo: details.taxPayerRegNo || "",
                taxPayerRegion: details.taxPayerRegion || "",
                address: details.address || "",
                officeEmail: details.officeEmail || "",
                officePhone: details.officePhone || "",
                contactName: details.contactName || "",
                contactEmail: details.contactEmail || "",
                contactPhone: details.contactPhone || ""
              })
            }
            break

          case "INDIVIDUAL":
            if (details) {
              setIndividualDetails({
                cid: details.cid || "",
                name: details.name || "",
                taxPayerRegStatus: details.taxPayerRegStatus || "NO",
                taxPayerRegNo: details.taxPayerRegNo || "",
                taxPayerRegion: details.taxPayerRegion || "",
                email: details.email || "",
                phone: details.phone || ""
              })
            }
            break

          default:
            console.error("Unknown party type:", party.partyType)
            toast.error("Unknown party type")
            router.push('/party')
        }
      } else {
        toast.error(data.error || "Failed to fetch party details")
        router.push('/party')
      }
    } catch (err) {
      console.error("Error fetching party details:", err)
      toast.error("Error fetching party details: " + err.message)
      router.push('/party')
    } finally {
      setFetching(false)
    }
  }

  // Handle Party Type Change (disabled in edit mode)
  const handlePartyTypeChange = (e) => {
    // Party type cannot be changed in edit mode
    toast.info("Party type cannot be changed after creation")
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

  // Submit Handler (POST for update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare payload based on party type
      let payload = {
        partyId: parseInt(partyId),
        status: formData.status
      }

      // Add type-specific details and common fields
      switch (formData.partyType) {
        case "BUSINESS":
          payload = {
            ...payload,
            taxPayerRegStatus: businessDetails.taxPayerRegStatus,
            taxPayerRegNo: businessDetails.taxPayerRegNo,
            taxPayerRegion: businessDetails.taxPayerRegion,
            address: businessDetails.address,
            officeEmail: businessDetails.officeEmail,
            officePhone: businessDetails.officePhone,
            contactName: businessDetails.representativeName,
            contactEmail: businessDetails.representativeEmail,
            contactPhone: businessDetails.representativePhone,
            licenseNo: businessDetails.licenseNo,
            businessName: businessDetails.businessName,
            companyRegistrationNo: businessDetails.companyRegistrationNo,
            businessLicenseRegion: businessDetails.businessLicenseRegion
          }
          break

        case "GOVERNMENT_AGENCY":
          payload = {
            ...payload,
            taxPayerRegStatus: governmentDetails.taxPayerRegStatus,
            taxPayerRegNo: governmentDetails.taxPayerRegNo,
            taxPayerRegion: governmentDetails.taxPayerRegion,
            address: governmentDetails.address,
            officeEmail: governmentDetails.officeEmail,
            officePhone: governmentDetails.officePhone,
            contactName: governmentDetails.contactName,
            contactEmail: governmentDetails.contactEmail,
            contactPhone: governmentDetails.contactPhone,
            agencyName: governmentDetails.agencyName
          }
          break

        case "CORPORATION":
          payload = {
            ...payload,
            taxPayerRegStatus: corporationDetails.taxPayerRegStatus,
            taxPayerRegNo: corporationDetails.taxPayerRegNo,
            taxPayerRegion: corporationDetails.taxPayerRegion,
            address: corporationDetails.address,
            officeEmail: corporationDetails.officeEmail,
            officePhone: corporationDetails.officePhone,
            contactName: corporationDetails.contactName,
            contactEmail: corporationDetails.contactEmail,
            contactPhone: corporationDetails.contactPhone,
            corporationName: corporationDetails.corporationName
          }
          break

        case "CSO":
          payload = {
            ...payload,
            taxPayerRegStatus: csoDetails.taxPayerRegStatus,
            taxPayerRegNo: csoDetails.taxPayerRegNo,
            taxPayerRegion: csoDetails.taxPayerRegion,
            address: csoDetails.address,
            officeEmail: csoDetails.officeEmail,
            officePhone: csoDetails.officePhone,
            contactName: csoDetails.contactName,
            contactEmail: csoDetails.contactEmail,
            contactPhone: csoDetails.contactPhone,
            csoRegistrationNo: csoDetails.csoRegistrationNo,
            csoName: csoDetails.csoName
          }
          break

        case "INDIVIDUAL":
          payload = {
            ...payload,
            taxPayerRegStatus: individualDetails.taxPayerRegStatus,
            taxPayerRegNo: individualDetails.taxPayerRegNo,
            taxPayerRegion: individualDetails.taxPayerRegion,
            cid: individualDetails.cid,
            name: individualDetails.name,
            email: individualDetails.email,
            phone: individualDetails.phone,
            name: individualDetails.name
          }
          break
      }

      const res = await fetch("/api/party/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Party updated successfully!")
        router.push('/party')
      } else {
        toast.error(data.error || "Failed to update party")
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

  if (fetching) {
    return (
      <Card>
        <CardContent>
          <Typography align="center" sx={{ py: 4 }}>
            Loading party details...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Don't render form if no party type is set
  if (!formData.partyType && !fetching) {
    return (
      <Card>
        <CardContent>
          <Typography align="center" sx={{ py: 4, color: 'error.main' }}>
            Unable to load party details. Please try again.
          </Typography>
          <Box display="flex" justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => router.push('/party')}
            >
              Back to Party
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Edit Party" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            {/* Party Type Selection (Read-only in edit mode) */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Party Type</InputLabel>
                <Select
                  label="Party Type"
                  name="partyType"
                  value={formData.partyType}
                  onChange={handlePartyTypeChange}
                  disabled
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
                  Party type cannot be changed after creation
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Conditional Form Rendering */}
            {formData.partyType && renderFormByType()}

            {/* Status Field */}
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
                  <FormHelperText>Current status of the party</FormHelperText>
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
                    {loading ? "Updating..." : "Update Party"}
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

export default EditParty