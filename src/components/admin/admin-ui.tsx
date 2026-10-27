"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
import { loginAction } from "@/app/admin/actions";
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
];

export function AdminNav() {
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
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
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
};

export function ActionForm({
  action,
  children,
  submitLabel,
  className = "admin-form",
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className={className}>
      {children}

      {state?.error ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="admin-form_actions">
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

export function ConfirmSubmit({
  children,
  message,
  className = "admin-btn admin-btn--danger",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      type="submit"
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

export function ImageField({
  name,
  label,
  defaultValue,
  placeholder = "/assets/images/...",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [failed, setFailed] = useState(false);

  return (
    <div className="admin-field admin-field--image">
      <span>{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setFailed(false);
        }}
        placeholder={placeholder}
      />
      <div className="admin-image-preview">
        {value ? (
          <img
            src={failed ? "/assets/placeholder.svg" : value}
            alt=""
            onError={() => setFailed(true)}
          />
        ) : (
          <span>Image preview</span>
        )}
      </div>
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
  imageUrl: string | null;
};

type SizeRow = {
  key: string;
  label: string;
  grams: string;
  mrp: string;
  price: string;
  discount: string;
  imageUrl: string;
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
    imageUrl: size.imageUrl ?? "",
  };
}

export function SizesEditor({ defaultSizes }: { defaultSizes: SizeDraft[] }) {
  const [rows, setRows] = useState<SizeRow[]>(() =>
    defaultSizes.map((size, index) => sizeToRow(size, index))
  );

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
            imageUrl: row.imageUrl.trim() === "" ? null : row.imageUrl.trim(),
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

  return (
    <div className="admin-sizes">
      <input type="hidden" name="sizes" value={payload} />

      <div className="admin-sizes_head">
        <span>Size label</span>
        <span>Grams</span>
        <span>MRP (₹)</span>
        <span>Discount</span>
        <span>Price (₹)</span>
        <span>Image URL</span>
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
            <input
              aria-label="Size image URL"
              value={row.imageUrl}
              onChange={(event) => update(row.key, "imageUrl", event.target.value)}
              placeholder="/assets/images/..."
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
              imageUrl: "",
            },
          ])
        }
      >
        Add size
      </button>
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
