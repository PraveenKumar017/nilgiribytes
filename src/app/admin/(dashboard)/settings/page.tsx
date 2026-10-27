import { ActionForm } from "@/components/admin/admin-ui";
import { updateSettingsAction } from "@/app/admin/actions";
import { getAdminSettings } from "@/lib/admin";

type PageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const settings = await getAdminSettings();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-text">
            Manage storefront options and checkout preferences.
          </p>
        </div>
      </header>

      {params.saved ? (
        <p className="admin-alert admin-alert--success">Settings saved.</p>
      ) : null}
      {params.error ? (
        <p className="admin-alert admin-alert--error">
          Could not save settings. Please try again.
        </p>
      ) : null}

      <section className="admin-panel">
        <ActionForm action={updateSettingsAction} submitLabel="Save settings">
          <div className="admin-form_section">
            <div className="admin-form_section-head">
              <h2>Checkout</h2>
              <p>Choose which payment options are available to customers.</p>
            </div>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                name="codEnabled"
                defaultChecked={settings.codEnabled}
              />
              <span>Enable cash on delivery (COD)</span>
            </label>
          </div>

          <div className="admin-form_section">
            <div className="admin-form_section-head">
              <h2>Offer banner</h2>
              <p>Control whether the offer banner is enabled.</p>
            </div>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                name="offerBannerEnabled"
                defaultChecked={settings.offerBannerEnabled}
              />
              <span>Enable offer banner</span>
            </label>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
