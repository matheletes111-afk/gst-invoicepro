import React from 'react'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material'

const RenderCorporationForm = ({
  corporationDetails,
  handleCorporationChange,
  REGISTRATION_TYPES
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Corporation Details</Typography>
        <Divider sx={{ mb: 4 }} />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Corporation Name"
          name="corporationName"
          value={corporationDetails.corporationName}
          onChange={handleCorporationChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Organization Code"
          name="organizationCode"
          value={corporationDetails.organizationCode}
          onChange={handleCorporationChange}
          placeholder="Abbreviation for invoice prefix"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="TPN"
          name="tpn"
          value={corporationDetails.tpn}
          onChange={handleCorporationChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Taxpayer Registration Region</InputLabel>
          <Select
            label="Taxpayer Registration Region"
            name="taxpayerRegistrationRegion"
            value={corporationDetails.taxpayerRegistrationRegion}
            onChange={handleCorporationChange}
          >
            <MenuItem value="RRCO Thimphu">RRCO Thimphu</MenuItem>
            <MenuItem value="RRCO Phuentsholing">RRCO Phuentsholing</MenuItem>
            <MenuItem value="RRCO Gelephu">RRCO Gelephu</MenuItem>
            <MenuItem value="RRCO Samdrup Jongkhar">RRCO Samdrup Jongkhar</MenuItem>
            <MenuItem value="RRCO Mongar">RRCO Mongar</MenuItem>
            <MenuItem value="RRCO Bumthang">RRCO Bumthang</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Registration Type</InputLabel>
          <Select
            label="Registration Type"
            name="registrationType"
            value={corporationDetails.registrationType}
            onChange={handleCorporationChange}
          >
            {REGISTRATION_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Contact Person Details
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Person Name"
          name="contactPerson"
          value={corporationDetails.contactPerson}
          onChange={handleCorporationChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={corporationDetails.contactEmail}
          onChange={handleCorporationChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Phone No"
          name="contactPhone"
          value={corporationDetails.contactPhone}
          onChange={handleCorporationChange}
        />
      </Grid>
    </>
  )
}

export default RenderCorporationForm