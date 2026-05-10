// Adaptador pequeño entre Zod y el formato de detalles que responde la API.
// Se usa desde validate y ValidationError para no duplicar el mismo mapeo.

function formatZodIssues(error, location) {
  if (!error?.issues) {
    return [];
  }

  return error.issues.map((issue) => {
    const field = issue.path.join('.');
    const detail = { message: issue.message };
    if (location) {
      detail.location = location;
    }
    if (field) {
      detail.field = field;
    }
    return detail;
  });
}

module.exports = formatZodIssues;