import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  ConfirmSubmit,
  ImageField,
  ItemsEditor,
  type ComboItemDraft,
} from "@/components/admin/admin-ui";
import {
  createComboAction,
  deleteComboAction,
  updateComboAction,
} from "@/app/admin/actions";
import { getCombo, listCombos, listProductOptions, type AdminCombo } from "@/lib/admin";
import { formatINR } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{
    new?: string;
    id?: string;
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
};

type ProductOption = { id: number; sku: string | null; name: string };

function ComboForm({
  products,
  combo,
}: {
  products: ProductOption[];
  combo?: AdminCombo;
}) {
  const items: ComboItemDraft[] =
    combo?.items.map((item) => ({
      productId: item.productId == null ? null : String(item.productId),
      name: item.name,
      quantity: item.quantity,
    })) ?? [{ productId: null, name: "", quantity: "" }];

  return (
    <ActionForm action={combo ? updateComboAction : createComboAction} submitLabel={combo ? "Save combo" : "Create combo"}>
      {combo ? <input type="hidden" name="id" value={combo.id} /> : null}

      <div className="admin-form_grid">
        <label className="admin-field">
          <span>Name</span>
          <input name="name" defaultValue={combo?.name ?? ""} required />
        </label>

        <label className="admin-field">
          <span>SKU</span>
          <input name="sku" defaultValue={combo?.sku ?? ""} placeholder="cm-004" />
        </label>

        <label className="admin-field">
          <span>Slug</span>
          <input
            name="slug"
            defaultValue={combo?.slug ?? ""}
            placeholder="tea-time-combo"
            required
          />
        </label>

        <label className="admin-field">
          <span>Weight label</span>
          <input
            name="weightLabel"
            defaultValue={combo?.weightLabel ?? ""}
            placeholder="1 kg total"
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={combo?.description ?? ""}
          required
        />
      </label>

      <div className="admin-form_section">
        <div className="admin-form_section-head">
          <h2>Combo contents</h2>
          <p>Choose products and describe the quantity included in the pack.</p>
        </div>
        <ItemsEditor products={products} defaultItems={items} />
      </div>

      <div className="admin-form_grid">
        <ImageField name="imageUrl" label="Image" defaultValue={combo?.imageUrl} />
        <label className="admin-field">
          <span>Image alt text</span>
          <input name="imageAlt" defaultValue={combo?.imageAlt ?? ""} />
        </label>
        <label className="admin-field">
          <span>Price (₹)</span>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={combo ? String(combo.pricePaise / 100) : ""}
            required
          />
        </label>
        <label className="admin-field">
          <span>Sort order</span>
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={combo?.sortOrder ?? 0}
          />
        </label>
        <label className="admin-checkbox">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={combo?.isActive ?? true}
          />
          <span>Visible on the storefront</span>
        </label>
      </div>
    </ActionForm>
  );
}

export default async function AdminCombosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isNew = Boolean(params.new);
  const id = Number(params.id);

  if (isNew || (params.id && !id)) {
    const products = await listProductOptions();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/combos">Combos</Link> / New
            </p>
            <h1 className="admin-page-title">New combo</h1>
          </div>
        </header>

        <section className="admin-panel">
          <ComboForm products={products} />
        </section>
      </>
    );
  }

  if (params.id) {
    const [combo, products] = await Promise.all([
      getCombo(id),
      listProductOptions(),
    ]);
    if (!combo) notFound();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/combos">Combos</Link> / Edit
            </p>
            <h1 className="admin-page-title">{combo.name}</h1>
            <p className="admin-page-text">
              {combo.items.length} item{combo.items.length === 1 ? "" : "s"} in this combo.
            </p>
          </div>
        </header>

        <section className="admin-panel">
          <ComboForm products={products} combo={combo} />
        </section>
      </>
    );
  }

  const combos = await listCombos();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Combos</h1>
          <p className="admin-page-text">
            Curated packs shown alongside products on the shop page.
          </p>
        </div>
        <Link className="admin-btn admin-btn--primary" href="/admin/combos?new=1">
          New combo
        </Link>
      </header>

      {params.created ? <p className="admin-alert admin-alert--success">Combo created.</p> : null}
      {params.updated ? <p className="admin-alert admin-alert--success">Combo updated.</p> : null}
      {params.deleted ? <p className="admin-alert admin-alert--success">Combo deleted.</p> : null}
      {params.error === "not-found" ? (
        <p className="admin-alert admin-alert--error">Combo not found.</p>
      ) : null}

      <section className="admin-panel">
        {combos.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => (
                  <tr key={combo.id}>
                    <td>
                      <span className="admin-table_primary">{combo.name}</span>
                      <span className="admin-table_sub">{combo.slug}</span>
                    </td>
                    <td className="admin-mono">{combo.sku ?? "—"}</td>
                    <td>{formatINR(combo.pricePaise)}</td>
                    <td>{combo.sortOrder}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          combo.isActive ? "admin-badge--published" : "admin-badge--draft"
                        }`}
                      >
                        {combo.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          className="admin-btn admin-btn--small"
                          href={`/admin/combos?id=${combo.id}`}
                        >
                          Edit
                        </Link>
                        <form action={deleteComboAction}>
                          <input type="hidden" name="id" value={combo.id} />
                          <ConfirmSubmit
                            message={`Delete "${combo.name}"? This cannot be undone.`}
                          >
                            Delete
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
          <p className="admin-empty">No combos yet.</p>
        )}
      </section>
    </>
  );
}
