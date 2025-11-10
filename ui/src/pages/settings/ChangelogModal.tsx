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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BaseModal from '../../components/modal/BaseModal';

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

const ChangelogModal = ({ open, onClose }: ChangelogModalProps) => {
  const [changelogContent, setChangelogContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchChangelog = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch the changelog from the public folder or API endpoint
      const response = await fetch('/CHANGELOG.md');
      if (!response.ok) {
        setError('Failed to load changelog');
        return;
      }
      const content = await response.text();
      setChangelogContent(content);
    } catch (err) {
      setError('Failed to load changelog');
      console.error('Error fetching changelog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !changelogContent) {
      void fetchChangelog();
    }
  }, [open, changelogContent, fetchChangelog]);

  const handleRetry = useCallback(() => {
    void fetchChangelog();
  }, [fetchChangelog]);

  return (
    <BaseModal
      open={open}
      handleClose={onClose}
      sx={{
        width: '90%',
        maxWidth: '800px',
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
        <Typography variant="h4">Changelog</Typography>
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
            <Typography color="error">{error}</Typography>
            <Button onClick={handleRetry} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        )}

        {changelogContent && !loading && (
          <Box
            sx={{
              maxHeight: 'calc(90vh - 150px)',
              overflow: 'auto',
              '& h1, & h2, & h3': {
                color: 'primary.main',
                fontWeight: 'bold',
              },
              '& h1': {
                fontSize: '2rem',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
              },
              '& h2': {
                fontSize: '1.5rem',
                marginTop: '2rem',
                marginBottom: '1rem',
              },
              '& h3': {
                fontSize: '1.2rem',
                marginTop: '1.5rem',
                marginBottom: '0.5rem',
              },
              '& ul': {
                paddingLeft: '1.5rem',
              },
              '& li': {
                marginBottom: '0.25rem',
              },
              '& code': {
                backgroundColor: 'grey.100',
                padding: '0.125rem 0.25rem',
                borderRadius: '0.25rem',
                fontFamily: 'monospace',
              },
              '& pre': {
                backgroundColor: 'grey.100',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {changelogContent}
            </ReactMarkdown>
          </Box>
        )}
      </DialogContent>
    </BaseModal>
  );
};

export default ChangelogModal;
