import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const DOC_TYPES = ["Nota Dinas", "Surat Masuk", "Surat Keluar", "Surat Undangan", "Surat Tugas", "Berita Acara", "Memorandum", "Semua jenis", "Lainnya"];
const RULE_TYPES = [
  ["required_paragraph", "Paragraf wajib"],
  ["required_phrase", "Frasa wajib"],
  ["forbidden_phrase", "Frasa yang dihindari"],
  ["guidance", "Panduan (tidak otomatis menandai)"],
];
const blank = { document_type: "Nota Dinas", title: "", document_number: "", document_date: "", approval_status: "Final disetujui" };

export default function PustakaReferensi() {
  const [references, setReferences] = useState([]);
  const [rules, setRules] = useState([]);
  const [insights, setInsights] = useState({ reference_count: 0, paragraphs: [] });
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("documents");
  const [ruleDraft, setRuleDraft] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [ruleForm, setRuleForm] = useState({ name: "", document_type: "Nota Dinas", rule_type: "required_paragraph", content: "", description: "", severity: "warning", source_reference_id: null, source_paragraph_id: null });

  const refresh = async () => {
    try {
      const [r, ru, ins] = await Promise.all([api.get("/api/references"), api.get("/api/rules"), api.get("/api/reference-insights")]);
      setReferences(r.data || []); setRules(ru.data || []); setInsights(ins.data || { reference_count: 0, paragraphs: [] });
    } catch { toast.error("Gagal memuat pustaka. Pastikan backend SPK Lembur aktif."); }
  };
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (tab !== "audit") return;
    api.get("/api/audit-log?limit=150").then(r => setAuditLogs(r.data || [])).catch(() => toast.error("Gagal memuat jejak audit."));
  }, [tab]);
  const filtered = useMemo(() => references.filter(x => `${x.title} ${x.document_type} ${x.document_number}`.toLowerCase().includes(filter.toLowerCase())), [references, filter]);
  const changeForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitReference = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Pilih file dokumen final.");
    const body = new FormData(); Object.entries(form).forEach(([k, v]) => body.append(k, v)); body.append("file", file);
    setLoading(true);
    try {
      const response = await api.post("/api/references", body);
      toast.success(`Referensi tersimpan. ${response.data.data.paragraphs?.length || 0} paragraf diekstrak.`);
      setForm(blank); setFile(null); e.target.reset(); await refresh(); setSelected(response.data.data); setTab("documents");
    } catch (err) { toast.error(err.response?.data?.error || "Dokumen gagal diproses."); }
    finally { setLoading(false); }
  };

  const openReference = async (id) => {
    try { const r = await api.get(`/api/references/${id}`); setSelected(r.data); }
    catch { toast.error("Gagal membuka referensi."); }
  };

  const startRuleFromParagraph = (ref, paragraph) => {
    setRuleForm({ name: `${ref.document_type}: paragraf ${paragraph.paragraph_no}`, document_type: ref.document_type, rule_type: "required_paragraph", content: paragraph.paragraph_text, description: `Diambil dari dokumen final: ${ref.title}`, severity: "warning", source_reference_id: ref.id, source_paragraph_id: paragraph.id });
    setRuleDraft(true); setTab("rules");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveRule = async (e) => {
    e.preventDefault();
    try { await api.post("/api/rules", ruleForm); toast.success("Aturan tersimpan dengan sumber referensi."); setRuleDraft(null); setRuleForm({ name: "", document_type: "Nota Dinas", rule_type: "required_paragraph", content: "", description: "", severity: "warning", source_reference_id: null, source_paragraph_id: null }); await refresh(); }
    catch (err) { toast.error(err.response?.data?.error || "Aturan gagal disimpan."); }
  };

  const toggleRule = async (rule) => {
    try { await api.put(`/api/rules/${rule.id}`, { active: !rule.active }); toast.success(rule.active ? "Aturan dinonaktifkan." : "Aturan diaktifkan."); await refresh(); }
    catch { toast.error("Status aturan gagal diperbarui."); }
  };

  const removeReference = async (ref) => {
    if (!window.confirm(`Hapus referensi “${ref.title}”? Aturan yang memakai sumber ini akan tetap ada, tetapi tautan sumbernya terputus.`)) return;
    try { await api.delete(`/api/references/${ref.id}`); if (selected?.id === ref.id) setSelected(null); toast.success("Referensi dihapus."); await refresh(); }
    catch { toast.error("Referensi gagal dihapus."); }
  };

  return <Layout title="Smart Persuratan · Pustaka Referensi">
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div><h2 className="mb-1">Pustaka Referensi Persuratan</h2><p className="text-secondary mb-0">Kelola dokumen final yang disetujui, pelajari pola paragraf, dan tetapkan standar yang dapat ditelusuri sumbernya.</p></div>
      <span className="badge text-bg-light border p-2">{references.length} dokumen referensi · {rules.filter(r => r.active).length} aturan aktif</span>
    </div>
    <div className="alert alert-warning"><strong>Penting:</strong> kemunculan paragraf yang sering tidak otomatis menjadikannya wajib. Setiap standar harus divalidasi checker sebelum diaktifkan. Versi ini bekerja lokal tanpa panggilan AI eksternal.</div>
    <div className="row g-3 mb-4">
      <div className="col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-secondary small">Dokumen final terdaftar</div><div className="display-6 fw-semibold">{references.length}</div></div></div></div>
      <div className="col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-secondary small">Pola paragraf teramati</div><div className="display-6 fw-semibold">{insights.paragraphs.length}</div></div></div></div>
      <div className="col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-secondary small">Aturan aktif</div><div className="display-6 fw-semibold">{rules.filter(r => r.active).length}</div></div></div></div>
    </div>
    <div className="d-flex flex-wrap gap-2 mb-3">
      {[ ["documents", "Dokumen Referensi"], ["patterns", "Pola Paragraf"], ["rules", "Standar & Aturan"], ["audit", "Jejak Audit"] ].map(([key, label]) => <button key={key} className={`btn ${tab === key ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setTab(key)}>{label}</button>)}
    </div>

    {tab === "documents" && <>
      <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4"><h5 className="mb-3">Tambahkan dokumen final</h5>
        <form onSubmit={submitReference}><div className="row g-3">
          <div className="col-md-4"><label className="form-label">Jenis dokumen *</label><select className="form-select" name="document_type" value={form.document_type} onChange={changeForm}>{DOC_TYPES.filter(x => x !== "Semua jenis").map(x => <option key={x}>{x}</option>)}</select></div>
          <div className="col-md-8"><label className="form-label">Judul / nama dokumen *</label><input className="form-control" name="title" value={form.title} onChange={changeForm} placeholder="Contoh: Nota Dinas koordinasi kegiatan" required /></div>
          <div className="col-md-6"><label className="form-label">Nomor dokumen</label><input className="form-control" name="document_number" value={form.document_number} onChange={changeForm} /></div>
          <div className="col-md-6"><label className="form-label">Tanggal dokumen</label><input className="form-control" type="date" name="document_date" value={form.document_date} onChange={changeForm} /></div>
          <div className="col-md-8"><label className="form-label">File referensi * (DOCX, PDF teks, TXT)</label><input className="form-control" type="file" accept=".docx,.pdf,.txt" onChange={e => setFile(e.target.files?.[0] || null)} required /><div className="form-text">Unggah hanya naskah final yang disetujui/ditandatangani. PDF scan belum dapat diekstrak tanpa OCR.</div></div>
          <div className="col-md-4 d-flex align-items-end"><button className="btn btn-primary w-100" disabled={loading}>{loading ? "Mengekstrak…" : "Simpan & Ekstrak Paragraf"}</button></div>
        </div></form>
      </div></div>
      <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><h5 className="mb-0">Dokumen tersimpan</h5><input className="form-control" style={{ maxWidth: 320 }} placeholder="Cari judul, nomor, jenis…" value={filter} onChange={e => setFilter(e.target.value)} /></div>
        <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Dokumen</th><th>Nomor / tanggal</th><th>Paragraf</th><th>Hash file</th><th>Aksi</th></tr></thead><tbody>
          {filtered.map(ref => <tr key={ref.id}><td><div className="fw-semibold">{ref.title}</div><small className="text-secondary">{ref.document_type} · {ref.attachment_name}</small></td><td>{ref.document_number || "—"}<br/><small className="text-secondary">{ref.document_date || "Tanggal tidak dicatat"}</small></td><td><span className="badge text-bg-light border">{ref.paragraph_count}</span></td><td><code>{ref.sha256?.slice(0, 12)}…</code></td><td className="text-nowrap"><button className="btn btn-sm btn-outline-primary me-2" onClick={() => openReference(ref.id)}>Lihat pola</button><a className="btn btn-sm btn-outline-secondary me-2" href={`${api.defaults.baseURL}/api/references/${ref.id}/file`}>Unduh</a><button className="btn btn-sm btn-outline-danger" onClick={() => removeReference(ref)}>Hapus</button></td></tr>)}
          {!filtered.length && <tr><td colSpan="5" className="text-center text-secondary py-4">Belum ada dokumen referensi.</td></tr>}
        </tbody></table></div>
      </div></div>
      {selected && <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4"><div className="d-flex justify-content-between gap-3"><div><h5>{selected.title}</h5><p className="text-secondary">{selected.document_type} · {selected.document_number || "Nomor tidak dicatat"} · {selected.paragraphs?.length || 0} paragraf</p></div><button className="btn btn-sm btn-outline-secondary align-self-start" onClick={() => setSelected(null)}>Tutup</button></div><div className="alert alert-light border small">Paragraf diekstrak sesuai urutan dokumen. Pilih “Jadikan aturan” hanya setelah memverifikasi bahwa redaksi tersebut memang standar untuk jenis dokumen terkait.</div>
        <div className="d-grid gap-2">{(selected.paragraphs || []).map(p => <div key={p.id} className="border rounded p-3"><div className="d-flex justify-content-between align-items-start gap-3"><div className="flex-grow-1"><div className="small text-secondary mb-1">Paragraf {p.paragraph_no}</div><div style={{ whiteSpace: "pre-wrap" }}>{p.paragraph_text}</div></div><button className="btn btn-sm btn-outline-primary flex-shrink-0" onClick={() => startRuleFromParagraph(selected, p)}>Jadikan aturan</button></div></div>)}</div>
      </div></div>}
    </>}

    {tab === "patterns" && <div className="card border-0 shadow-sm"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3"><div><h5 className="mb-1">Pola paragraf dari dokumen final</h5><p className="text-secondary small mb-0">Pencocokan tahap pertama memakai paragraf identik setelah normalisasi spasi/tanda baca.</p></div><span className="badge text-bg-light border">Basis: {insights.reference_count} dokumen</span></div>
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Paragraf teramati</th><th>Jumlah dokumen</th><th>Frekuensi</th><th>Jenis dokumen</th></tr></thead><tbody>{insights.paragraphs.map((p, i) => <tr key={`${p.normalized_text}-${i}`}><td style={{ minWidth: 320, maxWidth: 700 }}><div style={{ whiteSpace: "pre-wrap" }}>{p.sample_text}</div></td><td>{p.document_count} / {insights.reference_count}</td><td><div className="progress" style={{ minWidth: 100, height: 8 }}><div className="progress-bar" style={{ width: `${Math.round(p.frequency * 100)}%` }} /></div><small className="text-secondary">{Math.round(p.frequency * 100)}%</small></td><td><small>{p.document_types}</small></td></tr>)}{!insights.paragraphs.length && <tr><td colSpan="4" className="text-center text-secondary py-4">Tambahkan beberapa dokumen final untuk melihat pola paragraf.</td></tr>}</tbody></table></div>
      <p className="small text-secondary mb-0">Catatan: angka frekuensi adalah indikasi observasi, bukan bukti bahwa paragraf wajib. Paragraf serupa dengan redaksi berbeda belum digabung otomatis.</p>
    </div></div>}

    {tab === "audit" && <div className="card border-0 shadow-sm"><div className="card-body"><h5 className="mb-1">Jejak Audit</h5><p className="text-secondary small">Riwayat penambahan/penghapusan referensi, aktivasi aturan, dan pembaruan hasil pemeriksaan.</p><div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Waktu</th><th>Entitas</th><th>ID</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>{auditLogs.map(log => <tr key={log.id}><td className="text-nowrap">{log.created_at?.replace("T", " ")}</td><td>{log.entity_type}</td><td>{log.entity_id ?? "—"}</td><td>{log.action}</td><td><code style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(log.detail || {})}</code></td></tr>)}{!auditLogs.length && <tr><td colSpan="5" className="text-center text-secondary py-4">Belum ada aktivitas tercatat.</td></tr>}</tbody></table></div></div></div>}

    {tab === "rules" && <>
      <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4"><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">{ruleDraft ? "Buat aturan dari paragraf referensi" : "Tambah standar secara manual"}</h5>{ruleDraft && <button className="btn btn-sm btn-outline-secondary" onClick={() => setRuleDraft(null)}>Batal</button>}</div>
        <form onSubmit={saveRule}><div className="row g-3">
          <div className="col-md-6"><label className="form-label">Nama aturan *</label><input className="form-control" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} required /></div>
          <div className="col-md-3"><label className="form-label">Jenis dokumen</label><select className="form-select" value={ruleForm.document_type} onChange={e => setRuleForm({ ...ruleForm, document_type: e.target.value })}>{DOC_TYPES.map(x => <option key={x}>{x}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label">Tipe aturan</label><select className="form-select" value={ruleForm.rule_type} onChange={e => setRuleForm({ ...ruleForm, rule_type: e.target.value })}>{RULE_TYPES.map(([v, label]) => <option value={v} key={v}>{label}</option>)}</select></div>
          <div className="col-12"><label className="form-label">Isi paragraf / frasa / panduan *</label><textarea className="form-control" rows="4" value={ruleForm.content} onChange={e => setRuleForm({ ...ruleForm, content: e.target.value })} required /></div>
          <div className="col-md-6"><label className="form-label">Catatan / kondisi berlaku</label><input className="form-control" value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} placeholder="Mis. digunakan untuk permohonan persetujuan kegiatan" /></div>
          <div className="col-md-3"><label className="form-label">Tingkat temuan</label><select className="form-select" value={ruleForm.severity} onChange={e => setRuleForm({ ...ruleForm, severity: e.target.value })}><option value="info">Info</option><option value="warning">Perlu verifikasi</option><option value="error">Penting</option></select></div>
          <div className="col-md-3 d-flex align-items-end"><button className="btn btn-primary w-100">Simpan standar</button></div>
          {ruleForm.source_reference_id && <div className="col-12"><div className="alert alert-success py-2 mb-0 small">Sumber terhubung ke dokumen referensi ID {ruleForm.source_reference_id}, paragraf ID {ruleForm.source_paragraph_id}. Hubungan sumber akan dicatat.</div></div>}
        </div></form>
      </div></div>
      <div className="card border-0 shadow-sm"><div className="card-body"><h5 className="mb-3">Aturan terdaftar</h5><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Aturan</th><th>Jenis</th><th>Sumber</th><th>Status</th><th></th></tr></thead><tbody>{rules.map(rule => <tr key={rule.id}><td><div className="fw-semibold">{rule.name}</div><div className="small text-secondary" style={{ maxWidth: 560 }}>{rule.content.slice(0, 180)}{rule.content.length > 180 ? "…" : ""}</div></td><td><div>{rule.document_type}</div><small className="text-secondary">{RULE_TYPES.find(x => x[0] === rule.rule_type)?.[1] || rule.rule_type}</small></td><td>{rule.source_title ? <><div>{rule.source_title}</div><small className="text-secondary">Paragraf {rule.source_paragraph_no || "—"}</small></> : <span className="text-secondary">Input manual / sumber belum tersedia</span>}</td><td><span className={`badge ${rule.active ? "text-bg-success" : "text-bg-secondary"}`}>{rule.active ? "Aktif" : "Nonaktif"}</span></td><td><button className="btn btn-sm btn-outline-secondary" onClick={() => toggleRule(rule)}>{rule.active ? "Nonaktifkan" : "Aktifkan"}</button></td></tr>)}{!rules.length && <tr><td colSpan="5" className="text-center text-secondary py-4">Belum ada standar. Buka paragraf dari dokumen referensi dan pilih “Jadikan aturan”.</td></tr>}</tbody></table></div></div></div>
    </>}
  </Layout>;
}
