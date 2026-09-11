/**
 * Utilitaires de réponse HTTP standardisés.
 */
export const success = (res, data, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const error = (res, message, status = 400) => {
  res.status(status).json({ success: false, error: message });
};

export const created = (res, data) => success(res, data, 201);

export const noContent = (res) => {
  res.status(204).send();
};

export default { success, error, created, noContent };
