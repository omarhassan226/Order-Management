import { useState, useEffect } from 'react';
import RatingStars from './RatingStars';
import './RatingModal.css';

/**
 * RatingModal Component
 * Modal for submitting beverage ratings and reviews
 */
const RatingModal = ({
    beverage,
    existingRating = null,
    onSubmit,
    onClose,
    isLoading = false
}) => {
    const [rating, setRating] = useState(existingRating?.rating || 0);
    const [review, setReview] = useState(existingRating?.review || '');
    const [isAnonymous, setIsAnonymous] = useState(existingRating?.is_anonymous || false);

    useEffect(() => {
        if (existingRating) {
            setRating(existingRating.rating);
            setReview(existingRating.review || '');
            setIsAnonymous(existingRating.is_anonymous || false);
        }
    }, [existingRating]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('يرجى تحديد التقييم');
            return;
        }

        onSubmit({
            beverageId: beverage._id,
            rating,
            review: review.trim() || null,
            isAnonymous,
        });
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="rating-modal-overlay" onClick={handleBackdropClick}>
            <div className="rating-modal">
                <div className="rating-modal-header">
                    <h3>تقييم المشروب</h3>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="rating-modal-body">
                    <div className="beverage-info">
                        <h4>{beverage.name}</h4>
                        <p className="category">{beverage.category}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>التقييم *</label>
                            <div className="rating-input">
                                <RatingStars
                                    rating={rating}
                                    onRate={setRating}
                                    size="large"
                                />
                                <span className="rating-text">
                                    {rating > 0 ? `${rating} من 5` : 'اختر التقييم'}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="review">المراجعة (اختياري)</label>
                            <textarea
                                id="review"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="شارك رأيك في هذا المشروب..."
                                maxLength={500}
                                rows={4}
                            />
                            <span className="char-count">
                                {review.length} / 500
                            </span>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                />
                                <span>تقييم مجهول</span>
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading || rating === 0}
                            >
                                {isLoading ? 'جاري الحفظ...' : existingRating ? 'تحديث التقييم' : 'إرسال التقييم'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
