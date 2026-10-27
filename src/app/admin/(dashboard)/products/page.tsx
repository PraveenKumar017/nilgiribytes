import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  ConfirmSubmit,
  SizesEditor,
  type SizeDraft,
} from "@/components/admin/admin-ui";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/admin/actions";
import {
  getProduct,
  listCategories,
  listProducts,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/admin";

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

function ProductForm({
  categories,
  product,
}: {
  categories: AdminCategory[];
  product?: AdminProduct;
}) {
  const sizes: SizeDraft[] =
    product?.sizes.map((size) => ({
      label: size.label,
      grams: size.grams,
      mrpPaise: size.mrpPaise,
      pricePaise: size.pricePaise,
      imageUrl: size.imageUrl,
    })) ?? [
      {
        label: "500g",
        grams: 500,
        mrpPaise: 0,
        pricePaise: 0,
        imageUrl: null,
      },
    ];

  return (
    <ActionForm
      action={product ? updateProductAction : createProductAction}
      submitLabel={product ? "Save product" : "Create product"}
    >
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="sku" value={product?.sku ?? ""} />
      <input type="hidden" name="slug" value={product?.slug ?? ""} />
      <input type="hidden" name="posterUrl" value={product?.posterUrl ?? ""} />
      <input type="hidden" name="imageUrl" value={product?.imageUrl ?? ""} />
      <input type="hidden" name="imageAlt" value={product?.imageAlt ?? ""} />
      <input type="hidden" name="sortOrder" value={product?.sortOrder ?? 0} />

      <div className="admin-form_grid">
        <label className="admin-field">
          <span>Name</span>
          <input name="name" defaultValue={product?.name ?? ""} required />
        </label>

        <label className="admin-field">
          <span>Category</span>
          <select name="categoryId" defaultValue={product?.categoryId ?? ""} required>
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="admin-field">
        <span>Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          required
        />
      </label>

      <div className="admin-form_section">
        <div className="admin-form_section-head">
          <h2>Sizes and prices</h2>
          <p>Enter prices in rupees. Discounts are calculated automatically.</p>
        </div>
        <SizesEditor defaultSizes={sizes} />
      </div>

    </ActionForm>
  );
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isNew = Boolean(params.new);
  const id = Number(params.id);

  if (isNew || (params.id && !id)) {
    const categories = await listCategories();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/products">Products</Link> / New
            </p>
            <h1 className="admin-page-title">New product</h1>
          </div>
        </header>

        {categories.length ? (
          <section className="admin-panel">
            <ProductForm categories={categories} />
          </section>
        ) : (
          <section className="admin-panel">
            <p className="admin-empty">
              Create a category before adding products.{" "}
              <Link className="admin-link" href="/admin/categories?new=1">
                Add a category
              </Link>
            </p>
          </section>
        )}
      </>
    );
  }

  if (params.id) {
    const [product, categories] = await Promise.all([
      getProduct(id),
      listCategories(),
    ]);
    if (!product) notFound();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/products">Products</Link> / Edit
            </p>
            <h1 className="admin-page-title">{product.name}</h1>
            <p className="admin-page-text">
              {product.categoryName} &middot; {product.sizes.length} size
              {product.sizes.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/products">
              &larr; Back to products
            </Link>
          </div>
        </header>

        <section className="admin-panel">
          <ProductForm categories={categories} product={product} />
        </section>
      </>
    );
  }

  const products = await listProducts();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-text">
            Manage varkey, biscuits and their size-wise pricing.
          </p>
        </div>
        <Link className="admin-btn admin-btn--primary" href="/admin/products?new=1">
          New product
        </Link>
      </header>

      {params.created ? <p className="admin-alert admin-alert--success">Product created.</p> : null}
      {params.updated ? <p className="admin-alert admin-alert--success">Product updated.</p> : null}
      {params.deleted ? <p className="admin-alert admin-alert--success">Product deleted.</p> : null}
      {params.error === "not-found" ? (
        <p className="admin-alert admin-alert--error">Product not found.</p>
      ) : null}

      <section className="admin-panel">
        {products.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Sizes</th>
                  <th>Order</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="admin-table_primary">{product.name}</span>
                    </td>
                    <td>{product.categoryName}</td>
                    <td>{product.sizeCount}</td>
                    <td>{product.sortOrder}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          className="admin-btn admin-btn--small"
                          href={`/admin/products?id=${product.id}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M4 20h4.4L19 9.4a2 2 0 000-2.8l-1.6-1.6a2 2 0 00-2.8 0L4 15.6V20zM13.5 6.5l4 4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Edit
                        </Link>
                        <form action={deleteProductAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <ConfirmSubmit
                            message={`Delete "${product.name}"? This cannot be undone.`}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M4 7h16M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M6.5 7l.8 12.1A1.9 1.9 0 009.2 21h5.6a1.9 1.9 0 001.9-1.9L17.5 7M10 11v6M14 11v6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
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
          <p className="admin-empty">No products yet.</p>
        )}
      </section>
    </>
  );
}
