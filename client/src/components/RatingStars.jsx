import { useState } from 'react';
import './RatingStars.css';

/**
 * RatingStars Component
 * Interactive star rating component
 */
const RatingStars = ({
    rating = 0,
    onRate,
    readonly = false,
    size = 'medium',
    showCount = false,
    count = 0
}) => {
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleMouseEnter = (star) => {
        if (!readonly) {
            setHoveredRating(star);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoveredRating(0);
        }
    };

    const handleClick = (star) => {
        if (!readonly && onRate) {
            onRate(star);
        }
    };

    const displayRating = hoveredRating || rating;

    return (
        <div className={`rating-stars ${size} ${readonly ? 'readonly' : 'interactive'}`}>
            <div className="stars" onMouseLeave={handleMouseLeave}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star ${star <= displayRating ? 'filled' : 'empty'}`}
                        onMouseEnter={() => handleMouseEnter(star)}
                        onClick={() => handleClick(star)}
                        disabled={readonly}
                        aria-label={`Rate ${star} stars`}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                    </button>
                ))}
            </div>
            {showCount && count > 0 && (
                <span className="rating-count">({count})</span>
            )}
        </div>
    );
};

export default RatingStars;
