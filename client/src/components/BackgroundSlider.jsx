/**
 * BackgroundSlider Component
 * Animated background that changes every 3 seconds with smooth transitions
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './BackgroundSlider.css';

// Background image sets for different themes
const BACKGROUND_THEMES = {
    login: [
        '/images/backgrounds/bg1.png',
        '/images/backgrounds/bg2.png',
        '/images/backgrounds/bg3.png',
        '/images/backgrounds/bg4.png'
    ],
    employee: [
        '/images/backgrounds/employee_bg1.png',
        '/images/backgrounds/employee_bg2.png',
        '/images/backgrounds/employee_bg3.png',
        '/images/backgrounds/employee_bg4.png'
    ],
    officeboy: [
        '/images/backgrounds/officeboy_bg1.png',
        '/images/backgrounds/officeboy_bg2.png',
        '/images/backgrounds/officeboy_bg3.png',
        '/images/backgrounds/officeboy_bg4.png'
    ],
    admin: [
        '/images/backgrounds/admin_bg1.png',
        '/images/backgrounds/admin_bg2.png',
        '/images/backgrounds/admin_bg3.png',
        '/images/backgrounds/admin_bg4.png'
    ]
};

const BackgroundSlider = ({ theme = 'login' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Get backgrounds based on theme
    const backgrounds = BACKGROUND_THEMES[theme] || BACKGROUND_THEMES.login;

    useEffect(() => {
        // Change background every 3 seconds
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [backgrounds.length]);

    return (
        <div className="background-slider">
            {backgrounds.map((bg, index) => (
                <div
                    key={index}
                    className={`background-slide ${index === currentIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${bg})` }}
                />
            ))}
            {/* Overlay for better text readability */}
            <div className="background-overlay" />
        </div>
    );
};

BackgroundSlider.propTypes = {
    theme: PropTypes.oneOf(['login', 'employee', 'officeboy', 'admin'])
};

export default BackgroundSlider;
