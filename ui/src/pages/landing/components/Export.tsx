import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import { useState } from "react";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 1000,
    bgcolor: 'background.paper',
    border: '1px solid #efefef',
    boxShadow: 24,
    borderRadius: '2px',
    p: 4,
};

const ExportComponent = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button variant="text" size="small" onClick={handleOpen} color="primary">
        export
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            We are exporting
        </Box>
      </Modal>
    </div>
  );
};

export default ExportComponent;
