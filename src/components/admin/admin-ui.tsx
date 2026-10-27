"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, logoutAction } from "@/app/admin/actions";
import { formatDate } from "@/lib/format";
import type { ActionState, LoginState } from "@/lib/admin";
import type { BlogBlock } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/combos", label: "Combos" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-nav_link${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="admin-mobile-bar">
        <Link href="/admin" className="admin-mobile-brand">
          Nilgiribytes <span>Admin</span>
        </Link>
        <button
          type="button"
          className="admin-mobile-toggle"
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          onClick={() => setOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {open ? (
        <button
          type="button"
          className="admin-sidebar_backdrop"
          aria-label="Close admin menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={`admin-sidebar${open ? " is-open" : ""}`}
      >
        <div className="admin-brand">
          <Link href="/admin" className="admin-brand_name" onClick={() => setOpen(false)}>
            Nilgiribytes
          </Link>
          <span className="admin-brand_tag">Admin</span>
        </div>

        <AdminNav onNavigate={() => setOpen(false)} />

        <div className="admin-sidebar_footer">
          <Link className="admin-sidebar_link" href="/" target="_blank">
            View website &#8599;
          </Link>
          <form action={logoutAction}>
            <button className="admin-btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  extraActions?: React.ReactNode;
};

export function ActionForm({
  action,
  children,
  submitLabel,
  className = "admin-form",
  extraActions,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const snapshotRef = useRef<Record<string, string | string[]> | null>(null);

  useEffect(() => {
    const form = formRef.current;
    const snapshot = snapshotRef.current;
    if (!form || !snapshot || !state?.error) return;

    for (const [name, value] of Object.entries(snapshot)) {
      const values = Array.isArray(value) ? value : [value];
      let index = 0;

      for (const element of Array.from(form.elements)) {
        if (!("name" in element) || element.name !== name) continue;

        if (element instanceof HTMLInputElement) {
          if (element.type === "file") continue;
          if (element.type === "checkbox" || element.type === "radio") {
            element.checked = values.includes(element.value);
          } else {
            element.value = values[index] ?? values[0] ?? "";
            index += 1;
          }
        } else if (element instanceof HTMLSelectElement) {
          element.value = values[0] ?? "";
        } else if (element instanceof HTMLTextAreaElement) {
          element.value = values[index] ?? values[0] ?? "";
          index += 1;
        }
      }
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onSubmit={(event) => {
        const snapshot: Record<string, string | string[]> = {};

        for (const [name, value] of new FormData(event.currentTarget)) {
          if (typeof value !== "string") continue;
          const existing = snapshot[name];
          snapshot[name] = Array.isArray(existing)
            ? [...existing, value]
            : existing === undefined
              ? value
              : [existing, value];
        }

        snapshotRef.current = snapshot;
      }}
    >
      {children}

      {state?.error ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="admin-form_actions">
        {extraActions}
        <button
          className="admin-btn admin-btn--primary"
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  className,
  label,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
  label?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className={className}
      aria-label={label}
      disabled={pending}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

type PostPreview = {
  title: string;
  author: string;
  date: string;
  readingTime: string;
  category: string;
  status: string;
  coverImage: string;
  imageAlt: string;
  blocks: BlogBlock[];
};

export function PostPreviewButton() {
  const [preview, setPreview] = useState<PostPreview | null>(null);

  useEffect(() => {
    if (!preview) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  function openPreview(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;

    const data = new FormData(form);
    let blocks: BlogBlock[] = [];

    try {
      const parsed: unknown = JSON.parse(String(data.get("content") ?? "[]"));
      if (Array.isArray(parsed)) {
        blocks = parsed.filter((block): block is BlogBlock => {
          if (!block || typeof block !== "object" || !("type" in block)) {
            return false;
          }
          return typeof block.type === "string";
        });
      }
    } catch {
      blocks = [];
    }

    setPreview({
      title: String(data.get("title") ?? "").trim() || "Untitled post",
      author: String(data.get("author") ?? "").trim() || "Nilgiribytes Team",
      date: String(data.get("date") ?? ""),
      readingTime: String(data.get("readingTimeMin") ?? "").trim(),
      category: String(data.get("category") ?? "").trim(),
      status: String(data.get("status") ?? "DRAFT"),
      coverImage: String(data.get("coverImage") ?? ""),
      imageAlt: String(data.get("imageAlt") ?? ""),
      blocks,
    });
  }

  return (
    <>
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        onClick={openPreview}
      >
        Preview
      </button>

      {preview ? (
        <div
          className="admin-image-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-post-preview-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <div className="admin-image-modal_panel admin-post-preview">
            <div className="admin-image-modal_head">
              <div>
                <h2>Post preview</h2>
                <p>
                  {preview.status === "PUBLISHED"
                    ? "This is how the published post will look."
                    : "Draft preview \u2014 not visible on the site yet."}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--ghost"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>

            <article className="admin-post-preview_body">
              <h1 id="admin-post-preview-title">{preview.title}</h1>
              <p className="admin-post-preview_meta">
                <span>By {preview.author}</span>
                {preview.date ? <span>{formatDate(preview.date)}</span> : null}
                {preview.readingTime ? (
                  <span>{preview.readingTime} min read</span>
                ) : null}
                {preview.category ? <span>{preview.category}</span> : null}
              </p>

              {preview.coverImage ? (
                <img
                  className="admin-post-preview_cover"
                  src={imageSrc(preview.coverImage)}
                  alt={preview.imageAlt || preview.title}
                />
              ) : null}

              <div className="admin-post-preview_content">
                {preview.blocks.map((block, index) => {
                  if (block.type === "p") {
                    return <p key={index}>{block.text}</p>;
                  }
                  if (block.type === "h2") {
                    return <h2 key={index}>{block.text}</h2>;
                  }
                  if (block.type === "h3") {
                    return <h3 key={index}>{block.text}</h3>;
                  }
                  if (block.type === "ol") {
                    return (
                      <ol key={index}>
                        {block.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ol>
                    );
                  }
                  if ("items" in block) {
                    return (
                      <ul key={index}>
                        {block.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    );
                  }
                  return null;
                })}
              </div>
            </article>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ConfirmSubmit({
  children,
  message,
  label,
  className = "admin-btn admin-btn--danger",
}: {
  children: React.ReactNode;
  message: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      type="submit"
      aria-label={label}
      title={label}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="admin-login_form">
      <label className="admin-field">
        <span>Username</span>
        <input name="username" autoComplete="username" required autoFocus />
      </label>

      <div className="admin-field">
        <label htmlFor="admin-password">Password</label>
        <div className="admin-password">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="admin-password_toggle"
            onClick={() => setShowPassword((current) => !current)}
            onMouseDown={(event) => event.preventDefault()}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls="admin-password"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.8 9.8 0 0112 5c5 0 8.5 4.2 9.5 7a12.6 12.6 0 01-2.2 3.4M6.3 6.3A12.7 12.7 0 002.5 12c1 2.8 4.5 7 9.5 7a9.9 9.9 0 004.2-.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2.5 12c1-2.8 4.5-7 9.5-7s8.5 4.2 9.5 7c-1 2.8-4.5 7-9.5 7s-8.5-4.2-9.5-7z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="2.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {state?.error ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        className="admin-btn admin-btn--primary"
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Image field                                                                */
/* -------------------------------------------------------------------------- */

function imageSrc(value: string): string {
  if (!value) return "/assets/placeholder.svg";
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

export function ImageField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [failed, setFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("Each image must be 2 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as
        | { url?: unknown; error?: unknown }
        | null;

      if (!response.ok || typeof result?.url !== "string") {
        setError(
          typeof result?.error === "string"
            ? result.error
            : "Could not upload the image."
        );
        return;
      }

      setValue(result.url);
      setFailed(false);
    } catch {
      setError("Could not upload the image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-field admin-field--image">
      <span>{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="admin-image-preview">
        {value ? (
          <img
            src={failed ? "/assets/placeholder.svg" : imageSrc(value)}
            alt=""
            onError={() => setFailed(true)}
          />
        ) : (
          <span>No image selected</span>
        )}
      </div>
      <div className="admin-image-upload-actions">
        <label className="admin-btn admin-btn--small">
          {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
          <input
            className="admin-image-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (file) void upload(file);
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            className="admin-btn admin-btn--small admin-btn--danger"
            onClick={() => {
              setValue("");
              setFailed(false);
              setError(null);
            }}
            disabled={uploading}
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ImagesField({
  name,
  label,
  defaultImages = [],
}: {
  name: string;
  label: string;
  defaultImages?: (string | null)[] | null;
}) {
  const [images, setImages] = useState<string[]>(() =>
    (defaultImages ?? [])
      .filter((image): image is string => typeof image === "string" && image !== "")
      .slice(0, 3)
  );
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function upload(index: number, file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("Each image must be 2 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as
        | { url?: unknown; error?: unknown }
        | null;

      if (!response.ok || typeof result?.url !== "string") {
        setError(
          typeof result?.error === "string"
            ? result.error
            : "Could not upload the image."
        );
        return;
      }

      setImages((current) => {
        const next = [...current];
        next[index] = result.url as string;
        return next.filter(Boolean).slice(0, 3);
      });
    } catch {
      setError("Could not upload the image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-field admin-field--image">
      <span>{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(images)} />

      <div className="admin-image-gallery">
        {images.length ? (
          images.map((image, index) => (
            <img key={`${image}-${index}`} src={imageSrc(image)} alt="" />
          ))
        ) : (
          <span>No images selected</span>
        )}
      </div>

      <button
        type="button"
        className="admin-btn admin-btn--small"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Images ({images.length}/3)
      </button>

      {open ? (
        <div
          className="admin-image-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-gallery-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="admin-image-modal_panel">
            <div className="admin-image-modal_head">
              <div>
                <h2 id="admin-gallery-modal-title">{label}</h2>
                <p>Add, replace or delete up to three images.</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--ghost"
                onClick={() => setOpen(false)}
                aria-label="Close image manager"
              >
                Close
              </button>
            </div>

            {error ? (
              <p className="admin-alert admin-alert--error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="admin-image-modal_grid">
              {[0, 1, 2].map((index) => {
                const image = images[index] ?? "";
                const inputId = `gallery-image-${name}-${index}`;

                return (
                  <div
                    className={`admin-image-slot${image ? " has-image" : ""}`}
                    key={index}
                  >
                    <span className="admin-image-slot_label">
                      Image {index + 1}
                    </span>

                    {image ? (
                      <img
                        className="admin-image-slot_preview"
                        src={imageSrc(image)}
                        alt=""
                      />
                    ) : (
                      <span className="admin-image-slot_empty">No image</span>
                    )}

                    <div className="admin-image-slot_actions">
                      <label
                        className="admin-btn admin-btn--small"
                        htmlFor={inputId}
                      >
                        {image ? "Edit" : "Add"}
                      </label>
                      <input
                        id={inputId}
                        className="admin-image-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={uploading}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.currentTarget.value = "";
                          if (file) void upload(index, file);
                        }}
                      />
                      {image ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() =>
                            setImages((current) =>
                              current.filter((_, imageIndex) => imageIndex !== index)
                            )
                          }
                          disabled={uploading}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-image-modal_foot">
              <span>{images.length} of 3 images</span>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product sizes                                                              */
/* -------------------------------------------------------------------------- */

export type SizeDraft = {
  label: string;
  grams: number | null;
  mrpPaise: number;
  pricePaise: number;
  images: string[];
};

type SizeRow = {
  key: string;
  label: string;
  grams: string;
  mrp: string;
  price: string;
  discount: string;
  images: string[];
};

function toPaise(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function discountPercent(mrpPaise: number, pricePaise: number): number {
  return mrpPaise > pricePaise && mrpPaise > 0
    ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100)
    : 0;
}

function priceFromDiscount(mrp: string, discount: string): string | null {
  const mrpAmount = Number(mrp);
  const discountAmount = Number(discount);
  if (!Number.isFinite(mrpAmount) || !Number.isFinite(discountAmount)) {
    return null;
  }
  const clamped = Math.min(100, Math.max(0, discountAmount));
  return String(Math.round(mrpAmount * (100 - clamped)) / 100);
}

function sizeToRow(size: SizeDraft, index: number): SizeRow {
  return {
    key: `size-${index}`,
    label: size.label,
    grams: size.grams == null ? "" : String(size.grams),
    mrp: String(size.mrpPaise / 100),
    price: String(size.pricePaise / 100),
    discount: String(discountPercent(size.mrpPaise, size.pricePaise)),
    images: size.images,
  };
}

export function SizesEditor({ defaultSizes }: { defaultSizes: SizeDraft[] }) {
  const [rows, setRows] = useState<SizeRow[]>(() =>
    defaultSizes.map((size, index) => sizeToRow(size, index))
  );
  const [imageRowKey, setImageRowKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageRow = rows.find((row) => row.key === imageRowKey) ?? null;

  useEffect(() => {
    if (!imageRowKey) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setImageRowKey(null);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [imageRowKey]);

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row) => {
          const mrpPaise = toPaise(row.mrp);
          const pricePaise = toPaise(row.price);
          return {
            label: row.label,
            grams: row.grams.trim() === "" ? null : Number(row.grams),
            mrpPaise,
            discountPercent: discountPercent(mrpPaise, pricePaise),
            pricePaise,
            images: row.images,
            imageUrl: row.images[0] ?? null,
          };
        })
      ),
    [rows]
  );

  function update(key: string, field: keyof SizeRow, value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) return row;

        if (field === "discount") {
          const price = priceFromDiscount(row.mrp, value);
          return { ...row, discount: value, price: price ?? row.price };
        }

        if (field === "mrp") {
          const price = priceFromDiscount(value, row.discount);
          return { ...row, mrp: value, price: price ?? row.price };
        }

        if (field === "price") {
          return {
            ...row,
            price: value,
            discount: String(discountPercent(toPaise(row.mrp), toPaise(value))),
          };
        }

        return { ...row, [field]: value };
      })
    );
  }

  async function uploadImage(key: string, index: number, file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Each image must be 2 MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as
        | { url?: unknown; error?: unknown }
        | null;

      if (!response.ok || typeof result?.url !== "string") {
        setUploadError(
          typeof result?.error === "string"
            ? result.error
            : "Could not upload the image."
        );
        return;
      }

      setRows((current) =>
        current.map((row) => {
          if (row.key !== key) return row;
          const images = [...row.images];
          images[index] = result.url as string;
          return {
            ...row,
            images: images.filter(Boolean).slice(0, 3),
          };
        })
      );
    } catch {
      setUploadError("Could not upload the image.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(key: string, index: number) {
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? {
              ...row,
              images: row.images.filter((_, imageIndex) => imageIndex !== index),
            }
          : row
      )
    );
  }

  return (
    <div className="admin-sizes">
      <input type="hidden" name="sizes" value={payload} />

      <div className="admin-sizes_head">
        <span>Size label</span>
        <span>Grams</span>
        <span>MRP (₹)</span>
        <span>Discount</span>
        <span>Price (₹)</span>
        <span>Images</span>
        <span />
      </div>

      {rows.map((row) => {
        return (
          <div className="admin-sizes_row" key={row.key}>
            <input
              aria-label="Size label"
              value={row.label}
              onChange={(event) => update(row.key, "label", event.target.value)}
              placeholder="500g"
              required
            />
            <input
              aria-label="Grams"
              type="number"
              min={1}
              value={row.grams}
              onChange={(event) => update(row.key, "grams", event.target.value)}
              placeholder="500"
            />
            <input
              aria-label="MRP in rupees"
              type="number"
              min={0}
              step="0.01"
              value={row.mrp}
              onChange={(event) => update(row.key, "mrp", event.target.value)}
              required
            />
            <input
              aria-label="Discount percent"
              type="number"
              min={0}
              max={100}
              step="1"
              value={row.discount}
              onChange={(event) => update(row.key, "discount", event.target.value)}
              placeholder="0"
            />
            <input
              aria-label="Price in rupees"
              type="number"
              min={0}
              step="0.01"
              value={row.price}
              onChange={(event) => update(row.key, "price", event.target.value)}
              required
            />
            <button
              type="button"
              className="admin-btn admin-btn--small"
              onClick={() => {
                setUploadError(null);
                setImageRowKey(row.key);
              }}
            >
              Images ({row.images.length}/3)
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--small admin-btn--ghost"
              onClick={() =>
                setRows((current) => current.filter((entry) => entry.key !== row.key))
              }
              disabled={rows.length === 1}
            >
              Remove
            </button>
          </div>
        );
      })}

      <button
        type="button"
        className="admin-btn admin-btn--small"
        onClick={() =>
          setRows((current) => [
            ...current,
            {
              key: `size-${Date.now()}-${current.length}`,
              label: "",
              grams: "",
              mrp: "0",
              price: "0",
              discount: "0",
              images: [],
            },
          ])
        }
      >
        Add size
      </button>

      {imageRow ? (
        <div
          className="admin-image-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-image-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setImageRowKey(null);
          }}
        >
          <div className="admin-image-modal_panel">
            <div className="admin-image-modal_head">
              <div>
                <h2 id="admin-image-modal-title">
                  Images for {imageRow.label.trim() || "this size"}
                </h2>
                <p>Add, replace or delete up to three images.</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--ghost"
                onClick={() => setImageRowKey(null)}
                aria-label="Close image manager"
              >
                Close
              </button>
            </div>

            {uploadError ? (
              <p className="admin-alert admin-alert--error" role="alert">
                {uploadError}
              </p>
            ) : null}

            <div className="admin-image-modal_grid">
              {[0, 1, 2].map((index) => {
                const image = imageRow.images[index] ?? "";
                const inputId = `size-image-${imageRow.key}-${index}`;

                return (
                  <div
                    className={`admin-image-slot${image ? " has-image" : ""}`}
                    key={index}
                  >
                    <span className="admin-image-slot_label">
                      Image {index + 1}
                    </span>

                    {image ? (
                      <img
                        className="admin-image-slot_preview"
                        src={imageSrc(image)}
                        alt=""
                      />
                    ) : (
                      <span className="admin-image-slot_empty">No image</span>
                    )}

                    <div className="admin-image-slot_actions">
                      <label
                        className="admin-btn admin-btn--small"
                        htmlFor={inputId}
                      >
                        {image ? "Edit" : "Add"}
                      </label>
                      <input
                        id={inputId}
                        className="admin-image-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={uploading}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.currentTarget.value = "";
                          if (file) void uploadImage(imageRow.key, index, file);
                        }}
                      />
                      {image ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => removeImage(imageRow.key, index)}
                          disabled={uploading}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-image-modal_foot">
              <span>{imageRow.images.length} of 3 images</span>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => setImageRowKey(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Combo items                                                                */
/* -------------------------------------------------------------------------- */

export type ComboItemDraft = {
  productId: string | null;
  name: string;
  quantity: string;
};

type ProductOption = { id: number; sku: string | null; name: string };
type ItemRow = ComboItemDraft & { key: string };

export function ItemsEditor({
  products,
  defaultItems,
}: {
  products: ProductOption[];
  defaultItems: ComboItemDraft[];
}) {
  const [rows, setRows] = useState<ItemRow[]>(() =>
    defaultItems.map((item, index) => ({
      key: `item-${index}`,
      productId: item.productId == null ? null : String(item.productId),
      name: item.name,
      quantity: item.quantity,
    }))
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row) => ({
          productId: row.productId || null,
          name: row.name,
          quantity: row.quantity,
        }))
      ),
    [rows]
  );

  function update(key: string, patch: Partial<ComboItemDraft>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  return (
    <div className="admin-items">
      <input type="hidden" name="items" value={payload} />

      <div className="admin-items_head">
        <span>Product</span>
        <span>Display name</span>
        <span>Quantity</span>
        <span />
      </div>

      {rows.map((row) => (
        <div className="admin-items_row" key={row.key}>
          <select
            aria-label="Product"
            value={row.productId ?? ""}
            onChange={(event) => {
              const productId = event.target.value;
              const product = products.find(
                (entry) => (entry.sku ?? `id:${entry.id}`) === productId
              );
              update(row.key, {
                productId: productId || null,
                name: product ? product.name : row.name,
              });
            }}
          >
            <option value="">Custom item</option>
            {products.map((product) => (
              <option key={product.id} value={product.sku ?? `id:${product.id}`}>
                {product.name}
                {product.sku ? ` (${product.sku})` : ""}
              </option>
            ))}
          </select>
          <input
            aria-label="Display name"
            value={row.name}
            onChange={(event) => update(row.key, { name: event.target.value })}
            required
          />
          <input
            aria-label="Quantity"
            value={row.quantity}
            onChange={(event) => update(row.key, { quantity: event.target.value })}
            placeholder="500g"
            required
          />
          <button
            type="button"
            className="admin-btn admin-btn--small admin-btn--ghost"
            onClick={() =>
              setRows((current) => current.filter((entry) => entry.key !== row.key))
            }
            disabled={rows.length === 1}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="admin-btn admin-btn--small"
        onClick={() =>
          setRows((current) => [
            ...current,
            {
              key: `item-${Date.now()}-${current.length}`,
              productId: null,
              name: "",
              quantity: "",
            },
          ])
        }
      >
        Add item
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Blog blocks                                                                */
/* -------------------------------------------------------------------------- */

type BlockType = "p" | "h2" | "h3" | "list" | "ul" | "ol";
type BlockRow = { key: string; type: BlockType; text: string };

function blockToRow(block: BlogBlock, index: number): BlockRow {
  return {
    key: `block-${index}`,
    type: block.type,
    text: "items" in block ? block.items.join("\n") : block.text,
  };
}

export function BlocksEditor({ defaultBlocks }: { defaultBlocks: BlogBlock[] }) {
  const [rows, setRows] = useState<BlockRow[]>(() =>
    defaultBlocks.map((block, index) => blockToRow(block, index))
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row) => {
          if (row.type === "list" || row.type === "ul" || row.type === "ol") {
            return {
              type: row.type,
              items: row.text
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            };
          }
          return { type: row.type, text: row.text.trim() };
        })
      ),
    [rows]
  );

  function update(key: string, patch: Partial<BlockRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function move(key: string, direction: -1 | 1) {
    setRows((current) => {
      const index = current.findIndex((row) => row.key === key);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }

  return (
    <div className="admin-blocks">
      <input type="hidden" name="content" value={payload} />

      {rows.map((row, index) => (
        <div className="admin-block" key={row.key}>
          <div className="admin-block_head">
            <select
              aria-label="Block type"
              value={row.type}
              onChange={(event) =>
                update(row.key, { type: event.target.value as BlockType })
              }
            >
              <option value="p">Paragraph</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="ul">Bullet list</option>
              <option value="ol">Numbered list</option>
            </select>

            <div className="admin-block_actions">
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--ghost"
                onClick={() => move(row.key, -1)}
                disabled={index === 0}
              >
                Up
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--ghost"
                onClick={() => move(row.key, 1)}
                disabled={index === rows.length - 1}
              >
                Down
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--ghost"
                onClick={() =>
                  setRows((current) =>
                    current.filter((entry) => entry.key !== row.key)
                  )
                }
                disabled={rows.length === 1}
              >
                Remove
              </button>
            </div>
          </div>

          <textarea
            aria-label="Block content"
            rows={row.type === "p" ? 5 : 3}
            value={row.text}
            onChange={(event) => update(row.key, { text: event.target.value })}
            placeholder={
              row.type === "list" || row.type === "ul" || row.type === "ol"
                ? "One list item per line"
                : "Write the content here"
            }
            required
          />
        </div>
      ))}

      <button
        type="button"
        className="admin-btn admin-btn--small"
        onClick={() =>
          setRows((current) => [
            ...current,
            {
              key: `block-${Date.now()}-${current.length}`,
              type: "p",
              text: "",
            },
          ])
        }
      >
        Add block
      </button>
    </div>
  );
}
