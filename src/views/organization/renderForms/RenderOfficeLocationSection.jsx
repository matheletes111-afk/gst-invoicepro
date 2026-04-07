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

const RenderOfficeLocationSection = ({
  businessDetails,
  handleBusinessLocationChange,
  dzongkhagsOffice,
  gewogsOffice,
  villagesOffice,
  loadingLocations,
  setSelectedDzongkhagOffice,
  setSelectedGewogOffice,
  setSelectedVillageOffice
}) => {
  return (
    <>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Dzongkhag</InputLabel>
          <Select
            label="Dzongkhag"
            value={businessDetails.officeLocation.dzongkhag}
            onChange={(e) => {
              const selectedDzongkhag = dzongkhagsOffice.find(dz => dz.name === e.target.value);
              // console.log(selectedDzongkhag)
              setSelectedDzongkhagOffice(selectedDzongkhag.dzongkhagId); // store ID
              handleBusinessLocationChange("officeLocation", "dzongkhag", e.target.value)
            }}
            disabled={loadingLocations}
          >
            {dzongkhagsOffice.map((dz) => (
              <MenuItem key={dz.dzongkhagId} value={dz.name}>
                {dz.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Gewog</InputLabel>
          <Select
            label="Gewog"
            value={businessDetails.officeLocation.gewog}
            onChange={(e) => {
              const selectedGewog = gewogsOffice.find(gw => gw.name === e.target.value);
              setSelectedGewogOffice(selectedGewog.gewogId);
              handleBusinessLocationChange("officeLocation", "gewog", e.target.value);
            }}
            disabled={!businessDetails.officeLocation.dzongkhag || loadingLocations}
          >
            {gewogsOffice.map((gw) => (
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
            value={businessDetails.officeLocation.village}
            onChange={(e) => {
              const selectedVillage = villagesOffice.find(vl => vl.name === e.target.value);
              setSelectedVillageOffice(selectedVillage.villageId);
              handleBusinessLocationChange("officeLocation", "village", e.target.value);
            }}
            disabled={!businessDetails.officeLocation.gewog || loadingLocations}
          >
            {villagesOffice.map((vl) => (
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
          value={businessDetails.officeLocation.wardName}
          onChange={(e) => handleBusinessLocationChange("officeLocation", "wardName", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Building No (Optional)"
          value={businessDetails.officeLocation.buildingNo}
          onChange={(e) => handleBusinessLocationChange("officeLocation", "buildingNo", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Flat No (Optional)"
          value={businessDetails.officeLocation.flatNo}
          onChange={(e) => handleBusinessLocationChange("officeLocation", "flatNo", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Locality"
          value={businessDetails.officeLocation.locality}
          onChange={(e) => handleBusinessLocationChange("officeLocation", "locality", e.target.value)}
        />
      </Grid>

    </>
  )
}

export default RenderOfficeLocationSection