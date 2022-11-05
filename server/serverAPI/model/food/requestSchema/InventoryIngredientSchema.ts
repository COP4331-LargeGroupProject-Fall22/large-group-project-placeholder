import { IsNumber, IsPositive, validate } from "class-validator";
import INutrient from "../../nutrients/INutrient";
import IUnit from "../../unit/IUnit";
import IngredientSchema from "./IngredientSchema";

export default class InventoryIngredientSchema extends IngredientSchema {
    @IsNumber()
    @IsPositive()
    expirationDate: number;

    quantity?: IUnit | undefined;

    constructor(
        id: number,
        name: string,
        category: string,
        nutrients: INutrient[],
        quantityUnits: string[],
        expirationDate: number
    ) {
        super(id, name, category, nutrients, quantityUnits);

        this.expirationDate = expirationDate;
    }

    async validate(): Promise<{ [type: string]: string; }[]> {
        let validationError = validate(this);

        const errors = await validationError;

        let logs: Array<{ [type: string]: string; }> = [];
        if (errors.length > 0) {
            errors.forEach(error => logs.push(error.constraints!));
        }

        return await Promise.resolve(logs);
    }
}
