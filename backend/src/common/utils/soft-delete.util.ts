export function notDeleted() {
  return { deletedAt: null };
}

export function softDeleteClause(includeDeleted = false) {
  return includeDeleted ? {} : { deletedAt: null };
}
