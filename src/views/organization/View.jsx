'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation';

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { toast } from "sonner";
import {
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Stack,
  TextField
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import Link from 'next/link';

const View = ({ id }) => {
  const router = useRouter();
  const organizationId = id;

  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [details, setDetails] = useState(null);

  // Fetch organization data
  useEffect(() => {
    if (organizationId) {
      fetchOrganizationData();
    }
  }, [organizationId])

  const fetchOrganizationData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/organization/${organizationId}`);
      const data = await res.json();

      if (data.success && data.organization) {
        setOrganization(data.organization);
        setDetails(data.organization.details || {});
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get organization type label
  const getOrgTypeLabel = (type) => {
    switch (type) {
      case 'business': return 'Business';
      case 'government': return 'Government Agency';
      case 'corporation': return 'Corporation';
      case 'cso': return 'Civil Society Organization (CSO)';
      default: return type;
    }
  };

  // Get status chip
  const getStatusChip = (status) => {
    return status === 'A' ?
      <Chip label="Active" color="success" size="small" /> :
      <Chip label="Inactive" color="error" size="small" />;
  };

  // Render business details
  const renderBusinessDetails = () => {
    if (!details) return null;

    return (
      <>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon /> Business Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Business Name"
            value={details.businessName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Business Code"
            value={details.businessNameCode || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="License Number"
            value={details.licenseNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company Registration No"
            value={details.companyRegistrationNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Taxpayer Number (TPN)"
            value={details.taxpayerNumber || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Taxpayer Type"
            value={details.taxpayerType || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Taxpayer Registration Region"
            value={details.taxpayerRegistrationRegion || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Business License Region"
            value={details.businessLicenseRegion || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Ownership Type"
            value={details.ownershipType || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        {/* Business Location */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <LocationOnIcon /> Business Location
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        {renderLocationDetails(details.businessLocationJson, 'Business')}

        {/* Office Location */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <HomeWorkIcon /> Office Location
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        {renderLocationDetails(details.officeLocationJson, 'Office')}

        {/* Ownership Details */}
        {renderOwnershipDetails()}
      </>
    );
  };

  // Render location details
  const renderLocationDetails = (locationData, type) => {
    if (!locationData) {
      return (
        <Grid item xs={12}>
          <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
            No {type.toLowerCase()} location information available
          </Typography>
        </Grid>
      );
    }

    return (
      <>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Dzongkhag"
            value={locationData.dzongkhag || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Gewog"
            value={locationData.gewog || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Village"
            value={locationData.village || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Street Name"
            value={locationData.wardName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Building No"
            value={locationData.buildingNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Flat No"
            value={locationData.flatNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Locality"
            value={locationData.locality || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
      </>
    );
  };

  // Render ownership details based on type
  const renderOwnershipDetails = () => {
    if (!details) return null;

    const ownershipType = details.ownershipType;

    if (ownershipType === 'Sole Proprietorship') {
      return renderProprietorDetails();
    } else if (ownershipType === 'Partnership') {
      return renderPartnersDetails();
    } else if (ownershipType === 'Registered Company') {
      return renderCompanyDetails();
    }

    return null;
  };

  // Render proprietor details
  const renderProprietorDetails = () => {
    const proprietor = details.proprietorJson || {};

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <PersonIcon /> Proprietor Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CID"
            value={proprietor.cid || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name"
            value={proprietor.name || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone No"
            value={proprietor.phone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            value={proprietor.email || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
      </>
    );
  };

  // Render partners details
  const renderPartnersDetails = () => {
    const partners = details.partnersJson || [];

    if (partners.length === 0) {
      return (
        <Grid item xs={12}>
          <Typography color="textSecondary" sx={{ fontStyle: 'italic', mt: 3 }}>
            No partner information available
          </Typography>
        </Grid>
      );
    }

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <AssignmentIndIcon /> Partner Details ({partners.length} Partners)
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        {partners.map((partner, index) => (
          <Grid item xs={12} key={index}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BadgeIcon /> Partner {index + 1}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="CID"
                      value={partner.cid || 'N/A'}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={partner.name || 'N/A'}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone No"
                      value={partner.phone || 'N/A'}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={partner.email || 'N/A'}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </>
    );
  };

  // Render registered company details
  const renderCompanyDetails = () => {
    const company = details.registeredCompanyJson || {};

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <CorporateFareIcon /> Registered Company Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CEO/MD Name"
            value={company.ceoMdName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CEO Phone No"
            value={company.ceoPhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CEO Email"
            value={company.ceoEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
      </>
    );
  };

  // Render government agency details
  const renderGovernmentDetails = () => {
    if (!details) return null;

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CorporateFareIcon /> Government Agency Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Agency Name"
            value={details.agencyName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Agency Code"
            value={details.agencyCode || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="TPN"
            value={details.tpn || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Taxpayer Registration Region"
            value={details.taxpayerRegistrationRegion || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Registration Type"
            value={details.registrationType || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <PersonIcon /> Contact Person Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Person Name"
            value={details.contactPerson || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Email"
            value={details.contactEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Phone No"
            value={details.contactPhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
      </>
    );
  };

  // Render corporation details
  const renderCorporationDetails = () => {
    if (!details) return null;

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon /> Corporation Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Corporation Name"
            value={details.corporationName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Organization Code"
            value={details.organizationCode || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="TPN"
            value={details.tpn || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Taxpayer Registration Region"
            value={details.taxpayerRegistrationRegion || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Registration Type"
            value={details.registrationType || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <PersonIcon /> Contact Person Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Person Name"
            value={details.contactPerson || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Email"
            value={details.contactEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Phone No"
            value={details.contactPhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
      </>
    );
  };

  // Render CSO details
  const renderCsoDetails = () => {
    if (!details) return null;

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIndIcon /> CSO Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Agency Name"
            value={details.agencyName || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Agency Code"
            value={details.agencyCode || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Registration No"
            value={details.registrationNo || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="TPN"
            value={details.tpn || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Taxpayer Registration Region"
            value={details.taxpayerRegistrationRegion || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Registration Type"
            value={details.registrationType || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
            <PersonIcon /> Contact Person Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Person Name"
            value={details.contactPerson || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Email"
            value={details.contactEmail || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Phone No"
            value={details.contactPhone || 'N/A'}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Grid>
      </>
    );
  };

  // Render details based on organization type
  const renderDetailsByType = () => {
    if (!organization) return null;

    switch (organization.orgType) {
      case "business":
        return renderBusinessDetails();
      case "government":
        return renderGovernmentDetails();
      case "corporation":
        return renderCorporationDetails();
      case "cso":
        return renderCsoDetails();
      default:
        return null;
    }
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h6">
              Loading organization details...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Show error if no organization
  if (!organization) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h6" color="error">
              Organization not found
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              Organization Details
            </Typography>
          
          </Box>
        }
      />

      <CardContent>
        {/* Organization Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Organization Type
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getOrgTypeLabel(organization.orgType)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Status
                    </Typography>
                    <Box>{getStatusChip(organization.status)}</Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created On
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(organization.createdAt)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(organization.updatedAt)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Organization ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      #{organization.id}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Organization Details */}
        <Grid container spacing={3}>
          {renderDetailsByType()}
        </Grid>

        {/* Action Buttons at Bottom */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
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
                Close
              </Button>
            </Link>

          </Box>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default View;