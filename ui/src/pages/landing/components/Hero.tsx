import { useState } from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { TypeAnimation } from 'react-type-animation';
import LoginComponent from '../../../components/Login';
import ProvisionModal from './Provision';

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
                                letterSpacing: "2px",
                                marginBottom: "20px",
                                fontSize: 40,
                                fontWeight: 800
                            }}>
                                <TypeAnimation
                                    sequence={["Instant, Easy, Ephemeral Database Magic for Developers! ✨🚀🧪"]}
                                    wrapper="span"
                                    speed={30}
                                    cursor={false}
                                />
                            </h1>
                            <h5 className='action-text'>Instant Data Magic! ✨ Fast, Easy, and Gone in a Snap! 🚀 Test your ideas with our Ephemeral DBs! 🧪 <br/>#DevMagic #DataPlayground</h5>
                        </div>

                        <LoginComponent/>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Hero