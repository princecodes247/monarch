export type MonarchTransformation<T> = (value: T) => T;

export class MonarchTransformations<T> {
	private _transformations: MonarchTransformation<T>[] = [];

	addTransformation(transformation: MonarchTransformation<T>): this {
		this._transformations.push(transformation);
		return this;
	}
	applyTransformation(value: T): T {
		return this._transformations.reduce(
			(acc, transformation) => transformation(acc),
			value,
		);
	}
}
