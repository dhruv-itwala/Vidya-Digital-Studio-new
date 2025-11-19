// src/components/QuoteItemCard/QuoteItemCard.jsx
import React from "react";

const QuoteItemCard = ({ item, onDelete }) => {
  return (
    <div className={styles.card}>
      <div>
        <h4 className={styles.itemTitle}>{item.service}</h4>
        <div className={styles.meta}>
          <span className={styles.category}>{item.category}</span>
          {item.option && (
            <span className={styles.option}> · Option: {item.option}</span>
          )}
        </div>
        <div className={styles.small}>
          {item.quantity ? <span>Qty: {item.quantity}</span> : null}
          {item.unitPrice ? <span> · Unit: ₹{item.unitPrice}</span> : null}
        </div>
      </div>

      <div className={styles.cardRight}>
        <div className={styles.price}>₹{item.total}</div>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(item.id, item.option)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default QuoteItemCard;
