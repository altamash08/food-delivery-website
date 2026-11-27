import React, { useContext } from 'react'
import './FoodItem.css'
import { StoreContext } from '../../Context/StoreContext';

const FoodItem = ({ item, onOpenReviews }) => {

    const { cartItems, addToCart, removeFromCart, url, currency, favorites, toggleFavorite } = useContext(StoreContext);

    const { _id: id, image, name, description, price, inStock, avgRating, ratingCount } = item;
    const soldOut = inStock === false;
    const isFav = favorites.includes(id);
    const qty = cartItems[id];

    return (
        <div className={`food-item ${soldOut ? "sold-out" : ""}`}>
            <div className='food-item-img-container'>
                <img className='food-item-image' src={url + "/images/" + image} alt={name} loading="lazy" onClick={() => onOpenReviews(item)} />

                <button
                    className={`food-item-fav ${isFav ? "active" : ""}`}
                    onClick={() => toggleFavorite(id)}
                    aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.3 4.5c2 0 3.5 1.1 4.2 2.5.4.7 1.1.7 1.5 0 .7-1.4 2.2-2.5 4.2-2.5 3.6 0 5.4 3.9 3.9 7.3C19.5 16.4 12 21 12 21z" />
                    </svg>
                </button>

                {soldOut && <span className="food-item-soldout">Sold out</span>}

                {!soldOut && (!qty
                    ? <button className="food-item-add" onClick={() => addToCart(id)}>
                        <span className="food-item-add-plus">+</span> Add
                    </button>
                    : <div className="food-item-counter">
                        <button onClick={() => removeFromCart(id)} aria-label="Remove one">−</button>
                        <p>{qty}</p>
                        <button onClick={() => addToCart(id)} aria-label="Add one">+</button>
                    </div>
                )}
            </div>
            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p>
                    <button className="food-item-rating" onClick={() => onOpenReviews(item)} aria-label="See reviews">
                        <span className="star">★</span> {ratingCount > 0 ? avgRating.toFixed(1) : "New"}
                        {ratingCount > 0 && <span className="count">({ratingCount})</span>}
                    </button>
                </div>
                <p className="food-item-desc">{description}</p>
                <div className="food-item-bottom">
                    <p className="food-item-price">{currency}{price}</p>
                    <button className="food-item-reviews-link" onClick={() => onOpenReviews(item)}>Reviews</button>
                </div>
            </div>
        </div>
    )
}

export default FoodItem
