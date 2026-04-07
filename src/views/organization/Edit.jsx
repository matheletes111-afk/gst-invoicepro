'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation';

import RenderBusinessForm from './renderForms/RenderBusinessForm';
import RenderGovernmentForm from './renderForms/RenderGovernmentForm';
import RenderCorporationForm from './renderForms/RenderCorporationForm';
import RenderCsoForm from './renderForms/RenderCsoForm';
import RenderOfficeLocationSection from './renderForms/RenderOfficeLocationSection';

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
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
  Divider,
  FormHelperText,
  CircularProgress
} from '@mui/material'
import Link from 'next/link';

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

const EditOrganization = () => {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id;

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

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
  const [allDzongkhags, setAllDzongkhags] = useState([])
  const [gewogs, setGewogs] = useState([])
  const [villages, setVillages] = useState([])

  const [gewogsOffice, setGewogsOffice] = useState([])
  const [villagesOffice, setVillagesOffice] = useState([])

  // Selection states (needed for your components)
  const [selectedDzongkhag, setSelectedDzongkhag] = useState("")
  const [selectedGewog, setSelectedGewog] = useState("")
  const [selectedVillage, setSelectedVillage] = useState("")

  const [selectedDzongkhagOffice, setSelectedDzongkhagOffice] = useState("")
  const [selectedGewogOffice, setSelectedGewogOffice] = useState("")
  const [selectedVillageOffice, setSelectedVillageOffice] = useState("")

  // Refs to track if we've loaded initial data
  const hasLoadedInitialData = useRef(false);

  // Fetch all Dzongkhags on component mount
  useEffect(() => {
    fetchAllDzongkhags();
  }, [])

  // Fetch organization data after dzongkhags are loaded
  useEffect(() => {
    if (allDzongkhags.length > 0 && organizationId && !hasLoadedInitialData.current) {
      fetchOrganizationData();
      hasLoadedInitialData.current = true;
    }
  }, [allDzongkhags, organizationId])

  // Fetch all Dzongkhags
  const fetchAllDzongkhags = async () => {
    try {
      setLoadingLocations(true);
      const res = await fetch("/api/location/dzongkhags");
      const data = await res.json();
      if (data.success) {
        setAllDzongkhags(data.dzongkhags || []);
      }
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
      toast.error("Failed to load location data");
    } finally {
      setLoadingLocations(false);
    }
  }

  // Fetch Gewogs by dzongkhag ID
  const fetchGewogs = async (dzongkhagId, isOffice = false) => {
    try {
      setLoadingLocations(true);
      const res = await fetch(`/api/location/gewogs/${dzongkhagId}`);
      const data = await res.json();

      if (data.success) {
        if (isOffice) {
          setGewogsOffice(data.gewogs || []);
          return data.gewogs || [];
        } else {
          setGewogs(data.gewogs || []);
          return data.gewogs || [];
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching gewogs:", error);
      if (isOffice) {
        setGewogsOffice([]);
      } else {
        setGewogs([]);
      }
      return [];
    } finally {
      setLoadingLocations(false);
    }
  }

  // Fetch Villages by gewog ID
  const fetchVillages = async (gewogId, isOffice = false) => {
    try {
      setLoadingLocations(true);
      const res = await fetch(`/api/location/villages/${gewogId}`);
      const data = await res.json();

      if (data.success) {
        if (isOffice) {
          setVillagesOffice(data.villages || []);
        } else {
          setVillages(data.villages || []);
        }
      }
    } catch (error) {
      console.error("Error fetching villages:", error);
      if (isOffice) {
        setVillagesOffice([]);
      } else {
        setVillages([]);
      }
    } finally {
      setLoadingLocations(false);
    }
  }

  // Find location by name
  const findLocationByName = (list, name) => {
    return list.find(item => item.name === name);
  }

  // Main function to fetch and set organization data
  const fetchOrganizationData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/organization/${organizationId}`);
      const data = await res.json();

      if (data.success && data.organization) {
        const org = data.organization;

        // Set basic form data
        setFormData({
          orgType: org.orgType,
          status: org.status || "A"
        });

        // Set type-specific data based on organization type
        switch (org.orgType) {
          case "business":
            if (org.details) {
              await setBusinessData(org.details);
            }
            break;

          case "government":
            if (org.details) {
              setGovernmentAgencyDetails({
                agencyName: org.details.agencyName || "",
                agencyCode: org.details.agencyCode || "",
                tpn: org.details.tpn || "",
                taxpayerRegistrationRegion: org.details.taxpayerRegistrationRegion || "",
                registrationType: org.details.registrationType || "",
                contactPerson: org.details.contactPerson || "",
                contactEmail: org.details.contactEmail || "",
                contactPhone: org.details.contactPhone || ""
              });
            }
            break;

          case "corporation":
            if (org.details) {
              setCorporationDetails({
                corporationName: org.details.corporationName || "",
                organizationCode: org.details.organizationCode || "",
                tpn: org.details.tpn || "",
                taxpayerRegistrationRegion: org.details.taxpayerRegistrationRegion || "",
                registrationType: org.details.registrationType || "",
                contactPerson: org.details.contactPerson || "",
                contactEmail: org.details.contactEmail || "",
                contactPhone: org.details.contactPhone || ""
              });
            }
            break;

          case "cso":
            if (org.details) {
              setCsoDetails({
                agencyName: org.details.agencyName || "",
                agencyCode: org.details.agencyCode || "",
                registrationNo: org.details.registrationNo || "",
                tpn: org.details.tpn || "",
                taxpayerRegistrationRegion: org.details.taxpayerRegistrationRegion || "",
                registrationType: org.details.registrationType || "",
                contactPerson: org.details.contactPerson || "",
                contactEmail: org.details.contactEmail || "",
                contactPhone: org.details.contactPhone || ""
              });
            }
            break;
        }
      } else {
        toast.error(data.error || "Failed to fetch organization data");
        router.push('/organization');
      }
    } catch (err) {
      console.error("Error fetching organization:", err);
      toast.error("Error fetching organization data");
      router.push('/organization');
    } finally {
      setIsLoading(false);
    }
  };

  // Separate function to set business data with proper async handling
  const setBusinessData = async (details) => {
    const businessData = {
      businessName: details.businessName || "",
      businessNameCode: details.businessNameCode || "",
      licenseNo: details.licenseNo || "",
      companyRegistrationNo: details.companyRegistrationNo || "",
      taxpayerNumber: details.taxpayerNumber || "",
      taxpayerType: details.taxpayerType || "",
      taxpayerRegistrationRegion: details.taxpayerRegistrationRegion || "",
      businessLicenseRegion: details.businessLicenseRegion || "",
      businessLocation: details.businessLocationJson || { ...initialBusinessLocation },
      officeLocation: details.officeLocationJson || { ...initialBusinessLocation },
      ownershipType: details.ownershipType || "",
      proprietor: details.proprietorJson || { ...initialProprietor },
      partners: details.partnersJson || [{ ...initialPartner }],
      registeredCompany: details.registeredCompanyJson || { ...initialRegisteredCompany }
    };

    // Set the business data immediately
    setBusinessDetails(businessData);

    // Set selection states for UI
    if (businessData.businessLocation.dzongkhag) {
      setSelectedDzongkhag(businessData.businessLocation.dzongkhag);
    }
    if (businessData.businessLocation.gewog) {
      setSelectedGewog(businessData.businessLocation.gewog);
    }
    if (businessData.businessLocation.village) {
      setSelectedVillage(businessData.businessLocation.village);
    }

    if (businessData.officeLocation.dzongkhag) {
      setSelectedDzongkhagOffice(businessData.officeLocation.dzongkhag);
    }
    if (businessData.officeLocation.gewog) {
      setSelectedGewogOffice(businessData.officeLocation.gewog);
    }
    if (businessData.officeLocation.village) {
      setSelectedVillageOffice(businessData.officeLocation.village);
    }

    // Handle Business Location cascading
    await handleBusinessLocationCascading(businessData.businessLocation, false);

    // Handle Office Location cascading
    await handleOfficeLocationCascading(businessData.officeLocation, true);
  }

  // Handle Business Location cascading
  const handleBusinessLocationCascading = async (locationData, isOffice = false) => {
    if (!locationData || !locationData.dzongkhag) return;

    const { dzongkhag, gewog } = locationData;

    // 1. Find dzongkhag ID
    const dzongkhagObj = findLocationByName(allDzongkhags, dzongkhag);
    if (!dzongkhagObj) return;

    // 2. Fetch gewogs for this dzongkhag and wait for it
    const fetchedGewogs = await fetchGewogs(dzongkhagObj.dzongkhagId, isOffice);

    // 3. If there's a saved gewog, find it and fetch villages
    if (gewog && fetchedGewogs.length > 0) {
      const gewogObj = findLocationByName(fetchedGewogs, gewog);
      if (gewogObj) {
        // Fetch villages for this gewog
        await fetchVillages(gewogObj.gewogId, isOffice);
      }
    }
  }

  // Handle Office Location cascading
  const handleOfficeLocationCascading = async (locationData, isOffice = true) => {
    if (!locationData || !locationData.dzongkhag) return;

    const { dzongkhag, gewog } = locationData;

    // 1. Find dzongkhag ID
    const dzongkhagObj = findLocationByName(allDzongkhags, dzongkhag);
    if (!dzongkhagObj) return;

    // 2. Fetch gewogs for this dzongkhag and wait for it
    const fetchedGewogs = await fetchGewogs(dzongkhagObj.dzongkhagId, isOffice);

    // 3. If there's a saved gewog, find it and fetch villages
    if (gewog && fetchedGewogs.length > 0) {
      const gewogObj = findLocationByName(fetchedGewogs, gewog);
      if (gewogObj) {
        // Fetch villages for this gewog
        await fetchVillages(gewogObj.gewogId, isOffice);
      }
    }
  }

  // Handle Dzongkhag change
  const handleDzongkhagChange = async (dzongkhagName, isOffice = false) => {
    const dzongkhagObj = findLocationByName(allDzongkhags, dzongkhagName);

    if (dzongkhagObj) {
      // Fetch gewogs for selected dzongkhag
      await fetchGewogs(dzongkhagObj.dzongkhagId, isOffice);

      // Clear villages when dzongkhag changes
      if (isOffice) {
        setVillagesOffice([]);
      } else {
        setVillages([]);
      }
    }
  }

  // Handle Gewog change
  const handleGewogChange = async (gewogName, isOffice = false) => {
    const gewogsList = isOffice ? gewogsOffice : gewogs;
    const gewogObj = findLocationByName(gewogsList, gewogName);

    if (gewogObj) {
      // Fetch villages for selected gewog
      await fetchVillages(gewogObj.gewogId, isOffice);
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
  const handleBusinessLocationChange = async (locationType, field, value) => {
    const isOffice = locationType === 'officeLocation';

    // Update selection states
    if (field === 'dzongkhag') {
      if (isOffice) {
        setSelectedDzongkhagOffice(value);
        setSelectedGewogOffice("");
        setSelectedVillageOffice("");
      } else {
        setSelectedDzongkhag(value);
        setSelectedGewog("");
        setSelectedVillage("");
      }
    } else if (field === 'gewog') {
      if (isOffice) {
        setSelectedGewogOffice(value);
        setSelectedVillageOffice("");
      } else {
        setSelectedGewog(value);
        setSelectedVillage("");
      }
    } else if (field === 'village') {
      if (isOffice) {
        setSelectedVillageOffice(value);
      } else {
        setSelectedVillage(value);
      }
    }

    const updatedDetails = {
      ...businessDetails,
      [locationType]: {
        ...businessDetails[locationType],
        [field]: value
      }
    };

    // Handle cascading when location changes
    if (field === 'dzongkhag') {
      // Clear dependent fields
      updatedDetails[locationType].gewog = "";
      updatedDetails[locationType].village = "";

      // Fetch gewogs for the new dzongkhag
      await handleDzongkhagChange(value, isOffice);

    } else if (field === 'gewog') {
      // Clear village when gewog changes
      updatedDetails[locationType].village = "";

      // Fetch villages for the new gewog
      await handleGewogChange(value, isOffice);
    }

    setBusinessDetails(updatedDetails);
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

  // Submit Handler (Update instead of Create)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare payload based on organization type
      let payload = {
        id: organizationId,
        orgType: formData.orgType,
        status: formData.status
      }

      // Add type-specific details
      switch (formData.orgType) {
        case "business":
          payload.businessDetails = {
            ...businessDetails,
            // Ensure JSON fields are properly structured
            businessLocationJson: businessDetails.businessLocation,
            officeLocationJson: businessDetails.officeLocation,
            proprietorJson: businessDetails.proprietor,
            partnersJson: businessDetails.partners,
            registeredCompanyJson: businessDetails.registeredCompany
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

      const res = await fetch("/api/organization/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Organization updated successfully!")
        router.push('/organization')
      } else {
        toast.error(data.error || "Failed to update organization")
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

  // Business Form
  const renderBusinessForm = () => (
    <>
      <RenderBusinessForm
        businessDetails={businessDetails}
        handleBusinessChange={handleBusinessChange}
        handleBusinessLocationChange={handleBusinessLocationChange}
        dzongkhags={allDzongkhags}
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
        dzongkhagsOffice={allDzongkhags}
        gewogsOffice={gewogsOffice}
        villagesOffice={villagesOffice}
        loadingLocations={loadingLocations}
        setSelectedDzongkhagOffice={setSelectedDzongkhagOffice}
        setSelectedGewogOffice={setSelectedGewogOffice}
        setSelectedVillageOffice={setSelectedVillageOffice}
      />
    </>
  )

  // Government Agency Form
  const renderGovernmentForm = () => (
    <>
      <RenderGovernmentForm
        governmentAgencyDetails={governmentAgencyDetails}
        handleGovernmentChange={handleGovernmentChange}
        REGISTRATION_TYPES={REGISTRATION_TYPES}
      />
    </>
  )

  // Corporation Form
  const renderCorporationForm = () => (
    <>
      <RenderCorporationForm
        corporationDetails={corporationDetails}
        handleCorporationChange={handleCorporationChange}
        REGISTRATION_TYPES={REGISTRATION_TYPES}
      />
    </>
  )

  // CSO Form
  const renderCsoForm = () => (
    <>
      <RenderCsoForm
        csoDetails={csoDetails}
        handleCsoChange={handleCsoChange}
        REGISTRATION_TYPES={REGISTRATION_TYPES}
      />
    </>
  )

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading organization data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Edit Organization" />
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
                  disabled // Disable type change in edit mode
                >
                  <MenuItem value="" disabled>Select Organization Type</MenuItem>
                  {ORG_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Organization type cannot be changed after creation</FormHelperText>
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
                      {loading ? "Updating..." : "Update Organization"}
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

export default EditOrganization