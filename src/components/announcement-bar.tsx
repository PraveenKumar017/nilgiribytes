"use client";

const MESSAGES = [
  "No preservatives",
  "Delivery within 4 to 5 days",
  "Wholesale options available",
  "100% Pure Vegetarian",
  "Custom corporate & personal gifting solutions",
];

export function AnnouncementBar() {
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <div className="announcement">
      <div className="announcement-track">
        {items.map((message, index) => (
          <span className="announcement-item" key={index}>
            <span className="announcement-dot">•</span>
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
