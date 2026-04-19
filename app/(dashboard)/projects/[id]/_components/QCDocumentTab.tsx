'use client';

import { useState } from 'react';
import {
  useGetQCDocumentsQuery,
  useCreateQCDocumentMutation,
  useUpdateQCDocumentMutation,
  useDeleteQCDocumentMutation,
} from '@/lib/api/qcDocumentApi';
import { useUploadFileMutation } from '@/lib/api/uploadApi';
import { useAppSelector } from '@/lib/hooks';
import { formatDate, getApiBaseUrl } from '@/lib/utils';
import type { QCDocument, DocumentType } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS } from '@/lib/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Plus,
  Image,
  Music,
  Video,
  FileText,
  Trash2,
  Pencil,
  Upload,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const DOC_TYPE_ICONS: Record<DocumentType, typeof Image> = {
  IMAGE: Image,
  AUDIO: Music,
  VIDEO: Video,
  DOCUMENT: FileText,
};

const DOC_TYPE_COLORS: Record<DocumentType, string> = {
  IMAGE: 'bg-blue-50 text-blue-700',
  AUDIO: 'bg-violet-50 text-violet-700',
  VIDEO: 'bg-rose-50 text-rose-700',
  DOCUMENT: 'bg-amber-50 text-amber-700',
};

const ACCEPTED_FILES: Record<DocumentType, string> = {
  IMAGE: '.jpg,.jpeg,.png',
  AUDIO: '.mp3,.wav,.ogg,.m4a',
  VIDEO: '.mp4,.mov,.avi,.webm',
  DOCUMENT: '.pdf',
};

function getAllAcceptedFiles() {
  return Object.values(ACCEPTED_FILES).join(',');
}

function getAcceptForType(type: DocumentType | '') {
  if (!type) return getAllAcceptedFiles();
  return ACCEPTED_FILES[type] || getAllAcceptedFiles();
}

interface QCDocumentTabProps {
  projectId: number;
}

