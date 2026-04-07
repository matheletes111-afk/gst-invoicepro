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

const RenderGovernmentForm = ({ governmentDetails, handleGovernmentChange }) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
          Government Agency Information
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Agency Name"
          name="agencyName"
          value={governmentDetails.agencyName}
          onChange={handleGovernmentChange}
          placeholder="Government agency name"
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
            value={governmentDetails.taxPayerRegStatus}
            onChange={handleGovernmentChange}
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
          value={governmentDetails.taxPayerRegNo}
          onChange={handleGovernmentChange}
          placeholder="Tax registration number"
          disabled={governmentDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Tax Payer Region"
          name="taxPayerRegion"
          value={governmentDetails.taxPayerRegion}
          onChange={handleGovernmentChange}
          placeholder="Tax region"
          disabled={governmentDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>*/}

      {governmentDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Registration No"
            name="taxPayerRegNo"
            value={governmentDetails.taxPayerRegNo}
            onChange={handleGovernmentChange}
            placeholder="Tax registration number"
          />
        </Grid>
      )}

      {governmentDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            required
            label="Tax Payer Region"
            name="taxPayerRegion"
            value={governmentDetails.taxPayerRegion}
            onChange={handleGovernmentChange}
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
          value={governmentDetails.address}
          onChange={handleGovernmentChange}
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
          value={governmentDetails.officeEmail}
          onChange={handleGovernmentChange}
          placeholder="office@agency.gov"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Office Phone"
          name="officePhone"
          value={governmentDetails.officePhone}
          onChange={handleGovernmentChange}
          placeholder="Office phone number"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Contact Person Name"
          name="contactName"
          value={governmentDetails.contactName}
          onChange={handleGovernmentChange}
          placeholder="Contact person name"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={governmentDetails.contactEmail}
          onChange={handleGovernmentChange}
          placeholder="contact@agency.gov"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Phone"
          name="contactPhone"
          value={governmentDetails.contactPhone}
          onChange={handleGovernmentChange}
          placeholder="Contact phone number"
        />
      </Grid>
    </>
  )
}

export default RenderGovernmentForm