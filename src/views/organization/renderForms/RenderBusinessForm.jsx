import React from 'react'
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
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';




const RenderBusinessForm = ({
  businessDetails,
  handleBusinessChange,
  handleBusinessLocationChange,
  dzongkhags,
  gewogs,
  villages,
  loadingLocations,
  setSelectedDzongkhag,
  setSelectedGewog,
  setSelectedVillage,
  OWNERSHIP_TYPES,
  renderOfficeLocationSection,


  handleProprietorChange,
  handlePartnerChange,
  addPartner,
  removePartner,
  handleRegisteredCompanyChange
}) => {



  const renderOwnershipDetails = () => {
    console.log(gewogs, villages)
    if (businessDetails.ownershipType === "Sole Proprietorship") {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Proprietor Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CID"
              name="cid"
              value={businessDetails.proprietor.cid}
              onChange={handleProprietorChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={businessDetails.proprietor.name}
              onChange={handleProprietorChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone No"
              name="phone"
              value={businessDetails.proprietor.phone}
              onChange={handleProprietorChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={businessDetails.proprietor.email}
              onChange={handleProprietorChange}
            />
          </Grid>
        </>
      )
    }

    if (businessDetails.ownershipType === "Partnership") {
      return (
        <>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
              <Typography variant="subtitle1">Partner Details</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addPartner}
                size="small"
              >
                Add Partner
              </Button>
            </Box>
          </Grid>

          {businessDetails.partners.map((partner, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2">Partner {index + 1}</Typography>
                    {businessDetails.partners.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => removePartner(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="CID"
                        name="cid"
                        value={partner.cid}
                        onChange={(e) => handlePartnerChange(index, e)}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={partner.name}
                        onChange={(e) => handlePartnerChange(index, e)}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone No"
                        name="phone"
                        value={partner.phone}
                        onChange={(e) => handlePartnerChange(index, e)}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={partner.email}
                        onChange={(e) => handlePartnerChange(index, e)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </>
      )
    }

    if (businessDetails.ownershipType === "Registered Company") {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Registered Company Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CEO/MD Name"
              name="ceoMdName"
              value={businessDetails.registeredCompany.ceoMdName}
              onChange={handleRegisteredCompanyChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CEO Phone No"
              name="ceoPhone"
              value={businessDetails.registeredCompany.ceoPhone}
              onChange={handleRegisteredCompanyChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CEO Email"
              name="ceoEmail"
              type="email"
              value={businessDetails.registeredCompany.ceoEmail}
              onChange={handleRegisteredCompanyChange}
            />
          </Grid>
        </>
      )
    }

    return null
  }


  return (
    <>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Business Details</Typography>
        <Divider sx={{ mb: 4 }} />
      </Grid>

      {/* Basic Business Info */}
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Business Name"
          name="businessName"
          value={businessDetails.businessName}
          onChange={handleBusinessChange}
          placeholder="As per license/registration certificate"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Business Name Code"
          name="businessNameCode"
          value={businessDetails.businessNameCode}
          onChange={handleBusinessChange}
          placeholder="Abbreviation for invoice prefix"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="License No"
          name="licenseNo"
          value={businessDetails.licenseNo}
          onChange={handleBusinessChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Company Registration No"
          name="companyRegistrationNo"
          value={businessDetails.companyRegistrationNo}
          onChange={handleBusinessChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Taxpayer Number (TPN)"
          name="taxpayerNumber"
          value={businessDetails.taxpayerNumber}
          onChange={handleBusinessChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          select
          label="Taxpayer Type"
          name="taxpayerType"
          value={businessDetails.taxpayerType}
          onChange={handleBusinessChange}
        >
          <MenuItem value="Mandatory Filer">Mandatory Filer</MenuItem>
          <MenuItem value="Voluntary Filer">Voluntary Filer</MenuItem>
        </TextField>
      </Grid>


      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Taxpayer Registration Region</InputLabel>
          <Select
            label="Taxpayer Registration Region"
            name="taxpayerRegistrationRegion"
            value={businessDetails.taxpayerRegistrationRegion}
            onChange={handleBusinessChange}
          >
            <MenuItem value="RRCO Thimphu">RRCO Thimphu</MenuItem>
            <MenuItem value="RRCO Paro">RRCO Paro</MenuItem>
            <MenuItem value="RRCO Phuntsholing">RRCO Phuntsholing</MenuItem>
            <MenuItem value="RRCO Samtse">RRCO Samtse</MenuItem>
            <MenuItem value="RRCO Gelephu">RRCO Gelephu</MenuItem>
            <MenuItem value="RRCO Samdrupjongkhar">RRCO Samdrupjongkhar</MenuItem>
            <MenuItem value="RRCO Mongar">RRCO Mongar</MenuItem>
            <MenuItem value="RRCO Bumthang">RRCO Bumthang</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Business License Region</InputLabel>
          <Select
            label="Business License Region"
            name="businessLicenseRegion"
            value={businessDetails.businessLicenseRegion}
            onChange={handleBusinessChange}
          >
            <MenuItem value="Thimphu">Thimphu</MenuItem>
            <MenuItem value="Phuentsholing">Phuentsholing</MenuItem>
            <MenuItem value="Gelephu">Gelephu</MenuItem>
            <MenuItem value="Samdrup Jongkhar">Samdrup Jongkhar</MenuItem>
            <MenuItem value="Mongar">Mongar</MenuItem>
            <MenuItem value="Bumthang">Bumthang</MenuItem>
          </Select>
        </FormControl>
      </Grid>


      {/* Business Location */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Business Location
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Dzongkhag</InputLabel>
          <Select
            label="Dzongkhag"
            value={businessDetails.businessLocation.dzongkhag}
            onChange={(e) => {
              const selectedDzongkhag = dzongkhags.find(dz => dz.name === e.target.value);
              // console.log(selectedDzongkhag)
              setSelectedDzongkhag(selectedDzongkhag.dzongkhagId); // store ID
              handleBusinessLocationChange("businessLocation", "dzongkhag", e.target.value);
            }}

            disabled={loadingLocations}
          >
            {dzongkhags.map((dz) => (
              <MenuItem key={dz.dzongkhagId} value={dz.name}>
                {dz.name}
              </MenuItem>
            ))}
          </Select>
          {loadingLocations && <FormHelperText>Loading...</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Gewog</InputLabel>
          <Select
            label="Gewog"
            value={businessDetails.businessLocation.gewog}
            onChange={(e) => {
              const selectedGewog = gewogs.find(gw => gw.name === e.target.value);
              setSelectedGewog(selectedGewog.gewogId);
              handleBusinessLocationChange("businessLocation", "gewog", e.target.value)
            }}
            disabled={!businessDetails.businessLocation.dzongkhag || loadingLocations}
          >
            {gewogs.map((gw) => (
              <MenuItem key={gw.gewogId} value={gw.name}>
                {gw.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Village</InputLabel>
          <Select
            label="Village"
            value={businessDetails.businessLocation.village}
            onChange={(e) => {
              const selectedVillage = villages.find(vl => vl.name === e.target.value);
              setSelectedVillage(selectedVillage.villageId);
              handleBusinessLocationChange("businessLocation", "village", e.target.value)
            }}
            disabled={!businessDetails.businessLocation.gewog || loadingLocations}
          >
            {villages.map((vl) => (
              <MenuItem key={vl.villageId} value={vl.name}>
                {vl.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Street Name (Optional)"
          value={businessDetails.businessLocation.wardName}
          onChange={(e) => handleBusinessLocationChange("businessLocation", "wardName", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Building No (Optional)"
          value={businessDetails.businessLocation.buildingNo}
          onChange={(e) => handleBusinessLocationChange("businessLocation", "buildingNo", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Flat No (Optional)"
          value={businessDetails.businessLocation.flatNo}
          onChange={(e) => handleBusinessLocationChange("businessLocation", "flatNo", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Locality"
          value={businessDetails.businessLocation.locality}
          onChange={(e) => handleBusinessLocationChange("businessLocation", "locality", e.target.value)}
        />
      </Grid>

      {/* Office Location (Optional - Same as Business Location by default) */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Office Location
        </Typography>
      </Grid>

      {renderOfficeLocationSection()}


      {/* Ownership Type */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Ownership Type</InputLabel>
          <Select
            label="Ownership Type"
            name="ownershipType"
            value={businessDetails.ownershipType}
            onChange={handleBusinessChange}
          >
            {OWNERSHIP_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {/* Ownership Details based on Ownership Type */}
      {renderOwnershipDetails()}




    </>
  )
}

export default RenderBusinessForm