'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';

import RenderBusinessForm from './renderForms/RenderBusinessForm';
import RenderGovernmentForm from './renderForms/RenderGovernmentForm';
import RenderCorporationForm from './renderForms/RenderCorporationForm';
import RenderCsoForm from './renderForms/RenderCsoForm';
import RenderOfficeLocationSection from './renderForms/RenderOfficeLocationSection';

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { toast } from "sonner";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Divider,
  InputAdornment,
  FormHelperText,
  Autocomplete
} from '@mui/material'
import Link from 'next/link'

// Organization Type Options
const ORG_TYPES = [
  { value: "business", label: "Business" },
  { value: "government", label: "Government Agency" },
  { value: "corporation", label: "Corporation" },
  { value: "cso", label: "Civil Society Organization (CSO)" }
]

// Registration Types
const REGISTRATION_TYPES = [
  { value: "Mandatory", label: "Mandatory Filer" },
  { value: "Voluntary", label: "Voluntary Filer" }
]

// Ownership Types
const OWNERSHIP_TYPES = [
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "Registered Company", label: "Registered Company" }
]

// Initial Business Location Structure
const initialBusinessLocation = {
  dzongkhag: "",
  gewog: "",
  village: "",
  wardName: "",
  buildingNo: "",
  flatNo: "",
  locality: ""
}

// Initial Partner Structure
const initialPartner = {
  cid: "",
  name: "",
  phone: "",
  email: ""
}

// Initial Proprietor Structure
const initialProprietor = {
  cid: "",
  name: "",
  phone: "",
  email: ""
}

// Initial Registered Company Structure
const initialRegisteredCompany = {
  ceoMdName: "",
  ceoPhone: "",
  ceoEmail: ""
}

