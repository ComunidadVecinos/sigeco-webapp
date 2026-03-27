
// Convierte los issues de Zod al formato de detalles usado por ValidationError.

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