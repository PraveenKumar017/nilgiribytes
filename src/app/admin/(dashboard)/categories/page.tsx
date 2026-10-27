import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmSubmit } from "@/components/admin/admin-ui";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/actions";
import { getCategory, listCategories, type AdminCategory } from "@/lib/admin";

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

function CategoryForm({ category }: { category?: AdminCategory }) {
  return (
    <ActionForm
      action={category ? updateCategoryAction : createCategoryAction}
      submitLabel={category ? "Save changes" : "Create category"}
    >
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="admin-form_grid">
        <label className="admin-field">
          <span>Name</span>
          <input name="name" defaultValue={category?.name ?? ""} required />
        </label>

        <label className="admin-field">
          <span>Slug</span>
          <input
            name="slug"
            defaultValue={category?.slug ?? ""}
            placeholder="ooty-varkey"
            required
          />
        </label>

        <label className="admin-field">
          <span>Sort order</span>
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={category?.sortOrder ?? 0}
          />
        </label>
      </div>
    </ActionForm>
  );
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isNew = Boolean(params.new);
  const id = Number(params.id);

  if (isNew || (params.id && !id)) {
    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/categories">Categories</Link> / New
            </p>
            <h1 className="admin-page-title">New category</h1>
          </div>
        </header>

        <section className="admin-panel">
          <CategoryForm />
        </section>
      </>
    );
  }

  if (params.id) {
    const category = await getCategory(id);
    if (!category) notFound();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/categories">Categories</Link> / Edit
            </p>
            <h1 className="admin-page-title">{category.name}</h1>
            <p className="admin-page-text">
              {category.productCount} product
              {category.productCount === 1 ? "" : "s"} in this category.
            </p>
          </div>
        </header>

        <section className="admin-panel">
          <CategoryForm category={category} />
        </section>
      </>
    );
  }

  const categories = await listCategories();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-text">
            Group products on the shop page and in category filters.
          </p>
        </div>
        <Link className="admin-btn admin-btn--primary" href="/admin/categories?new=1">
          New category
        </Link>
      </header>

      {params.created ? <p className="admin-alert admin-alert--success">Category created.</p> : null}
      {params.updated ? <p className="admin-alert admin-alert--success">Category updated.</p> : null}
      {params.deleted ? <p className="admin-alert admin-alert--success">Category deleted.</p> : null}
      {params.error === "in-use" ? (
        <p className="admin-alert admin-alert--error">
          This category still has products. Move or delete them first.
        </p>
      ) : null}
      {params.error === "not-found" ? (
        <p className="admin-alert admin-alert--error">Category not found.</p>
      ) : null}

      <section className="admin-panel">
        {categories.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Order</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td className="admin-mono">{category.slug}</td>
                    <td>{category.productCount}</td>
                    <td>{category.sortOrder}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          className="admin-btn admin-btn--small"
                          href={`/admin/categories?id=${category.id}`}
                        >
                          Edit
                        </Link>
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={category.id} />
                          <ConfirmSubmit
                            message={`Delete "${category.name}"? This cannot be undone.`}
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
          <p className="admin-empty">No categories yet.</p>
        )}
      </section>
    </>
  );
}
