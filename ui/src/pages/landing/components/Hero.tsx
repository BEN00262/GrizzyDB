import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from '@mui/material/Button';
import { useState } from 'react';
import ProvisionModal from './Provision';
import StorageIcon from '@mui/icons-material/Storage';
import { TypeAnimation } from 'react-type-animation';

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
                        marginTop: "100px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "40px"
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <h1 className='action-text' style={{
                                letterSpacing: "2px"
                            }}>
                                <TypeAnimation
                                    sequence={["Free Ephemeral Relational Databases for all your testing needs"]}
                                    wrapper="span"
                                    speed={30}
                                    cursor={false}
                                />
                            </h1>
                            <h5 className='action-text'>Be up and running in less than a minute</h5>
                        </div>

                        <Button 
                            variant="outlined"
                            style={{
                                color: "black",
                                fontWeight: "bold",
                                letterSpacing: "2px",
                                // backgroundColor: "black",
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