import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import { validators } from '../../utils/validators'
import { useCreateCollectionMutation, useUpdateCollectionMutation } from '../../store/api'

// Same palette collectionModel.generateRandomColor() picks from on the server,
// so a manually-picked color and an auto-assigned one always look consistent.
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
]

const emptyForm = { name: '', description: '', color: COLORS[0] }

const CollectionFormModal = ({ isOpen, onClose, collection }) => {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [createCollection, { isLoading: creating }] = useCreateCollectionMutation()
  const [updateCollection, { isLoading: updating }] = useUpdateCollectionMutation()

  useEffect(() => {
    if (collection) {
      setForm({
        name: collection.name || '',
        description: collection.description || '',
        color: collection.color || COLORS[0],
      })
    } else {
      setForm({ ...emptyForm, color: COLORS[Math.floor(Math.random() * COLORS.length)] })
    }
    setErrors({})
  }, [collection, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {
      name: validators.collectionName(form.name),
      description: validators.description(form.description),
    }
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors)
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
    }

    try {
      if (collection) {
        await updateCollection({ id: collection._id, ...payload }).unwrap()
        toast.success('Collection updated')
      } else {
        await createCollection(payload).unwrap()
        toast.success('Collection created')
      }
      onClose()
    } catch (err) {
      const details = err?.data?.details
      const message = Array.isArray(details) ? details.join(', ') : err?.data?.error
      toast.error(message || 'Failed to save collection')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={collection ? 'Edit Collection' : 'New Collection'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Interview Prep"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description (optional)
          </label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="What's this collection for?"
            className={`w-full rounded-lg border text-sm px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                className={`w-8 h-8 rounded-full transition-transform ${
                  form.color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-800 dark:ring-slate-100 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={creating || updating}>
            {collection ? 'Save Changes' : 'Create Collection'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CollectionFormModal
