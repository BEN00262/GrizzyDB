import React from 'react';
import { Carousel } from 'antd';

const contentStyle: React.CSSProperties = {
  margin: 0,
  height: '500px',
  // color: '#fff',
  // lineHeight: '160px',
  // textAlign: 'center',
  // background: '#364d79',
  border: "2px solid #efefef"
};

const FeaturesComp = () => {
    const onChange = (currentSlide: number) => {
        console.log(currentSlide);
      };
    
      return (
        <Carousel afterChange={onChange} adaptiveHeight={true}>
          <div style={contentStyle}>
            <img src="/editor.png" alt="Grizzy DB editor"/>
          </div>
        </Carousel>
    );
}

export default FeaturesComp;