import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  createReviewAction,
  deleteReviewAction,
  toggleReviewVisibilityAction,
  updateReviewAction,
} from "@/app/admin/actions";
import { ActionForm, ConfirmSubmit } from "@/components/admin/admin-ui";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import {
  getReview,
  listReviewItems,
  listReviews,
  type AdminReview,
  type AdminReviewItem,
} from "@/lib/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Reviews | Nilgiribytes Admin",
  description: "Manage customer reviews shown on product and combo pages.",
};

const PAGE_SIZE = 10;

function pageHref(page: number, query: string, itemSlug: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (itemSlug) params.set("item", itemSlug);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return `/admin/reviews${search ? `?${search}` : ""}`;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let number = start; number <= end; number += 1) pages.push(number);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

type PageProps = {
  searchParams: Promise<{
    new?: string;
    id?: string;
    q?: string;
    item?: string;
    page?: string;
    created?: string;
    updated?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  }>;
};

function ReviewForm({
  items,
  review,
}: {
  items: AdminReviewItem[];
  review?: AdminReview;
}) {
  const hasItem = items.some((item) => item.slug === review?.itemSlug);

  return (
    <ActionForm
      action={review ? updateReviewAction : createReviewAction}
      submitLabel={review ? "Save review" : "Create review"}
    >
      {review ? <input type="hidden" name="id" value={review.id} /> : null}

      <div className="admin-form_grid">
        <label className="admin-field">
          <span>Item</span>
          {items.length ? (
            <select name="itemSlug" defaultValue={review?.itemSlug ?? ""} required>
              <option value="" disabled>
                Choose a product or combo
              </option>
              {!hasItem && review ? (
                <option value={review.itemSlug}>{review.itemName} (missing item)</option>
              ) : null}
              {items.map((item) => (
                <option key={`${item.type}-${item.slug}`} value={item.slug}>
                  {item.name} ({item.type})
                </option>
              ))}
            </select>
          ) : (
            <input
              name="itemSlug"
              defaultValue={review?.itemSlug ?? ""}
              placeholder="item-slug"
              required
            />
          )}
        </label>

        <label className="admin-field">
          <span>Author</span>
          <input
            name="authorName"
            defaultValue={review?.authorName ?? ""}
            maxLength={160}
            required
          />
        </label>

        <label className="admin-field">
          <span>Location</span>
          <input
            name="location"
            defaultValue={review?.location ?? ""}
            maxLength={160}
            placeholder="e.g. Coimbatore"
          />
        </label>

        <label className="admin-field">
          <span>Rating (0.5–5)</span>
          <input
            name="rating"
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            defaultValue={review?.rating ?? 5}
            required
          />
        </label>

      </div>

      <label className="admin-field">
        <span>Review text</span>
        <textarea
          name="reviewText"
          rows={4}
          maxLength={5000}
          defaultValue={review?.reviewText ?? ""}
          required
        />
      </label>

      <label className="admin-review-toggle" title="Show this review in the storefront">
        <input
          type="checkbox"
          name="isVisible"
          defaultChecked={review?.isVisible ?? true}
        />
        <span className="admin-review-toggle-slider" aria-hidden="true" />
        <span className="admin-review-toggle-label">Show in storefront</span>
      </label>
    </ActionForm>
  );
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const itemSlug = params.item ?? "";
  const items = await listReviewItems();

  if (params.new || (params.id && !Number(params.id))) {
    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/reviews">Reviews</Link> / New
            </p>
            <h1 className="admin-page-title">New review</h1>
          </div>
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/reviews">
              &larr; Back to reviews
            </Link>
          </div>
        </header>

        <section className="admin-panel">
          <ReviewForm items={items} />
        </section>
      </>
    );
  }

  if (params.id) {
    const review = await getReview(Number(params.id));
    if (!review) notFound();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/reviews">Reviews</Link> / Edit
            </p>
            <h1 className="admin-page-title">{review.authorName}</h1>
            <p className="admin-page-text">
              {review.itemName} &middot; {review.rating} / 5
            </p>
          </div>
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/reviews">
              &larr; Back to reviews
            </Link>
          </div>
        </header>

        <section className="admin-panel">
          <ReviewForm items={items} review={review} />
        </section>
      </>
    );
  }

  const requestedPage = Math.max(1, Math.floor(Number(params.page) || 1));
  const { rows, total } = await listReviews(
    query,
    itemSlug,
    requestedPage,
    PAGE_SIZE
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  if (currentPage !== requestedPage) {
    redirect(pageHref(currentPage, query, itemSlug));
  }
  const reviews = rows;
  const filtered = Boolean(query || itemSlug);

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Reviews</h1>
          <p className="admin-page-text">
            Manage the customer reviews shown on product and combo pages.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-btn admin-btn--primary" href="/admin/reviews?new=1">
            New review
          </Link>
        </div>
      </header>

      {params.created ? (
        <p className="admin-alert admin-alert--success">Review created.</p>
      ) : null}
      {params.updated ? (
        <p className="admin-alert admin-alert--success">Review updated.</p>
      ) : null}
      {params.saved ? (
        <p className="admin-alert admin-alert--success">
          Review visibility updated.
        </p>
      ) : null}
      {params.deleted ? (
        <p className="admin-alert admin-alert--success">Review deleted.</p>
      ) : null}
      {params.error === "not-found" ? (
        <p className="admin-alert admin-alert--error">Review not found.</p>
      ) : null}

      <section className="admin-panel admin-reviews_panel">
        <form method="get" className="admin-reviews_filters">
          <label className="admin-field">
            <span>Search</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Author, item or review text"
            />
          </label>
          <label className="admin-field">
            <span>Item</span>
            <select name="item" defaultValue={itemSlug}>
              <option value="">All items</option>
              {items.map((item) => (
                <option key={`${item.type}-${item.slug}`} value={item.slug}>
                  {item.name} ({item.type})
                </option>
              ))}
            </select>
          </label>
          <div className="admin-reviews_filter-actions">
            <button className="admin-btn" type="submit">
              Apply
            </button>
            {filtered ? (
              <Link className="admin-btn admin-btn--ghost" href="/admin/reviews">
                Clear
              </Link>
            ) : null}
          </div>
        </form>

        {reviews.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Review</th>
                  <th>Rating</th>
                  <th>Visible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className={review.isVisible ? undefined : "is-hidden"}>
                    <td>
                      <span className="admin-table_primary">{review.itemName}</span>
                      <span className="admin-table_sub">{review.itemSlug}</span>
                    </td>
                    <td>
                      <span className="admin-table_primary">{review.authorName}</span>
                      {review.location ? (
                        <span className="admin-table_sub">{review.location}</span>
                      ) : null}
                      <span className="admin-review_text">{review.reviewText}</span>
                    </td>
                    <td>
                      <span className="admin-review_rating">
                        <span className="admin-review_stars" aria-hidden="true">
                          {"★".repeat(Math.round(review.rating))}
                        </span>
                        {review.rating.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <form action={toggleReviewVisibilityAction}>
                        <input type="hidden" name="id" value={review.id} />
                        <input
                          type="hidden"
                          name="isVisible"
                          value={review.isVisible ? "false" : "true"}
                        />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={pageHref(currentPage, query, itemSlug)}
                        />
                        <button
                          type="submit"
                          className={`admin-review-toggle${
                            review.isVisible ? " is-on" : ""
                          }`}
                          title={
                            review.isVisible
                              ? "Hide this review from the storefront"
                              : "Show this review in the storefront"
                          }
                          aria-label={
                            review.isVisible
                              ? `Hide review by ${review.authorName}`
                              : `Show review by ${review.authorName}`
                          }
                        >
                          <span className="admin-review-toggle-slider" aria-hidden="true" />
                          <span className="admin-review-toggle-label">
                            {review.isVisible ? "Shown" : "Hidden"}
                          </span>
                        </button>
                      </form>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          className="admin-btn admin-btn--small admin-btn--icon"
                          href={`/admin/reviews?id=${review.id}`}
                          aria-label={`Edit review by ${review.authorName}`}
                          title="Edit"
                        >
                          <EditIcon />
                        </Link>
                        <form action={deleteReviewAction}>
                          <input type="hidden" name="id" value={review.id} />
                          <ConfirmSubmit
                            className="admin-btn admin-btn--small admin-btn--danger admin-btn--icon"
                            message={`Delete the review by "${review.authorName}"? This cannot be undone.`}
                            label={`Delete review by ${review.authorName}`}
                          >
                            <TrashIcon />
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            {filtered ? "No reviews match your filters." : "No reviews yet."}
          </p>
        )}

        {totalPages > 1 ? (
          <nav className="admin-reviews_pagination" aria-label="Reviews pages">
            <span className="admin-reviews_pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}&ndash;
              {Math.min(currentPage * PAGE_SIZE, total)} of {total} reviews
            </span>
            <div className="admin-reviews_pagination-links">
              {currentPage > 1 ? (
                <Link
                  className="admin-reviews_pagination-btn"
                  href={pageHref(currentPage - 1, query, itemSlug)}
                >
                  Previous
                </Link>
              ) : (
                <span className="admin-reviews_pagination-btn is-disabled" aria-disabled="true">
                  Previous
                </span>
              )}
              {pageNumbers(currentPage, totalPages).map((number, index) =>
                number === "…" ? (
                  <span key={`ellipsis-${index}`} className="admin-reviews_pagination-gap">
                    &hellip;
                  </span>
                ) : (
                  <Link
                    key={number}
                    className={`admin-reviews_pagination-btn${
                      number === currentPage ? " is-active" : ""
                    }`}
                    href={pageHref(number, query, itemSlug)}
                    aria-current={number === currentPage ? "page" : undefined}
                  >
                    {number}
                  </Link>
                )
              )}
              {currentPage < totalPages ? (
                <Link
                  className="admin-reviews_pagination-btn"
                  href={pageHref(currentPage + 1, query, itemSlug)}
                >
                  Next
                </Link>
              ) : (
                <span className="admin-reviews_pagination-btn is-disabled" aria-disabled="true">
                  Next
                </span>
              )}
            </div>
          </nav>
        ) : null}
      </section>
    </>
  );
}
