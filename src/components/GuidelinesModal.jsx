import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Stack, Divider 
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

export default function GuidelinesModal({ open, onClose }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', p: 1 }
      }}
    >
      {/* Modal Header */}
      <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LibraryBooksIcon sx={{ color: '#0f172a' }} />
        Course Registration Guidelines
      </DialogTitle>
      
      <Divider sx={{ mx: 3 }} />

      {/* Modal Body Instructions */}
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          <Box display="flex" gap={2}>
            <CheckCircleOutlineIcon sx={{ color: '#10b981', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Step 1: Select Your Core Courses
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Check the boxes next to the courses assigned to your current semester level layout panel. 
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <CheckCircleOutlineIcon sx={{ color: '#10b981', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Step 2: Complete Face ID Biometrics
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Ensure your Face ID biometric verification is successfully scanned and activated in the right side panel to validate automated lecture attendance tracking.
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <PriorityHighIcon sx={{ color: '#f59e0b', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Important Deadlines & Limits
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                The maximum workload capacity allowed per student is **24 credit units** per semester term. Late registration windows incur penalty reviews.
              </Typography>
            </Box>
          </Box>

        </Stack>
      </DialogContent>

      {/* Action Buttons */}
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          disableElevation
          sx={{ 
            bgcolor: '#0f172a', 
            color: 'white', 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#1e293b' }
          }}
        >
          Got it, thanks!
        </Button>
      </DialogActions>
    </Dialog>
  );
}