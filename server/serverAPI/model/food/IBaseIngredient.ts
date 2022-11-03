export default interface IBaseIngredient {
    /**
     * Unique food identifier.
     */
    id: number;

    /**
     * Food name.
     */
    name: string;

    /**
     * Food category.
     */
    category: string;

    quantityUnits: string[];
}
