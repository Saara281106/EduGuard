export const API_BASE =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

async function readResponse(response) {
  let data = null

  try {
    data = await response.json()
  } catch (error) {
    data = null
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}.`
    throw new Error(message)
  }

  return data
}

export async function uploadDatasetFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/upload-dataset`, {
    method: 'POST',
    body: formData,
  })

  return readResponse(response)
}

export async function fetchActiveDataset() {
  const response = await fetch(`${API_BASE}/active-dataset`)
  return readResponse(response)
}

export async function clearActiveDataset() {
  const response = await fetch(`${API_BASE}/active-dataset`, {
    method: 'DELETE',
  })
  return readResponse(response)
}
