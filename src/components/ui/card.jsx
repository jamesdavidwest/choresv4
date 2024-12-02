// src/components/ui/card.jsx
import PropTypes from 'prop-types';

export function Card({ className, ...props }) {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    />
  );
}

Card.displayName = "Card";
Card.propTypes = {
  className: PropTypes.string
};
