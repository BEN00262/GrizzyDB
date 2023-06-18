import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from '@mui/material/Button';
import { useState } from 'react';
import ProvisionModal from './Provision';
import StorageIcon from '@mui/icons-material/Storage';

function Hero() {
    const [isProvisionModalopen, setIsProvisionModalOpen] = useState(false);

    return (
        <div className='hero'>
            <Container className='hero-main'>
                <ProvisionModal
                    open={isProvisionModalopen}
                    handleClose={() => setIsProvisionModalOpen(false)}
                />
                <Row>
                    <Col className='pb-3' style={{
                        marginTop: "250px",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Button 
                            variant="contained"
                            style={{
                                color: "white",
                                backgroundColor: "black",
                                border: "1px solid #000"
                            }}
                            endIcon={<StorageIcon />}
                            onClick={() => setIsProvisionModalOpen(true)}
                        >
                            create database
                        </Button>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Hero