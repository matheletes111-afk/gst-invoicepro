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

const RenderCsoForm = ({ csoDetails, handleCsoChange }) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
          CSO Information
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="CSO Registration No"
          name="csoRegistrationNo"
          value={csoDetails.csoRegistrationNo}
          onChange={handleCsoChange}
          placeholder="CSO registration number"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="CSO Name"
          name="csoName"
          value={csoDetails.csoName}
          onChange={handleCsoChange}
          placeholder="CSO name"
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
            value={csoDetails.taxPayerRegStatus}
            onChange={handleCsoChange}
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
          value={csoDetails.taxPayerRegNo}
          onChange={handleCsoChange}
          placeholder="Tax registration number"
          disabled={csoDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Tax Payer Region"
          name="taxPayerRegion"
          value={csoDetails.taxPayerRegion}
          onChange={handleCsoChange}
          placeholder="Tax region"
          disabled={csoDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>*/}

      {csoDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Registration No"
            name="taxPayerRegNo"
            value={csoDetails.taxPayerRegNo}
            onChange={handleCsoChange}
            placeholder="Tax registration number"
          />
        </Grid>
      )}

      {csoDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
          required
            fullWidth
            select
            label="Tax Payer Region"
            name="taxPayerRegion"
            value={csoDetails.taxPayerRegion}
            onChange={handleCsoChange}
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
          value={csoDetails.address}
          onChange={handleCsoChange}
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
          value={csoDetails.officeEmail}
          onChange={handleCsoChange}
          placeholder="office@cso.org"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Office Phone"
          name="officePhone"
          value={csoDetails.officePhone}
          onChange={handleCsoChange}
          placeholder="Office phone number"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Contact Person Name"
          name="contactName"
          value={csoDetails.contactName}
          onChange={handleCsoChange}
          placeholder="Contact person name"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={csoDetails.contactEmail}
          onChange={handleCsoChange}
          placeholder="contact@cso.org"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Phone"
          name="contactPhone"
          value={csoDetails.contactPhone}
          onChange={handleCsoChange}
          placeholder="Contact phone number"
        />
      </Grid>
    </>
  )
}

export default RenderCsoForm