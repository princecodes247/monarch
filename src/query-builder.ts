import type {
	Collection,
	Filter,
	DeleteResult,
	UpdateResult,
	WithId,
	Document,
} from "mongodb";

export type Projection<T> = {
	[K in keyof T]?: 1 | 0;
};

// Define a base query class
export class BaseQuery<T extends Document> {
	protected filters: Filter<T> = {};
	protected projection: Projection<T> = {};
	protected options: any = {};

	constructor(protected readonly collection: Collection<T>) {}

	where(filter: Filter<WithId<T>>): this {
		Object.assign(this.filters, filter);
		return this;
	}

	select(projection: Projection<WithId<T>>): this {
		Object.assign(this.projection, projection);
		return this;
	}

	limit(limit: number): this {
		this.options.limit = limit;
		return this;
	}
	skip(skip: number): this {
		this.options.skip = skip;
		return this;
	}
}

// Define a query class for find operations
export class FindQuery<T extends Document> extends BaseQuery<T> {
	async exec(): Promise<WithId<T>[]> {
		return this.collection
			.find(this.filters, {
				...this.options,
				projection: this.projection,
			})
			.toArray();
	}
}

// Define a query class for findOne operations
export class FindOneQuery<T extends Document> extends BaseQuery<T> {
	exec(): Promise<WithId<T> | null> {
		return this.collection.findOne(this.filters, {
			projection: this.projection,
		});
	}
}

// Define a query class for updateOne operations
export class UpdateOneQuery<T extends Document> extends BaseQuery<T> {
	constructor(
		collection: Collection<T>,
		private readonly update: UpdateOneQuery<T>,
	) {
		super(collection);
	}

	async exec(): Promise<boolean> {
		const result: UpdateResult = await this.collection.updateOne(
			this.filters,
			this.update,
			this.options,
		);
		return !!result.modifiedCount;
	}
}

// Define a query class for deleteOne operations
export class DeleteOneQuery<T extends Document> extends BaseQuery<T> {
	async exec(): Promise<boolean> {
		const result: DeleteResult = await this.collection.deleteOne(
			this.filters,
			this.options,
		);
		return !!result.deletedCount;
	}
}
