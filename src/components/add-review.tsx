"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CUSTOM_COMBO_SLUG } from "@/lib/types";

type ReviewItem = {
  slug: string;
  name: string;
};

type AddReviewProps = {
  items: ReviewItem[];
  defaultItemSlug?: string;
};

type SubmitState = "idle" | "submitting" | "success";

export function AddReview({ items, defaultItemSlug }: AddReviewProps) {
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);

  const options: ReviewItem[] = items.some(
    (item) => item.slug === CUSTOM_COMBO_SLUG,
  )
    ? items
    : [...items, { slug: CUSTOM_COMBO_SLUG, name: "Build your own combo" }];
  const canSubmit = options.length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && state !== "submitting") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, state]);

  function close() {
    if (state !== "submitting") {
      setOpen(false);
      setError("");
      setRating(0);
      if (state === "success") {
        setState("idle");
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") {
      return;
    }

    const data = new FormData(event.currentTarget);
    const values = {
      itemSlug: String(data.get("itemSlug") ?? "").trim(),
      authorName: String(data.get("authorName") ?? "").trim(),
      location: String(data.get("location") ?? "").trim(),
      reviewText: String(data.get("reviewText") ?? "").trim(),
    };

    if (
      !values.itemSlug ||
      !values.authorName ||
      !values.location ||
      values.reviewText.length < 10 ||
      rating === 0
    ) {
      setError("Please fill in all fields and select a rating.");
      return;
    }

    setState("submitting");
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemSlug: values.itemSlug,
          rating,
          authorName: values.authorName,
          location: values.location,
          reviewText: values.reviewText,
          website: String(data.get("website") ?? ""),
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "We could not save your review.");
      }

      setState("success");
    } catch (submitError) {
      setState("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not save your review. Please try again.",
      );
    }
  }

  return (
    <>
      <div className="review-add">
        <button
          className="btn btn--outline review-add_button"
          type="button"
          onClick={() => setOpen(true)}
          disabled={!canSubmit}
        >
          Write a review
        </button>
      </div>

      {open ? (
        <div
          className="review-modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
        >
          <div
            className="review-modal_dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            tabIndex={-1}
            ref={dialogRef}
          >
            <div className="review-modal_header">
              <h2 className="review-modal_title" id={`${uid}-title`}>
                {state === "success"
                  ? "Review submitted"
                  : "Share your experience"}
              </h2>
              <button
                className="review-modal_close"
                type="button"
                aria-label="Close"
                onClick={close}
                disabled={state === "submitting"}
              >
                &times;
              </button>
            </div>

            {state === "success" ? (
              <>
                <div className="review-modal_body">
                  <p className="review-modal_text">
                    Thanks for sharing! Your review.
                  </p>
                </div>
                <div className="review-modal_footer">
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={close}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="review-modal_body">
                  <form
                    className="review-modal_form"
                    id={`${uid}-form`}
                    onSubmit={handleSubmit}
                  >
                    <div className="review-modal_row">
                      <label htmlFor={`${uid}-item`}>Product *</label>
                      <select
                        className="input"
                        id={`${uid}-item`}
                        name="itemSlug"
                        required
                        defaultValue={defaultItemSlug ?? options[0]?.slug ?? ""}
                      >
                        {options.map((item) => (
                          <option value={item.slug} key={item.slug}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="review-modal_split">
                      <div className="review-modal_row">
                        <label htmlFor={`${uid}-name`}>Your name *</label>
                        <input
                          className="input"
                          id={`${uid}-name`}
                          name="authorName"
                          type="text"
                          minLength={2}
                          maxLength={160}
                          required
                          placeholder="Example: John"
                        />
                      </div>
                      <div className="review-modal_row">
                        <label htmlFor={`${uid}-location`}>City *</label>
                        <input
                          className="input"
                          id={`${uid}-location`}
                          name="location"
                          type="text"
                          minLength={2}
                          maxLength={160}
                          required
                          placeholder="Example: Coimbatore"
                        />
                      </div>
                    </div>

                    <fieldset className="review-modal_row review-modal_rating">
                      <legend>Your rating *</legend>
                      <div className="review-modal_stars">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <label
                            className={`review-modal_star${
                              value <= rating ? " is-active" : ""
                            }`}
                            key={value}
                            title={`${value} star${value > 1 ? "s" : ""}`}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={value}
                              checked={rating === value}
                              required
                              onChange={() => setRating(value)}
                            />
                            <span aria-hidden="true">
                              {value <= rating ? "★" : "☆"}
                            </span>
                            <span className="sr-only">{value} stars</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="review-modal_row">
                      <label htmlFor={`${uid}-text`}>Your review *</label>
                      <textarea
                        className="textarea"
                        id={`${uid}-text`}
                        name="reviewText"
                        minLength={10}
                        maxLength={2000}
                        rows={5}
                        required
                        placeholder="What did you think of the taste, freshness and packing?"
                      />
                    </div>

                    <div className="review-modal_honeypot" aria-hidden="true">
                      <label htmlFor={`${uid}-website`}>Website</label>
                      <input
                        id={`${uid}-website`}
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    {error ? (
                      <p className="review-modal_error" role="alert">
                        {error}
                      </p>
                    ) : null}
                  </form>
                </div>
                <div className="review-modal_footer">
                  <button
                    className="btn btn--outline"
                    type="button"
                    onClick={close}
                    disabled={state === "submitting"}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn--primary"
                    type="submit"
                    form={`${uid}-form`}
                    disabled={state === "submitting"}
                  >
                    {state === "submitting"
                      ? "Submitting..."
                      : "Submit review"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
