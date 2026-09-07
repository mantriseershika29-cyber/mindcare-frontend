const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function getAuthHeaders() {
  const token =
    localStorage.getItem("firebaseIdToken") ||
    localStorage.getItem("firebaseToken") ||
    localStorage.getItem("idToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export async function fetchCaregiverDashboard(userId) {
  const [progress, performance] = await Promise.all([
    getJson(`/progress/${userId}`),
    getJson(`/performance/${userId}`),
  ]);
  return { progress, performance };
}
