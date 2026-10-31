import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  ConfirmSubmit,
  ImagesField,
  ItemsEditor,
  type ComboItemDraft,
  type ProductOption,
} from "@/components/admin/admin-ui";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
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
      <input type="hidden" name="slug" value={combo?.slug ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(combo?.images ?? [])} />
      <input type="hidden" name="sortOrder" value={combo?.sortOrder ?? 0} />

      <div className="admin-form_grid">
        <label className="admin-field">
          <span>Name</span>
          <input name="name" defaultValue={combo?.name ?? ""} required />
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
          <span>Weight label</span>
          <input
            name="weightLabel"
            defaultValue={combo?.weightLabel ?? ""}
            placeholder="1 kg total"
          />
        </label>

        <label className="admin-field">
          <span>Discount (%)</span>
          <input
            name="discountPercent"
            type="number"
            min={0}
            max={100}
            step="1"
            defaultValue={combo?.discountPercent ?? 0}
            placeholder="0"
          />
        </label>

        <label className="admin-field">
          <span>Rating (0–5)</span>
          <input
            name="rating"
            type="number"
            min={0}
            max={5}
            step="0.1"
            defaultValue={combo?.rating ?? 4.3}
          />
        </label>
      </div>

      <div className="admin-form_grid">
        <label className="admin-field">
          <span>Ingredients</span>
          <input
            name="ingredients"
            defaultValue={combo?.ingredients ?? ""}
            placeholder="e.g. Assorted traditional bakes"
          />
        </label>

        <label className="admin-field">
          <span>Shelf life</span>
          <input
            name="shelfLife"
            defaultValue={combo?.shelfLife ?? ""}
            placeholder="e.g. 30 days"
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
        <ImagesField
          name="images"
          label="Images"
          defaultImages={combo?.images}
        />
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
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/combos">
              &larr; Back to combos
            </Link>
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
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/combos">
              &larr; Back to combos
            </Link>
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
                  <th>Products</th>
                  <th>Price</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => (
                  <tr key={combo.id}>
                    <td>
                      <span className="admin-table_primary">{combo.name}</span>
                    </td>
                    <td>
                      {combo.items.length
                        ? combo.items
                            .map((item) =>
                              item.quantity
                                ? `${item.name} (${item.quantity})`
                                : item.name
                            )
                            .join(", ")
                        : "\u2014"}
                    </td>
                    <td>{formatINR(combo.pricePaise)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          className="admin-btn admin-btn--small admin-btn--icon"
                          href={`/admin/combos?id=${combo.id}`}
                          aria-label={`Edit ${combo.name}`}
                          title="Edit"
                        >
                          <EditIcon />
                        </Link>
                        <form action={deleteComboAction}>
                          <input type="hidden" name="id" value={combo.id} />
                          <ConfirmSubmit
                            className="admin-btn admin-btn--small admin-btn--danger admin-btn--icon"
                            message={`Delete "${combo.name}"? This cannot be undone.`}
                            label={`Delete ${combo.name}`}
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
          <p className="admin-empty">No combos yet.</p>
        )}
      </section>
    </>
  );
}
