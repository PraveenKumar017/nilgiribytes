"use client";

const MESSAGES = [
  "Pan-India delivery",
  "100% vegetarian",
  "Baked fresh daily",
  "No preservatives",
  "Wholesale options available",
  "Custom corporate & personal gifting solutions",
];

export function AnnouncementBar() {
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <div className="announcement">
      <div className="announcement-track">
        {items.map((message, index) => (
          <span className="announcement-item" key={index}>
            {message}
            <span className="announcement-dot" aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
