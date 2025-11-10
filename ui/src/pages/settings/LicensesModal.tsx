import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import BaseModal from '../../components/modal/BaseModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LicensesModalProps {
  open: boolean;
  onClose: () => void;
}

const LicensesModal = ({ open, onClose }: LicensesModalProps) => {
  const [licenseContent, setLicenseContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const licenseResp = await fetch('/LICENSE');

      if (!licenseResp.ok) {
        setError(
          'Some license information could not be loaded. Please try again or contact support if the issue persists.',
        );
        return;
      }
      const licenseText = await licenseResp.text();
      setLicenseContent(licenseText);
    } catch (err) {
      console.error('Error fetching licenses:', err);
      setError('Failed to load license information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !licenseContent) {
      void fetchLicenses();
    }
  }, [open, licenseContent, fetchLicenses]);

  const handleRetry = useCallback(() => {
    void fetchLicenses();
  }, [fetchLicenses]);

  const currentYear = new Date().getFullYear();
  const markdown = `Copyright ${currentYear} Australian Digital Health Agency ABN 84 425 496 912.

This software is licensed under the Apache 2.0 License.

${licenseContent}`;

  return (
    <BaseModal
      open={open}
      handleClose={onClose}
      sx={{
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90%',
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4">Licenses and Attributions</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box p={3}>
            <Typography color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Button onClick={handleRetry} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        )}

        {licenseContent && !loading && (
          <Box
            sx={{
              maxHeight: 'calc(90vh - 150px)',
              overflow: 'auto',
              '& h1, & h2, & h3': {
                color: 'primary.main',
                fontWeight: 'bold',
              },
              '& h2': {
                fontSize: '1.5rem',
                marginTop: '1rem',
                marginBottom: '0.75rem',
              },
              '& pre': {
                backgroundColor: 'grey.100',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              },
              '& code': {
                backgroundColor: 'grey.100',
                padding: '0.125rem 0.25rem',
                borderRadius: '0.25rem',
                fontFamily: 'monospace',
              },
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ mt: 1 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
    </BaseModal>
  );
};

export default LicensesModal;
