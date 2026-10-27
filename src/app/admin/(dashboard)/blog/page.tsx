import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  AutoSubmitSelect,
  BlocksEditor,
  ConfirmSubmit,
  ImageField,
  PostPreviewButton,
} from "@/components/admin/admin-ui";
import {
  EditIcon,
  ExternalLinkIcon,
  TrashIcon,
} from "@/components/admin/icons";
import {
  createPostAction,
  deletePostAction,
  updatePostAction,
  updatePostStatusAction,
} from "@/app/admin/actions";
import { getPost, listPosts, type AdminPost } from "@/lib/admin";
import { formatDate } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{
    new?: string;
    id?: string;
    created?: string;
    updated?: string;
    deleted?: string;
    status?: string;
    error?: string;
  }>;
};

function PostForm({ post }: { post?: AdminPost }) {
  const blocks = post?.content.length
    ? post.content
    : [{ type: "p" as const, text: "" }];

  return (
    <ActionForm
      action={post ? updatePostAction : createPostAction}
      submitLabel={post ? "Save post" : "Create post"}
      extraActions={<PostPreviewButton />}
    >
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="admin-form_grid">
        <label className="admin-field">
          <span>Title</span>
          <input name="title" defaultValue={post?.title ?? ""} required />
        </label>

        <label className="admin-field">
          <span>Slug</span>
          <input
            name="slug"
            defaultValue={post?.slug ?? ""}
            placeholder="the-art-of-the-perfect-varkey"
            required
          />
        </label>

        <label className="admin-field">
          <span>Category</span>
          <input
            name="category"
            defaultValue={post?.category ?? "Bakery Stories"}
            required
          />
        </label>

        <label className="admin-field">
          <span>Author</span>
          <input name="author" defaultValue={post?.author ?? "Nilgiribytes Team"} />
        </label>

        <label className="admin-field">
          <span>Date</span>
          <input
            name="date"
            type="date"
            defaultValue={post?.date ?? new Date().toISOString().slice(0, 10)}
            required
          />
        </label>

        <label className="admin-field">
          <span>Reading time (minutes)</span>
          <input
            name="readingTimeMin"
            type="number"
            min={0}
            defaultValue={post?.readingTimeMin ?? ""}
            placeholder="3"
          />
        </label>

        <label className="admin-field">
          <span>Status</span>
          <select name="status" defaultValue={post?.status ?? "DRAFT"}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>
      </div>

      <label className="admin-field">
        <span>Excerpt</span>
        <textarea name="excerpt" rows={3} defaultValue={post?.excerpt ?? ""} />
      </label>

      <div className="admin-form_grid">
        <ImageField name="coverImage" label="Cover image" defaultValue={post?.coverImage} />
        <label className="admin-field">
          <span>Image alt text</span>
          <input name="imageAlt" defaultValue={post?.imageAlt ?? ""} />
        </label>
      </div>

      <div className="admin-form_section">
        <div className="admin-form_section-head">
          <h2>Content</h2>
          <p>Build the article with paragraphs, headings and lists.</p>
        </div>
        <BlocksEditor defaultBlocks={blocks} />
      </div>
    </ActionForm>
  );
}

export default async function AdminBlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isNew = Boolean(params.new);
  const id = Number(params.id);

  if (isNew || (params.id && !id)) {
    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/blog">Blog</Link> / New
            </p>
            <h1 className="admin-page-title">New post</h1>
          </div>
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/blog">
              &larr; Back to blog
            </Link>
          </div>
        </header>

        <section className="admin-panel">
          <PostForm />
        </section>
      </>
    );
  }

  if (params.id) {
    const post = await getPost(id);
    if (!post) notFound();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/blog">Blog</Link> / Edit
            </p>
            <h1 className="admin-page-title">{post.title}</h1>
            <p className="admin-page-text">
              {post.status === "PUBLISHED" ? "Published" : "Draft"} &middot;{" "}
              {post.category}
            </p>
          </div>
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/blog">
              &larr; Back to blog
            </Link>
          </div>
        </header>

        <section className="admin-panel">
          <PostForm post={post} />
        </section>
      </>
    );
  }

  const posts = await listPosts();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Blog</h1>
          <p className="admin-page-text">
            Write stories and recipes. Only published posts appear on the site.
          </p>
        </div>
        <Link className="admin-btn admin-btn--primary" href="/admin/blog?new=1">
          New post
        </Link>
      </header>

      {params.created ? <p className="admin-alert admin-alert--success">Post created.</p> : null}
      {params.updated ? <p className="admin-alert admin-alert--success">Post updated.</p> : null}
      {params.status ? (
        <p className="admin-alert admin-alert--success">Post status updated.</p>
      ) : null}
      {params.deleted ? <p className="admin-alert admin-alert--success">Post deleted.</p> : null}
      {params.error === "not-found" ? (
        <p className="admin-alert admin-alert--error">Post not found.</p>
      ) : null}

      <section className="admin-panel">
        {posts.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--blog">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="admin-col-category">Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td data-label="Post">
                      <span className="admin-table_primary">{post.title}</span>
                      <span className="admin-table_sub">{post.slug}</span>
                    </td>
                    <td className="admin-col-category" data-label="Category">
                      {post.category}
                    </td>
                    <td data-label="Date">{formatDate(post.date)}</td>
                    <td data-label="Status">
                      <form action={updatePostStatusAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <AutoSubmitSelect
                          name="status"
                          defaultValue={post.status}
                          label={`Status for ${post.title}`}
                          className={`admin-status-select admin-status-select--${post.status.toLowerCase()}`}
                          options={[
                            { value: "DRAFT", label: "Draft" },
                            { value: "PUBLISHED", label: "Published" },
                          ]}
                        />
                      </form>
                    </td>
                    <td data-label="Updated">
                      {new Date(post.updatedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="admin-table_actions" data-label="Actions">
                      <div className="admin-row-actions">
                        <Link
                          className="admin-btn admin-btn--small admin-btn--icon"
                          href={`/admin/blog?id=${post.id}`}
                          aria-label={`Edit ${post.title}`}
                          title="Edit"
                        >
                          <EditIcon />
                        </Link>
                        {post.status === "PUBLISHED" ? (
                          <Link
                            className="admin-btn admin-btn--small admin-btn--ghost admin-btn--icon"
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            aria-label={`View ${post.title}`}
                            title="View post"
                          >
                            <ExternalLinkIcon />
                          </Link>
                        ) : null}
                        <form action={deletePostAction}>
                          <input type="hidden" name="id" value={post.id} />
                          <ConfirmSubmit
                            className="admin-btn admin-btn--small admin-btn--danger admin-btn--icon"
                            message={`Delete "${post.title}"? This cannot be undone.`}
                            label={`Delete ${post.title}`}
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
          <p className="admin-empty">No posts yet.</p>
        )}
      </section>
    </>
  );
}
