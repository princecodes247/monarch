export function getTypeFromString(typeString: string) {
	switch (typeString.toLowerCase()) {
		case "string":
			return String;
		case "number":
			return Number;
		case "boolean":
			return Boolean;
		case "object":
			return Object;
		// Add more cases for other types as needed
		default:
			throw new Error(`Unsupported type: ${typeString}`);
	}
}

export function transformCollectionName(collectionName: string): string {
	// Convert to kebab case
	let kebabCaseName = collectionName.replace(/\s+/g, "-").toLowerCase();

	// Convert to plural
	if (!kebabCaseName.endsWith("s")) {
		kebabCaseName += "s";
	}

	return kebabCaseName;
}
