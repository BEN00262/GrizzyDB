import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from '@mui/material/Button';
import { useState } from 'react';
import ProvisionModal from './Provision';
import StorageIcon from '@mui/icons-material/Storage';
import { TypeAnimation } from 'react-type-animation';
import { useNavigate } from 'react-router-dom';
import { useLoginWithGoogleAuth } from '../../../hooks';
import LoginComponent from '../../../components/Login';

function Hero() {
    const [isProvisionModalopen, setIsProvisionModalOpen] = useState(false);
    const navigate = useNavigate();
    // const { login } = useLoginWithGoogleAuth();

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
                                    sequence={["Figma for your database schemas"]}
                                    wrapper="span"
                                    speed={30}
                                    cursor={false}
                                />
                            </h1>
                            <h5 className='action-text'>Be up and running in less than a minute</h5>
                        </div>

                        <LoginComponent/>

                        {/* <Button 
                            variant="outlined"
                            className='action-text'
                            style={{
                                color: "black",
                                fontWeight: "bold",
                                letterSpacing: "2px",
                                border: "1px solid #000"
                            }}
                            endIcon={<StorageIcon />}
                            onClick={() => login()}
                        >
                            get started
                        </Button> */}
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Hero