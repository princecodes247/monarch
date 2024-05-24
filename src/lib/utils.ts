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
