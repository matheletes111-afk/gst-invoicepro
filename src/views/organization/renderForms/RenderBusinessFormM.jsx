import React from 'react'

const RenderBusinessForm = ({ businessDetails, handleBusinessChange }) => {
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
                label="Taxpayer Type"
                name="taxpayerType"
                value={businessDetails.taxpayerType}
                onChange={handleBusinessChange}
              />
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