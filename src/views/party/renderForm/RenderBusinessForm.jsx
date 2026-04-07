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

const RenderBusinessForm = ({ businessDetails, handleBusinessChange }) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
          Business Information
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="License No"
          name="licenseNo"
          value={businessDetails.licenseNo}
          onChange={handleBusinessChange}
          placeholder="Business license number"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Business Name"
          name="businessName"
          value={businessDetails.businessName}
          onChange={handleBusinessChange}
          placeholder="Business Name"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Company Registration No"
          name="companyRegistrationNo"
          value={businessDetails.companyRegistrationNo}
          onChange={handleBusinessChange}
          placeholder="Registration number"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Business License Region"
          name="businessLicenseRegion"
          value={businessDetails.businessLicenseRegion}
          onChange={handleBusinessChange}
          placeholder="Region"
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
            value={businessDetails.taxPayerRegStatus}
            onChange={handleBusinessChange}
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
          value={businessDetails.taxPayerRegNo}
          onChange={handleBusinessChange}
          placeholder="Tax registration number"
          disabled={businessDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Tax Payer Region"
          name="taxPayerRegion"
          value={businessDetails.taxPayerRegion}
          onChange={handleBusinessChange}
          placeholder="Tax region"
          disabled={businessDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>*/}

      {businessDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Registration No"
            name="taxPayerRegNo"
            value={businessDetails.taxPayerRegNo}
            onChange={handleBusinessChange}
            placeholder="Tax registration number"
          />
        </Grid>
      )}

      {businessDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
          required
            fullWidth
            select
            label="Tax Payer Region"
            name="taxPayerRegion"
            value={businessDetails.taxPayerRegion}
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
          </TextField>
        </Grid>

      )}


      {/* Contact Information Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
          Address & Contact Information
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          name="address"
          value={businessDetails.address}
          onChange={handleBusinessChange}
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
          value={businessDetails.officeEmail}
          onChange={handleBusinessChange}
          placeholder="office@company.com"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Office Phone"
          name="officePhone"
          value={businessDetails.officePhone}
          onChange={handleBusinessChange}
          placeholder="Office phone number"
        />
      </Grid>

      {/* Representative Information */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
          Representative Information
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Representative Name"
          name="representativeName"
          value={businessDetails.representativeName}
          onChange={handleBusinessChange}
          placeholder="Representative name"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Representative Email"
          name="representativeEmail"
          type="email"
          value={businessDetails.representativeEmail}
          onChange={handleBusinessChange}
          placeholder="representative@email.com"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Representative Phone"
          name="representativePhone"
          value={businessDetails.representativePhone}
          onChange={handleBusinessChange}
          placeholder="Representative phone"
        />
      </Grid>
    </>
  )
}

export default RenderBusinessForm