export default function QCDocumentTab({ projectId }: QCDocumentTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<QCDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<QCDocument | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<QCDocument | null>(null);

  const { data, isLoading, isError } = useGetQCDocumentsQuery(projectId);
  const [createDoc, { isLoading: creating }] = useCreateQCDocumentMutation();
  const [updateDoc, { isLoading: updating }] = useUpdateQCDocumentMutation();
  const [deleteDoc] = useDeleteQCDocumentMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();

  const [form, setForm] = useState({
    title: '',
    description: '',
    document_type: '' as DocumentType | '',
    file_url: '',
  });

  const allDocs = data?.data || [];
  const filtered = typeFilter
    ? allDocs.filter((d) => d.document_type === typeFilter)
    : allDocs;

  const isFieldRole = user?.role === 'SPV' || user?.role === 'QC';
  const apiBase = getApiBaseUrl();

  const resetForm = () => {
    setForm({ title: '', description: '', document_type: '', file_url: '' });
    setEditingDoc(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (doc: QCDocument) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      description: doc.description || '',
      document_type: doc.document_type,
      file_url: doc.file_url,
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file maksimal 50MB');
      e.target.value = '';
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadFile(formData).unwrap();
      if (res.data?.file_url) {
        setForm((prev) => ({ ...prev, file_url: res.data.file_url }));
        toast.success('File berhasil diupload');
      }
    } catch {
      toast.error('Gagal upload file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file_url) {
      toast.error('File wajib diupload');
      return;
    }
    if (!form.document_type) {
      toast.error('Tipe dokumen wajib dipilih');
      return;
    }

    try {
      if (editingDoc) {
        await updateDoc({
          id: editingDoc.id,
          body: {
            title: form.title,
            description: form.description || undefined,
            document_type: form.document_type as DocumentType,
            file_url: form.file_url,
          },
        }).unwrap();
        toast.success('Dokumen berhasil diperbarui!');
      } else {
        await createDoc({
          project_id: projectId,
          title: form.title,
          description: form.description || undefined,
          document_type: form.document_type as DocumentType,
          file_url: form.file_url,
        }).unwrap();
        toast.success('Dokumen berhasil diupload!');
      }
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyimpan dokumen');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(confirmDelete.id).unwrap();
      toast.success('Dokumen berhasil dihapus');
      setConfirmDelete(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus dokumen');
    }
  };

  const canModify = (doc: QCDocument) => {
    if (!isFieldRole) return true;
    return doc.uploaded_by === user?.id;
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <EmptyState
        title="Gagal memuat dokumen"
        description="Pastikan backend berjalan dan coba refresh"
      />
    );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dokumen QC</h2>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} dokumen</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">Semua Tipe</option>
            {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Upload Dokumen
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada dokumen QC"
          description="Upload dokumen QC untuk proyek ini"
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Upload Dokumen
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => {
            const Icon = DOC_TYPE_ICONS[doc.document_type];
            return (
              <div
                key={doc.id}
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all"
              >
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="w-full h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden cursor-pointer"
                >
                  {doc.document_type === 'IMAGE' ? (
                    <img
                      src={`${apiBase}${doc.file_url}`}
                      alt={doc.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={clsx(
                          'w-14 h-14 rounded-2xl flex items-center justify-center',
                          DOC_TYPE_COLORS[doc.document_type]
                        )}
                      >
                        <Icon size={28} />
                      </div>
                      <span className="text-xs text-slate-400">
                        {DOCUMENT_TYPE_LABELS[doc.document_type]}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Eye
                      size={24}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                    />
                  </div>
                </button>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {doc.title}
                    </h3>
                    <span
                      className={clsx(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                        DOC_TYPE_COLORS[doc.document_type]
                      )}
                    >
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      <span>{doc.uploader_name}</span>
                      <span className="mx-1">&middot;</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                    {canModify(doc) && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => openEdit(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingDoc ? 'Edit Dokumen QC' : 'Upload Dokumen QC'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Judul *
            </label>
            <input
              required
              minLength={2}
              maxLength={255}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Foto Pondasi Blok A"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Deskripsi
            </label>
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi dokumen (opsional)..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tipe Dokumen *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => {
                const Icon = DOC_TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, document_type: t, file_url: '' })
                    }
                    className={clsx(
                      'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-all',
                      form.document_type === t
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <Icon size={20} />
                    {DOCUMENT_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              File <span className="text-red-500">*</span>
            </label>
            {form.file_url ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="truncate">File terupload</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, file_url: '' })}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium shrink-0 ml-2"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">
                  {uploading ? 'Mengupload...' : 'Upload file (max 50MB)'}
                </span>
                <input
                  type="file"
                  accept={getAcceptForType(form.document_type)}
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating || updating || uploading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating || updating
                ? 'Menyimpan...'
                : editingDoc
                  ? 'Simpan Perubahan'
                  : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          apiBase={apiBase}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Dokumen?"
        message={`Dokumen "${confirmDelete?.title}" akan dihapus permanen.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}

function PreviewModal({
  doc,
  apiBase,
  onClose,
}: {
  doc: QCDocument;
  apiBase: string;
  onClose: () => void;
}) {
  const fileUrl = `${apiBase}${doc.file_url}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{doc.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {doc.uploader_name} &middot; {formatDate(doc.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50">
          {doc.document_type === 'IMAGE' && (
            <img
              src={fileUrl}
              alt={doc.title}
              className="max-w-full max-h-[70vh] rounded-xl object-contain"
            />
          )}
          {doc.document_type === 'AUDIO' && (
            <div className="w-full max-w-md space-y-4 text-center">
              <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
                <Music size={40} className="text-violet-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">{doc.title}</p>
              <audio controls className="w-full" src={fileUrl}>
                Browser tidak mendukung audio player.
              </audio>
            </div>
          )}
          {doc.document_type === 'VIDEO' && (
            <video
              controls
              className="max-w-full max-h-[70vh] rounded-xl"
              src={fileUrl}
            >
              Browser tidak mendukung video player.
            </video>
          )}
          {doc.document_type === 'DOCUMENT' && (
            <div className="w-full max-w-md space-y-4 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <FileText size={40} className="text-amber-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">{doc.title}</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Eye size={16} />
                Buka Dokumen
              </a>
            </div>
          )}
        </div>

        {doc.description && (
          <div className="px-6 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-600">{doc.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
