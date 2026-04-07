"use client";

export default function Dashboard({
  form,
  handleChange,
  handleSubmit,
  loading,
}: any) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-300 bg-[#e7edf2] p-6 shadow-sm">
        
        <h1 className="text-2xl font-bold mb-4">
          Kampagnensteuerung & AI Setup
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            name="kampagnenname"
            placeholder="Kampagnenname"
            value={form.kampagnenname}
            onChange={handleChange}
            className="border border-slate-200 rounded-2xl p-3 bg-slate-50"
          />

          <input
            name="budget"
            placeholder="Budget in €"
            value={form.budget}
            onChange={handleChange}
            className="border border-slate-200 rounded-2xl p-3 bg-slate-50"
          />
        </div>

        <textarea
          name="prompt"
          placeholder="Beschreibe deine Kampagne..."
          value={form.prompt}
          onChange={handleChange}
          className="border border-slate-200 rounded-2xl p-4 bg-slate-50 w-full min-h-[120px] mb-4"
        />

        <button
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-[#334155] text-white py-3 font-medium hover:opacity-90"
        >
          {loading ? "Wird erstellt..." : "Kampagne starten"}
        </button>
      </div>
    </div>
  );
}