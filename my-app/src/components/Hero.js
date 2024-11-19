import React from 'react';

const Hero = () => {
    return (
        <div className="main">
            <div className="main__container">
                <div className="main__content">
                    <h1>AZ Tickets</h1>
                    <h2>Technology</h2>
                    <p>See what makes us different.</p>
                    <button className="main__btn">
                        <a href="/">Get Started</a>
                    </button>
                </div>
                <div className="main__img--container">
                    <img src="images/pic5.svg" alt="pic" id="main__img" />
                </div>
            </div>
        </div>
    );
};

export default Hero;
