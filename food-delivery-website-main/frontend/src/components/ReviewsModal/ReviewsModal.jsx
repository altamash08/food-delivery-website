import React, { useContext, useEffect, useState } from 'react'
import './ReviewsModal.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { StoreContext } from '../../Context/StoreContext'

const ReviewsModal = ({ food, onClose }) => {

  const { url, token, fetchFoodList, currency } = useContext(StoreContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const loadReviews = async () => {
    try {
      const response = await axios.post(url + "/api/review/get", { foodId: food._id });
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      // reviews load nahi hue: khaali list dikhegi
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [food._id]);

  // Esc se band + background scroll lock
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }
    setSending(true);
    try {
      const response = await axios.post(url + "/api/review/add", { foodId: food._id, rating, comment }, { headers: { token } });
      if (response.data.success) {
        toast.success("Thanks for your review!");
        setRating(0);
        setComment("");
        await loadReviews();
        fetchFoodList(); // card par naya average dikhane ke liye
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const shown = hover || rating;

  return (
    <div className="reviews-overlay" onClick={onClose}>
      <div className="reviews-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="reviews-close" onClick={onClose} aria-label="Close">×</button>

        <div className="reviews-head">
          <img src={url + "/images/" + food.image} alt={food.name} />
          <div>
            <h3>{food.name}</h3>
            <p className="reviews-price">{currency}{food.price}</p>
            <p className="reviews-avg">
              <span className="star">★</span>
              {reviews.length > 0 ? <> <b>{avg.toFixed(1)}</b> <span>({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span></> : <span> No reviews yet</span>}
            </p>
          </div>
        </div>

        <div className="reviews-list">
          {loading
            ? <p className="reviews-empty">Loading reviews...</p>
            : reviews.length === 0
              ? <p className="reviews-empty">Be the first to review this dish!</p>
              : reviews.map((r, i) => (
                <div className="review" key={i}>
                  <div className="review-top">
                    <b>{r.userName}</b>
                    <span className="review-stars">{"★".repeat(r.rating)}<i>{"★".repeat(5 - r.rating)}</i></span>
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                  <small>{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small>
                </div>
              ))
          }
        </div>

        {token
          ? <form className="reviews-form" onSubmit={submit}>
              <p>Rate this dish</p>
              <div className="reviews-stars-input" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={n <= shown ? "on" : ""}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                    aria-label={n + " star"}
                  >★</button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Write a short review (optional)"
              />
              <button type="submit" disabled={sending}>{sending ? "Saving..." : "Submit review"}</button>
            </form>
          : <p className="reviews-login">Sign in to write a review.</p>
        }
      </div>
    </div>
  )
}

export default ReviewsModal