const CreateOrganization = () => {
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    orgType: "",
    status: "A"
  })

  // Type-specific form data
  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    businessNameCode: "",
    licenseNo: "",
    companyRegistrationNo: "",
    taxpayerNumber: "",
    taxpayerType: "",
    taxpayerRegistrationRegion: "",
    businessLicenseRegion: "",
    businessLocation: { ...initialBusinessLocation },
    officeLocation: { ...initialBusinessLocation },
    ownershipType: "",
    proprietor: { ...initialProprietor },
    partners: [{ ...initialPartner }],
    registeredCompany: { ...initialRegisteredCompany }
  })

  const [governmentAgencyDetails, setGovernmentAgencyDetails] = useState({
    agencyName: "",
    agencyCode: "",
    tpn: "",
    taxpayerRegistrationRegion: "",
    registrationType: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: ""
  })

  const [corporationDetails, setCorporationDetails] = useState({
    corporationName: "",
    organizationCode: "",
    tpn: "",
    taxpayerRegistrationRegion: "",
    registrationType: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: ""
  })

  const [csoDetails, setCsoDetails] = useState({
    agencyName: "",
    agencyCode: "",
    registrationNo: "",
    tpn: "",
    taxpayerRegistrationRegion: "",
    registrationType: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: ""
  })

  // Location Data States
  const [dzongkhags, setDzongkhags] = useState([])
  const [gewogs, setGewogs] = useState([])
  const [villages, setVillages] = useState([])

  const [selectedDzongkhag, setSelectedDzongkhag] = useState("")
  const [selectedGewog, setSelectedGewog] = useState("")
  const [selectedVillage, setSelectedVillage] = useState("")


  const [dzongkhagsOffice, setDzongkhagsOffice] = useState([])
  const [gewogsOffice, setGewogsOffice] = useState([])
  const [villagesOffice, setVillagesOffice] = useState([])

  const [selectedDzongkhagOffice, setSelectedDzongkhagOffice] = useState("")
  const [selectedGewogOffice, setSelectedGewogOffice] = useState("")
  const [selectedVillageOffice, setSelectedVillageOffice] = useState("")



  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(false)

  // Fetch Dzongkhags on component mount
  useEffect(() => {
    fetchDzongkhags()
    fetchDzongkhagsOffice()
  }, [])

  // Fetch Gewogs when Dzongkhag changes
  useEffect(() => {
    console.log("Selected Dzongkhag changed:", selectedDzongkhag);
    if (selectedDzongkhag) {
      fetchGewogs(selectedDzongkhag)
    }
  }, [selectedDzongkhag])

  useEffect(() => {
    console.log("Selected Dzongkhag changed:", selectedDzongkhagOffice);
    if (selectedDzongkhagOffice) {
      fetchGewogsOffice(selectedDzongkhagOffice)
    }
  }, [selectedDzongkhagOffice])

  // Fetch Villages when Gewog changes
  useEffect(() => {
    if (selectedGewog) {
      fetchVillages(selectedGewog)
    }
  }, [selectedGewog])

  useEffect(() => {
    if (selectedGewogOffice) {
      fetchVillagesOffice(selectedGewogOffice)
    }
  }, [selectedGewogOffice])

  // API Functions for Location Data
  const fetchDzongkhags = async () => {
    try {
      setLoadingLocations(true)
      const res = await fetch("/api/location/dzongkhags")
      const data = await res.json()
      if (data.success) {
        setDzongkhags(data.dzongkhags || [])
      }
    } catch (error) {
      console.error("Error fetching dzongkhags:", error)
    } finally {
      setLoadingLocations(false)
    }
  }


  const fetchDzongkhagsOffice = async () => {
    try {
      setLoadingLocations(true)
      const res = await fetch("/api/location/dzongkhags")
      const data = await res.json()
      if (data.success) {
        setDzongkhagsOffice(data.dzongkhags || [])
      }
    } catch (error) {
      console.error("Error fetching dzongkhags:", error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const fetchGewogs = async (dzongkhagId) => {
    try {
      setLoadingLocations(true)
      const res = await fetch(`/api/location/gewogs/${dzongkhagId}`)
      const data = await res.json()
      if (data.success) {
        setGewogs(data.gewogs || [])
        setVillages([]) // Clear villages when gewog changes
      }
    } catch (error) {
      console.error("Error fetching gewogs:", error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const fetchGewogsOffice = async (dzongkhagId) => {
    try {
      setLoadingLocations(true)
      const res = await fetch(`/api/location/gewogs/${dzongkhagId}`)
      const data = await res.json()
      if (data.success) {
        setGewogsOffice(data.gewogs || [])
        setVillagesOffice([]) // Clear villages when gewog changes
      }
    } catch (error) {
      console.error("Error fetching gewogs:", error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const fetchVillages = async (gewogId) => {
    try {
      setLoadingLocations(true)
      const res = await fetch(`/api/location/villages/${gewogId}`)
      const data = await res.json()
      if (data.success) {
        setVillages(data.villages || [])
      }
    } catch (error) {
      console.error("Error fetching villages:", error)
    } finally {
      setLoadingLocations(false)
    }
  }



  const fetchVillagesOffice = async (gewogId) => {
    try {
      setLoadingLocations(true)
      const res = await fetch(`/api/location/villages/${gewogId}`)
      const data = await res.json()
      if (data.success) {
        setVillagesOffice(data.villages || [])
      }
    } catch (error) {
      console.error("Error fetching villages:", error)
    } finally {
      setLoadingLocations(false)
    }
  }

  // Handle Organization Type Change
  const handleOrgTypeChange = (e) => {
    setFormData({
      ...formData,
      orgType: e.target.value
    })
  }

  // Handle Business Details Change
  const handleBusinessChange = (e) => {
    setBusinessDetails({
      ...businessDetails,
      [e.target.name]: e.target.value
    })
  }

  // Handle Business Location Change
  const handleBusinessLocationChange = (locationType, field, value) => {
    setBusinessDetails({
      ...businessDetails,
      [locationType]: {
        ...businessDetails[locationType],
        [field]: value
      }
    })
  }

  // Handle Proprietor Change
  const handleProprietorChange = (e) => {
    setBusinessDetails({
      ...businessDetails,
      proprietor: {
        ...businessDetails.proprietor,
        [e.target.name]: e.target.value
      }
    })
  }

  // Handle Partner Operations
  const addPartner = () => {
    setBusinessDetails({
      ...businessDetails,
      partners: [...businessDetails.partners, { ...initialPartner }]
    })
  }

  const removePartner = (index) => {
    const newPartners = [...businessDetails.partners]
    newPartners.splice(index, 1)
    setBusinessDetails({
      ...businessDetails,
      partners: newPartners
    })
  }

  const handlePartnerChange = (index, e) => {
    const newPartners = [...businessDetails.partners]
    newPartners[index][e.target.name] = e.target.value
    setBusinessDetails({
      ...businessDetails,
      partners: newPartners
    })
  }

  // Handle Registered Company Change
  const handleRegisteredCompanyChange = (e) => {
    setBusinessDetails({
      ...businessDetails,
      registeredCompany: {
        ...businessDetails.registeredCompany,
        [e.target.name]: e.target.value
      }
    })
  }

  // Handle Government Agency Details Change
  const handleGovernmentChange = (e) => {
    setGovernmentAgencyDetails({
      ...governmentAgencyDetails,
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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare payload based on organization type
      let payload = {
        orgType: formData.orgType,
        status: formData.status
      }

      // Add type-specific details
      switch (formData.orgType) {
        case "business":
          payload.businessDetails = {
            ...businessDetails,

          }
          break

        case "government":
          payload.governmentAgencyDetails = governmentAgencyDetails
          break

        case "corporation":
          payload.corporationDetails = corporationDetails
          break

        case "cso":
          payload.csoDetails = csoDetails
          break
      }

      const res = await fetch("/api/organization/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Organization created successfully!")
        router.push('/organization')
      } else {
        toast.error(data.error || "Failed to create organization")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
    }

    setLoading(false)
  }

  // Render form based on organization type
  const renderFormByType = () => {
    switch (formData.orgType) {
      case "business":
        return renderBusinessForm()
      case "government":
        return renderGovernmentForm()
      case "corporation":
        return renderCorporationForm()
      case "cso":
        return renderCsoForm()
      default:
        return null
    }
  }

  // Business Form  1


  const renderBusinessForm = () => (
    <>
      <RenderBusinessForm
        businessDetails={businessDetails}
        handleBusinessChange={handleBusinessChange}
        handleBusinessLocationChange={handleBusinessLocationChange}
        dzongkhags={dzongkhags}
        gewogs={gewogs}
        villages={villages}
        loadingLocations={loadingLocations}
        setSelectedDzongkhag={setSelectedDzongkhag}
        setSelectedGewog={setSelectedGewog}
        setSelectedVillage={setSelectedVillage}
        OWNERSHIP_TYPES={OWNERSHIP_TYPES}
        renderOfficeLocationSection={renderOfficeLocationSection}

        handleProprietorChange={handleProprietorChange}
        handlePartnerChange={handlePartnerChange}
        addPartner={addPartner}
        removePartner={removePartner}
        handleRegisteredCompanyChange={handleRegisteredCompanyChange}
      />
    </>
  )




  // Office Location Section (reusable)
  const renderOfficeLocationSection = () => (
    <>
      <RenderOfficeLocationSection
        businessDetails={businessDetails}
        handleBusinessLocationChange={handleBusinessLocationChange}
        dzongkhagsOffice={dzongkhagsOffice}
        gewogsOffice={gewogsOffice}
        villagesOffice={villagesOffice}
        loadingLocations={loadingLocations}
        setSelectedDzongkhagOffice={setSelectedDzongkhagOffice}
        setSelectedGewogOffice={setSelectedGewogOffice}
        setSelectedVillageOffice={setSelectedVillageOffice}
      />
    </>
  )

  // Ownership Details based on type


  // Government Agency Form  2
  const renderGovernmentForm = () => (
    <>
      <RenderGovernmentForm
        governmentAgencyDetails={governmentAgencyDetails}
        handleGovernmentChange={handleGovernmentChange}
        REGISTRATION_TYPES={REGISTRATION_TYPES}
      />
    </>
  )

  // Corporation Form  3
  const renderCorporationForm = () => (
    <>
      <RenderCorporationForm
        corporationDetails={corporationDetails}
        handleCorporationChange={handleCorporationChange}
        REGISTRATION_TYPES={REGISTRATION_TYPES}
      />
    </>
  )

  // CSO Form  4
  const renderCsoForm = () => (
    <>
      <RenderCsoForm
        csoDetails={csoDetails}
        handleCsoChange={handleCsoChange}
        REGISTRATION_TYPES={REGISTRATION_TYPES}
      />
    </>
  )

  return (
    <Card>
      <CardHeader title="Create New Organization" />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            {/* Organization Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Organization Type</InputLabel>
                <Select
                  label="Organization Type"
                  name="orgType"
                  value={formData.orgType}
                  onChange={handleOrgTypeChange}
                >
                  <MenuItem value="" disabled>Select Organization Type</MenuItem>
                  {ORG_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the type of organization to display relevant fields</FormHelperText>
              </FormControl>
            </Grid>

            {/* Conditional Form Rendering */}
            {formData.orgType && renderFormByType()}

            {/* Status Field (always visible) */}
            {formData.orgType && (
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
                </FormControl>
              </Grid>
            )}

            {/* Action Buttons */}
            {formData.orgType && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                 

                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    size="large"
                  >
                    {loading ? "Creating..." : "Create Organization"}
                  </Button>

                   <Link href="/organization" passHref>
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

export default CreateOrganization