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

const RenderIndividualForm = ({ individualDetails, handleIndividualChange }) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
          Individual Information
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="CID"
          name="cid"
          value={individualDetails.cid}
          onChange={handleIndividualChange}
          placeholder="Citizen ID"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Name"
          name="name"
          value={individualDetails.name}
          onChange={handleIndividualChange}
          placeholder="Enter Name"
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
            value={individualDetails.taxPayerRegStatus}
            onChange={handleIndividualChange}
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
          value={individualDetails.taxPayerRegNo}
          onChange={handleIndividualChange}
          placeholder="Tax registration number"
          disabled={individualDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Tax Payer Region"
          name="taxPayerRegion"
          value={individualDetails.taxPayerRegion}
          onChange={handleIndividualChange}
          placeholder="Tax region"
          disabled={individualDetails.taxPayerRegStatus === "NO"}
        />
      </Grid>*/}

      {individualDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tax Payer Registration No"
            name="taxPayerRegNo"
            value={individualDetails.taxPayerRegNo}
            onChange={handleIndividualChange}
            placeholder="Tax registration number"
          />
        </Grid>
      )}

      {individualDetails.taxPayerRegStatus !== "NO" && (
        <Grid item xs={12} md={4}>
          <TextField
          required
            fullWidth
            select
            label="Tax Payer Region"
            name="taxPayerRegion"
            value={individualDetails.taxPayerRegion}
            onChange={handleIndividualChange}
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

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={individualDetails.email}
          onChange={handleIndividualChange}
          placeholder="individual@email.com"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Phone"
          name="phone"
          value={individualDetails.phone}
          onChange={handleIndividualChange}
          placeholder="Phone number"
        />
      </Grid>
    </>
  )
}

export default RenderIndividualForm