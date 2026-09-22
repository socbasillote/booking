export function PromotionsPage() {
  const promotions = [
    { title: "Summer Glow", detail: "20% off facials", status: "Live" },
    {
      title: "Studio Bundle",
      detail: "Hair + treatment package",
      status: "Draft",
    },
    {
      title: "Loyalty Bonus",
      detail: "Free add-on after 3 visits",
      status: "Scheduled",
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Promotions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage active promo campaigns.
          </p>
        </div>
        <button className="w-full shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto">
          + Create Promotion
        </button>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promo) => (
          <div key={promo.title} className="page-card p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {promo.status}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              {promo.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{promo.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
