import React, { useContext, useEffect, useState } from 'react'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import ReviewsModal from '../ReviewsModal/ReviewsModal'
import { StoreContext } from '../../Context/StoreContext'

const FoodDisplay = ({category}) => {

  const { food_list, foodLoading, favorites } = useContext(StoreContext);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [onlyFav, setOnlyFav] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [slow, setSlow] = useState(false);

  // Render free server so jaata hai, pehli baar load hone mein time lag sakta hai
  useEffect(() => {
    if (!foodLoading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(timer);
  }, [foodLoading]);

  const q = search.trim().toLowerCase();

  let items = food_list.filter((item) => {
    if (category !== "All" && category !== item.category) return false;
    if (onlyFav && !favorites.includes(item._id)) return false;
    if (q) {
      const text = (item.name + " " + (item.description || "") + " " + item.category).toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  if (sort === "low") items = [...items].sort((a, b) => a.price - b.price);
  if (sort === "high") items = [...items].sort((a, b) => b.price - a.price);
  if (sort === "rating") items = [...items].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

  const clearFilters = () => {
    setSearch("");
    setSort("default");
    setOnlyFav(false);
  }

  return (
    <div className='food-display' id='food-display'>
      <div className="food-display-head">
        <h2>Top dishes near you</h2>
        {!foodLoading && <span className="food-display-count">{items.length} {items.length === 1 ? "dish" : "dishes"}</span>}
      </div>

      <div className="food-toolbar">
        <label className="food-search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes, e.g. salad, roll..."
          />
          {search && <button type="button" className="food-search-clear" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </label>

        <select className="food-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort dishes">
          <option value="default">Sort: Recommended</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="rating">Top rated</option>
        </select>

        <button className={`food-fav-toggle ${onlyFav ? "active" : ""}`} onClick={() => setOnlyFav((prev) => !prev)}>
          <span>♥</span> Favourites {favorites.length > 0 && <em>{favorites.length}</em>}
        </button>
      </div>

      {foodLoading && food_list.length === 0
        ? <>
            {slow && <p className="food-slow-note">Server thoda so raha tha, ab jaag raha hai. Menu 30-40 second mein aa jayega...</p>}
            <div className="food-display-list">
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="food-skeleton" key={i}>
                  <div className="food-skeleton-img"></div>
                  <div className="food-skeleton-body">
                    <div className="food-skeleton-line w60"></div>
                    <div className="food-skeleton-line"></div>
                    <div className="food-skeleton-line w80"></div>
                    <div className="food-skeleton-pill"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        : items.length === 0
          ? <div className="food-empty">
              <div className="food-empty-icon">🍽️</div>
              <h3>No dishes found</h3>
              <p>{onlyFav && favorites.length === 0 ? "You have not added any favourites yet. Tap the heart on a dish to save it." : "Try a different search or category."}</p>
              <button onClick={clearFilters}>Clear filters</button>
            </div>
          : <div className='food-display-list'>
              {items.map((item) => (
                <FoodItem key={item._id} item={item} onOpenReviews={setReviewItem} />
              ))}
            </div>
      }

      {reviewItem && <ReviewsModal food={reviewItem} onClose={() => setReviewItem(null)} />}
    </div>
  )
}

export default FoodDisplay
