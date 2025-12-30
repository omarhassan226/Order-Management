import { useState, useEffect } from 'react';
import { favoriteAPI } from '../services/api';
import toast from 'react-hot-toast';
import './FavoriteButton.css';

/**
 * FavoriteButton Component
 * Heart button to toggle favorite status
 */
const FavoriteButton = ({ beverageId, initialIsFavorite = false, size = 'medium' }) => {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsFavorite(initialIsFavorite);
    }, [initialIsFavorite]);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation(); // Prevent event bubbling

        if (isLoading) return;

        setIsLoading(true);
        const previousState = isFavorite;

        try {
            // Optimistic update
            setIsFavorite(!isFavorite);

            const result = await favoriteAPI.toggleFavorite(beverageId);

            toast.success(result.message, {
                icon: result.isFavorite ? '❤️' : '🤍',
                duration: 2000,
            });
        } catch (error) {
            // Revert on error
            setIsFavorite(previousState);
            toast.error(error.message || 'فشل في تحديث المفضلة');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            className={`favorite-btn ${size} ${isFavorite ? 'is-favorite' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={handleToggleFavorite}
            disabled={isLoading}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
            <svg
                className="heart-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        </button>
    );
};

export default FavoriteButton;
