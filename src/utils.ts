export function transformCollectionName(collectionName: string): string {
  // Convert to kebab case
  let kebabCaseName = collectionName.replace(/\s+/g, "-").toLowerCase();

  // Convert to plural
  if (!kebabCaseName.endsWith("s")) {
    kebabCaseName += "s";
  }

  return kebabCaseName;
}
