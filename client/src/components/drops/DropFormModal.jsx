import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { validators } from "../../utils/validators";
import { extractTags } from "../../utils/tagExtractor";
import { useCreateDropMutation, useUpdateDropMutation } from "../../store/api";

const TYPES = ["code", "command", "link", "note"];

const emptyForm = {
  title: "",
  type: "code",
  content: "",
  language: "",
  tags: "",
  visibility: "private",
};

const DropFormModal = ({ isOpen, onClose, drop }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [createDrop, { isLoading: creating }] = useCreateDropMutation();
  const [updateDrop, { isLoading: updating }] = useUpdateDropMutation();

  useEffect(() => {
    if (drop) {
      setForm({
        title: drop.title || "",
        type: drop.type || "code",
        content: drop.content || "",
        language: drop.language || "",
        tags: (drop.tags || []).join(", "),
        visibility: drop.visibility || "private",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [drop, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAutoTag = () => {
    const auto = extractTags(form.content, form.type);
    setForm((prev) => ({ ...prev, tags: auto.join(", ") }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      title: validators.title(form.title),
      content: validators.content(form.content),
    };
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const payload = {
      title: form.title.trim(),
      type: form.type,
      content: form.content.trim(),
      language: form.language.trim() || undefined,
      visibility: form.visibility,
      tags: [...new Set(tags)].slice(0, 5),
    };

    try {
      if (drop) {
        await updateDrop({ id: drop._id, ...payload }).unwrap();
        toast.success("Drop updated");
      } else {
        await createDrop(payload).unwrap();
        toast.success("Drop created");
      }
      onClose();
    } catch (err) {
      const details = err?.data?.details;
      const message = Array.isArray(details)
        ? details.join(", ")
        : err?.data?.error;
      toast.error(message || "Failed to save drop");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={drop ? "Edit Drop" : "New Drop"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="Quick sort implementation"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Type
          </label>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  form.type === t
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Content
          </label>
          <textarea
            name="content"
            rows={6}
            value={form.content}
            onChange={handleChange}
            placeholder="Paste your snippet, command, link, or note..."
            className={`w-full rounded-lg border font-mono text-sm px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.content
                ? "border-red-500"
                : "border-slate-300 dark:border-slate-600"
            }`}
          />
          {errors.content && (
            <p className="mt-1.5 text-sm text-red-500">{errors.content}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Language (optional)"
            name="language"
            value={form.language}
            onChange={handleChange}
            placeholder="javascript"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Visibility
            </label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tags (comma separated)
            </label>
            <button
              type="button"
              onClick={handleAutoTag}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Auto-tag
            </button>
          </div>
          <Input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="react, hooks, performance"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={creating || updating}>
            {drop ? "Save Changes" : "Create Drop"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DropFormModal;
