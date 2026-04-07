'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

// Yes/No Options
const YES_NO_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" }
]

const RenderCorporationForm = ({ corporationDetails, handleCorporationChange }) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
          Corporation Information
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Corporation Name"
          name="corporationName"
          value={corporationDetails.corporationName}
          onChange={handleCorporationChange}
          placeholder="Corporation name"
        />
      </Grid>

      {/* Tax Information Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
          Tax Information
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Tax Payer Registered</InputLabel>
          <Select
            label="Tax Payer Registered"
            name="taxPayerRegStatus"
            value={corporationDetails.taxPayerRegStatus}
            onChange={handleCorporationChange}
          >
            {YES_NO_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/*      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Tax Payer Registration No"
          name="taxPayerRegNo"
          value={corporationDetails.taxPayerRegNo}
          onChange={handleCorporationChange}
          placeholder="Tax registration number"
          disabled={corporationDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Tax Payer Region"
          name="taxPayerRegion"
          value={corporationDetails.taxPayerRegion}
          onChange={handleCorporationChange}
          placeholder="Tax region"
          disabled={corporationDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>*/}

      {corporationDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Registration No"
            name="taxPayerRegNo"
            value={corporationDetails.taxPayerRegNo}
            onChange={handleCorporationChange}
            placeholder="Tax registration number"
          />
        </Grid>
      )}

      {corporationDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            required
            select
            label="Tax Payer Region"
            name="taxPayerRegion"
            value={corporationDetails.taxPayerRegion}
            onChange={handleCorporationChange}
          >
            <MenuItem value="RRCO Thimphu">RRCO Thimphu</MenuItem>
            <MenuItem value="RRCO Paro">RRCO Paro</MenuItem>
            <MenuItem value="RRCO Phuntsholing">RRCO Phuntsholing</MenuItem>
            <MenuItem value="RRCO Samtse">RRCO Samtse</MenuItem>
            <MenuItem value="RRCO Gelephu">RRCO Gelephu</MenuItem>
            <MenuItem value="RRCO Samdrupjongkhar">RRCO Samdrupjongkhar</MenuItem>
            <MenuItem value="RRCO Mongar">RRCO Mongar</MenuItem>
            <MenuItem value="RRCO Bumthang">RRCO Bumthang</MenuItem>
          </TextField>
        </Grid>

      )}


      {/* Contact Information Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
          Contact Information
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          name="address"
          value={corporationDetails.address}
          onChange={handleCorporationChange}
          placeholder="Full address"
          multiline
          rows={2}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Office Email"
          name="officeEmail"
          type="email"
          value={corporationDetails.officeEmail}
          onChange={handleCorporationChange}
          placeholder="office@corporation.com"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Office Phone"
          name="officePhone"
          value={corporationDetails.officePhone}
          onChange={handleCorporationChange}
          placeholder="Office phone number"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Contact Person Name"
          name="contactName"
          value={corporationDetails.contactName}
          onChange={handleCorporationChange}
          placeholder="Contact person name"
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
          placeholder="contact@corporation.com"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Phone"
          name="contactPhone"
          value={corporationDetails.contactPhone}
          onChange={handleCorporationChange}
          placeholder="Contact phone number"
        />
      </Grid>
    </>
  )
}

export default RenderCorporationForm